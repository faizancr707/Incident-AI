"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentConfigs = void 0;
exports.createInvestigationWorkflow = createInvestigationWorkflow;
exports.getInvestigationState = getInvestigationState;
exports.executeInvestigation = executeInvestigation;
exports.streamInvestigation = streamInvestigation;
const logger_1 = require("../lib/logger");
const langgraph_1 = require("@langchain/langgraph");
const uuid_1 = require("uuid");
/* ── Agent Definitions ─────────────────────────────────── */
exports.agentConfigs = [
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const InvestigationAnnotation = langgraph_1.Annotation.Root({
    incidentId: (0, langgraph_1.Annotation)(),
    currentStep: (0, langgraph_1.Annotation)(),
    steps: (0, langgraph_1.Annotation)({
        reducer: (state, update) => {
            const newState = [...state];
            for (const u of update) {
                const idx = newState.findIndex((s) => s.id === u.id);
                if (idx !== -1)
                    newState[idx] = { ...newState[idx], ...u };
                else
                    newState.push(u);
            }
            return newState;
        }
    }),
    evidence: (0, langgraph_1.Annotation)({
        reducer: (state, update) => [...state, ...update]
    }),
    hypotheses: (0, langgraph_1.Annotation)({
        reducer: (state, update) => update
    }),
    rootCause: (0, langgraph_1.Annotation)({
        reducer: (state, update) => update
    }),
    agentMessages: (0, langgraph_1.Annotation)({
        reducer: (state, update) => [...state, ...update]
    }),
    metadata: (0, langgraph_1.Annotation)({
        reducer: (state, update) => ({ ...state, ...update })
    })
});
// Mock nodes
async function detectNode(state) {
    logger_1.logger.info(`Running detectNode for ${state.incidentId}`);
    await sleep(1000);
    return {
        currentStep: "collect_logs",
        steps: [{ id: "detect", agent: "incident-manager", status: "completed", findings: ["Incident detected"] }],
        evidence: [{ id: (0, uuid_1.v4)(), type: "alert", title: "High Error Rate", description: "5xx errors > 5%", confidence: 0.9, source: "Prometheus", timestamp: new Date(), data: {} }]
    };
}
async function collectLogsNode(state) {
    logger_1.logger.info(`Running collectLogsNode for ${state.incidentId}`);
    await sleep(1500);
    return {
        currentStep: "analyze_traces",
        steps: [{ id: "collect_logs", agent: "log-analyst", status: "completed", findings: ["Found spike in timeout errors in payment service"] }]
    };
}
async function analyzeTracesNode(state) {
    logger_1.logger.info(`Running analyzeTracesNode for ${state.incidentId}`);
    await sleep(1500);
    return {
        currentStep: "inspect_deployment",
        steps: [{ id: "analyze_traces", agent: "trace-analyst", status: "completed", findings: ["Traces show DB queries taking > 5s"] }]
    };
}
async function inspectDeploymentNode(state) {
    logger_1.logger.info(`Running inspectDeploymentNode for ${state.incidentId}`);
    await sleep(1000);
    return {
        currentStep: "analyze_database",
        steps: [{ id: "inspect_deployment", agent: "github-analyst", status: "completed", findings: ["Recent PR merged touching payment logic"] }]
    };
}
async function analyzeDatabaseNode(state) {
    logger_1.logger.info(`Running analyzeDatabaseNode for ${state.incidentId}`);
    await sleep(1500);
    return {
        currentStep: "search_knowledge",
        steps: [{ id: "analyze_database", agent: "database-analyst", status: "completed", findings: ["Missing index on transactions table"] }]
    };
}
async function searchKnowledgeNode(state) {
    logger_1.logger.info(`Running searchKnowledgeNode for ${state.incidentId}`);
    await sleep(1000);
    return {
        currentStep: "synthesize",
        steps: [{ id: "search_knowledge", agent: "root-cause-analyst", status: "completed", findings: ["Similar incident in Jan 2025"] }]
    };
}
async function synthesizeNode(state) {
    logger_1.logger.info(`Running synthesizeNode for ${state.incidentId}`);
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
async function reportNode(state) {
    logger_1.logger.info(`Running reportNode for ${state.incidentId}`);
    await sleep(1000);
    return {
        currentStep: "completed",
        steps: [{ id: "report", agent: "report-generator", status: "completed", findings: ["Report generated"] }]
    };
}
function createInvestigationWorkflow() {
    const workflow = new langgraph_1.StateGraph(InvestigationAnnotation)
        .addNode("detect", detectNode)
        .addNode("collect_logs", collectLogsNode)
        .addNode("analyze_traces", analyzeTracesNode)
        .addNode("inspect_deployment", inspectDeploymentNode)
        .addNode("analyze_database", analyzeDatabaseNode)
        .addNode("search_knowledge", searchKnowledgeNode)
        .addNode("synthesize", synthesizeNode)
        .addNode("report", reportNode)
        .addEdge(langgraph_1.START, "detect")
        .addEdge("detect", "collect_logs")
        .addEdge("collect_logs", "analyze_traces")
        .addEdge("analyze_traces", "inspect_deployment")
        .addEdge("inspect_deployment", "analyze_database")
        .addEdge("analyze_database", "search_knowledge")
        .addEdge("search_knowledge", "synthesize")
        .addEdge("synthesize", "report")
        .addEdge("report", langgraph_1.END);
    return workflow.compile();
}
const investigations = new Map();
function getInvestigationState(incidentId) {
    return investigations.get(incidentId) || null;
}
function executeInvestigation(incidentId) {
    const workflow = createInvestigationWorkflow();
    const initialState = {
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
                            if (idx !== -1)
                                mergedSteps[idx] = { ...mergedSteps[idx], ...u };
                            else
                                mergedSteps.push(u);
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
        }
        catch (error) {
            logger_1.logger.error(`Error executing investigation ${incidentId}`, { error });
        }
    })();
    return initialState;
}
function streamInvestigation(incidentId) {
    return getInvestigationState(incidentId);
}
logger_1.logger.info("AI Agent system initialized", {
    agentCount: exports.agentConfigs.length,
    agents: exports.agentConfigs.map((a) => a.name),
});
//# sourceMappingURL=agents.js.map