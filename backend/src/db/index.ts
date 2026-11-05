import { Pool } from "pg";
import { logger } from "../lib/logger";

// Import mock data to seed the fallback DB
// @ts-ignore
import { incidents, logs, metrics, traceSpans, deployments, agents, knowledgeEntries, evaluationMetrics } from "../../../frontend/src/lib/mock-data";

// Create an in-memory data store for fallback
class MockDB {
  data: Record<string, any[]> = {
    incidents: incidents || [],
    logs: logs || [],
    metrics: metrics || [],
    traces: traceSpans || [],
    deployments: deployments || [],
    agents: agents || [],
    knowledge: knowledgeEntries || [],
    evaluations: evaluationMetrics || []
  };

  async query(text: string, params?: any[]) {
    // Basic mock logic returning empty rows unless implemented
    return { rows: [] };
  }
}

export let db: any;
export let isMockDB = false;

if (process.env.DATABASE_URL) {
  try {
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    logger.info("Connected to PostgreSQL");
  } catch (err) {
    logger.error("Failed to connect to PostgreSQL, falling back to MockDB", { err });
    db = new MockDB();
    isMockDB = true;
  }
} else {
  logger.warn("No DATABASE_URL provided, using MockDB for local development.");
  db = new MockDB();
  isMockDB = true;
}

export default db;
