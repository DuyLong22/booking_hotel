import { z } from 'zod';

export const createRatePlanSchema = z.object({
  body: z.object({
    roomTypeId: z.string().uuid('ID loại phòng không hợp lệ'),
    name: z.string().min(2, 'Tên gói đặt phòng không được để trống'),
    description: z.string().optional(),
    priceModifierType: z.enum(['FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'AMOUNT_DISCOUNT']).default('FIXED_PRICE'),
    priceModifierValue: z.number().nonnegative().default(0),
    
    // 1. Payment policy
    paymentPolicy: z.enum(['PAY_ONLINE', 'PAY_AT_HOTEL', 'DEPOSIT']).default('PAY_AT_HOTEL'),
    depositType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).nullable().optional(),
    depositValue: z.number().nonnegative().nullable().optional(),

    // 2. Cancellation policy
    cancellationPolicy: z.enum(['FREE_CANCEL', 'NON_REFUNDABLE', 'CANCEL_BEFORE_DAYS', 'CANCEL_BEFORE_HOURS']).default('FREE_CANCEL'),
    freeCancelDaysBefore: z.number().int().nonnegative().nullable().optional().default(1),
    freeCancelHoursBefore: z.number().int().nonnegative().nullable().optional().default(24),
    cancellationFeeType: z.enum(['FIRST_NIGHT', 'PERCENT_100', 'PERCENT_50']).default('FIRST_NIGHT'),

    // 3. No-show policy
    noShowPolicy: z.enum(['NO_FEE', 'FIRST_NIGHT', 'PERCENT_100']).default('PERCENT_100'),

    isActive: z.boolean().optional().default(true),
  })
});

export const updateRatePlanSchema = z.object({
  body: createRatePlanSchema.shape.body.partial()
});
