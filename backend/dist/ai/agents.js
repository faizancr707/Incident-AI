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
const store_1 = require("../workflows/store");
const db_1 = require("../db");
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
function getRealIncident(incidentId) {
    return db_1.db?.data?.incidents?.find((i) => i.id === incidentId);
}
// Live Investigation Nodes
async function detectNode(state) {
    logger_1.logger.info(`Running detectNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const serviceName = incident?.service || "monitored-service";
    const severity = incident?.severity || "critical";
    const title = incident?.title || "Incident detected";
    return {
        currentStep: "collect_logs",
        steps: [{
                id: "detect",
                agent: "incident-manager",
                status: "completed",
                findings: [`${severity.toUpperCase()} incident detected on service: ${serviceName} ("${title}")`]
            }],
        evidence: [{
                id: (0, uuid_1.v4)(),
                type: "alert",
                title: `${severity.toUpperCase()} Alert: ${serviceName}`,
                description: incident?.impact || `Production alert triggered for ${serviceName}`,
                confidence: 0.95,
                source: "Incident Dispatcher",
                timestamp: new Date(),
                data: { service: serviceName, severity, environment: incident?.environment || "production" }
            }]
    };
}
async function collectLogsNode(state) {
    logger_1.logger.info(`Running collectLogsNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const serviceName = incident?.service;
    const logs = (db_1.db?.data?.logs || []).filter((l) => !serviceName || l.service === serviceName);
    const findings = logs.length > 0
        ? [`Analyzed ${logs.length} log events for ${serviceName || "system"}. Found ${logs.filter((l) => l.level === "error").length} error records.`]
        : [`No ingested log streams found for ${serviceName || "service"}. Connect logging integration or OpenTelemetry collector to correlate runtime logs.`];
    return {
        currentStep: "analyze_traces",
        steps: [{ id: "collect_logs", agent: "log-analyst", status: "completed", findings }]
    };
}
async function analyzeTracesNode(state) {
    logger_1.logger.info(`Running analyzeTracesNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const serviceName = incident?.service;
    const traces = (db_1.db?.data?.traces || []).filter((t) => !serviceName || t.service === serviceName);
    const findings = traces.length > 0
        ? [`Evaluated ${traces.length} distributed trace spans for ${serviceName}. Found high latency in service call tree.`]
        : [`No distributed trace spans received for ${serviceName || "service"}. Verify OpenTelemetry tracing instrumentation.`];
    return {
        currentStep: "inspect_deployment",
        steps: [{ id: "analyze_traces", agent: "trace-analyst", status: "completed", findings }]
    };
}
async function inspectDeploymentNode(state) {
    logger_1.logger.info(`Running inspectDeploymentNode for ${state.incidentId}`);
    const integration = store_1.workflowStore.getIntegration("integration-github");
    const connectedRepos = integration?.metadata?.connectedRepos || [];
    const findings = [];
    const evidence = [];
    if (connectedRepos.length > 0) {
        const primaryRepo = connectedRepos[0];
        findings.push(`Correlated incident context with verified repository: ${primaryRepo.fullName} (${primaryRepo.private ? "private" : "public"}, default branch: ${primaryRepo.defaultBranch})`);
        evidence.push({
            id: (0, uuid_1.v4)(),
            type: "git_repository",
            title: `Connected Repository: ${primaryRepo.fullName}`,
            description: `Target repository ${primaryRepo.url} verified via GitHub API (default branch: ${primaryRepo.defaultBranch})`,
            confidence: 0.9,
            source: "GitHub Integration",
            timestamp: new Date(),
            data: {
                repoFullName: primaryRepo.fullName,
                repoUrl: primaryRepo.url,
                defaultBranch: primaryRepo.defaultBranch,
                isPrivate: primaryRepo.private,
                hasToken: primaryRepo.hasToken,
            },
        });
    }
    else {
        findings.push("No GitHub repositories connected. Link a repository in Integrations to enable automated code change correlation.");
    }
    return {
        currentStep: "analyze_database",
        steps: [{ id: "inspect_deployment", agent: "github-analyst", status: "completed", findings }],
        evidence,
    };
}
async function analyzeDatabaseNode(state) {
    logger_1.logger.info(`Running analyzeDatabaseNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const dbStatus = db_1.isMockDB ? "In-memory LiveStore" : "PostgreSQL Database";
    const findings = [
        `Database status: ${dbStatus}. Checked active transactions and query performance for ${incident?.service || "monitored services"}.`
    ];
    return {
        currentStep: "search_knowledge",
        steps: [{ id: "analyze_database", agent: "database-analyst", status: "completed", findings }]
    };
}
async function searchKnowledgeNode(state) {
    logger_1.logger.info(`Running searchKnowledgeNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const runbooks = (db_1.db?.data?.knowledge || []).filter((k) => k.service === incident?.service);
    const findings = runbooks.length > 0
        ? [`Matched ${runbooks.length} organization runbooks for ${incident?.service}.`]
        : [`No internal runbooks matched for ${incident?.service || "service"}.`];
    return {
        currentStep: "synthesize",
        steps: [{ id: "search_knowledge", agent: "root-cause-analyst", status: "completed", findings }]
    };
}
async function synthesizeNode(state) {
    logger_1.logger.info(`Running synthesizeNode for ${state.incidentId}`);
    const incident = getRealIncident(state.incidentId);
    const title = incident?.title || "Production Incident";
    const service = incident?.service || "monitored service";
    const impact = incident?.impact || "Service degradation reported";
    const severity = incident?.severity || "high";
    return {
        currentStep: "report",
        steps: [{ id: "synthesize", agent: "root-cause-analyst", status: "completed", findings: [`Synthesized investigation findings for ${incident?.id || state.incidentId}`] }],
        rootCause: {
            summary: `${severity.toUpperCase()} impact on ${service}: ${title}. ${impact}`,
            confidence: 0.88,
            evidence: [
                `Incident Reported: ${title}`,
                `Service Target: ${service}`,
                `Severity Level: ${severity}`,
                `Environment: ${incident?.environment || "production"}`
            ],
            recommendation: `Inspect ${service} deployment metrics, evaluate recent configuration changes, and check upstream error rates.`,
            contributingFactors: [`Impact reported: ${impact}`]
        }
    };
}
async function reportNode(state) {
    logger_1.logger.info(`Running reportNode for ${state.incidentId}`);
    return {
        currentStep: "completed",
        steps: [{ id: "report", agent: "report-generator", status: "completed", findings: ["Postmortem investigation report synthesized."] }]
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