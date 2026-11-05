/* ── Core Domain Types ─────────────────────────────────── */

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "detected" | "investigating" | "identified" | "monitoring" | "resolved";
export type Environment = "production" | "staging" | "development";
export type AgentStatus = "idle" | "running" | "completed" | "failed" | "paused";
export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";
export type DeploymentStatus = "success" | "failed" | "rolling_back" | "in_progress";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  environment: Environment;
  startedAt: Date;
  resolvedAt?: Date;
  duration: number; // minutes
  impact: string;
  impactedRequests: number;
  assignee: string;
  deploymentVersion?: string;
  aiInvestigation: AIInvestigationStatus;
  affectedServices: string[];
  tags: string[];
}

export interface AIInvestigationStatus {
  active: boolean;
  stage: string;
  progress: number;
  confidence?: number;
  rootCause?: string;
  startedAt?: Date;
}

export interface RootCauseAnalysis {
  summary: string;
  confidence: number;
  evidence: Evidence[];
  contributingFactors: string[];
  recommendation: string;
  affectedComponent: string;
  relatedDeployment?: string;
}

export interface Evidence {
  id: string;
  type: "log" | "trace" | "metric" | "deployment" | "code_change" | "database" | "historical";
  title: string;
  description: string;
  timestamp: Date;
  confidence: number;
  source: string;
  data?: Record<string, unknown>;
}

export interface InvestigationStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp: Date;
  duration?: number;
  agent: string;
  findings?: string[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
  requestId?: string;
  metadata?: Record<string, string>;
  isAnomaly?: boolean;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  name: string;
  unit: string;
  data: MetricDataPoint[];
  current: number;
  change: number; // percentage
  status: "healthy" | "warning" | "critical";
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  service: string;
  operation: string;
  duration: number; // ms
  startTime: number; // ms offset from trace start
  status: "ok" | "error" | "timeout";
  tags: Record<string, string>;
  children?: TraceSpan[];
  databaseQueries?: number;
  externalCalls?: number;
}

export interface Deployment {
  id: string;
  version: string;
  commitHash: string;
  author: string;
  message: string;
  timestamp: Date;
  service: string;
  environment: Environment;
  status: DeploymentStatus;
  filesChanged: number;
  servicesAffected: string[];
  errorRateBefore: number;
  errorRateAfter: number;
  rollbackOf?: string;
}

export interface GitChange {
  id: string;
  prNumber: number;
  title: string;
  author: string;
  commitHash: string;
  filesChanged: FileChange[];
  additions: number;
  deletions: number;
  testCoverage?: number;
  aiAnalysis?: string;
  potentialImpact?: string;
  status: "merged" | "open" | "closed";
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  language: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask?: string;
  tools: string[];
  toolCount: number;
  lastExecution?: Date;
  successRate: number;
  avgExecutionTime: number; // seconds
  totalExecutions: number;
}

export interface EvaluationMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  target?: number;
  category: "accuracy" | "performance" | "cost" | "quality";
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  type: "incident" | "runbook" | "postmortem" | "architecture" | "resolution";
  summary: string;
  tags: string[];
  createdAt: Date;
  similarityScore?: number;
  relatedIncidents: string[];
}

export interface IncidentReport {
  incidentId: string;
  executiveSummary: string;
  impact: { description: string; requestsAffected: number; usersAffected: number; revenueImpact?: string };
  timeline: { timestamp: Date; event: string }[];
  rootCause: RootCauseAnalysis;
  resolution: { steps: string[]; resolvedBy: string; resolvedAt: Date };
  prevention: string[];
  aiInvestigationTrace: InvestigationStep[];
  confidence: number;
  limitations: string[];
  sourceReferences: { title: string; url: string; type: string }[];
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyP99: number;
  errorRate: number;
  requestRate: number;
  uptime: number;
  dependencies: string[];
}

/* ── UI State Types ────────────────────────────────────── */

export interface TimeRange {
  label: string;
  value: string;
  from: Date;
  to: Date;
}

export interface FilterState {
  severity?: Severity[];
  status?: IncidentStatus[];
  service?: string[];
  environment?: Environment[];
  search?: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  section?: string;
}
