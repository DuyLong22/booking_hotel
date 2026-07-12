"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
const client_1 = require("@prisma/client");
const coupon_use_case_1 = __importDefault(require("../coupon/coupon.use-case"));
class BookingUseCase {
    async cleanupExpiredBookings() {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        await database_1.default.booking.updateMany({
            where: {
                status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.PAYMENT_PROCESSING] },
                createdAt: { lt: tenMinutesAgo }
            },
            data: {
                status: client_1.BookingStatus.CANCELLED
            }
        });
    }
    async createBooking(userId, data) {
        await this.cleanupExpiredBookings();
        const { checkInDate, checkOutDate, guestName, guestEmail, guestPhone, notes, couponCode, insuranceSelected, bookingItems } = data;
        let finalUserId = userId;
        if (!finalUserId) {
            const emailLower = guestEmail.toLowerCase().trim();
            let user = await database_1.default.user.findUnique({ where: { email: emailLower } });
            if (!user) {
                user = await database_1.default.user.create({
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
        const firstRoomType = await database_1.default.roomType.findUnique({
            where: { id: bookingItems[0].roomTypeId },
            include: { hotel: true },
        });
        if (!firstRoomType)
            throw new error_middleware_1.AppError('Loại phòng đặt không tồn tại', 400);
        const hotelId = firstRoomType.hotelId;
        // Biến lưu tổng giá trị đặt phòng trước giảm giá
        let totalPrice = 0;
        const itemsToCreate = [];
        // Duyệt qua từng loại phòng trong đơn đặt
        for (const item of bookingItems) {
            const rt = await database_1.default.roomType.findUnique({
                where: { id: item.roomTypeId },
                include: { rooms: true },
            });
            if (!rt)
                throw new error_middleware_1.AppError(`Không tìm thấy loại phòng ID: ${item.roomTypeId}`, 404);
            if (rt.hotelId !== hotelId)
                throw new error_middleware_1.AppError('Tất cả phòng đặt phải thuộc về cùng một khách sạn', 400);
            // --- A. Kiểm Tra Chặn Phòng và Tình Trạng Trống ---
            // Lấy lịch chặn/giá của loại phòng này trong khoảng thời gian đi
            const calendarOverrides = await database_1.default.roomPriceCalendar.findMany({
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
                throw new error_middleware_1.AppError(`Loại phòng "${rt.name}" đã bị đóng/chặn đặt trong khoảng thời gian này`, 400);
            }
            // Đếm số lượng phòng đã bị đặt và chưa hủy trong khoảng ngày này
            const overlappingBookings = await database_1.default.booking.findMany({
                where: {
                    status: {
                        in: [
                            client_1.BookingStatus.PENDING,
                            client_1.BookingStatus.PAYMENT_PROCESSING,
                            client_1.BookingStatus.CONFIRMED,
                            client_1.BookingStatus.CHECKED_IN,
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
                throw new error_middleware_1.AppError(`Loại phòng "${rt.name}" không đủ phòng trống. Chỉ còn lại ${availableCount} phòng trống.`, 400);
            }
            // --- B. Tính toán giá phòng của từng loại phòng ---
            let roomTypeTotalPrice = 0;
            // Cộng giá tiền từng đêm lưu trú (Check-in đến trước ngày Check-out)
            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const override = calendarOverrides.find((c) => c.date.toISOString().split('T')[0] === dateStr);
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
            validatedCoupon = await coupon_use_case_1.default.validateCoupon(couponCode, hotelId, totalPrice);
            discountAmount = validatedCoupon.discountAmount;
        }
        const finalPrice = totalPrice - discountAmount + (insuranceSelected ? 43500 : 0);
        // --- 3. Tạo đơn Booking trong Database sử dụng Transaction ---
        const booking = await database_1.default.$transaction(async (tx) => {
            // 3.1. Tạo đơn Đặt phòng
            const newBooking = await tx.booking.create({
                data: {
                    userId: finalUserId,
                    checkInDate: start,
                    checkOutDate: end,
                    totalPrice,
                    discountAmount,
                    finalPrice,
                    status: client_1.BookingStatus.PENDING,
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
            return newBooking;
        });
        return booking;
    }
    async getBookingDetail(bookingId, userId, userRole) {
        await this.cleanupExpiredBookings();
        const booking = await database_1.default.booking.findUnique({
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
        if (!booking)
            throw new error_middleware_1.AppError('Không tìm thấy đơn đặt phòng', 404);
        // Nếu khách vãng lai (không có userId) truy cập bằng UUID bảo mật, cho phép xem chi tiết
        if (!userId) {
            return booking;
        }
        // Kiểm tra quyền truy cập (Người đặt đơn hoặc Chủ khách sạn của phòng đó hoặc Admin)
        const isOwnerOfRooms = booking.bookingItems.some((item) => item.roomType.hotel.ownerId === userId);
        if (userRole !== Role.ADMIN && booking.userId !== userId && !isOwnerOfRooms) {
            throw new error_middleware_1.AppError('Bạn không có quyền truy cập đơn đặt phòng này', 403);
        }
        return booking;
    }
    async updateBookingStatus(bookingId, status, userId, userRole) {
        const booking = await database_1.default.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookingItems: {
                    include: {
                        roomType: { include: { hotel: true } }
                    }
                }
            }
        });
        if (!booking)
            throw new error_middleware_1.AppError('Không tìm thấy đơn đặt phòng', 404);
        // Phân quyền đổi trạng thái
        const isHotelOwner = booking.bookingItems.some((item) => item.roomType.hotel.ownerId === userId);
        if (userRole !== Role.ADMIN && !isHotelOwner) {
            // Khách hàng tự hủy đơn
            if (booking.userId === userId && status === client_1.BookingStatus.CANCELLED) {
                if (booking.status !== client_1.BookingStatus.PENDING && booking.status !== client_1.BookingStatus.CONFIRMED) {
                    throw new error_middleware_1.AppError('Không thể hủy đơn đặt phòng ở trạng thái hiện tại', 400);
                }
            }
            else {
                throw new error_middleware_1.AppError('Bạn không có quyền thay đổi trạng thái đơn đặt phòng này', 403);
            }
        }
        // Đổi trạng thái
        const updated = await database_1.default.booking.update({
            where: { id: bookingId },
            data: { status },
        });
        return updated;
    }
    async getMyBookings(userId, role) {
        await this.cleanupExpiredBookings();
        if (role === 'HOTEL_OWNER') {
            const bookings = await database_1.default.booking.findMany({
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
        const bookings = await database_1.default.booking.findMany({
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
exports.BookingUseCase = BookingUseCase;
// Map roles
const Role = {
    ADMIN: 'ADMIN',
    HOTEL_OWNER: 'HOTEL_OWNER',
    CUSTOMER: 'CUSTOMER',
};
exports.default = new BookingUseCase();
