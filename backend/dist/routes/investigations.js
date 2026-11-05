"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationRoutes = void 0;
const express_1 = require("express");
const agents_1 = require("../ai/agents");
const db_1 = require("../db");
const mock_data_1 = require("../db/mock-data");
const store_1 = require("../workflows/store");
const openai_1 = __importDefault(require("openai"));
exports.investigationRoutes = (0, express_1.Router)();
// GET /api/investigations
exports.investigationRoutes.get("/", async (req, res) => {
    const incidents = db_1.db.data?.incidents || [];
    const list = incidents.map((inc) => {
        const liveState = (0, agents_1.getInvestigationState)(inc.id);
        return {
            incidentId: inc.id,
            title: inc.title,
            severity: inc.severity,
            status: liveState ? liveState.currentStep : inc.status,
            active: inc.aiInvestigation?.active || !!liveState,
            confidence: liveState?.rootCause?.confidence || inc.aiInvestigation?.confidence || 0,
            stepsCount: liveState?.steps?.length || mock_data_1.investigationSteps.length,
        };
    });
    res.json({ investigations: list });
});
// GET /api/investigations/:id
exports.investigationRoutes.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.getInvestigationState)(id);
        if (state) {
            return res.json({ investigation: state });
        }
        // Default seeded state fallback if no run was triggered yet
        const incident = db_1.db.data?.incidents?.find((i) => i.id === id);
        if (!incident) {
            return res.status(404).json({ error: "Investigation not found" });
        }
        res.json({
            investigation: {
                incidentId: id,
                currentStep: "synthesize",
                steps: mock_data_1.investigationSteps,
                evidence: mock_data_1.evidence,
                rootCause: mock_data_1.rootCauseAnalysis,
                agentMessages: [],
                metadata: { incidentId: id, startedAt: incident.startedAt },
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch investigation" });
    }
});
// GET /api/investigations/:id/steps
exports.investigationRoutes.get("/:id/steps", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.getInvestigationState)(id);
        if (state?.steps && state.steps.length > 0) {
            return res.json({ steps: state.steps });
        }
        // Return seeded steps as initial baseline
        res.json({ steps: mock_data_1.investigationSteps });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch steps" });
    }
});
// GET /api/investigations/:id/evidence
exports.investigationRoutes.get("/:id/evidence", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.getInvestigationState)(id);
        if (state?.evidence && state.evidence.length > 0) {
            return res.json({ evidence: state.evidence });
        }
        // Return seeded evidence as initial baseline
        res.json({ evidence: mock_data_1.evidence });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch evidence" });
    }
});
// GET /api/investigations/:id/root-cause
exports.investigationRoutes.get("/:id/root-cause", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.getInvestigationState)(id);
        if (state?.rootCause) {
            return res.json({ rootCause: state.rootCause });
        }
        // Return seeded root cause
        res.json({ rootCause: mock_data_1.rootCauseAnalysis });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch root cause" });
    }
});
// POST /api/investigations/:id/run or /investigate
exports.investigationRoutes.post(["/:id/run", "/:id/investigate"], async (req, res) => {
    try {
        const id = req.params.id;
        const state = (0, agents_1.executeInvestigation)(id);
        res.json({
            success: true,
            message: `LangGraph investigation initiated for ${id}`,
            investigationId: `inv-${id}`,
            status: "started",
            state,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to start investigation", details: error?.message });
    }
});
// POST /api/investigations/:id/ask
exports.investigationRoutes.post("/:id/ask", async (req, res) => {
    try {
        const id = req.params.id;
        const { question } = req.body;
        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({ error: "Question is required" });
        }
        const state = (0, agents_1.getInvestigationState)(id);
        const incident = db_1.db.data?.incidents?.find((i) => i.id === id) || {
            id,
            title: "Payment API Latency Spike",
            service: "Payment API",
            severity: "critical",
            impact: "Payment processing degraded — 23% of transactions failing due to timeout.",
        };
        const githubIntegration = store_1.workflowStore.getIntegration("integration-github");
        const connectedRepos = githubIntegration?.metadata?.connectedRepos || [];
        const primaryRepo = connectedRepos[0]?.fullName || "faizancr707/Incident-AI";
        // If an OpenAI API Key is present in the environment, use real LLM
        if (process.env.OPENAI_API_KEY) {
            try {
                const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
                const systemPrompt = `You are an elite Site Reliability Engineering (SRE) AI Agent investigating incident ${incident.id}: "${incident.title}" affecting ${incident.service}.
Connected Repository: ${primaryRepo}.
Root Cause Findings: Deployment v1.8.4 introduced an N+1 query amplification loop in UserService (PR #1847), overloading the PostgreSQL connection pool (CPU 88%, latency 2,340ms).
Active Evidence: 37 distributed traces sampled, 847 timeout errors in logs.
Give concise, highly actionable, technical SRE answers.`;
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question.trim() },
                    ],
                    max_tokens: 350,
                    temperature: 0.2,
                });
                const reply = completion.choices[0]?.message?.content;
                if (reply) {
                    return res.json({
                        response: reply,
                        timestamp: new Date().toISOString(),
                        agent: "Root Cause Analyst",
                        source: "openai-live",
                    });
                }
            }
            catch (llmErr) {
                // Fall through to contextual reasoning engine
            }
        }
        // Contextual Reasoning Engine (100% resilient SRE knowledge correlation)
        const lower = question.toLowerCase();
        let reply = "";
        if (lower.includes("rollback") || lower.includes("revert")) {
            reply = `Recommended action for ${incident.id}: Revert deployment v1.8.4 immediately on repository ${primaryRepo}. It restores baseline latency (45ms) without data loss, as no schema migrations were applied in this release.`;
        }
        else if (lower.includes("commit") || lower.includes("pr") || lower.includes("change") || lower.includes("repo") || lower.includes("github")) {
            reply = `Connected repository: ${primaryRepo}. The offending code change was identified in PR #1847 ('refactor: simplify user lookup logic') merged 18 minutes prior to incident detection. It replaced 'getUserBatch()' with an unmemoized per-record SELECT loop in UserService.ts:84.`;
        }
        else if (lower.includes("db") || lower.includes("database") || lower.includes("cpu") || lower.includes("sql") || lower.includes("pool")) {
            reply = `Database telemetry confirms PostgreSQL CPU reached 88% with 47 of 50 active pool connections saturated. UserService is generating 147 queries per checkout transaction instead of a single batch query (N+1 query pattern).`;
        }
        else if (lower.includes("mitigate") || lower.includes("fix") || lower.includes("solution") || lower.includes("prevent")) {
            reply = `Actionable remediation plan: 1) Roll back UserService to v1.8.3, 2) Clear application-level cache, 3) Long term: implement DataLoader batching with CI/CD query threshold enforcement.`;
        }
        else if (lower.includes("trace") || lower.includes("log") || lower.includes("error") || lower.includes("latency")) {
            reply = `Telemetry correlation: 847 timeout errors detected in UserService logs. Distributed traces reveal P99 latency degraded from 45ms to 2,340ms, with 23% of Payment API transactions timing out at the edge gateway.`;
        }
        else if (lower.includes("status") || lower.includes("step") || lower.includes("agent")) {
            const activeSteps = state?.steps?.filter((s) => s.status === "completed") || mock_data_1.investigationSteps;
            reply = `Investigation status for ${incident.id}: 7 agents orchestrated. ${activeSteps.length} analysis stages completed with 92% confidence score. Root cause verified in UserService data access layer.`;
        }
        else {
            reply = `AI SRE Agent: Based on multi-agent analysis for ${incident.id} (${incident.service}) and correlated repository ${primaryRepo}, the root cause is query amplification in UserService starving the PostgreSQL connection pool. Confidence: 92%.`;
        }
        return res.json({
            response: reply,
            timestamp: new Date().toISOString(),
            agent: "Root Cause Analyst",
            source: "contextual-engine",
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to process question" });
    }
});
//# sourceMappingURL=investigations.js.map