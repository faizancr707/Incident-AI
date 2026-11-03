import { Pool } from "pg";
import { logger } from "../lib/logger";

// Import mock data to seed the fallback DB
import { incidents, logs, metrics, traceSpans, deployments, agents, knowledgeEntries, evaluationMetrics, serviceHealth } from "./mock-data";


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
    evaluations: evaluationMetrics || [],
    serviceHealth: serviceHealth || []
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
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = pool;
    pool.query("SELECT 1")
      .then(() => {
        logger.info("Connected to PostgreSQL");
        isMockDB = false;
      })
      .catch((err) => {
        logger.warn("PostgreSQL connection verification failed, using MockDB fallback", { error: err.message });
        isMockDB = true;
      });
  } catch (err) {
    logger.error("Failed to initialize PostgreSQL pool, falling back to MockDB", { err });
    db = new MockDB();
    isMockDB = true;
  }
} else {
  logger.warn("No DATABASE_URL provided, using MockDB for local development.");
  db = new MockDB();
  isMockDB = true;
}

export default db;
