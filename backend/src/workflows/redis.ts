import IORedis from "ioredis";
import { logger } from "../lib/logger";

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

/**
 * MockRedis - In-memory fallback for Redis when no Redis server is available.
 * Implements basic Set, Get, Del, Exists, Keys, and TTL operations using a Map.
 */
export class MockRedis {
  private store: Map<string, CacheEntry> = new Map();
  public status: string = "ready";
  private eventHandlers: Map<string, Array<(...args: any[]) => void>> = new Map();

  constructor() {
    logger.info("MockRedis initialized (in-memory storage)");
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  private cleanKey(key: string): void {
    const entry = this.store.get(key);
    if (entry && this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  async get(key: string): Promise<string | null> {
    this.cleanKey(key);
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.value;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<"OK"> {
    let expiresAt: number | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === "EX" && args[i + 1] !== undefined) {
        const seconds = Number(args[i + 1]);
        if (!isNaN(seconds)) {
          expiresAt = Date.now() + seconds * 1000;
        }
      } else if (arg === "PX" && args[i + 1] !== undefined) {
        const ms = Number(args[i + 1]);
        if (!isNaN(ms)) {
          expiresAt = Date.now() + ms;
        }
      }
    }

    this.store.set(key, { value: String(value), expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        count++;
      }
    }
    return count;
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      this.cleanKey(key);
      if (this.store.has(key)) {
        count++;
      }
    }
    return count;
  }

  async keys(pattern: string = "*"): Promise<string[]> {
    const matched: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const [key, entry] of this.store.entries()) {
      if (!this.isExpired(entry) && regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    const results: (string | null)[] = [];
    for (const key of keys) {
      results.push(await this.get(key));
    }
    return results;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.cleanKey(key);
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    this.cleanKey(key);
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushall(): Promise<"OK"> {
    this.store.clear();
    return "OK";
  }

  async flushdb(): Promise<"OK"> {
    this.store.clear();
    return "OK";
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  async quit(): Promise<"OK"> {
    this.status = "end";
    return "OK";
  }

  disconnect(): void {
    this.status = "end";
  }

  on(event: string, handler: (...args: any[]) => void): this {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
    return this;
  }

  off(event: string, handler: (...args: any[]) => void): this {
    const handlers = this.eventHandlers.get(event) || [];
    this.eventHandlers.set(event, handlers.filter((h) => h !== handler));
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const handlers = this.eventHandlers.get(event);
    if (!handlers || handlers.length === 0) return false;
    for (const h of handlers) {
      h(...args);
    }
    return true;
  }
}

let redisClient: IORedis | null = null;
let mockClient: MockRedis | null = null;
let redisConnected = false;

// Attempt Redis connection if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn(`Redis connection retry limit reached (${times} attempts). Falling back to MockRedis.`);
          return null; // Stop reconnection attempts
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on("connect", () => {
      redisConnected = true;
      logger.info("Connected to Redis server");
    });

    redisClient.on("ready", () => {
      redisConnected = true;
      logger.info("Redis client ready for commands");
    });

    redisClient.on("error", (err) => {
      redisConnected = false;
      logger.warn("Redis error encountered; falling back to MockRedis", { error: err.message });
    });

    redisClient.on("close", () => {
      redisConnected = false;
      logger.warn("Redis connection closed");
    });
  } catch (err: unknown) {
    const error = err as Error;
    logger.error("Failed to initialize Redis client, falling back to MockRedis", { error: error.message });
    redisConnected = false;
    redisClient = null;
  }
} else {
  logger.info("No REDIS_URL provided; using MockRedis fallback");
}

/**
 * Check if a live Redis connection is currently available.
 */
export function isRedisAvailable(): boolean {
  return redisConnected && redisClient !== null && (redisClient.status === "ready" || redisClient.status === "connect");
}

/**
 * Get active Redis connection, or in-memory MockRedis fallback.
 */
export function getRedisConnection(): IORedis | MockRedis {
  if (isRedisAvailable() && redisClient) {
    return redisClient;
  }
  if (!mockClient) {
    mockClient = new MockRedis();
  }
  return mockClient;
}

export { IORedis };
