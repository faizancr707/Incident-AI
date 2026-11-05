"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.traceRoutes = (0, express_1.Router)();
exports.traceRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ traces: db_1.db.data.traces });
    }
    return res.json({ traces: [] });
});
//# sourceMappingURL=traces.js.map