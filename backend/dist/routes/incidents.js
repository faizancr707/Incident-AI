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
const CreateIncidentSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
    service: zod_1.z.string().min(1, "Service name is required"),
    severity: zod_1.z.enum(["critical", "high", "medium", "low"]).default("high"),
    environment: zod_1.z.enum(["production", "staging", "development"]).default("production"),
    impact: zod_1.z.string().optional(),
    autoInvestigate: zod_1.z.boolean().default(true),
});
// POST /api/incidents — Report or simulate a new production incident
exports.incidentRoutes.post("/", async (req, res) => {
    try {
        const body = CreateIncidentSchema.parse(req.body);
        const nextNumber = 4820 + (db_1.db.data?.incidents?.length || 0) + 1;
        const newId = `INC-${nextNumber}`;
        const newIncident = {
            id: newId,
            title: body.title,
            severity: body.severity,
            status: body.autoInvestigate ? "investigating" : "detected",
            service: body.service,
            environment: body.environment,
            startedAt: new Date(),
            duration: 1,
            impact: body.impact || `${body.severity.toUpperCase()} severity incident reported on ${body.service}`,
            impactedRequests: body.severity === "critical" ? 8500 : body.severity === "high" ? 1400 : 250,
            assignee: "AI Agent (Auto-Assigned)",
            aiInvestigation: {
                active: body.autoInvestigate,
                stage: body.autoInvestigate ? "detect" : "idle",
                progress: body.autoInvestigate ? 15 : 0,
                confidence: body.autoInvestigate ? 88 : 0,
                startedAt: new Date(),
            },
            affectedServices: [body.service],
            tags: ["production-alert", body.severity, body.service.toLowerCase().replace(/\s+/g, "-")],
        };
        if (db_1.isMockDB && db_1.db.data?.incidents) {
            db_1.db.data.incidents.unshift(newIncident);
        }
        if (body.autoInvestigate) {
            try {
                (0, agents_1.executeInvestigation)(newId);
            }
            catch (err) {
                // Logging is handled in executeInvestigation
            }
        }
        return res.status(201).json({
            success: true,
            incident: newIncident,
            message: `Incident ${newId} created successfully`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create incident" });
    }
});
// PATCH /api/incidents/:id — Update status or details of an incident
exports.incidentRoutes.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignee, severity } = req.body;
        if (db_1.isMockDB && db_1.db.data?.incidents) {
            const idx = db_1.db.data.incidents.findIndex((i) => i.id === id);
            if (idx === -1) {
                return res.status(404).json({ error: "Incident not found" });
            }
            const existing = db_1.db.data.incidents[idx];
            const updated = {
                ...existing,
                status: status || existing.status,
                assignee: assignee || existing.assignee,
                severity: severity || existing.severity,
                resolvedAt: status === "resolved" ? new Date() : existing.resolvedAt,
            };
            db_1.db.data.incidents[idx] = updated;
            return res.json({ success: true, incident: updated });
        }
        res.status(404).json({ error: "Incident not found" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update incident" });
    }
});
//# sourceMappingURL=incidents.js.map