import { Router } from "express";
import {
  createSession,
  destroySession,
  getSession,
  registerUser,
  getAllUsers,
  requireAuth,
} from "../middleware/auth";

export const authRoutes = Router();

/** POST /api/auth/register */
authRoutes.post("/register", (req, res) => {
  const { name, email, password, team } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }
  const result = registerUser(name, email, password, "engineer", team || "Engineering");
  if (!result.success) {
    res.status(400).json({ error: result.error || "Failed to register user" });
    return;
  }
  res.status(201).json({ token: result.token, user: result.user });
});

/** POST /api/auth/login */
authRoutes.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const result = createSession(email, password);
  if (!result) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json({ token: result.token, user: result.user });
});

/** POST /api/auth/logout */
authRoutes.post("/logout", (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    destroySession(header.slice(7));
  }
  res.json({ success: true });
});

/** GET /api/auth/me */
authRoutes.get("/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = getSession(header.slice(7));
  if (!user) {
    res.status(401).json({ error: "Session expired" });
    return;
  }
  res.json({ user });
});

/** GET /api/auth/users */
authRoutes.get("/users", requireAuth, (_req, res) => {
  res.json({ users: getAllUsers() });
});

