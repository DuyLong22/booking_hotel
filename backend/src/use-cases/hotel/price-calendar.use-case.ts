import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import socketService from '../../infrastructure/services/socket.service';

export class PriceCalendarUseCase {
  public async getPriceCalendar(roomTypeId: string, ownerId: string, startDate: string, endDate: string) {
    // Kiểm tra quyền chủ sở hữu
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) throw new AppError('Không tìm thấy loại phòng', 404);
    if (roomType.hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn này', 403);

    const start = new Date(startDate);
    const end = new Date(endDate);

    const calendar = await prisma.roomPriceCalendar.findMany({
      where: {
        roomTypeId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    return calendar;
  }

  public async updatePriceCalendar(roomTypeId: string, ownerId: string, prices: any[]) {
    // Kiểm tra quyền chủ sở hữu
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) throw new AppError('Không tìm thấy loại phòng', 404);
    if (roomType.hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn này', 403);

    // Tiến hành upsert hoặc xóa từng bản ghi lịch giá
    const transactions = prices.map((item) => {
      // Thiết lập ngày về 0h0m0s0ms theo giờ UTC/Local chuẩn để tránh lệch múi giờ
      const dateObj = new Date(item.date);
      dateObj.setHours(0, 0, 0, 0);

      if (item.isRestore) {
        return prisma.roomPriceCalendar.deleteMany({
          where: {
            roomTypeId,
            date: dateObj,
          },
        });
      }

      return prisma.roomPriceCalendar.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: dateObj,
          },
        },
        update: {
          price: item.price,
          isBlocked: item.isBlocked !== undefined ? item.isBlocked : false,
        },
        create: {
          roomTypeId,
          date: dateObj,
          price: item.price,
          isBlocked: item.isBlocked !== undefined ? item.isBlocked : false,
        },
      });
    });

    // Thực hiện tất cả dưới dạng transaction
    await prisma.$transaction(transactions);

    // Phát tín hiệu Socket.io thời gian thực báo lịch phòng cập nhật
    socketService.emitCalendarUpdate(roomType.hotelId, roomTypeId);

    return { success: true };
  }
}

export default new PriceCalendarUseCase();
