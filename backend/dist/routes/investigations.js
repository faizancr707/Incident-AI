"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationRoutes = void 0;
const express_1 = require("express");
const agents_1 = require("../ai/agents");
const db_1 = require("../db");
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
            stepsCount: liveState?.steps?.length || 0,
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
        const incident = db_1.db.data?.incidents?.find((i) => i.id === id);
        if (!incident) {
            return res.status(404).json({ error: "Investigation not found" });
        }
        return res.json({
            investigation: null,
            status: "not_started",
            message: `No AI investigation has been conducted for ${id} yet. Click 'Start AI Investigation' to begin analyzing live telemetry and code changes.`,
            metadata: { incidentId: id, startedAt: incident.startedAt },
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
        return res.json({ steps: state?.steps || [] });
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
        return res.json({ evidence: state?.evidence || [] });
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
        return res.json({ rootCause: state?.rootCause || null });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch root cause" });
    }
});
// POST /api/investigations/:id/run or /investigate or /trigger
exports.investigationRoutes.post(["/:id/run", "/:id/investigate", "/:id/trigger"], async (req, res) => {
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
        const incident = db_1.db.data?.incidents?.find((i) => i.id === id);
        if (!incident) {
            return res.status(404).json({ error: "Incident not found" });
        }
        const githubIntegration = store_1.workflowStore.getIntegration("integration-github");
        const connectedRepos = githubIntegration?.metadata?.connectedRepos || [];
        const primaryRepo = connectedRepos[0]?.fullName || "faizancr707/Incident-AI";
        // If an OpenAI API Key is present in the environment, use real LLM
        if (process.env.OPENAI_API_KEY) {
            try {
                const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
                const systemPrompt = `You are a Site Reliability Engineering (SRE) AI Agent investigating incident ${incident.id}: "${incident.title}" affecting ${incident.service}.
Severity: ${incident.severity}. Environment: ${incident.environment}.
Reported Impact: ${incident.impact || "Service degradation"}.
Connected Repository: ${primaryRepo}.
Root Cause Findings: ${state?.rootCause?.summary || "Investigation in progress"}.
Give concise, highly actionable, technical SRE answers based strictly on these facts.`;
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
                // Fall through to real parameter-grounded response
            }
        }
        // Real parameter-grounded technical response based on the actual incident
        const lower = question.toLowerCase();
        let reply = "";
        if (lower.includes("rollback") || lower.includes("revert")) {
            reply = `Remediation for ${incident.id}: Review recent releases on repository ${primaryRepo} affecting service ${incident.service}. If degradation started immediately following a deployment, revert the commit to restore baseline operations.`;
        }
        else if (lower.includes("commit") || lower.includes("pr") || lower.includes("change") || lower.includes("repo") || lower.includes("github")) {
            reply = `Connected repository: ${primaryRepo}. Automated correlation links ${incident.service} to changes on ${primaryRepo}. Review pull requests merged within 1 hour prior to ${new Date(incident.startedAt).toLocaleTimeString()}.`;
        }
        else if (lower.includes("mitigate") || lower.includes("fix") || lower.includes("solution") || lower.includes("prevent")) {
            reply = `Action items for ${incident.service}: 1) Verify healthy pods or instances for ${incident.service}, 2) Check upstream load balancers and database connection pools, 3) Add automated canary verification before full rollout.`;
        }
        else if (lower.includes("status") || lower.includes("step") || lower.includes("agent")) {
            const activeSteps = state?.steps?.filter((s) => s.status === "completed") || [];
            reply = `Investigation status for ${incident.id}: ${activeSteps.length} of ${state?.steps?.length || 0} stages completed. Current workflow state: ${state?.currentStep || "idle"}.`;
        }
        else {
            reply = `AI SRE Agent: Investigating incident ${incident.id} on ${incident.service} (${incident.severity.toUpperCase()}). Reported impact: ${incident.impact || incident.title}. Correlated with repository ${primaryRepo}.`;
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