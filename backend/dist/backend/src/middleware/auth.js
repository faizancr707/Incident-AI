"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.createSession = createSession;
exports.destroySession = destroySession;
exports.getSession = getSession;
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
exports.requirePermission = requirePermission;
exports.auditLog = auditLog;
const logger_1 = require("../lib/logger");
/* ── Permission Definitions ───────────────────────────── */
exports.PERMISSIONS = {
    incidents: { view: ["owner", "admin", "engineer", "viewer"], create: ["owner", "admin", "engineer"], update: ["owner", "admin", "engineer"], delete: ["owner", "admin"] },
    investigations: { view: ["owner", "admin", "engineer", "viewer"], start: ["owner", "admin", "engineer"], approve: ["owner", "admin"] },
    logs: { view: ["owner", "admin", "engineer", "viewer"] },
    metrics: { view: ["owner", "admin", "engineer", "viewer"] },
    traces: { view: ["owner", "admin", "engineer", "viewer"] },
    deployments: { view: ["owner", "admin", "engineer", "viewer"], rollback: ["owner", "admin"] },
    github: { view: ["owner", "admin", "engineer", "viewer"] },
    agents: { view: ["owner", "admin", "engineer"], configure: ["owner", "admin"] },
    reports: { view: ["owner", "admin", "engineer", "viewer"], export: ["owner", "admin", "engineer"], approve: ["owner", "admin"] },
    settings: { view: ["owner", "admin"], update: ["owner", "admin"] },
    team: { view: ["owner", "admin"], manage: ["owner"] },
    remediation: { view: ["owner", "admin", "engineer", "viewer"], execute: ["owner", "admin", "engineer"], approve: ["owner", "admin"] },
};
function hasPermission(role, resource, action) {
    const perms = exports.PERMISSIONS[resource];
    if (!perms || !perms[action])
        return false;
    return perms[action].includes(role);
}
/* ── Demo Users (replace with real DB lookup) ─────────── */
const DEMO_USERS = {
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
const sessions = new Map();
function createSession(email, password) {
    const entry = DEMO_USERS[email];
    if (!entry || entry.password !== password)
        return null;
    const token = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions.set(token, entry.user);
    logger_1.logger.info("User logged in", { email, role: entry.user.role });
    return { token, user: entry.user };
}
function destroySession(token) {
    sessions.delete(token);
}
function getSession(token) {
    return sessions.get(token) || null;
}
/** Extract user from Authorization header (Bearer token) */
function authMiddleware(req, res, next) {
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
function requireAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    next();
}
/** Require specific permission */
function requirePermission(resource, action) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        if (!hasPermission(req.user.role, resource, action)) {
            logger_1.logger.warn("Permission denied", { user: req.user.email, resource, action });
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }
        next();
    };
}
/* ── Audit Log ────────────────────────────────────────── */
function auditLog(action, resource, details) {
    return (req, _res, next) => {
        if (req.user) {
            logger_1.logger.info("AUDIT", {
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
//# sourceMappingURL=auth.js.map