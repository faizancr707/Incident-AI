import { v4 as uuidv4 } from "uuid";
import { logger } from "../lib/logger";
import {
  WorkflowExecution,
  WorkflowStatus,
  WorkflowType,
  WorkflowEvent,
  WorkflowNode,
  WorkflowCheckpoint,
  WorkflowStats,
  HumanApproval,
  IntegrationConfig,
} from "./types";
import { db, isMockDB } from "../db";

/**
 * In-memory workflow execution store.
 * Manages workflow executions, human approval requests, and provider integration configs.
 */
export class WorkflowStore {
  private executions: Map<string, WorkflowExecution> = new Map();
  private approvals: Map<string, HumanApproval> = new Map();
  private integrations: Map<string, IntegrationConfig> = new Map();

  constructor() {
    this.seedDefaultIntegrations();
    logger.info("WorkflowStore initialized with default integrations");
  }

  /* ── Default Integration Configurations ───────────────────────────── */

  private seedDefaultIntegrations(): void {
    const defaultIntegrations: IntegrationConfig[] = [
      {
        id: "integration-github",
        provider: "github",
        name: "GitHub Webhooks",
        enabled: false,
        webhookUrl: "/api/workflows/webhooks/github",
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
        events: ["push", "pull_request", "pull_request_review", "check_suite", "check_run"],
        status: "inactive",
        metadata: {
          appUrl: "https://github.com/apps/incident-investigator",
          configuredAt: new Date().toISOString(),
        },
      },
      {
        id: "integration-gitlab",
        provider: "gitlab",
        name: "GitLab Webhooks",
        enabled: false,
        webhookUrl: "/api/workflows/webhooks/gitlab",
        webhookSecret: process.env.GITLAB_WEBHOOK_SECRET,
        events: ["push", "merge_request", "pipeline", "tag_push"],
        status: "inactive",
        metadata: {
          instanceUrl: "https://gitlab.com",
          configuredAt: new Date().toISOString(),
        },
      },
      {
        id: "integration-vercel",
        provider: "vercel",
        name: "Vercel Webhooks",
        enabled: false,
        webhookUrl: "/api/workflows/webhooks/vercel",
        webhookSecret: process.env.VERCEL_WEBHOOK_SECRET,
        events: ["deployment", "deployment_status", "deployment_ready"],
        status: "inactive",
        metadata: {
          projectId: "prj_incident_investigator",
          configuredAt: new Date().toISOString(),
        },
      },
    ];

    for (const integration of defaultIntegrations) {
      this.integrations.set(integration.id, integration);
    }

    if (db && db.data && !db.data.integrations) {
      db.data.integrations = [...defaultIntegrations];
    }
  }

  /* ── Workflow Execution Operations ────────────────────────────────── */

  /**
   * Create a new workflow execution record.
   */
  create(data: Partial<WorkflowExecution> & { workflowType: WorkflowType; triggerEvent: WorkflowEvent }): WorkflowExecution {
    const id = data.id || uuidv4();
    const now = new Date();

    const execution: WorkflowExecution = {
      id,
      workflowType: data.workflowType,
      status: data.status || "queued",
      triggerEvent: data.triggerEvent,
      currentNode: data.currentNode || "start",
      nodes: data.nodes || [],
      checkpoints: data.checkpoints || [],
      result: data.result,
      error: data.error,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries ?? 3,
      createdAt: data.createdAt || now,
      updatedAt: now,
      completedAt: data.completedAt,
    };

    this.executions.set(id, execution);
    logger.info(`Created workflow execution: ${execution.id} [${execution.workflowType}] status=${execution.status}`);
    return execution;
  }

