import { Router } from "express";
import { db, isMockDB } from "../db";
import { serviceHealth } from "../db/mock-data";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  let dbStatus = "mock";
  if (!isMockDB && db && typeof db.query === "function") {
    try {
      await db.query("SELECT 1");
      dbStatus = "connected";
    } catch {
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
healthRoutes.get("/services", async (req, res) => {
  try {
    // When PostgreSQL is connected, query live service metrics
    // For now, return the curated service health dataset
    return res.json(serviceHealth);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch service health" });
  }
});

