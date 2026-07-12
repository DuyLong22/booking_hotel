"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_use_case_1 = __importDefault(require("../../use-cases/chat/chat.use-case"));
class ChatController {
    async getOrCreate(req, res, next) {
        try {
            const customerId = req.user.userId;
            const { hotelId } = req.body;
            const result = await chat_use_case_1.default.getOrCreateConversation(customerId, hotelId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyConversations(req, res, next) {
        try {
            const { userId, role } = req.user;
            const result = await chat_use_case_1.default.getConversationsOfUser(userId, role);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getConversationMessages(req, res, next) {
        try {
            const conversationId = req.params.id;
            const { userId } = req.user;
            const result = await chat_use_case_1.default.getMessages(conversationId, userId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChatController = ChatController;
exports.default = new ChatController();
