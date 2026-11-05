"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const mock_data_1 = require("../db/mock-data");
exports.healthRoutes = (0, express_1.Router)();
exports.healthRoutes.get("/", async (req, res) => {
    let dbStatus = "mock";
    if (!db_1.isMockDB && db_1.db && typeof db_1.db.query === "function") {
        try {
            await db_1.db.query("SELECT 1");
            dbStatus = "connected";
        }
        catch {
            dbStatus = "mock";
        }
    }
    res.json({
        status: "ok",
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
// GET /api/health/services — Service health status for topology & telemetry dashboards
exports.healthRoutes.get("/services", async (req, res) => {
    try {
        // When PostgreSQL is connected, query live service metrics
        // For now, return the curated service health dataset
        return res.json(mock_data_1.serviceHealth);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch service health" });
    }
});
//# sourceMappingURL=health.js.map