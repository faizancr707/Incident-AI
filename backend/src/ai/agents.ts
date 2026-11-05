import { logger } from "../lib/logger";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

/**
 * AI Agent System — LangGraph-based investigation workflow
 *
 * This module defines the multi-agent system that orchestrates
 * incident investigation using specialized agents.
 *
 * Architecture:
 *   Incident Manager (orchestrator)
 *   ├── Log Analyst
 *   ├── Metrics Analyst
 *   ├── Trace Analyst
 *   ├── GitHub Analyst
 *   ├── Database Analyst
 *   ├── Root Cause Analyst
 *   └── Report Generator
 *
 * Each agent has:
 *   - Defined tools (MCP-compatible)
 *   - Structured output schema
 *   - Memory (conversation + investigation context)
 *   - Evaluation hooks
 */

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentConfig {
  name: string;
  role: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: AgentTool[];
  systemPrompt: string;
}

export interface InvestigationState {
  incidentId: string;
  currentStep: string;
  steps: InvestigationStepState[];
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  rootCause: RootCause | null;
  agentMessages: AgentMessage[];
  metadata: Record<string, unknown>;
}

interface InvestigationStepState {
  id: string;
  agent: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  findings: string[];
  error?: string;
}

interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  source: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

interface Hypothesis {
  id: string;
  summary: string;
  confidence: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
}

interface RootCause {
  summary: string;
  confidence: number;
  evidence: string[];
  recommendation: string;
  contributingFactors: string[];
}

interface AgentMessage {
  agent: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  timestamp: Date;
  toolCall?: { name: string; arguments: Record<string, unknown>; result: unknown };
}

/* ── Agent Definitions ─────────────────────────────────── */

export const agentConfigs: AgentConfig[] = [
  {
    name: "incident-manager",
    role: "Orchestrates the investigation workflow and coordinates other agents",
    model: "gpt-4o",
    temperature: 0.1,
    maxTokens: 4096,
    tools: [],
    systemPrompt: `You are an Incident Manager AI agent responsible for orchestrating production incident investigations.
Your role is to:
1. Analyze the incident context and determine which specialist agents to invoke
2. Coordinate the investigation workflow
3. Synthesize findings from all agents
4. Determine when sufficient evidence has been gathered
5. Generate the final root cause analysis

Always follow a systematic approach:
- First, collect logs and metrics from the affected timeframe
- Then, analyze distributed traces for the affected services
- Check recent deployments that may correlate with the incident
- Inspect database and infrastructure signals
- Search historical incidents for similar patterns
- Synthesize all evidence into a root cause hypothesis`,
  },
  {
    name: "log-analyst",
    role: "Searches and analyzes application logs for anomalies and patterns",
    model: "gpt-4o",
    temperature: 0.0,
    maxTokens: 4096,
    tools: [],
    systemPrompt: `You are a Log Analyst AI agent. Your role is to search, filter, and analyze application logs to find anomalies, error patterns, and correlations relevant to production incidents.

You have access to Elasticsearch/OpenSearch for log queries. Use structured queries to efficiently find relevant log entries.

Focus on:
- Error rate spikes and new error types
- Timeout and latency patterns
- Cascading failures across services
- Anomalous log patterns that deviate from baselines
- Correlation between log events and incident timeline`,
  },
  {
    name: "trace-analyst",
    role: "Analyzes distributed traces to identify bottlenecks and failures",
    model: "gpt-4o",
    temperature: 0.0,
    maxTokens: 4096,
    tools: [],
    systemPrompt: `You are a Trace Analyst AI agent. Your role is to analyze distributed traces from Jaeger/OpenTelemetry to identify performance bottlenecks, error propagation, and service dependency issues.

Focus on:
- Spans with abnormal duration
- Error propagation across service boundaries
- Database query patterns within traces
- External API call failures
- Service dependency chain analysis`,
  },
  {
    name: "github-analyst",
    role: "Inspects code changes, pull requests, and deployment artifacts",
    model: "gpt-4o",
    temperature: 0.1,
    maxTokens: 8192,
    tools: [],
    systemPrompt: `You are a GitHub Analyst AI agent. Your role is to inspect recent code changes, pull requests, and deployments to identify potential causes of production incidents.

Focus on:
- Recent deployments that correlate with incident timing
- Code changes in affected service areas
- Database migration or schema changes
- Configuration changes
- Dependency updates
- Test coverage gaps in changed code`,
  },
  {
    name: "database-analyst",
    role: "Analyzes database performance, queries, and resource utilization",
    model: "gpt-4o",
    temperature: 0.0,
    maxTokens: 4096,
    tools: [],
    systemPrompt: `You are a Database Analyst AI agent. Your role is to analyze PostgreSQL performance metrics, query patterns, and resource utilization.

Focus on:
- Slow query detection and analysis
- Query count anomalies (N+1 patterns)
- Connection pool utilization
- Lock contention
- Index usage and missing indexes
- CPU, memory, and I/O metrics`,
  },
  {
    name: "root-cause-analyst",
    role: "Synthesizes all evidence to determine the most likely root cause",
    model: "gpt-4o",
    temperature: 0.2,
    maxTokens: 8192,
    tools: [],
    systemPrompt: `You are a Root Cause Analyst AI agent. Your role is to synthesize evidence from all other agents and determine the most likely root cause of the production incident.

You must:
1. Evaluate all evidence with confidence scores
2. Generate multiple hypotheses ranked by likelihood
3. Identify supporting and contradicting evidence for each hypothesis
4. Calculate an overall confidence score
5. Provide actionable recommendations
6. Reference similar historical incidents if available

Always be transparent about uncertainty and limitations. Never overstate confidence.`,
  },
  {
    name: "report-generator",
    role: "Creates structured incident reports and postmortems",
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 8192,
    tools: [],
    systemPrompt: `You are a Report Generator AI agent. Your role is to create comprehensive, well-structured incident reports and postmortem documents.

Generate reports that include:
- Executive summary
- Impact analysis
- Detailed timeline
- Root cause analysis with evidence
- Contributing factors
- Resolution steps
- Prevention recommendations
- AI investigation trace
- Confidence assessment and limitations`,
  },
];

