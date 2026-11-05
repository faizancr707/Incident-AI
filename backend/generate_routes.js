const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');

const agentsContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const agentRoutes = Router();

agentRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ agents: db.data.agents });
  }
  return res.json({ agents: [] });
});

agentRoutes.get("/:id", async (req, res) => {
  if (isMockDB) {
    const agent = db.data.agents.find((a: any) => a.id === req.params.id);
    return agent ? res.json({ agent }) : res.status(404).json({ error: "Not found" });
  }
  return res.json({ agent: null });
});
`;

const deploymentsContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const deploymentRoutes = Router();

deploymentRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ deployments: db.data.deployments });
  }
  return res.json({ deployments: [] });
});
`;

const evaluationsContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const evaluationRoutes = Router();

evaluationRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ evaluations: db.data.evaluations });
  }
  return res.json({ evaluations: [] });
});
`;

const healthContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  res.json({ status: "ok" });
});
`;

const incidentsContent = `import { Router } from "express";
import { z } from "zod";
import { db, isMockDB } from "../db";

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
    res.json({ investigationId: \`inv-\${id}\`, status: "started" });
  } catch (error) {
    res.status(500).json({ error: "Failed to start investigation" });
  }
});
`;

const knowledgeContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const knowledgeRoutes = Router();

knowledgeRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ knowledge: db.data.knowledge });
  }
  return res.json({ knowledge: [] });
});
`;

const logsContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const logRoutes = Router();

logRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ logs: db.data.logs });
  }
  return res.json({ logs: [] });
});
`;

const metricsContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const metricsRoutes = Router();

metricsRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ metrics: db.data.metrics });
  }
  return res.json({ metrics: [] });
});
`;

const tracesContent = `import { Router } from "express";
import { db, isMockDB } from "../db";

export const traceRoutes = Router();

traceRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ traces: db.data.traces });
  }
  return res.json({ traces: [] });
});
`;

fs.writeFileSync(path.join(routesDir, 'agents.ts'), agentsContent);
fs.writeFileSync(path.join(routesDir, 'deployments.ts'), deploymentsContent);
fs.writeFileSync(path.join(routesDir, 'evaluations.ts'), evaluationsContent);
fs.writeFileSync(path.join(routesDir, 'health.ts'), healthContent);
fs.writeFileSync(path.join(routesDir, 'incidents.ts'), incidentsContent);
fs.writeFileSync(path.join(routesDir, 'knowledge.ts'), knowledgeContent);
fs.writeFileSync(path.join(routesDir, 'logs.ts'), logsContent);
fs.writeFileSync(path.join(routesDir, 'metrics.ts'), metricsContent);
fs.writeFileSync(path.join(routesDir, 'traces.ts'), tracesContent);

console.log('Routes generated successfully.');
