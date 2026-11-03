import { Router } from "express";
import { db, isMockDB } from "../db";

export const metricsRoutes = Router();

metricsRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ metrics: db.data.metrics });
  }
  return res.json({ metrics: [] });
});

// GET /api/metrics/kpi — Dynamically compute KPI metrics from incidents data
metricsRoutes.get("/kpi", async (req, res) => {
  try {
    if (isMockDB) {
      const incidents: any[] = db.data.incidents || [];
      const activeIncidents = incidents.filter((i: any) => i.status !== "resolved").length;
      const criticalIncidents = incidents.filter((i: any) => i.severity === "critical" && i.status !== "resolved").length;
      const investigationsRunning = incidents.filter((i: any) => i.aiInvestigation?.active).length;
      const resolvedIncidents = incidents.filter((i: any) => i.status === "resolved");
      const aiAssistedResolutions = resolvedIncidents.filter((i: any) => i.aiInvestigation?.confidence && i.aiInvestigation.confidence > 0).length;

      // Calculate MTTD and MTTR from resolved incidents
      const durationsMinutes = resolvedIncidents.map((i: any) => i.duration || 0).filter((d: number) => d > 0);
      const avgDuration = durationsMinutes.length > 0 ? durationsMinutes.reduce((a: number, b: number) => a + b, 0) / durationsMinutes.length : 0;
      const mttd = Math.round((avgDuration * 0.1) * 10) / 10; // ~10% of total duration as detection time
      const mttr = Math.round(avgDuration * 10) / 10;

      const confidences = resolvedIncidents
        .map((i: any) => i.aiInvestigation?.confidence || 0)
        .filter((c: number) => c > 0);
      const aiAccuracy = confidences.length > 0
        ? Math.round((confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length) * 10) / 10
        : 0;

      return res.json({
        kpiMetrics: {
          activeIncidents,
          criticalIncidents,
          mttd,
          mttr,
          investigationsRunning,
          aiAssistedResolutions,
          totalIncidents30d: incidents.length,
          aiAccuracy,
        },
      });
    }
    return res.json({ kpiMetrics: { activeIncidents: 0, criticalIncidents: 0, mttd: 0, mttr: 0, investigationsRunning: 0, aiAssistedResolutions: 0, totalIncidents30d: 0, aiAccuracy: 0 } });
  } catch (error) {
    res.status(500).json({ error: "Failed to compute KPI metrics" });
  }
});
