import { Router } from "express";
import { db, isMockDB } from "../db";

export const metricsRoutes = Router();

metricsRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ metrics: db.data.metrics });
  }
  return res.json({ metrics: [] });
});