/* ── Investigation Workflow (LangGraph-compatible) ────── */

/**
 * Investigation graph state machine:
 *
 * START → detect → collect_logs → analyze_traces → inspect_deployment
 *       → analyze_database → search_knowledge → synthesize → report → END
 *
 * Each node in the graph corresponds to an agent execution.
 * The orchestrator can dynamically add/skip nodes based on findings.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const InvestigationAnnotation = Annotation.Root({
  incidentId: Annotation<string>(),
  currentStep: Annotation<string>(),
  steps: Annotation<InvestigationStepState[]>({
    reducer: (state, update) => {
      const newState = [...state];
      for (const u of update) {
        const idx = newState.findIndex((s) => s.id === u.id);
        if (idx !== -1) newState[idx] = { ...newState[idx], ...u };
        else newState.push(u);
      }
      return newState;
    }
  }),
  evidence: Annotation<EvidenceItem[]>({
    reducer: (state, update) => [...state, ...update]
  }),
  hypotheses: Annotation<Hypothesis[]>({
    reducer: (state, update) => update
  }),
  rootCause: Annotation<RootCause | null>({
    reducer: (state, update) => update
  }),
  agentMessages: Annotation<AgentMessage[]>({
    reducer: (state, update) => [...state, ...update]
  }),
  metadata: Annotation<Record<string, unknown>>({
    reducer: (state, update) => ({ ...state, ...update })
  })
});

// Mock nodes
async function detectNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running detectNode for ${state.incidentId}`);
  await sleep(1000);
  return {
    currentStep: "collect_logs",
    steps: [{ id: "detect", agent: "incident-manager", status: "completed", findings: ["Incident detected"] }],
    evidence: [{ id: uuidv4(), type: "alert", title: "High Error Rate", description: "5xx errors > 5%", confidence: 0.9, source: "Prometheus", timestamp: new Date(), data: {} }]
  };
}

async function collectLogsNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running collectLogsNode for ${state.incidentId}`);
  await sleep(1500);
  return {
    currentStep: "analyze_traces",
    steps: [{ id: "collect_logs", agent: "log-analyst", status: "completed", findings: ["Found spike in timeout errors in payment service"] }]
  };
}

async function analyzeTracesNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running analyzeTracesNode for ${state.incidentId}`);
  await sleep(1500);
  return {
    currentStep: "inspect_deployment",
    steps: [{ id: "analyze_traces", agent: "trace-analyst", status: "completed", findings: ["Traces show DB queries taking > 5s"] }]
  };
}

async function inspectDeploymentNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running inspectDeploymentNode for ${state.incidentId}`);
  await sleep(1000);
  return {
    currentStep: "analyze_database",
    steps: [{ id: "inspect_deployment", agent: "github-analyst", status: "completed", findings: ["Recent PR merged touching payment logic"] }]
  };
}

async function analyzeDatabaseNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running analyzeDatabaseNode for ${state.incidentId}`);
  await sleep(1500);
  return {
    currentStep: "search_knowledge",
    steps: [{ id: "analyze_database", agent: "database-analyst", status: "completed", findings: ["Missing index on transactions table"] }]
  };
}

async function searchKnowledgeNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running searchKnowledgeNode for ${state.incidentId}`);
  await sleep(1000);
  return {
    currentStep: "synthesize",
    steps: [{ id: "search_knowledge", agent: "root-cause-analyst", status: "completed", findings: ["Similar incident in Jan 2025"] }]
  };
}

async function synthesizeNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running synthesizeNode for ${state.incidentId}`);
  await sleep(2000);
  return {
    currentStep: "report",
    steps: [{ id: "synthesize", agent: "root-cause-analyst", status: "completed", findings: ["Root cause synthesized"] }],
    rootCause: {
      summary: "Database overload due to missing index after recent deployment",
      confidence: 0.95,
      evidence: ["Missing index on transactions table", "Traces show DB queries taking > 5s"],
      recommendation: "Add index to transactions table, revert PR #123 if immediate fix not possible",
      contributingFactors: ["Missing load tests in CI"]
    }
  };
}

async function reportNode(state: typeof InvestigationAnnotation.State) {
  logger.info(`Running reportNode for ${state.incidentId}`);
  await sleep(1000);
  return {
    currentStep: "completed",
    steps: [{ id: "report", agent: "report-generator", status: "completed", findings: ["Report generated"] }]
  };
}

export function createInvestigationWorkflow() {
  const workflow = new StateGraph(InvestigationAnnotation)
    .addNode("detect", detectNode as any)
    .addNode("collect_logs", collectLogsNode as any)
    .addNode("analyze_traces", analyzeTracesNode as any)
    .addNode("inspect_deployment", inspectDeploymentNode as any)
    .addNode("analyze_database", analyzeDatabaseNode as any)
    .addNode("search_knowledge", searchKnowledgeNode as any)
    .addNode("synthesize", synthesizeNode as any)
    .addNode("report", reportNode as any)
    .addEdge(START, "detect")
    .addEdge("detect", "collect_logs")
    .addEdge("collect_logs", "analyze_traces")
    .addEdge("analyze_traces", "inspect_deployment")
    .addEdge("inspect_deployment", "analyze_database")
    .addEdge("analyze_database", "search_knowledge")
    .addEdge("search_knowledge", "synthesize")
    .addEdge("synthesize", "report")
    .addEdge("report", END);

  return workflow.compile();
}

const investigations = new Map<string, typeof InvestigationAnnotation.State>();

export function getInvestigationState(incidentId: string) {
  return investigations.get(incidentId) || null;
}

export function executeInvestigation(incidentId: string) {
  const workflow = createInvestigationWorkflow();
  
  const initialState: typeof InvestigationAnnotation.State = {
    incidentId,
    currentStep: "detect",
    steps: [
      { id: "detect", agent: "incident-manager", status: "pending", findings: [] },
      { id: "collect_logs", agent: "log-analyst", status: "pending", findings: [] },
      { id: "analyze_traces", agent: "trace-analyst", status: "pending", findings: [] },
      { id: "inspect_deployment", agent: "github-analyst", status: "pending", findings: [] },
      { id: "analyze_database", agent: "database-analyst", status: "pending", findings: [] },
      { id: "search_knowledge", agent: "root-cause-analyst", status: "pending", findings: [] },
      { id: "synthesize", agent: "root-cause-analyst", status: "pending", findings: [] },
      { id: "report", agent: "report-generator", status: "pending", findings: [] },
    ],
    evidence: [],
    hypotheses: [],
    rootCause: null,
    agentMessages: [],
    metadata: { startedAt: new Date(), incidentId },
  };

  investigations.set(incidentId, initialState);
  
  (async () => {
    try {
      const stream = await workflow.stream(initialState);
      for await (const stateUpdate of stream) {
        const currentState = investigations.get(incidentId);
        if (currentState) {
          const nodeName = Object.keys(stateUpdate)[0];
          const update = stateUpdate[nodeName];
          
          let mergedSteps = [...currentState.steps];
          if (update.steps) {
            for (const u of update.steps) {
              const idx = mergedSteps.findIndex((s) => s.id === u.id);
              if (idx !== -1) mergedSteps[idx] = { ...mergedSteps[idx], ...u };
              else mergedSteps.push(u);
            }
          }

          investigations.set(incidentId, {
            ...currentState,
            ...update,
            steps: mergedSteps,
            evidence: currentState.evidence.concat(update.evidence || []),
            agentMessages: currentState.agentMessages.concat(update.agentMessages || [])
          });
        }
      }
    } catch (error) {
      logger.error(`Error executing investigation ${incidentId}`, { error });
    }
  })();
  
  return initialState;
}

export function streamInvestigation(incidentId: string) {
  return getInvestigationState(incidentId);
}

logger.info("AI Agent system initialized", {
  agentCount: agentConfigs.length,
  agents: agentConfigs.map((a) => a.name),
});

