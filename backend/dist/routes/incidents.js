"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const agents_1 = require("../ai/agents");
exports.incidentRoutes = (0, express_1.Router)();
const IncidentFilterSchema = zod_1.z.object({
    severity: zod_1.z.enum(["critical", "high", "medium", "low"]).optional(),
    status: zod_1.z.enum(["detected", "investigating", "identified", "monitoring", "resolved"]).optional(),
    service: zod_1.z.string().optional(),
    environment: zod_1.z.enum(["production", "staging", "development"]).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0),
});
exports.incidentRoutes.get("/", async (req, res) => {
    try {
        const filters = IncidentFilterSchema.parse(req.query);
        if (db_1.isMockDB) {
            let data = db_1.db.data.incidents;
            if (filters.severity)
                data = data.filter((i) => i.severity === filters.severity);
            if (filters.status)
                data = data.filter((i) => i.status === filters.status);
            if (filters.service)
                data = data.filter((i) => i.service === filters.service);
            if (filters.environment)
                data = data.filter((i) => i.environment === filters.environment);
            const paginated = data.slice(filters.offset, filters.offset + filters.limit);
            return res.json({
                incidents: paginated,
                total: data.length,
                filters
            });
        }
        return res.json({ incidents: [], total: 0, filters });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: "Invalid filters", details: error.errors });
        }
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});
exports.incidentRoutes.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (db_1.isMockDB) {
            const incident = db_1.db.data.incidents.find((i) => i.id === id);
            return incident ? res.json({ incident }) : res.status(404).json({ error: "Not found" });
        }
        res.json({ incident: null });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch incident" });
    }
});
exports.incidentRoutes.post("/:id/investigate", async (req, res) => {
    try {
        const { id } = req.params;
        const state = (0, agents_1.executeInvestigation)(id);
        res.json({ investigationId: `inv-${id}`, status: "started", state });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to start investigation" });
    }
});
//# sourceMappingURL=incidents.js.map