import { Server } from 'socket.io';
import prisma from '../../config/database';

class SocketService {
  private io: Server | null = null;

  public init(ioInstance: Server) {
    this.io = ioInstance;
    console.log('[Socket.io]: SocketService đã được khởi tạo thành công.');
  }

  public getIO() {
    return this.io;
  }

  /**
   * Phát tín hiệu khi trạng thái đơn đặt phòng thay đổi
   */
  public async emitBookingStatusUpdate(bookingId: string, status: string) {
    if (!this.io) {
      console.warn('[SocketService Warning]: Chưa khởi tạo Socket.io instance.');
      return;
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingItems: {
            include: {
              roomType: true,
            },
          },
        },
      });

      if (!booking) return;

      // 1. Gửi cho khách đặt phòng (khách hàng)
      if (booking.userId) {
        this.io.to(`user-${booking.userId}`).emit('bookingStatusUpdated', {
          bookingId,
          status,
          message: `Đơn đặt phòng của bạn đã được chuyển sang trạng thái: ${status}`,
        });
      }

      // 2. Gửi cho chủ khách sạn (owner)
      if (booking.bookingItems[0]) {
        const hotelId = booking.bookingItems[0].roomType.hotelId;
        this.io.to(`hotel-${hotelId}`).emit('bookingStatusUpdated', {
          bookingId,
          status,
          hotelId,
          message: `Đơn đặt phòng mới của khách sạn đã được cập nhật: ${status}`,
        });
      }
    } catch (err) {
      console.error('[SocketService Error]: Lỗi emit trạng thái đơn đặt phòng:', err);
    }
  }

  /**
   * Phát tín hiệu khi lịch chặn / giá phòng thay đổi
   */
  public emitCalendarUpdate(hotelId: string, roomTypeId: string) {
    if (!this.io) return;
    this.io.to(`hotel-${hotelId}`).emit('calendarUpdated', { hotelId, roomTypeId });
  }

  /**
   * Phát tín hiệu khi trạng thái duyệt khách sạn thay đổi
   */
  public emitHotelStatusUpdate(hotelId: string, status: string, ownerId: string) {
    if (!this.io) return;
    // Gửi cho chủ sở hữu khách sạn
    this.io.to(`user-${ownerId}`).emit('hotelStatusUpdated', { hotelId, status });
    // Phát tán toàn mạng
    this.io.emit('hotelStatusUpdated', { hotelId, status });
  }
}

export default new SocketService();
