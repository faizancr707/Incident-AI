"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMockDB = exports.db = void 0;
const pg_1 = require("pg");
const logger_1 = require("../lib/logger");
// Import mock data to seed the fallback DB
const mock_data_1 = require("./mock-data");
// Create an in-memory data store for fallback
class MockDB {
    data = {
        incidents: mock_data_1.incidents || [],
        logs: mock_data_1.logs || [],
        metrics: mock_data_1.metrics || [],
        traces: mock_data_1.traceSpans || [],
        deployments: mock_data_1.deployments || [],
        agents: mock_data_1.agents || [],
        knowledge: mock_data_1.knowledgeEntries || [],
        evaluations: mock_data_1.evaluationMetrics || [],
        serviceHealth: mock_data_1.serviceHealth || []
    };
    async query(text, params) {
        // Basic mock logic returning empty rows unless implemented
        return { rows: [] };
    }
}
exports.isMockDB = false;
if (process.env.DATABASE_URL) {
    try {
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        exports.db = pool;
        pool.query("SELECT 1")
            .then(() => {
            logger_1.logger.info("Connected to PostgreSQL");
            exports.isMockDB = false;
        })
            .catch((err) => {
            logger_1.logger.warn("PostgreSQL connection verification failed, using MockDB fallback", { error: err.message });
            exports.isMockDB = true;
        });
    }
    catch (err) {
        logger_1.logger.error("Failed to initialize PostgreSQL pool, falling back to MockDB", { err });
        exports.db = new MockDB();
        exports.isMockDB = true;
    }
}
else {
    logger_1.logger.warn("No DATABASE_URL provided, using MockDB for local development.");
    exports.db = new MockDB();
    exports.isMockDB = true;
}
exports.default = exports.db;
//# sourceMappingURL=index.js.map