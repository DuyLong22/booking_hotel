"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email không đúng định dạng'),
        password: zod_1.z
            .string()
            .min(6, 'Mật khẩu phải tối thiểu 6 ký tự')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số'),
        fullName: zod_1.z.string().min(2, 'Họ tên phải tối thiểu 2 ký tự'),
        phoneNumber: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.Role).refine((val) => val === client_1.Role.CUSTOMER || val === client_1.Role.HOTEL_OWNER, {
            message: 'Chỉ chấp nhận vai trò CUSTOMER hoặc HOTEL_OWNER',
        }),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email không đúng định dạng'),
        password: zod_1.z.string().min(1, 'Mật khẩu không được để trống'),
    }),
});
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email không đúng định dạng'),
        otpCode: zod_1.z.string().length(6, 'Mã OTP phải có độ dài đúng 6 ký tự'),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email không đúng định dạng'),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token không được để trống'),
        password: zod_1.z
            .string()
            .min(6, 'Mật khẩu phải tối thiểu 6 ký tự')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số'),
    }),
});
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Họ tên phải tối thiểu 2 ký tự').optional(),
        phoneNumber: zod_1.z.string().optional(),
        avatarUrl: zod_1.z.string().url('Đường dẫn ảnh đại diện không hợp lệ').or(zod_1.z.literal('')).optional(),
    }),
});
