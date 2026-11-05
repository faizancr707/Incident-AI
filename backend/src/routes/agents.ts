import { Router } from "express";
import { db, isMockDB } from "../db";

export const agentRoutes = Router();

agentRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ agents: db.data.agents });
  }
  return res.json({ agents: [] });
});

agentRoutes.get("/:id", async (req, res) => {
  if (isMockDB) {
    const agent = db.data.agents.find((a: any) => a.id === req.params.id);
    return agent ? res.json({ agent }) : res.status(404).json({ error: "Not found" });
  }
  return res.json({ agent: null });
});
