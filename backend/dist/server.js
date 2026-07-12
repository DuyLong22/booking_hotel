"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
// Load biến môi trường
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Khởi tạo Socket.io Server
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
io.on('connection', (socket) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Socket.io]: Thiết bị kết nối thành công: ${socket.id}`);
    }
    // Người dùng tham gia phòng chat
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Socket.io]: Socket ${socket.id} tham gia phòng chat: ${conversationId}`);
        }
    });
    // Nhận và phát tán tin nhắn, đồng thời lưu vào DB
    socket.on('sendMessage', async (data) => {
        try {
            const message = await database_1.default.message.create({
                data: {
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                    content: data.content,
                },
                include: {
                    sender: { select: { id: true, fullName: true, avatarUrl: true } }
                }
            });
            // Cập nhật Conversation
            await database_1.default.conversation.update({
                where: { id: data.conversationId },
                data: { updatedAt: new Date() }
            });
            // Broadcast tới tất cả mọi người trong phòng
            io.to(data.conversationId).emit('receiveMessage', message);
        }
        catch (err) {
            console.error('[Socket.io Error] Gửi tin nhắn thất bại:', err);
        }
    });
    socket.on('disconnect', () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Socket.io]: Thiết bị ngắt kết nối: ${socket.id}`);
        }
    });
});
server.listen(PORT, () => {
    console.log(`[System Server]: Đang chạy cổng ${PORT} dưới chế độ ${process.env.NODE_ENV || 'development'}`);
});
