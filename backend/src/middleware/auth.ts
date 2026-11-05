import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/* ── Types ────────────────────────────────────────────── */

export type UserRole = "owner" | "admin" | "engineer" | "viewer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team?: string;
}

/* ── Permission Definitions ───────────────────────────── */

export const PERMISSIONS: Record<string, Record<string, UserRole[]>> = {
  incidents:      { view: ["owner","admin","engineer","viewer"], create: ["owner","admin","engineer"], update: ["owner","admin","engineer"], delete: ["owner","admin"] },
  investigations: { view: ["owner","admin","engineer","viewer"], start: ["owner","admin","engineer"], approve: ["owner","admin"] },
  logs:           { view: ["owner","admin","engineer","viewer"] },
  metrics:        { view: ["owner","admin","engineer","viewer"] },
  traces:         { view: ["owner","admin","engineer","viewer"] },
  deployments:    { view: ["owner","admin","engineer","viewer"], rollback: ["owner","admin"] },
  github:         { view: ["owner","admin","engineer","viewer"] },
  agents:         { view: ["owner","admin","engineer"], configure: ["owner","admin"] },
  reports:        { view: ["owner","admin","engineer","viewer"], export: ["owner","admin","engineer"], approve: ["owner","admin"] },
  settings:       { view: ["owner","admin"], update: ["owner","admin"] },
  team:           { view: ["owner","admin"], manage: ["owner"] },
  remediation:    { view: ["owner","admin","engineer","viewer"], execute: ["owner","admin","engineer"], approve: ["owner","admin"] },
};

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const perms = PERMISSIONS[resource];
  if (!perms || !perms[action]) return false;
  return perms[action].includes(role);
}

/* ── Demo Users (replace with real DB lookup) ─────────── */

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@incident.ai": {
    password: "admin123",
    user: { id: "u1", name: "Sarah Chen", email: "admin@incident.ai", role: "owner", team: "Platform" },
  },
  "engineer@incident.ai": {
    password: "eng123",
    user: { id: "u2", name: "Alex Rivera", email: "engineer@incident.ai", role: "engineer", team: "Backend" },
  },
  "viewer@incident.ai": {
    password: "view123",
    user: { id: "u3", name: "Jordan Lee", email: "viewer@incident.ai", role: "viewer", team: "Product" },
  },
};

/* ── Session Store (in-memory, replace with Redis/JWT) ── */

const sessions = new Map<string, AuthUser>();

export function createSession(email: string, password: string): { token: string; user: AuthUser } | null {
  const entry = DEMO_USERS[email];
  if (!entry || entry.password !== password) return null;
  const token = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sessions.set(token, entry.user);
  logger.info("User logged in", { email, role: entry.user.role });
  return { token, user: entry.user };
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string): AuthUser | null {
  return sessions.get(token) || null;
}

/* ── Middleware ────────────────────────────────────────── */

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Extract user from Authorization header (Bearer token) */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    // Allow unauthenticated access for public endpoints
    next();
    return;
  }
  const token = header.slice(7);
  const user = getSession(token);
  if (user) {
    req.user = user;
  }
  next();
}

/** Require authentication */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

/** Require specific permission */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!hasPermission(req.user.role, resource, action)) {
      logger.warn("Permission denied", { user: req.user.email, resource, action });
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

/* ── Audit Log ────────────────────────────────────────── */

export function auditLog(action: string, resource: string, details?: Record<string, unknown>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user) {
      logger.info("AUDIT", {
        userId: req.user.id,
        userEmail: req.user.email,
        role: req.user.role,
        action,
        resource,
        path: req.path,
        method: req.method,
        ...details,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}
