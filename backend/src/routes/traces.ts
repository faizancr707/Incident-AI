import { Router } from "express";
import { db, isMockDB } from "../db";

export const traceRoutes = Router();

traceRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ traces: db.data.traces });
  }
  return res.json({ traces: [] });
});
