import { Router } from "express";
import { db } from "../db";
import { getInvestigationState } from "../ai/agents";

export const reportRoutes = Router();

// GET /api/reports — List all available incident reports
reportRoutes.get("/", async (req, res) => {
  try {
    const incidents = db.data?.incidents || [];
    const reports = incidents.map((inc: any) => ({
      incidentId: inc.id,
      title: inc.title,
      service: inc.service,
      severity: inc.severity,
      status: inc.status,
      startedAt: inc.startedAt,
      resolvedAt: inc.resolvedAt,
    }));
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: "Failed to list reports" });
  }
});

// GET /api/reports/:incidentId — Generate/fetch incident postmortem report
reportRoutes.get("/:incidentId", async (req, res) => {
  try {
    const { incidentId } = req.params;

    const incident = db.data?.incidents?.find((i: any) => i.id === incidentId);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Try to get live investigation state first
    const liveState = getInvestigationState(incidentId);

    const timeline = [
      { timestamp: incident.startedAt, event: `Incident ${incident.id} detected on ${incident.service}.` },
      ...(liveState?.steps
        ?.filter((s: any) => s.status === "completed")
        ?.map((s: any) => ({
          timestamp: s.completedAt || new Date(),
          event: `${s.agent}: ${s.findings?.join("; ") || "Stage completed"}`,
        })) || []),
      ...(incident.resolvedAt
        ? [{ timestamp: incident.resolvedAt, event: `Incident marked as resolved.` }]
        : []),
    ];

    return res.json({
      report: {
        incidentId: incident.id,
        executiveSummary: `Incident ${incident.id} (${incident.title}) affected ${incident.service} in ${incident.environment}. ${incident.impact || "Service degradation reported."}`,
        impact: {
          description: incident.impact || "Service degradation reported.",
          requestsAffected: incident.impactedRequests || 0,
          usersAffected: Math.round((incident.impactedRequests || 0) / 4),
          revenueImpact: incident.severity === "critical" ? "High business impact" : "Low business impact",
        },
        timeline,
        rootCause: liveState?.rootCause || {
          summary: incident.impact || `Service incident on ${incident.service}`,
          confidence: incident.aiInvestigation?.confidence || 80,
          evidence: [`Incident title: ${incident.title}`, `Service: ${incident.service}`, `Severity: ${incident.severity}`],
          recommendation: `Inspect ${incident.service} service health and deployment logs.`,
          contributingFactors: [incident.severity.toUpperCase() + " severity alert"],
        },
        resolution: {
          steps: incident.status === "resolved"
            ? ["Incident identified and resolved by engineering team", "Postmortem generated"]
            : ["Incident mitigation and investigation in progress"],
          resolvedBy: incident.assignee || "Unassigned",
          resolvedAt: incident.resolvedAt || new Date(),
        },
        prevention: [
          `Implement health check telemetry alarms for ${incident.service}`,
          "Add automated regression checks to continuous deployment pipeline",
          "Ensure secondary failover endpoints are configured",
        ],
        aiInvestigationTrace: liveState?.steps || [],
        confidence: liveState?.rootCause?.confidence || incident.aiInvestigation?.confidence || 85,
        limitations: [
          "Report generated from live telemetry and investigation records.",
        ],
        sourceReferences: [],
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate incident report" });
  }
});
