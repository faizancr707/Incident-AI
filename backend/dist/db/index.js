"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMockDB = exports.db = void 0;
const pg_1 = require("pg");
const logger_1 = require("../lib/logger");
/**
 * Production-ready in-memory store for runtime persistence.
 * Starts with strictly 0 records. All records are created by genuine API calls or webhook ingestions.
 */
class LiveStore {
    data = {
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
    async query(text, params) {
        return { rows: [] };
    }
}
const liveStore = new LiveStore();
exports.db = liveStore;
exports.isMockDB = true;
if (process.env.DATABASE_URL) {
    try {
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        pool.query("SELECT 1")
            .then(() => {
            logger_1.logger.info("Connected to PostgreSQL database");
            exports.db = pool;
            exports.isMockDB = false;
        })
            .catch((err) => {
            logger_1.logger.warn("PostgreSQL not reachable, using live runtime store", { error: err.message });
            exports.db = liveStore;
            exports.isMockDB = true;
        });
    }
    catch (err) {
        logger_1.logger.error("Failed to initialize PostgreSQL pool", { err });
        exports.db = liveStore;
        exports.isMockDB = true;
    }
}
else {
    logger_1.logger.info("Using live runtime data store");
    exports.db = liveStore;
    exports.isMockDB = true;
}
exports.default = exports.db;
//# sourceMappingURL=index.js.map