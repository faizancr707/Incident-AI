"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const setup_1 = require("./telemetry/setup");
const logger_1 = require("./lib/logger");
const incidents_1 = require("./routes/incidents");
const investigations_1 = require("./routes/investigations");
const agents_1 = require("./routes/agents");
const metrics_1 = require("./routes/metrics");
const logs_1 = require("./routes/logs");
const traces_1 = require("./routes/traces");
const deployments_1 = require("./routes/deployments");
const knowledge_1 = require("./routes/knowledge");
const evaluations_1 = require("./routes/evaluations");
const health_1 = require("./routes/health");
// Initialize OpenTelemetry before anything else
(0, setup_1.setupTelemetry)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
/* ── Middleware ─────────────────────────────────────────── */
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, morgan_1.default)("combined", { stream: { write: (msg) => logger_1.logger.info(msg.trim()) } }));
/* ── Routes ────────────────────────────────────────────── */
app.use("/api/health", health_1.healthRoutes);
app.use("/api/incidents", incidents_1.incidentRoutes);
app.use("/api/investigations", investigations_1.investigationRoutes);
app.use("/api/agents", agents_1.agentRoutes);
app.use("/api/metrics", metrics_1.metricsRoutes);
app.use("/api/logs", logs_1.logRoutes);
app.use("/api/traces", traces_1.traceRoutes);
app.use("/api/deployments", deployments_1.deploymentRoutes);
app.use("/api/knowledge", knowledge_1.knowledgeRoutes);
app.use("/api/evaluations", evaluations_1.evaluationRoutes);
/* ── Error Handler ─────────────────────────────────────── */
app.use((err, req, res, _next) => {
    logger_1.logger.error("Unhandled error", { error: err.message, stack: err.stack, path: req.path });
    res.status(500).json({ error: "Internal server error", requestId: req.headers["x-request-id"] });
});
/* ── Start ─────────────────────────────────────────────── */
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Incident Investigator API running on port ${PORT}`);
    logger_1.logger.info(`📊 Metrics available at /api/health/metrics`);
    logger_1.logger.info(`🔍 OpenTelemetry tracing enabled`);
});
exports.default = app;
//# sourceMappingURL=index.js.map