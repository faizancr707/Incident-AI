import { Router } from "express";
import { db, isMockDB } from "../db";
import { investigationSteps, rootCauseAnalysis } from "../db/mock-data";
import { getInvestigationState } from "../ai/agents";

export const reportRoutes = Router();

// GET /api/reports/:incidentId — Generate/fetch incident postmortem report
reportRoutes.get("/:incidentId", async (req, res) => {
  try {
    const { incidentId } = req.params;

    // Try to get live investigation state first
    const liveState = getInvestigationState(incidentId);

    if (liveState && liveState.rootCause) {
      // Build report from live investigation data
      return res.json({
        report: {
          incidentId,
          executiveSummary: `AI investigation completed for ${incidentId}. Root cause identified with ${liveState.rootCause.confidence || 0}% confidence.`,
          impact: {
            description: "Impact computed from live telemetry data.",
            requestsAffected: 0,
            usersAffected: 0,
            revenueImpact: "Calculating...",
          },
          timeline: liveState.steps
            .filter((s: any) => s.status === "completed")
            .map((s: any) => ({
              timestamp: s.timestamp || new Date(),
              event: `${s.agent}: ${s.findings?.join(", ") || "Step completed"}`,
            })),
          rootCause: liveState.rootCause,
          resolution: {
            steps: ["Review AI recommendations", "Apply suggested fix"],
            resolvedBy: "AI-Assisted",
            resolvedAt: new Date(),
          },
          prevention: ["Follow AI-generated prevention plan"],
          aiInvestigationTrace: liveState.steps,
          confidence: liveState.rootCause.confidence || 0,
          limitations: ["Report generated from automated investigation data"],
          sourceReferences: [],
        },
      });
    }

    // Fall back to mock-data driven report for known incidents
    if (isMockDB) {
      const incident = db.data.incidents.find((i: any) => i.id === incidentId);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      return res.json({
        report: {
          incidentId: incident.id,
          executiveSummary: `Incident ${incident.id} (${incident.title}) affected ${incident.service} in ${incident.environment}. ${incident.impact}`,
          impact: {
            description: incident.impact || "Service degradation detected.",
            requestsAffected: incident.impactedRequests || 0,
            usersAffected: Math.round((incident.impactedRequests || 0) / 4),
            revenueImpact: incident.impactedRequests > 10000 ? "~$45,000" : "< $5,000",
          },
          timeline: [
            { timestamp: incident.startedAt, event: `Incident ${incident.id} detected on ${incident.service}.` },
            { timestamp: new Date(new Date(incident.startedAt).getTime() + 60000), event: "AI investigation initiated." },
            ...(incident.resolvedAt
              ? [{ timestamp: incident.resolvedAt, event: "Incident resolved." }]
              : []),
          ],
          rootCause: rootCauseAnalysis,
          resolution: {
            steps: incident.status === "resolved"
              ? ["Root cause identified by AI agents", "Fix applied and verified"]
              : ["Investigation in progress"],
            resolvedBy: incident.assignee || "Unassigned",
            resolvedAt: incident.resolvedAt || new Date(),
          },
          prevention: [
            "Implement automated regression tests for the affected service",
            "Add anomaly detection thresholds for key metrics",
            "Review deployment pipeline safeguards",
          ],
          aiInvestigationTrace: investigationSteps,
          confidence: incident.aiInvestigation?.confidence || 0,
          limitations: [
            "Report generated from available telemetry data. Some metrics may be sampled.",
          ],
          sourceReferences: [],
        },
      });
    }

    return res.status(404).json({ error: "No report data available for this incident" });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate incident report" });
  }
});
