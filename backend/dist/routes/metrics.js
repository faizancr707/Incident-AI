"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.metricsRoutes = (0, express_1.Router)();
exports.metricsRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ metrics: db_1.db.data.metrics });
    }
    return res.json({ metrics: [] });
});
// GET /api/metrics/kpi — Dynamically compute KPI metrics from incidents data
exports.metricsRoutes.get("/kpi", async (req, res) => {
    try {
        if (db_1.isMockDB) {
            const incidents = db_1.db.data.incidents || [];
            const activeIncidents = incidents.filter((i) => i.status !== "resolved").length;
            const criticalIncidents = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;
            const investigationsRunning = incidents.filter((i) => i.aiInvestigation?.active).length;
            const resolvedIncidents = incidents.filter((i) => i.status === "resolved");
            const aiAssistedResolutions = resolvedIncidents.filter((i) => i.aiInvestigation?.confidence && i.aiInvestigation.confidence > 0).length;
            // Calculate MTTD and MTTR from resolved incidents
            const durationsMinutes = resolvedIncidents.map((i) => i.duration || 0).filter((d) => d > 0);
            const avgDuration = durationsMinutes.length > 0 ? durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length : 0;
            const mttd = Math.round((avgDuration * 0.1) * 10) / 10; // ~10% of total duration as detection time
            const mttr = Math.round(avgDuration * 10) / 10;
            const confidences = resolvedIncidents
                .map((i) => i.aiInvestigation?.confidence || 0)
                .filter((c) => c > 0);
            const aiAccuracy = confidences.length > 0
                ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10) / 10
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
    }
    catch (error) {
        res.status(500).json({ error: "Failed to compute KPI metrics" });
    }
});
//# sourceMappingURL=metrics.js.map