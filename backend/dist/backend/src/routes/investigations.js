"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationRoutes = void 0;
const express_1 = require("express");
const agents_1 = require("../ai/agents");
exports.investigationRoutes = (0, express_1.Router)();
// GET /api/investigations
exports.investigationRoutes.get("/", async (req, res) => {
    res.json({ investigations: [] });
});
// GET /api/investigations/:id
exports.investigationRoutes.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.getInvestigationState)(id);
        if (!state) {
            return res.status(404).json({ error: "Investigation not found" });
        }
        res.json({ investigation: state });
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
        res.json({ steps: state?.steps || [] });
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
        res.json({ evidence: state?.evidence || [] });
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
        res.json({ rootCause: state?.rootCause || null });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch root cause" });
    }
});
// POST /api/investigations/:id/ask
exports.investigationRoutes.post("/:id/ask", async (req, res) => {
    const { question } = req.body;
    // TODO: Send question to AI agent via LangGraph
    res.json({ response: null });
});
//# sourceMappingURL=investigations.js.map