import crypto from "crypto";
import { Request } from "express";
import { logger } from "../../lib/logger";

/**
 * Verify GitHub HMAC-SHA256 signature
 * Header format: sha256=<hex-digest>
 */
export function verifyGitHubSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) {
    logger.warn("GitHub signature verification skipped or missing signature/secret");
    return false;
  }

  try {
    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")}`;

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch (err: any) {
    logger.error("Error during GitHub signature verification", { error: err.message });
    return false;
  }
}

/**
 * Verify GitLab secret token
 * Header: X-Gitlab-Token
 */
export function verifyGitLabSignature(token: string | undefined, secret: string): boolean {
  if (!token || !secret) {
    logger.warn("GitLab token verification skipped or missing token/secret");
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);

    if (tokenBuffer.length !== secretBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch (err: any) {
    logger.error("Error during GitLab token verification", { error: err.message });
    return false;
  }
}

/**
 * Verify Vercel HMAC-SHA1 signature
 * Header: x-vercel-signature
 */
export function verifyVercelSignature(payload: string, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) {
    logger.warn("Vercel signature verification skipped or missing signature/secret");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha1", secret)
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch (err: any) {
    logger.error("Error during Vercel signature verification", { error: err.message });
    return false;
  }
}

/**
 * Helper to extract raw payload string from Express request
 */
export function getPayloadString(req: Request): string {
  if ((req as any).rawBody && typeof (req as any).rawBody === "string") {
    return (req as any).rawBody;
  }
  if ((req as any).rawBody && Buffer.isBuffer((req as any).rawBody)) {
    return (req as any).rawBody.toString("utf8");
  }
  return typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
}

/**
 * Generic webhook signature verifier
 */
export function verifyWebhookSignature(provider: "github" | "gitlab" | "vercel", req: Request, secret: string): boolean {
  const payloadStr = getPayloadString(req);

  switch (provider) {
    case "github": {
      const sig = (req.headers["x-hub-signature-256"] as string) || (req.headers["x-hub-signature"] as string);
      return verifyGitHubSignature(payloadStr, sig, secret);
    }
    case "gitlab": {
      const token = req.headers["x-gitlab-token"] as string;
      return verifyGitLabSignature(token, secret);
    }
    case "vercel": {
      const sig = req.headers["x-vercel-signature"] as string;
      return verifyVercelSignature(payloadStr, sig, secret);
    }
    default:
      return false;
  }
}