  /**
   * Get an execution by its unique ID.
   */
  get(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  /**
   * Get all executions, ordered by creation date descending.
   */
  getAll(): WorkflowExecution[] {
    return Array.from(this.executions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Update an existing workflow execution.
   */
  update(id: string, updates: Partial<WorkflowExecution>): WorkflowExecution | undefined {
    const existing = this.executions.get(id);
    if (!existing) {
      logger.warn(`Attempted to update non-existent execution: ${id}`);
      return undefined;
    }

    const now = new Date();
    let completedAt = updates.completedAt !== undefined ? updates.completedAt : existing.completedAt;

    // Automatically set completedAt timestamp if transitioned to terminal status
    if (
      updates.status &&
      ["completed", "failed", "cancelled"].includes(updates.status) &&
      !completedAt
    ) {
      completedAt = now;
    }

    const updated: WorkflowExecution = {
      ...existing,
      ...updates,
      updatedAt: now,
      completedAt,
    };

    this.executions.set(id, updated);
    logger.info(`Updated workflow execution: ${id} status=${updated.status} currentNode=${updated.currentNode}`);
    return updated;
  }

  /**
   * Filter executions by status.
   */
  getByStatus(status: WorkflowStatus): WorkflowExecution[] {
    return this.getAll().filter((exec) => exec.status === status);
  }

  /**
   * Filter executions by trigger provider ('github' | 'gitlab' | 'vercel').
   */
  getByProvider(provider: "github" | "gitlab" | "vercel" | string): WorkflowExecution[] {
    return this.getAll().filter((exec) => exec.triggerEvent?.provider === provider);
  }

  /**
   * Append a state checkpoint to an execution.
   */
  addCheckpoint(
    workflowId: string,
    checkpoint: Omit<WorkflowCheckpoint, "id" | "timestamp"> & Partial<WorkflowCheckpoint>
  ): WorkflowCheckpoint | undefined {
    const exec = this.executions.get(workflowId);
    if (!exec) return undefined;

    const newCheckpoint: WorkflowCheckpoint = {
      id: checkpoint.id || uuidv4(),
      nodeId: checkpoint.nodeId,
      state: checkpoint.state,
      timestamp: checkpoint.timestamp || new Date(),
    };

    exec.checkpoints.push(newCheckpoint);
    exec.updatedAt = new Date();
    this.executions.set(workflowId, exec);
    return newCheckpoint;
  }

  /**
   * Update or append a workflow node execution record.
   */
  updateNode(
    workflowId: string,
    nodeId: string,
    nodeUpdate: Partial<WorkflowNode>
  ): WorkflowNode | undefined {
    const exec = this.executions.get(workflowId);
    if (!exec) return undefined;

    const nodeIndex = exec.nodes.findIndex((n) => n.id === nodeId);
    let targetNode: WorkflowNode;

    if (nodeIndex >= 0) {
      targetNode = {
        ...exec.nodes[nodeIndex],
        ...nodeUpdate,
      };
      exec.nodes[nodeIndex] = targetNode;
    } else {
      targetNode = {
        id: nodeId,
        name: nodeUpdate.name || nodeId,
        status: nodeUpdate.status || "pending",
        agent: nodeUpdate.agent,
        input: nodeUpdate.input,
        output: nodeUpdate.output,
        startedAt: nodeUpdate.startedAt,
        completedAt: nodeUpdate.completedAt,
        duration: nodeUpdate.duration,
        error: nodeUpdate.error,
      };
      exec.nodes.push(targetNode);
    }

    exec.updatedAt = new Date();
    this.executions.set(workflowId, exec);
    return targetNode;
  }

  /* ── Aggregate Workflow Statistics ────────────────────────────────── */

  getStats(): WorkflowStats {
    const all = this.getAll();
    let total = all.length;
    let running = 0;
    let completed = 0;
    let failed = 0;
    let waitingApproval = 0;
    let totalDurationMs = 0;
    let completedWithDurationCount = 0;

    const byType: Record<WorkflowType, number> = {
      ci_cd_pipeline: 0,
      code_review: 0,
      failure_analysis: 0,
      deploy_monitor: 0,
    };

    const byProvider: Record<string, number> = {
      github: 0,
      gitlab: 0,
      vercel: 0,
    };

    for (const exec of all) {
      switch (exec.status) {
        case "running":
          running++;
          break;
        case "completed":
          completed++;
          if (exec.completedAt) {
            totalDurationMs += exec.completedAt.getTime() - exec.createdAt.getTime();
            completedWithDurationCount++;
          }
          break;
        case "failed":
          failed++;
          break;
        case "waiting_approval":
          waitingApproval++;
          break;
      }

      if (byType[exec.workflowType] !== undefined) {
        byType[exec.workflowType]++;
      } else {
        byType[exec.workflowType] = 1;
      }

      const prov = exec.triggerEvent?.provider;
      if (prov) {
        byProvider[prov] = (byProvider[prov] || 0) + 1;
      }
    }

    const avgDuration =
      completedWithDurationCount > 0
        ? Math.round(totalDurationMs / completedWithDurationCount)
        : 0;

    return {
      total,
      running,
      completed,
      failed,
      waitingApproval,
      avgDuration,
      byType,
      byProvider,
      recentExecutions: all.slice(0, 10),
    };
  }

  /* ── Human Approval Management ────────────────────────────────────── */

  createApproval(
    data: Omit<HumanApproval, "id" | "requestedAt"> & Partial<HumanApproval>
  ): HumanApproval {
    const id = data.id || uuidv4();
    const approval: HumanApproval = {
      id,
      workflowId: data.workflowId,
      nodeId: data.nodeId,
      requestedBy: data.requestedBy,
      requestedAt: data.requestedAt || new Date(),
      status: data.status || "pending",
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      reason: data.reason,
      context: data.context,
    };

    this.approvals.set(id, approval);

    // Transition workflow state to waiting_approval if not already
    const workflow = this.executions.get(data.workflowId);
    if (workflow && workflow.status !== "waiting_approval") {
      this.update(data.workflowId, { status: "waiting_approval", currentNode: data.nodeId });
    }

    logger.info(`Human approval requested: ${approval.id} for workflow=${approval.workflowId} node=${approval.nodeId}`);
    return approval;
  }

  getApproval(id: string): HumanApproval | undefined {
    return this.approvals.get(id);
  }

  getApprovalsByWorkflow(workflowId: string): HumanApproval[] {
    return Array.from(this.approvals.values())
      .filter((a) => a.workflowId === workflowId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  getPendingApprovals(): HumanApproval[] {
    return Array.from(this.approvals.values())
      .filter((a) => a.status === "pending")
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  getAllApprovals(): HumanApproval[] {
    return Array.from(this.approvals.values()).sort(
      (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()
    );
  }

  updateApproval(id: string, updates: Partial<HumanApproval>): HumanApproval | undefined {
    const existing = this.approvals.get(id);
    if (!existing) {
      logger.warn(`Approval not found for update: ${id}`);
      return undefined;
    }

    const updated: HumanApproval = {
      ...existing,
      ...updates,
      approvedAt:
        updates.status && ["approved", "rejected"].includes(updates.status) && !updates.approvedAt
          ? new Date()
          : updates.approvedAt || existing.approvedAt,
    };

    this.approvals.set(id, updated);
    logger.info(`Human approval updated: ${id} status=${updated.status} approvedBy=${updated.approvedBy || "n/a"}`);
    return updated;
  }

  /* ── Integration Configurations ───────────────────────────────────── */

  getIntegration(idOrProvider: string): IntegrationConfig | undefined {
    const byId = this.integrations.get(idOrProvider);
    if (byId) return byId;

    for (const integration of this.integrations.values()) {
      if (integration.provider === idOrProvider) {
        return integration;
      }
    }
    return undefined;
  }

  getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getIntegrations(): IntegrationConfig[] {
    return this.getAllIntegrations();
  }

  updateIntegration(
    idOrProvider: string,
    updates: (Omit<Partial<IntegrationConfig>, "status"> & { status?: string }) & Record<string, any>
  ): IntegrationConfig | undefined {
    let existing = this.integrations.get(idOrProvider);
    let storeKey = idOrProvider;

    if (!existing) {
      for (const [key, item] of this.integrations.entries()) {
        if (item.provider === idOrProvider || item.id === idOrProvider) {
          existing = item;
          storeKey = key;
          break;
        }
      }
    }

    if (!existing) {
      // Auto-provision if provider is recognized
      const newId = `integration-${idOrProvider}`;
      existing = {
        id: newId,
        provider: idOrProvider as any,
        name: `${idOrProvider.charAt(0).toUpperCase() + idOrProvider.slice(1)} Webhooks`,
        enabled: true,
        webhookUrl: `/api/webhooks/${idOrProvider}`,
        events: [],
        status: "active",
        metadata: {},
      };
      storeKey = newId;
    }

    // Normalize status: support both 'connected'/'disconnected' and 'active'/'inactive'
    let normalizedStatus: "active" | "inactive" | "error" = existing.status;
    if (updates.status === "connected" || updates.status === "active") {
      normalizedStatus = "active";
    } else if (updates.status === "disconnected" || updates.status === "inactive") {
      normalizedStatus = "inactive";
    } else if (updates.status === "error") {
      normalizedStatus = "error";
    }

    const isEnabled =
      updates.enabled !== undefined
        ? Boolean(updates.enabled)
        : normalizedStatus === "active";

    const webhookSecret =
      updates.webhookSecret !== undefined
        ? updates.webhookSecret
        : updates.secret !== undefined
        ? updates.secret
        : existing.webhookSecret;

    const webhookUrl = updates.webhookUrl || existing.webhookUrl;
    const events = Array.isArray(updates.events) ? updates.events : existing.events;
    const name = updates.name || existing.name;

    const mergedMetadata: Record<string, unknown> = {
      ...(existing.metadata || {}),
      ...(updates.metadata || {}),
      ...(updates.config || {}),
      lastSavedAt: new Date().toISOString(),
    };

    if (updates.repositoryScope) {
      mergedMetadata.repositoryScope = updates.repositoryScope;
    }

    const updated: IntegrationConfig = {
      ...existing,
      name,
      enabled: isEnabled,
      status: normalizedStatus,
      webhookSecret,
      webhookUrl,
      events,
      metadata: mergedMetadata,
      lastEventAt: updates.lastEventAt || existing.lastEventAt,
    };

    this.integrations.set(storeKey, updated);

    // Database persistence (MockDB or PostgreSQL)
    try {
      if (db) {
        if (db.data) {
          if (!db.data.integrations) {
            db.data.integrations = [];
          }
          const existingIdx = db.data.integrations.findIndex(
            (i: any) => i.id === updated.id || i.provider === updated.provider
          );
          if (existingIdx !== -1) {
            db.data.integrations[existingIdx] = updated;
          } else {
            db.data.integrations.push(updated);
          }
        } else if (!isMockDB && typeof db.query === "function") {
          db.query(
            `INSERT INTO integrations (id, provider, name, enabled, webhook_url, webhook_secret, events, status, metadata, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               enabled = EXCLUDED.enabled,
               webhook_url = EXCLUDED.webhook_url,
               webhook_secret = EXCLUDED.webhook_secret,
               events = EXCLUDED.events,
               status = EXCLUDED.status,
               metadata = EXCLUDED.metadata,
               updated_at = NOW()`,
            [
              updated.id,
              updated.provider,
              updated.name,
              updated.enabled,
              updated.webhookUrl,
              updated.webhookSecret || null,
              JSON.stringify(updated.events),
              updated.status,
              JSON.stringify(updated.metadata || {}),
            ]
          ).catch((err: any) => {
            logger.warn("Failed to persist integration to PostgreSQL database table (non-blocking)", { error: err.message });
          });
        }
      }
    } catch (persistErr: any) {
      logger.warn("Error during integration database persistence (non-blocking)", { error: persistErr.message });
    }

    logger.info(`Updated integration config: ${updated.id} (${updated.provider}) status=${updated.status} enabled=${updated.enabled}`);
    return updated;
  }

  setIntegration(config: IntegrationConfig): IntegrationConfig {
    this.integrations.set(config.id, config);
    return config;
  }

  /**
   * Reset all in-memory store collections. Useful for tests.
   */
  clear(): void {
    this.executions.clear();
    this.approvals.clear();
    this.integrations.clear();
    this.seedDefaultIntegrations();
  }
}

// Singleton export
export const workflowStore = new WorkflowStore();
export default workflowStore;
