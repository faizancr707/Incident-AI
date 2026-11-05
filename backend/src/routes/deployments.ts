import { Router } from "express";
import { db, isMockDB } from "../db";

export const deploymentRoutes = Router();

deploymentRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ deployments: db.data.deployments });
  }
  return res.json({ deployments: [] });
});
