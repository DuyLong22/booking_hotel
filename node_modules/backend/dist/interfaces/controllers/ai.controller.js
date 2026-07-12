"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const ai_search_use_case_1 = __importDefault(require("../../use-cases/ai-search/ai-search.use-case"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
const database_1 = __importDefault(require("../../config/database"));
class AiController {
    async search(req, res, next) {
        try {
            const { message } = req.body;
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                throw new error_middleware_1.AppError('Nội dung tin nhắn tìm kiếm không được để trống', 400);
            }
            const result = await ai_search_use_case_1.default.search(message);
            res.status(200).json({
                success: true,
                message: 'Tìm kiếm AI hoàn tất',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getLogs(req, res, next) {
        try {
            const logs = await database_1.default.aiSearchAnalytics.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            res.status(200).json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAuditLogs(req, res, next) {
        try {
            const logs = await database_1.default.auditLog.findMany({
                include: {
                    user: {
                        select: {
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            res.status(200).json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AiController = AiController;
exports.default = new AiController();
