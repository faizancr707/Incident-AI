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
