"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.deploymentRoutes = (0, express_1.Router)();
exports.deploymentRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ deployments: db_1.db.data.deployments });
    }
    return res.json({ deployments: [] });
});
//# sourceMappingURL=deployments.js.map