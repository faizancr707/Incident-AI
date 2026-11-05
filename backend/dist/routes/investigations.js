"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationRoutes = void 0;
const express_1 = require("express");
exports.investigationRoutes = (0, express_1.Router)();
// GET /api/investigations
exports.investigationRoutes.get("/", async (req, res) => {
    res.json({ investigations: [] });
});
// GET /api/investigations/:id
exports.investigationRoutes.get("/:id", async (req, res) => {
    res.json({ investigation: null });
});
// GET /api/investigations/:id/steps
exports.investigationRoutes.get("/:id/steps", async (req, res) => {
    res.json({ steps: [] });
});
// GET /api/investigations/:id/evidence
exports.investigationRoutes.get("/:id/evidence", async (req, res) => {
    res.json({ evidence: [] });
});
// GET /api/investigations/:id/root-cause
exports.investigationRoutes.get("/:id/root-cause", async (req, res) => {
    res.json({ rootCause: null });
});
// POST /api/investigations/:id/ask
exports.investigationRoutes.post("/:id/ask", async (req, res) => {
    const { question } = req.body;
    // TODO: Send question to AI agent via LangGraph
    res.json({ response: null });
});
//# sourceMappingURL=investigations.js.map