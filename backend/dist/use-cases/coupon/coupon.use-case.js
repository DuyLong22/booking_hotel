"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
const client_1 = require("@prisma/client");
class CouponUseCase {
    async createCoupon(userId, userRole, data) {
        const { code, description, discountType, discountValue, minOrderValue, maxDiscountAmount, startDate, endDate, usageLimit, hotelId } = data;
        // Phân quyền tạo coupon
        if (hotelId) {
            // Coupon của khách sạn: Kiểm tra xem user có phải chủ khách sạn này không
            const hotel = await database_1.default.hotel.findUnique({ where: { id: hotelId } });
            if (!hotel)
                throw new error_middleware_1.AppError('Khách sạn không tồn tại', 404);
            if (userRole !== client_1.Role.ADMIN && hotel.ownerId !== userId) {
                throw new error_middleware_1.AppError('Bạn không có quyền tạo coupon cho khách sạn này', 403);
            }
        }
        else {
            // Coupon toàn sàn: Chỉ Admin được phép tạo
            if (userRole !== client_1.Role.ADMIN) {
                throw new error_middleware_1.AppError('Chỉ Admin mới có quyền tạo mã giảm giá toàn hệ thống', 403);
            }
        }
        // Kiểm tra trùng mã
        const existing = await database_1.default.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (existing)
            throw new error_middleware_1.AppError('Mã giảm giá này đã tồn tại', 400);
        const coupon = await database_1.default.coupon.create({
            data: {
                code: code.toUpperCase(),
                description,
                discountType,
                discountValue,
                minOrderValue,
                maxDiscountAmount,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                usageLimit,
                hotelId: hotelId || null,
            },
        });
        return coupon;
    }
    async validateCoupon(code, hotelId, amount) {
        const coupon = await database_1.default.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!coupon || !coupon.isActive) {
            throw new error_middleware_1.AppError('Mã giảm giá không tồn tại hoặc đã bị khóa', 404);
        }
        const now = new Date();
        if (now < coupon.startDate) {
            throw new error_middleware_1.AppError('Mã giảm giá chưa đến thời gian áp dụng', 400);
        }
        if (now > coupon.endDate) {
            throw new error_middleware_1.AppError('Mã giảm giá đã hết hạn sử dụng', 400);
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            throw new error_middleware_1.AppError('Mã giảm giá đã hết lượt sử dụng', 400);
        }
        // Kiểm tra tính hợp lệ về khách sạn
        if (coupon.hotelId && coupon.hotelId !== hotelId) {
            throw new error_middleware_1.AppError('Mã giảm giá này chỉ áp dụng cho một số khách sạn nhất định', 400);
        }
        // Kiểm tra giá trị tối thiểu của đơn hàng
        if (amount !== undefined && amount < parseFloat(coupon.minOrderValue.toString())) {
            throw new error_middleware_1.AppError(`Mã giảm giá chỉ áp dụng cho đơn phòng từ ${coupon.minOrderValue} VNĐ`, 400);
        }
        // Tính toán số tiền được giảm
        let discountAmount = 0;
        if (amount !== undefined) {
            if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = amount * (parseFloat(coupon.discountValue.toString()) / 100);
                if (coupon.maxDiscountAmount) {
                    const maxVal = parseFloat(coupon.maxDiscountAmount.toString());
                    if (discountAmount > maxVal) {
                        discountAmount = maxVal;
                    }
                }
            }
            else {
                discountAmount = parseFloat(coupon.discountValue.toString());
            }
            // Đảm bảo số tiền giảm không lớn hơn tổng tiền đơn phòng
            discountAmount = Math.min(discountAmount, amount);
        }
        return {
            couponId: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: parseFloat(coupon.discountValue.toString()),
            discountAmount,
        };
    }
    async getCoupons(hotelId, all = false) {
        const where = {};
        if (!all) {
            const now = new Date();
            where.isActive = true;
            where.startDate = { lte: now };
            where.endDate = { gte: now };
        }
        if (hotelId) {
            where.OR = [
                { hotelId: null }, // Lấy coupon toàn sàn
                { hotelId: hotelId }, // Lấy coupon riêng của khách sạn
            ];
        }
        const coupons = await database_1.default.coupon.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return coupons.map((c) => ({
            ...c,
            discountValue: parseFloat(c.discountValue.toString()),
            minOrderValue: parseFloat(c.minOrderValue.toString()),
            maxDiscountAmount: c.maxDiscountAmount ? parseFloat(c.maxDiscountAmount.toString()) : null,
        }));
    }
    async deleteCoupon(userId, userRole, couponId) {
        const coupon = await database_1.default.coupon.findUnique({ where: { id: couponId } });
        if (!coupon)
            throw new error_middleware_1.AppError('Mã giảm giá không tồn tại', 404);
        if (coupon.hotelId) {
            const hotel = await database_1.default.hotel.findUnique({ where: { id: coupon.hotelId } });
            if (userRole !== client_1.Role.ADMIN && (!hotel || hotel.ownerId !== userId)) {
                throw new error_middleware_1.AppError('Bạn không có quyền xóa coupon này', 403);
            }
        }
        else {
            if (userRole !== client_1.Role.ADMIN) {
                throw new error_middleware_1.AppError('Chỉ Admin mới có quyền xóa mã giảm giá toàn sàn', 403);
            }
        }
        await database_1.default.coupon.delete({ where: { id: couponId } });
        return { id: couponId };
    }
}
exports.CouponUseCase = CouponUseCase;
exports.default = new CouponUseCase();
