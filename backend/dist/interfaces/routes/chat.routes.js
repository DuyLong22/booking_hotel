"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = __importDefault(require("../controllers/chat.controller"));
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.post('/conversations', chat_controller_1.default.getOrCreate);
router.get('/conversations', chat_controller_1.default.getMyConversations);
router.get('/conversations/:id/messages', chat_controller_1.default.getConversationMessages);
exports.default = router;
