import { Router, Request, Response } from "express";
import { logger } from "../lib/logger";
import { verifyWebhookSignature, getPayloadString } from "../workflows/webhooks/signature";
import { normalizeEvent } from "../workflows/webhooks/normalize";
import { idempotencyStore } from "../workflows/idempotency";
import { workflowQueue } from "../workflows/queue";
import { executeWorkflow } from "../workflows/engine";
import { workflowStore } from "../workflows/store";

const router = Router();

// Middleware to capture rawBody for HMAC checking
router.use((req: any, _res: any, next: any) => {
  if (!req.rawBody && req.body) {
    req.rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  next();
});

/**
 * POST /api/webhooks/github
 */
router.post("/github", async (req: Request, res: Response): Promise<void> => {
  const deliveryId = (req.headers["x-github-delivery"] as string) || req.body?.delivery_id;
  const eventHeader = (req.headers["x-github-event"] as string) || "push";
  logger.info(`Received GitHub webhook: event=${eventHeader} delivery=${deliveryId}`);

  // Idempotency check
  if (deliveryId && idempotencyStore.isDuplicate(deliveryId)) {
    res.status(200).json({ received: true, duplicate: true, message: "Event already processed" });
    return;
  }

  // Signature verification (if secret configured)
  const secret = process.env.GITHUB_WEBHOOK_SECRET || workflowStore.getIntegration("github")?.webhookSecret;
  const signature = (req.headers["x-hub-signature-256"] as string) || (req.headers["x-hub-signature"] as string);

  if (secret && process.env.NODE_ENV === "production") {
    const isValid = verifyWebhookSignature("github", req, secret);
    if (!isValid) {
      logger.warn("GitHub webhook signature verification failed");
      res.status(401).json({ error: "Invalid HMAC signature" });
      return;
    }
  }

  try {
    const event = normalizeEvent("github", eventHeader, req.body || {});
    if (deliveryId) {
      event.id = deliveryId;
      idempotencyStore.markProcessed(deliveryId);
    }

    // Queue job
    await workflowQueue.add("github-event", event, { jobId: event.id });

    // Execute workflow in engine asynchronously
    executeWorkflow(event).catch((err) => {
      logger.error("Error initiating GitHub workflow execution", { error: err.message });
    });

    res.status(200).json({
      received: true,
      provider: "github",
      eventType: event.eventType,
      eventId: event.id,
      repository: event.repository.fullName,
    });
  } catch (error: any) {
    logger.error("Failed to process GitHub webhook", { error: error.message });
    res.status(500).json({ error: "Failed to process webhook event" });
  }
});

/**
 * POST /api/webhooks/gitlab
 */
router.post("/gitlab", async (req: Request, res: Response): Promise<void> => {
  const eventHeader = (req.headers["x-gitlab-event"] as string) || "Push Hook";
  const token = req.headers["x-gitlab-token"] as string;
  const eventId = req.body?.event_id || req.body?.checkout_sha;
  logger.info(`Received GitLab webhook: event=${eventHeader}`);

  // Idempotency check
  if (eventId && idempotencyStore.isDuplicate(eventId)) {
    res.status(200).json({ received: true, duplicate: true, message: "Event already processed" });
    return;
  }

  // Secret check
  const secret = process.env.GITLAB_WEBHOOK_SECRET || workflowStore.getIntegration("gitlab")?.webhookSecret;
  if (secret && process.env.NODE_ENV === "production") {
    const isValid = verifyWebhookSignature("gitlab", req, secret);
    if (!isValid) {
      logger.warn("GitLab webhook token verification failed");
      res.status(401).json({ error: "Invalid GitLab webhook token" });
      return;
    }
  }

  try {
    const event = normalizeEvent("gitlab", eventHeader, req.body || {});
    if (eventId) {
      idempotencyStore.markProcessed(eventId);
    }

    await workflowQueue.add("gitlab-event", event, { jobId: event.id });

    executeWorkflow(event).catch((err) => {
      logger.error("Error initiating GitLab workflow execution", { error: err.message });
    });

    res.status(200).json({
      received: true,
      provider: "gitlab",
      eventType: event.eventType,
      eventId: event.id,
      repository: event.repository.fullName,
    });
  } catch (error: any) {
    logger.error("Failed to process GitLab webhook", { error: error.message });
    res.status(500).json({ error: "Failed to process webhook event" });
  }
});

/**
 * POST /api/webhooks/vercel
 */
router.post("/vercel", async (req: Request, res: Response): Promise<void> => {
  const eventType = req.body?.type || "deployment.created";
  const eventId = req.body?.id || req.body?.payload?.deployment?.id;
  logger.info(`Received Vercel webhook: event=${eventType}`);

  // Idempotency check
  if (eventId && idempotencyStore.isDuplicate(eventId)) {
    res.status(200).json({ received: true, duplicate: true, message: "Event already processed" });
    return;
  }

  // Signature verification
  const secret = process.env.VERCEL_WEBHOOK_SECRET || workflowStore.getIntegration("vercel")?.webhookSecret;
  if (secret && process.env.NODE_ENV === "production") {
    const isValid = verifyWebhookSignature("vercel", req, secret);
    if (!isValid) {
      logger.warn("Vercel webhook signature verification failed");
      res.status(401).json({ error: "Invalid Vercel webhook signature" });
      return;
    }
  }

  try {
    const event = normalizeEvent("vercel", eventType, req.body || {});
    if (eventId) {
      idempotencyStore.markProcessed(eventId);
    }

    await workflowQueue.add("vercel-event", event, { jobId: event.id });

    executeWorkflow(event).catch((err) => {
      logger.error("Error initiating Vercel workflow execution", { error: err.message });
    });

    res.status(200).json({
      received: true,
      provider: "vercel",
      eventType: event.eventType,
      eventId: event.id,
      repository: event.repository.fullName,
    });
  } catch (error: any) {
    logger.error("Failed to process Vercel webhook", { error: error.message });
    res.status(500).json({ error: "Failed to process webhook event" });
  }
});

export { router as webhookRoutes };
export default router;
