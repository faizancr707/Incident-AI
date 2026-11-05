import { Router } from "express";
import { db, isMockDB } from "../db";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  res.json({ status: "ok" });
});
