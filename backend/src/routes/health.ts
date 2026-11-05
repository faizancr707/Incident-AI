import { Router } from "express";
import { db, isMockDB } from "../db";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  let dbStatus = "in-memory";
  if (!isMockDB && db && typeof db.query === "function") {
    try {
      await db.query("SELECT 1");
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }
  res.json({
    status: "ok",
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/services — Real service health status for topology & telemetry dashboards
healthRoutes.get("/services", async (req, res) => {
  try {
    const services = db?.data?.serviceHealth || [];
    return res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch service health" });
  }
});
