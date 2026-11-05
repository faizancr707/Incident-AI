import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { setupTelemetry } from "./telemetry/setup";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { incidentRoutes } from "./routes/incidents";
import { investigationRoutes } from "./routes/investigations";
import { agentRoutes } from "./routes/agents";
import { metricsRoutes } from "./routes/metrics";
import { logRoutes } from "./routes/logs";
import { traceRoutes } from "./routes/traces";
import { deploymentRoutes } from "./routes/deployments";
import { knowledgeRoutes } from "./routes/knowledge";
import { evaluationRoutes } from "./routes/evaluations";
import { healthRoutes } from "./routes/health";
import { webhookRoutes } from "./routes/webhooks";
import { workflowRoutes } from "./routes/workflows";

// Initialize OpenTelemetry before anything else
setupTelemetry();

const app = express();
const PORT = process.env.PORT || 3001;

/* ── CORS Configuration ─────────────────────────────────── */
const rawOrigins = process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3002";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

/* ── Middleware ─────────────────────────────────────────── */
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(authMiddleware); // Extract user from token on every request

/* ── Routes ────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);           // Public: login/logout/me
app.use("/api/health", healthRoutes);       // Public: health check
app.use("/api/webhooks", webhookRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/investigations", investigationRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/traces", traceRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/evaluations", evaluationRoutes);

/* ── Error Handler ─────────────────────────────────────── */
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: "Internal server error", requestId: req.headers["x-request-id"] });
});

/* ── Start ─────────────────────────────────────────────── */
app.listen(3001, () => {
  logger.info(`🚀 Incident Investigator API running on port ${PORT}`);
  logger.info(`📊 Metrics available at /api/health/metrics`);
  logger.info(`🔍 OpenTelemetry tracing enabled`);
  logger.info(`🔐 Auth middleware active`);
});

export default app;
