import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

import crypto from "crypto";

/* ── Types ────────────────────────────────────────────── */

export type UserRole = "owner" | "admin" | "engineer" | "viewer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team?: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  team?: string;
  createdAt: string;
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

/* ── Cryptographic Hashing ────────────────────────────── */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(key, "hex"));
  } catch {
    return false;
  }
}

function sanitizeUser(u: StoredUser): AuthUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team,
  };
}

/* ── User Store (with Default Seed Accounts) ──────────── */

const usersByEmail = new Map<string, StoredUser>();

function seedInitialUsers() {
  const defaultAccounts: Array<{ name: string; email: string; pass: string; role: UserRole; team: string }> = [
    { name: "Sarah Chen", email: "admin@incident.ai", pass: "admin123", role: "owner", team: "Platform" },
    { name: "Alex Rivera", email: "engineer@incident.ai", pass: "eng123", role: "engineer", team: "Backend" },
    { name: "Jordan Lee", email: "viewer@incident.ai", pass: "view123", role: "viewer", team: "Product" },
  ];

  for (const acc of defaultAccounts) {
    const normalized = acc.email.toLowerCase().trim();
    if (!usersByEmail.has(normalized)) {
      usersByEmail.set(normalized, {
        id: `usr_${acc.role}`,
        name: acc.name,
        email: normalized,
        passwordHash: hashPassword(acc.pass),
        role: acc.role,
        team: acc.team,
        createdAt: new Date().toISOString(),
      });
    }
  }
}
seedInitialUsers();

export function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = "engineer",
  team: string = "Engineering"
): { success: boolean; user?: AuthUser; token?: string; error?: string } {
  const normalized = email.toLowerCase().trim();
  if (!name.trim()) return { success: false, error: "Name is required" };
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { success: false, error: "Valid email address is required" };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  if (usersByEmail.has(normalized)) {
    return { success: false, error: "An account with this email already exists" };
  }

  const user: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    name: name.trim(),
    email: normalized,
    passwordHash: hashPassword(password),
    role,
    team,
    createdAt: new Date().toISOString(),
  };

  usersByEmail.set(normalized, user);
  logger.info("User registered", { email: normalized, role: user.role });

  const session = createSessionForUser(user);
  return { success: true, user: sanitizeUser(user), token: session.token };
}

export function getAllUsers(): AuthUser[] {
  return Array.from(usersByEmail.values()).map(sanitizeUser);
}

/* ── Session Store (Token-based with TTL) ─────────────── */

const sessions = new Map<string, { user: AuthUser; expiresAt: number }>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createSessionForUser(user: StoredUser): { token: string; user: AuthUser } {
  const token = `session_${crypto.randomBytes(24).toString("hex")}`;
  const authUser = sanitizeUser(user);
  sessions.set(token, { user: authUser, expiresAt: Date.now() + SESSION_TTL_MS });
  return { token, user: authUser };
}

export function createSession(email: string, password: string): { token: string; user: AuthUser } | null {
  const normalized = email.toLowerCase().trim();
  const entry = usersByEmail.get(normalized);
  if (!entry || !verifyPassword(password, entry.passwordHash)) return null;

  const session = createSessionForUser(entry);
  logger.info("User logged in", { email: normalized, role: entry.role });
  return session;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string): AuthUser | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session.user;
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
