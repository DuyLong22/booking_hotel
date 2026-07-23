import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import { BookingStatus } from '@prisma/client';
import couponUseCase from '../coupon/coupon.use-case';
import loyaltyUseCase from '../user/loyalty.use-case';
import socketService from '../../infrastructure/services/socket.service';

export class BookingUseCase {
  public async cleanupExpiredBookings() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.booking.updateMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.PAYMENT_PROCESSING] },
        createdAt: { lt: tenMinutesAgo }
      },
      data: {
        status: BookingStatus.CANCELLED
      }
    });
  }

  public async createBooking(userId: string | null, data: any) {
    await this.cleanupExpiredBookings();
    const { checkInDate, checkOutDate, guestName, guestEmail, guestPhone, notes, couponCode, insuranceSelected, bookingItems, usePoints } = data;

    let finalUserId = userId;
    if (!finalUserId) {
      const emailLower = guestEmail.toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email: emailLower } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: emailLower,
            fullName: guestName,
            phoneNumber: guestPhone || null,
            password: '', // Guest user has no password
            role: 'CUSTOMER',
            isVerified: true
          }
        });
      }
      finalUserId = user.id;
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    // 1. Lấy thông tin khách sạn từ các phòng được đặt (giả sử đặt các phòng thuộc cùng 1 khách sạn)
    const firstRoomType = await prisma.roomType.findUnique({
      where: { id: bookingItems[0].roomTypeId },
      include: { hotel: true },
    });
    if (!firstRoomType) throw new AppError('Loại phòng đặt không tồn tại', 400);
    const hotelId = firstRoomType.hotelId;

    // Biến lưu tổng giá trị đặt phòng trước giảm giá
    let totalPrice = 0;
    const itemsToCreate: { roomTypeId: string; quantity: number; price: number }[] = [];

    // Duyệt qua từng loại phòng trong đơn đặt
    for (const item of bookingItems) {
      const rt = await prisma.roomType.findUnique({
        where: { id: item.roomTypeId },
        include: { rooms: true },
      });

      if (!rt) throw new AppError(`Không tìm thấy loại phòng ID: ${item.roomTypeId}`, 404);
      if (rt.hotelId !== hotelId) throw new AppError('Tất cả phòng đặt phải thuộc về cùng một khách sạn', 400);

      // --- A. Kiểm Tra Chặn Phòng và Tình Trạng Trống ---
      
      // Lấy lịch chặn/giá của loại phòng này trong khoảng thời gian đi
      const calendarOverrides = await prisma.roomPriceCalendar.findMany({
        where: {
          roomTypeId: rt.id,
          date: {
            gte: start,
            lt: end,
          },
        },
      });

      // Nếu bất kỳ ngày nào bị chặn, trả về lỗi chặn phòng
      if (calendarOverrides.some((c) => c.isBlocked)) {
        throw new AppError(`Loại phòng "${rt.name}" đã bị đóng/chặn đặt trong khoảng thời gian này`, 400);
      }

      // Đếm số lượng phòng đã bị đặt và chưa hủy trong khoảng ngày này
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.PAYMENT_PROCESSING,
              BookingStatus.CONFIRMED,
              BookingStatus.CHECKED_IN,
            ],
          },
          checkInDate: { lt: end },
          checkOutDate: { gt: start },
          bookingItems: {
            some: { roomTypeId: rt.id },
          },
        },
        include: {
          bookingItems: true,
        },
      });

      const bookedQuantity = overlappingBookings.reduce((sum, b) => {
        const bookedItem = b.bookingItems.find((i) => i.roomTypeId === rt.id);
        return sum + (bookedItem ? bookedItem.quantity : 0);
      }, 0);

      const availableCount = rt.rooms.length - bookedQuantity;
      if (availableCount < item.quantity) {
        throw new AppError(
          `Loại phòng "${rt.name}" không đủ phòng trống. Chỉ còn lại ${availableCount} phòng trống.`,
          400
        );
      }

      // --- B. Tính toán giá phòng của từng loại phòng ---
      let roomTypeTotalPrice = 0;

      // Cộng giá tiền từng đêm lưu trú (Check-in đến trước ngày Check-out)
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const override = calendarOverrides.find(
          (c) => c.date.toISOString().split('T')[0] === dateStr
        );
        
        const nightPrice = override ? parseFloat(override.price.toString()) : parseFloat(rt.basePrice.toString());
        roomTypeTotalPrice += nightPrice;
      }

      // Tổng tiền cho loại phòng này = tổng giá tiền các đêm * số lượng phòng đặt
      const itemFinalPrice = roomTypeTotalPrice * item.quantity;
      totalPrice += itemFinalPrice;

      itemsToCreate.push({
        roomTypeId: rt.id,
        quantity: item.quantity,
        price: itemFinalPrice, // Giá trị lưu lại cho item
      });
    }

    // --- 2. Áp dụng Coupon giảm giá (nếu có) ---
    let discountAmount = 0;
    let validatedCoupon = null;

    if (couponCode) {
      validatedCoupon = await couponUseCase.validateCoupon(couponCode, hotelId, totalPrice);
      discountAmount = validatedCoupon.discountAmount;
    }

    // --- 2.5. Áp dụng Điểm thưởng Loyalty (nếu dùng) ---
    let pointsUsedVal = 0;
    let pointsDiscountVal = 0;

    if (usePoints && Number(usePoints) > 0) {
      pointsUsedVal = Math.floor(Number(usePoints));
      const userPointsBalance = await loyaltyUseCase.getUserPointsBalance(finalUserId);
      
      if (pointsUsedVal > userPointsBalance) {
        throw new AppError(`Số điểm sử dụng vượt quá số điểm hiện có (${userPointsBalance} điểm)`, 400);
      }

      pointsDiscountVal = pointsUsedVal * 200; // 1 điểm = 200 VND
      const maxPointsDiscount = totalPrice * 0.3; // Tối đa 30% giá trị booking gốc

      if (pointsDiscountVal > maxPointsDiscount) {
        throw new AppError(`Giá trị quy đổi điểm thưởng (${pointsDiscountVal.toLocaleString('vi-VN')} đ) vượt quá giới hạn 30% giá trị booking (${maxPointsDiscount.toLocaleString('vi-VN')} đ)`, 400);
      }
    }

    const finalPrice = totalPrice - discountAmount - pointsDiscountVal + (insuranceSelected ? 43500 : 0);

    // --- 3. Tạo đơn Booking trong Database sử dụng Transaction ---
    const booking = await prisma.$transaction(async (tx) => {
      // 3.1. Tạo đơn Đặt phòng
      const newBooking = await tx.booking.create({
        data: {
          userId: finalUserId,
          checkInDate: start,
          checkOutDate: end,
          totalPrice,
          discountAmount,
          finalPrice,
          pointsUsed: pointsUsedVal,
          pointsDiscount: pointsDiscountVal,
          status: BookingStatus.PENDING,
          insuranceSelected: !!insuranceSelected,
          guestName,
          guestEmail,
          guestPhone,
          notes,
          bookingItems: {
            create: itemsToCreate.map((item) => ({
              roomTypeId: item.roomTypeId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          bookingItems: true,
        },
      });

      // 3.2. Nếu áp dụng coupon thành công, tạo bản ghi CouponUsage và tăng count
      if (validatedCoupon) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCoupon.couponId,
            userId: finalUserId,
            bookingId: newBooking.id,
          },
        });

        await tx.coupon.update({
          where: { id: validatedCoupon.couponId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 3.3. Nếu tiêu điểm Loyalty thành công, tạo bản ghi LoyaltyTransaction và cập nhật user
      if (pointsUsedVal > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            userId: finalUserId,
            bookingId: newBooking.id,
            points: -pointsUsedVal,
            type: 'SPEND',
            description: `Sử dụng điểm tích lũy thanh toán đơn phòng #${newBooking.id.substring(0, 8).toUpperCase()}`
          }
        });

        const currentPoints = await loyaltyUseCase.getUserPointsBalance(finalUserId);
        await tx.user.update({
          where: { id: finalUserId },
          data: { loyaltyPoints: Math.max(0, currentPoints - pointsUsedVal) }
        });

        await tx.notification.create({
          data: {
            userId: finalUserId,
            title: 'Khấu trừ điểm tích lũy 💳',
            content: `Bạn đã sử dụng ${pointsUsedVal} điểm Loyalty cho đơn đặt phòng #${newBooking.id.substring(0, 8).toUpperCase()}.`,
            type: 'SYSTEM'
          }
        });
      }

      return newBooking;
    });

    return booking;
  }

  public async getBookingDetail(bookingId: string, userId: string | null, userRole: string | null) {
    await this.cleanupExpiredBookings();
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingItems: {
          include: {
            roomType: {
              include: { hotel: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);

    // Nếu khách vãng lai (không có userId) truy cập bằng UUID bảo mật, cho phép xem chi tiết
    if (!userId) {
      return booking;
    }

    // Kiểm tra quyền truy cập (Người đặt đơn hoặc Chủ khách sạn của phòng đó hoặc Admin)
    const isOwnerOfRooms = booking.bookingItems.some(
      (item) => item.roomType.hotel.ownerId === userId
    );

    if (userRole !== Role.ADMIN && booking.userId !== userId && !isOwnerOfRooms) {
      throw new AppError('Bạn không có quyền truy cập đơn đặt phòng này', 403);
    }

    return booking;
  }

  public async updateBookingStatus(bookingId: string, status: BookingStatus, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingItems: {
          include: {
            roomType: { include: { hotel: true } }
          }
        }
      }
    });

    if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);

    // Phân quyền đổi trạng thái
    const isHotelOwner = booking.bookingItems.some(
      (item) => item.roomType.hotel.ownerId === userId
    );

    if (userRole !== Role.ADMIN && !isHotelOwner) {
      // Khách hàng tự hủy đơn
      if (booking.userId === userId && status === BookingStatus.CANCELLED) {
        if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
          throw new AppError('Không thể hủy đơn đặt phòng ở trạng thái hiện tại', 400);
        }
      } else {
        throw new AppError('Bạn không có quyền thay đổi trạng thái đơn đặt phòng này', 403);
      }
    }

    // Đổi trạng thái
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Xử lý điểm tích lũy Loyalty
    const allowedEarnStatuses: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
      BookingStatus.CHECKED_OUT,
      BookingStatus.COMPLETED
    ];
    if (allowedEarnStatuses.includes(status)) {
      try {
        await loyaltyUseCase.earnPoints(bookingId);
      } catch (err) {
        console.error('Failed to earn points:', err);
      }
    } else if (status === BookingStatus.CANCELLED) {
      try {
        await loyaltyUseCase.refundPoints(bookingId);
      } catch (err) {
        console.error('Failed to refund points:', err);
      }
    }

    // Phát tín hiệu Socket.io thời gian thực
    socketService.emitBookingStatusUpdate(bookingId, status);

    return updated;
  }

  public async getMyBookings(userId: string, role?: string) {
    await this.cleanupExpiredBookings();
    if (role === 'HOTEL_OWNER') {
      const bookings = await prisma.booking.findMany({
        where: {
          bookingItems: {
            some: {
              roomType: {
                hotel: {
                  ownerId: userId,
                },
              },
            },
          },
        },
        include: {
          bookingItems: {
            include: {
              roomType: {
                include: { hotel: true },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return bookings;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        bookingItems: {
          include: {
            roomType: {
              include: { hotel: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }
}

// Map roles
const Role = {
  ADMIN: 'ADMIN',
  HOTEL_OWNER: 'HOTEL_OWNER',
  CUSTOMER: 'CUSTOMER',
};

export default new BookingUseCase();
