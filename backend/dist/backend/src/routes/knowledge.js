"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.knowledgeRoutes = (0, express_1.Router)();
exports.knowledgeRoutes.get("/", async (req, res) => {
    if (db_1.isMockDB) {
        return res.json({ knowledge: db_1.db.data.knowledge });
    }
    return res.json({ knowledge: [] });
});
//# sourceMappingURL=knowledge.js.map