"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
exports.authRoutes = (0, express_1.Router)();
/** POST /api/auth/login */
exports.authRoutes.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }
    const result = (0, auth_1.createSession)(email, password);
    if (!result) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    res.json({ token: result.token, user: result.user });
});
/** POST /api/auth/logout */
exports.authRoutes.post("/logout", (req, res) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        (0, auth_1.destroySession)(header.slice(7));
    }
    res.json({ success: true });
});
/** GET /api/auth/me */
exports.authRoutes.get("/me", (req, res) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    const user = (0, auth_1.getSession)(header.slice(7));
    if (!user) {
        res.status(401).json({ error: "Session expired" });
        return;
    }
    res.json({ user });
});
//# sourceMappingURL=auth.js.map