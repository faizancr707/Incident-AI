import { Queue, Worker, Job } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import { isRedisAvailable, getRedisConnection, IORedis } from "./redis";
import { logger } from "../lib/logger";

export const QUEUE_NAME = "workflow-events";

export interface WorkflowJobPayload<T = unknown> {
  id: string;
  name: string;
  data: T;
  attemptsMade: number;
  opts?: Record<string, unknown>;
  timestamp: Date;
}

export type WorkflowJobHandler = (job: {
  id?: string;
  name: string;
  data: any;
  attemptsMade?: number;
}) => Promise<unknown>;

export interface IWorkflowWorker {
  close(): Promise<void>;
}

export interface IWorkflowQueue {
  name: string;
  add(name: string, data: unknown, opts?: Record<string, unknown>): Promise<{ id?: string; name: string; data: unknown }>;
  getJobCounts?(): Promise<{ waiting: number; active: number; completed?: number; failed?: number }>;
  close?(): Promise<void>;
}

/**
 * In-memory MockQueue fallback for when Redis is unavailable.
 * Emulates BullMQ queueing, worker concurrency (3), retries (5), and exponential backoff via setTimeout.
 */
export class MockQueue implements IWorkflowQueue {
  public readonly name: string;
  private pendingJobs: WorkflowJobPayload[] = [];
  private activeJobs: number = 0;
  private readonly concurrency: number = 3;
  private readonly maxRetries: number = 5;
  private handler: WorkflowJobHandler | null = null;
  private isClosed: boolean = false;

  constructor(name: string = QUEUE_NAME) {
    this.name = name;
    logger.info(`MockQueue initialized for "${this.name}"`);
  }

  async add(name: string, data: unknown, opts?: Record<string, unknown>): Promise<{ id: string; name: string; data: unknown }> {
    const job: WorkflowJobPayload = {
      id: (opts?.jobId as string) || uuidv4(),
      name,
      data,
      attemptsMade: 0,
      opts,
      timestamp: new Date(),
    };

    logger.info(`Job queued in MockQueue: "${name}" [${job.id}]`);
    this.pendingJobs.push(job);
    this.processNext();

    return { id: job.id, name: job.name, data: job.data };
  }

  setHandler(handler: WorkflowJobHandler): void {
    this.handler = handler;
    logger.info(`Handler registered for MockQueue "${this.name}". Draining pending jobs...`);
    this.processNext();
  }

  private processNext(): void {
    if (this.isClosed || !this.handler) return;

    while (this.activeJobs < this.concurrency && this.pendingJobs.length > 0) {
      const job = this.pendingJobs.shift();
      if (!job) break;

      this.activeJobs++;
      this.executeJob(job);
    }
  }

  private executeJob(job: WorkflowJobPayload): void {
    setTimeout(async () => {
      try {
        logger.info(
          `MockQueue processing job: "${job.name}" [${job.id}] (attempt ${job.attemptsMade + 1}/${this.maxRetries})`
        );
        if (this.handler) {
          await this.handler({
            id: job.id,
            name: job.name,
            data: job.data,
            attemptsMade: job.attemptsMade,
          });
        }
        logger.info(`MockQueue job completed successfully: "${job.name}" [${job.id}]`);
      } catch (err: unknown) {
        const error = err as Error;
        job.attemptsMade++;
        logger.error(`MockQueue job execution failed: "${job.name}" [${job.id}]`, {
          error: error.message,
          attemptsMade: job.attemptsMade,
        });

        if (job.attemptsMade < this.maxRetries) {
          // Exponential backoff: 2^(attemptsMade - 1) * 1000ms, capped at 30s
          const delay = Math.min(1000 * Math.pow(2, job.attemptsMade - 1), 30000);
          logger.info(`MockQueue scheduling retry for "${job.name}" [${job.id}] in ${delay}ms`);
          setTimeout(() => {
            if (!this.isClosed) {
              this.pendingJobs.push(job);
              this.processNext();
            }
          }, delay);
        } else {
          logger.error(`MockQueue job "${job.name}" [${job.id}] permanently failed after ${this.maxRetries} retries`);
        }
      } finally {
        this.activeJobs--;
        this.processNext();
      }
    }, 0);
  }

