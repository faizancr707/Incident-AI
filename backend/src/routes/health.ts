import { Router } from "express";
import { db, isMockDB } from "../db";

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

