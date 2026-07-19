import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';
import prisma from './config/database';
import socketService from './infrastructure/services/socket.service';

// Load biến môi trường
dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Khởi tạo Socket.io Server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

socketService.init(io);

io.on('connection', (socket) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Socket.io]: Thiết bị kết nối thành công: ${socket.id}`);
  }

  // Người dùng tham gia phòng cá nhân của họ
  socket.on('joinUser', (userId: string) => {
    socket.join(`user-${userId}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Socket.io]: Socket ${socket.id} tham gia phòng user-${userId}`);
    }
  });

  // Khách hàng hoặc Owner tham gia phòng của khách sạn để nhận update phòng/lịch giá
  socket.on('joinHotel', (hotelId: string) => {
    socket.join(`hotel-${hotelId}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Socket.io]: Socket ${socket.id} tham gia phòng hotel-${hotelId}`);
    }
  });

  // Người dùng tham gia phòng chat
  socket.on('joinConversation', (conversationId: string) => {
    socket.join(conversationId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Socket.io]: Socket ${socket.id} tham gia phòng chat: ${conversationId}`);
    }
  });

  // Nhận và phát tán tin nhắn, đồng thời lưu vào DB
  socket.on('sendMessage', async (data: { conversationId: string; senderId: string; content: string }) => {
    try {
      const message = await prisma.message.create({
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
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() }
      });

      // Broadcast tới tất cả mọi người trong phòng
      io.to(data.conversationId).emit('receiveMessage', message);
    } catch (err) {
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