  async getJobCounts(): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
    return {
      waiting: this.pendingJobs.length,
      active: this.activeJobs,
      completed: 0,
      failed: 0,
    };
  }

  async close(): Promise<void> {
    this.isClosed = true;
    this.pendingJobs = [];
    this.handler = null;
    logger.info(`MockQueue "${this.name}" closed`);
  }
}

// Internal state: decide between BullMQ and MockQueue
let bullQueue: Queue | null = null;
const mockQueueInstance = new MockQueue(QUEUE_NAME);

if (isRedisAvailable()) {
  try {
    const redisConn = getRedisConnection();
    if (redisConn instanceof IORedis) {
      bullQueue = new Queue(QUEUE_NAME, {
        connection: redisConn,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      });
      logger.info(`BullMQ Queue "${QUEUE_NAME}" initialized with Redis connection`);
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("Failed to initialize BullMQ Queue with Redis, using MockQueue fallback", { error: error.message });
    bullQueue = null;
  }
}

/**
 * Unified workflow queue interface.
 * Delegates to BullMQ if Redis is active, or to MockQueue if in-memory fallback.
 */
export const workflowQueue: IWorkflowQueue = {
  name: QUEUE_NAME,

  async add(name: string, data: unknown, opts?: Record<string, unknown>): Promise<{ id?: string; name: string; data: unknown }> {
    if (bullQueue && isRedisAvailable()) {
      const job = await bullQueue.add(name, data, {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
        ...opts,
      });
      return { id: job.id, name: job.name, data: job.data };
    }
    return mockQueueInstance.add(name, data, opts);
  },

  async getJobCounts() {
    if (bullQueue && isRedisAvailable()) {
      const counts = await bullQueue.getJobCounts("waiting", "active", "completed", "failed");
      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
      };
    }
    return mockQueueInstance.getJobCounts();
  },

  async close() {
    if (bullQueue) {
      await bullQueue.close();
    }
    await mockQueueInstance.close();
  },
};

/**
 * Start worker process to consume workflow events.
 * Uses BullMQ Worker if Redis available, otherwise attaches handler to MockQueue.
 */
export function startWorker(handler: WorkflowJobHandler): IWorkflowWorker {
  if (isRedisAvailable()) {
    try {
      const redisConn = getRedisConnection();
      if (redisConn instanceof IORedis) {
        // BullMQ requires a dedicated Redis connection for the worker
        const workerConn = typeof redisConn.duplicate === "function" ? redisConn.duplicate() : redisConn;

        const worker = new Worker(
          QUEUE_NAME,
          async (job: Job) => {
            return handler({
              id: job.id,
              name: job.name,
              data: job.data,
              attemptsMade: job.attemptsMade,
            });
          },
          {
            connection: workerConn,
            concurrency: 3,
          }
        );

        worker.on("completed", (job) => {
          logger.info(`Workflow worker completed job: "${job.name}" [${job.id}]`);
        });

        worker.on("failed", (job, err) => {
          logger.error(`Workflow worker failed job: "${job?.name}" [${job?.id}]`, { error: err.message });
        });

        worker.on("error", (err) => {
          logger.error("Workflow worker connection error", { error: err.message });
        });

        logger.info(`BullMQ Worker started on queue "${QUEUE_NAME}" with concurrency 3`);
        return worker;
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error("Failed to start BullMQ Worker, falling back to MockQueue worker", { error: error.message });
    }
  }

  logger.info(`Starting MockQueue in-memory worker for "${QUEUE_NAME}"`);
  mockQueueInstance.setHandler(handler);

  return {
    close: async () => {
      await mockQueueInstance.close();
    },
  };
}
