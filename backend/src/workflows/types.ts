import { z } from "zod";

// WorkflowEvent - normalized event from any webhook provider
export interface WorkflowEvent {
  id: string;               // unique event ID
  provider: 'github' | 'gitlab' | 'vercel';
  eventType: WorkflowEventType;
  action: string;           // raw action (e.g., 'opened', 'closed', 'completed')
  repository: { name: string; fullName: string; url: string; defaultBranch: string; };
  sender: { id: string; login: string; avatarUrl?: string; };
  payload: Record<string, unknown>;  // raw provider-specific payload
  ref?: string;             // branch/tag ref
  commitSha?: string;
  pullRequest?: { number: number; title: string; state: string; url: string; baseBranch: string; headBranch: string; };
  deployment?: { id: string; environment: string; url?: string; status: string; };
  pipeline?: { id: string; status: string; url?: string; stages?: string[]; };
  timestamp: Date;
  receivedAt: Date;
}

export type WorkflowEventType = 
  | 'push' | 'pull_request' | 'pull_request_review'
  | 'deployment' | 'deployment_status' | 'deployment_ready'
  | 'pipeline' | 'check_suite' | 'check_run'
  | 'merge_request' | 'tag_push';

// Workflow execution state
export type WorkflowStatus = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
export type WorkflowType = 'ci_cd_pipeline' | 'code_review' | 'failure_analysis' | 'deploy_monitor';

export interface WorkflowExecution {
  id: string;
  workflowType: WorkflowType;
  status: WorkflowStatus;
  triggerEvent: WorkflowEvent;
  currentNode: string;
  nodes: WorkflowNode[];
  checkpoints: WorkflowCheckpoint[];
  result?: WorkflowResult;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WorkflowNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  agent?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
}

export interface WorkflowCheckpoint {
  id: string;
  nodeId: string;
  state: Record<string, unknown>;
  timestamp: Date;
}

export interface WorkflowResult {
  summary: string;
  details: Record<string, unknown>;
  recommendations: string[];
  confidence: number;
  artifacts: WorkflowArtifact[];
}

export interface WorkflowArtifact {
  type: 'report' | 'review' | 'analysis' | 'approval';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface HumanApproval {
  id: string;
  workflowId: string;
  nodeId: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  reason?: string;
  context: { title: string; description: string; evidence: string[]; };
}

export interface IntegrationConfig {
  id: string;
  provider: 'github' | 'gitlab' | 'vercel';
  name: string;
  enabled: boolean;
  webhookSecret?: string;
  webhookUrl: string;
  events: string[];
  lastEventAt?: Date;
  status: 'active' | 'inactive' | 'error';
  metadata?: Record<string, unknown>;
}

export interface WorkflowStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  waitingApproval: number;
  avgDuration: number;
  byType: Record<WorkflowType, number>;
  byProvider: Record<string, number>;
  recentExecutions: WorkflowExecution[];
}

/* ── Zod Validation Schemas ────────────────────────────────────────── */

export const workflowEventTypeSchema = z.enum([
  'push',
  'pull_request',
  'pull_request_review',
  'deployment',
  'deployment_status',
  'deployment_ready',
  'pipeline',
  'check_suite',
  'check_run',
  'merge_request',
  'tag_push'
]);

export const workflowStatusSchema = z.enum([
  'queued',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled'
]);

export const workflowTypeSchema = z.enum([
  'ci_cd_pipeline',
  'code_review',
  'failure_analysis',
  'deploy_monitor'
]);

export const workflowEventSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(['github', 'gitlab', 'vercel']),
  eventType: workflowEventTypeSchema,
  action: z.string(),
  repository: z.object({
    name: z.string(),
    fullName: z.string(),
    url: z.string(),
    defaultBranch: z.string()
  }),
  sender: z.object({
    id: z.string(),
    login: z.string(),
    avatarUrl: z.string().optional()
  }),
  payload: z.record(z.unknown()),
  ref: z.string().optional(),
  commitSha: z.string().optional(),
  pullRequest: z.object({
    number: z.number(),
    title: z.string(),
    state: z.string(),
    url: z.string(),
    baseBranch: z.string(),
    headBranch: z.string()
  }).optional(),
  deployment: z.object({
    id: z.string(),
    environment: z.string(),
    url: z.string().optional(),
    status: z.string()
  }).optional(),
  pipeline: z.object({
    id: z.string(),
    status: z.string(),
    url: z.string().optional(),
    stages: z.array(z.string()).optional()
  }).optional(),
  timestamp: z.coerce.date(),
  receivedAt: z.coerce.date()
});

export const humanApprovalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
  approvedBy: z.string().optional()
});

export const integrationConfigUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  webhookSecret: z.string().optional(),
  secret: z.string().optional(),
  webhookUrl: z.string().optional(),
  repositoryScope: z.string().optional(),
  events: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'error', 'connected', 'disconnected']).optional(),
  config: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional()
}).passthrough();
