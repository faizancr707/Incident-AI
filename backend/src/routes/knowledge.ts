import { Router } from "express";
import { db, isMockDB } from "../db";

export const knowledgeRoutes = Router();

knowledgeRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ knowledge: db.data.knowledge });
  }
  return res.json({ knowledge: [] });
});
