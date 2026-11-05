"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.metricsRoutes = (0, express_1.Router)();
exports.metricsRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ metrics: db_1.db.data.metrics });
    }
    return res.json({ metrics: [] });
});
//# sourceMappingURL=metrics.js.map