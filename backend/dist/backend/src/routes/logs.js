"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.logRoutes = (0, express_1.Router)();
exports.logRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ logs: db_1.db.data.logs });
    }
    return res.json({ logs: [] });
});
//# sourceMappingURL=logs.js.map