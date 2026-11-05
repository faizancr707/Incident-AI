"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.evaluationRoutes = (0, express_1.Router)();
exports.evaluationRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ evaluations: db_1.db.data.evaluations });
    }
    return res.json({ evaluations: [] });
});
//# sourceMappingURL=evaluations.js.map