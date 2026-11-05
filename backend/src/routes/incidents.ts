import { Router } from "express";
import { z } from "zod";
import { db, isMockDB } from "../db";
import { executeInvestigation } from "../ai/agents";

export const incidentRoutes = Router();

const IncidentFilterSchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["detected", "investigating", "identified", "monitoring", "resolved"]).optional(),
  service: z.string().optional(),
  environment: z.enum(["production", "staging", "development"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

incidentRoutes.get("/", async (req, res) => {
  try {
    const filters = IncidentFilterSchema.parse(req.query);
    if (isMockDB) {
      let data = db.data.incidents;
      if (filters.severity) data = data.filter((i: any) => i.severity === filters.severity);
      if (filters.status) data = data.filter((i: any) => i.status === filters.status);
      if (filters.service) data = data.filter((i: any) => i.service === filters.service);
      if (filters.environment) data = data.filter((i: any) => i.environment === filters.environment);
      
      const paginated = data.slice(filters.offset, filters.offset + filters.limit);
      return res.json({
        incidents: paginated,
        total: data.length,
        filters
      });
    }
    return res.json({ incidents: [], total: 0, filters });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid filters", details: error.errors });
    }
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

incidentRoutes.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockDB) {
      const incident = db.data.incidents.find((i: any) => i.id === id);
      return incident ? res.json({ incident }) : res.status(404).json({ error: "Not found" });
    }
    res.json({ incident: null });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

incidentRoutes.post("/:id/investigate", async (req, res) => {
  try {
    const { id } = req.params;
    const state = executeInvestigation(id);
    res.json({ investigationId: `inv-${id}`, status: "started", state });
  } catch (error) {
    res.status(500).json({ error: "Failed to start investigation" });
  }
});

const CreateIncidentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  service: z.string().min(1, "Service name is required"),
  severity: z.enum(["critical", "high", "medium", "low"]).default("high"),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  impact: z.string().optional(),
  autoInvestigate: z.boolean().default(true),
});

// POST /api/incidents — Report or simulate a new production incident
incidentRoutes.post("/", async (req, res) => {
  try {
    const body = CreateIncidentSchema.parse(req.body);

    const nextNumber = 4820 + (db.data?.incidents?.length || 0) + 1;
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

    if (isMockDB && db.data?.incidents) {
      db.data.incidents.unshift(newIncident);
    }

    if (body.autoInvestigate) {
      try {
        executeInvestigation(newId);
      } catch (err) {
        // Logging is handled in executeInvestigation
      }
    }

    return res.status(201).json({
      success: true,
      incident: newIncident,
      message: `Incident ${newId} created successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create incident" });
  }
});

// PATCH /api/incidents/:id — Update status or details of an incident
incidentRoutes.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignee, severity } = req.body;

    if (isMockDB && db.data?.incidents) {
      const idx = db.data.incidents.findIndex((i: any) => i.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const existing = db.data.incidents[idx];
      const updated = {
        ...existing,
        status: status || existing.status,
        assignee: assignee || existing.assignee,
        severity: severity || existing.severity,
        resolvedAt: status === "resolved" ? new Date() : existing.resolvedAt,
      };

      db.data.incidents[idx] = updated;
      return res.json({ success: true, incident: updated });
    }

    res.status(404).json({ error: "Incident not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update incident" });
  }
});
