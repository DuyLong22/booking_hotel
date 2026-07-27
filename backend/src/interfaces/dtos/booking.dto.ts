import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Định dạng ngày nhận phòng không hợp lệ (YYYY-MM-DD)',
    }),
    checkOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Định dạng ngày trả phòng không hợp lệ (YYYY-MM-DD)',
    }),
    guestName: z.string().min(2, 'Tên khách lưu trú không được để trống'),
    guestEmail: z.string().email('Email khách hàng không đúng định dạng'),
    guestPhone: z.string().min(8, 'Số điện thoại khách hàng không đúng định dạng'),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
    insuranceSelected: z.boolean().optional(),
    bookingItems: z
      .array(
        z.object({
          roomTypeId: z.string().uuid('ID loại phòng không hợp lệ'),
          ratePlanId: z.string().uuid('ID gói đặt phòng không hợp lệ').optional().nullable(),
          quantity: z.number().int().positive('Số lượng phòng phải lớn hơn 0'),
        })
      )
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

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Mã giảm giá phải từ 3 ký tự trở lên').toUpperCase(),
    description: z.string().min(5, 'Mô tả mã giảm giá không được để trống'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive('Giá trị giảm giá phải lớn hơn 0'),
    minOrderValue: z.number().nonnegative().default(0),
    maxDiscountAmount: z.number().positive().nullable().optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Định dạng ngày bắt đầu không hợp lệ',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Định dạng ngày kết thúc không hợp lệ',
    }),
    usageLimit: z.number().int().positive('Giới hạn lượt dùng phải lớn hơn 0'),
    dailyUsageLimit: z.number().int().positive('Giới hạn lượt dùng theo ngày phải lớn hơn 0').nullable().optional(),
    targetUserType: z.enum(['ALL', 'NEW', 'VIP']).optional().default('ALL'),
    hotelId: z.string().uuid('ID khách sạn không hợp lệ').nullable().optional(),
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

export const validateCouponSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Mã coupon không được để trống').toUpperCase(),
    hotelId: z.string().uuid('ID khách sạn không hợp lệ').optional(),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Tổng tiền đơn hàng không hợp lệ',
    })
  })
});
