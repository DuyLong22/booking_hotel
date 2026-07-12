import { PrismaClient } from '@prisma/client';
import prisma from '../../config/database';

export class ChatUseCase {
  constructor(private prisma: PrismaClient) {}

  async getOrCreateConversation(customerId: string, hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) throw new Error('Không tìm thấy khách sạn');
    const hotelOwnerId = hotel.ownerId;

    if (hotelOwnerId === customerId) {
      throw new Error('Bạn không thể trò chuyện với chính khách sạn của mình');
    }

    // Tìm hoặc tạo Conversation unique constraint
    const conversation = await this.prisma.conversation.upsert({
      where: {
        customerId_hotelOwnerId_hotelId: {
          customerId,
          hotelOwnerId,
          hotelId
        }
      },
      update: {},
      create: {
        customerId,
        hotelOwnerId,
        hotelId
      },
      include: {
        hotel: { select: { name: true, address: true } },
        customer: { select: { fullName: true, avatarUrl: true } },
        hotelOwner: { select: { fullName: true, avatarUrl: true } }
      }
    });

    return conversation;
  }

  async getConversationsOfUser(userId: string, role: string) {
    const where: any = {};
    if (role === 'HOTEL_OWNER') {
      where.hotelOwnerId = userId;
    } else {
      where.customerId = userId;
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        hotel: { select: { name: true, address: true } },
        customer: { select: { fullName: true, avatarUrl: true } },
        hotelOwner: { select: { fullName: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return conversations;
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) throw new Error('Không tìm thấy cuộc hội thoại');
    if (conversation.customerId !== userId && conversation.hotelOwnerId !== userId) {
      throw new Error('Bạn không có quyền truy cập cuộc trò chuyện này');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return messages;
  }
}

export default new ChatUseCase(prisma);
