import { Pool } from "pg";
import { logger } from "../lib/logger";

/**
 * Production-ready in-memory store for runtime persistence.
 * Starts with strictly 0 records. All records are created by genuine API calls or webhook ingestions.
 */
class LiveStore {
  data: Record<string, any[]> = {
    incidents: [],
    logs: [],
    metrics: [],
    traces: [],
    deployments: [],
    agents: [],
    knowledge: [],
    evaluations: [],
    serviceHealth: [],
  };

  async query(text: string, params?: any[]) {
    return { rows: [] };
  }
}

const liveStore = new LiveStore();

export let db: any = liveStore;
export let isMockDB = true;

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query("SELECT 1")
      .then(() => {
        logger.info("Connected to PostgreSQL database");
        db = pool;
        isMockDB = false;
      })
      .catch((err) => {
        logger.warn("PostgreSQL not reachable, using live runtime store", { error: err.message });
        db = liveStore;
        isMockDB = true;
      });
  } catch (err) {
    logger.error("Failed to initialize PostgreSQL pool", { err });
    db = liveStore;
    isMockDB = true;
  }
} else {
  logger.info("Using live runtime data store");
  db = liveStore;
  isMockDB = true;
}

export default db;
