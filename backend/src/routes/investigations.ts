import { Router } from "express";
import { getInvestigationState } from "../ai/agents";

export const investigationRoutes = Router();

// GET /api/investigations
investigationRoutes.get("/", async (req, res) => {
  res.json({ investigations: [] });
});

// GET /api/investigations/:id
investigationRoutes.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const state = getInvestigationState(id);
    if (!state) {
      return res.status(404).json({ error: "Investigation not found" });
    }
    res.json({ investigation: state });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch investigation" });
  }
});

// GET /api/investigations/:id/steps
investigationRoutes.get("/:id/steps", async (req, res) => {
  try {
    const { id } = req.params;
    const state = getInvestigationState(id);
    res.json({ steps: state?.steps || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch steps" });
  }
});

// GET /api/investigations/:id/evidence
investigationRoutes.get("/:id/evidence", async (req, res) => {
  try {
    const { id } = req.params;
    const state = getInvestigationState(id);
    res.json({ evidence: state?.evidence || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

// GET /api/investigations/:id/root-cause
investigationRoutes.get("/:id/root-cause", async (req, res) => {
  try {
    const { id } = req.params;
    const state = getInvestigationState(id);
    res.json({ rootCause: state?.rootCause || null });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch root cause" });
  }
});

// POST /api/investigations/:id/ask
investigationRoutes.post("/:id/ask", async (req, res) => {
  const { question } = req.body;
  // TODO: Send question to AI agent via LangGraph
  res.json({ response: null });
});
