"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponSchema = exports.createCouponSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        checkInDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Định dạng ngày nhận phòng không hợp lệ (YYYY-MM-DD)',
        }),
        checkOutDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Định dạng ngày trả phòng không hợp lệ (YYYY-MM-DD)',
        }),
        guestName: zod_1.z.string().min(2, 'Tên khách lưu trú không được để trống'),
        guestEmail: zod_1.z.string().email('Email khách hàng không đúng định dạng'),
        guestPhone: zod_1.z.string().min(8, 'Số điện thoại khách hàng không đúng định dạng'),
        notes: zod_1.z.string().optional(),
        couponCode: zod_1.z.string().optional(),
        insuranceSelected: zod_1.z.boolean().optional(),
        bookingItems: zod_1.z
            .array(zod_1.z.object({
            roomTypeId: zod_1.z.string().uuid('ID loại phòng không hợp lệ'),
            quantity: zod_1.z.number().int().positive('Số lượng phòng phải lớn hơn 0'),
        }))
            .min(1, 'Đơn đặt phòng phải chứa ít nhất một loại phòng'),
    })
        .refine((data) => {
        const checkIn = new Date(data.checkInDate);
        const checkOut = new Date(data.checkOutDate);
        return checkOut > checkIn;
    }, {
        message: 'Ngày trả phòng phải sau ngày nhận phòng',
        path: ['checkOutDate'],
    })
});
exports.createCouponSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(3, 'Mã giảm giá phải từ 3 ký tự trở lên').toUpperCase(),
        description: zod_1.z.string().min(5, 'Mô tả mã giảm giá không được để trống'),
        discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED']),
        discountValue: zod_1.z.number().positive('Giá trị giảm giá phải lớn hơn 0'),
        minOrderValue: zod_1.z.number().nonnegative().default(0),
        maxDiscountAmount: zod_1.z.number().positive().optional(),
        startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Định dạng ngày bắt đầu không hợp lệ',
        }),
        endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Định dạng ngày kết thúc không hợp lệ',
        }),
        usageLimit: zod_1.z.number().int().positive('Giới hạn lượt dùng phải lớn hơn 0'),
        hotelId: zod_1.z.string().uuid('ID khách sạn không hợp lệ').nullable().optional(),
    })
        .refine((data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
    }, {
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
        path: ['endDate'],
    })
});
exports.validateCouponSchema = zod_1.z.object({
    query: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Mã coupon không được để trống').toUpperCase(),
        hotelId: zod_1.z.string().uuid('ID khách sạn không hợp lệ').optional(),
        amount: zod_1.z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
            message: 'Tổng tiền đơn hàng không hợp lệ',
        })
    })
});
