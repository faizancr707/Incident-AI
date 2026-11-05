import { Router } from "express";
import { db, isMockDB } from "../db";

export const logRoutes = Router();

logRoutes.get("/", async (req, res) => {
  if (isMockDB) {
    return res.json({ logs: db.data.logs });
  }
  return res.json({ logs: [] });
});
