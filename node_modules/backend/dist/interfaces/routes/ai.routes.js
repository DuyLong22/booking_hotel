"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Route tìm kiếm AI ở chế độ public (khách vãng lai cũng có thể tìm phòng qua chat)
router.post('/search', ai_controller_1.default.search);
// Các route quản trị AI Analytics và Audit Logs dành riêng cho Admin
router.get('/logs', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), ai_controller_1.default.getLogs);
router.get('/audit-logs', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), ai_controller_1.default.getAuditLogs);
exports.default = router;
