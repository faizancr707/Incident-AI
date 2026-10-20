import { Router } from "express";
import { isMockDB } from "../db";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  res.json({
    status: "ok",
    database: isMockDB ? "mock" : "connected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

