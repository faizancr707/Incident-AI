import { Router } from "express";
import { db, isMockDB } from "../db";

export const evaluationRoutes = Router();

evaluationRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ evaluations: db.data.evaluations });
  }
  return res.json({ evaluations: [] });
});
