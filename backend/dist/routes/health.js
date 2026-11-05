"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
exports.healthRoutes = (0, express_1.Router)();
exports.healthRoutes.get("/", async (req, res) => {
    res.json({ status: "ok" });
});
//# sourceMappingURL=health.js.map