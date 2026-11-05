"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.agentRoutes = (0, express_1.Router)();
exports.agentRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ agents: db_1.db.data.agents });
    }
    return res.json({ agents: [] });
});
exports.agentRoutes.get("/:id", async (req, res) => {
    if (db_1.isMockDB) {
        const agent = db_1.db.data.agents.find((a) => a.id === req.params.id);
        return agent ? res.json({ agent }) : res.status(404).json({ error: "Not found" });
    }
    return res.json({ agent: null });
});
//# sourceMappingURL=agents.js.map