"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
const jwt_1 = require("../../infrastructure/security/jwt");
const mail_service_1 = __importDefault(require("../../infrastructure/services/mail.service"));
class AuthUseCase {
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async register(data) {
        const { email, password, fullName, phoneNumber, role } = data;
        // Kiểm tra email tồn tại
        const existingUser = await database_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new error_middleware_1.AppError('Email đã được sử dụng trên hệ thống', 400);
        }
        // Băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // Tạo mã OTP xác thực
        const otpCode = this.generateOTP();
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // Hạn 10 phút
        // Tạo user mới ở trạng thái chưa xác thực (isVerified = false)
        const user = await database_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phoneNumber,
                role: role,
                isVerified: false,
                otpCode,
                otpExpiresAt,
            },
        });
        // Gửi email OTP
        try {
            await mail_service_1.default.sendOTP(email, otpCode, fullName);
        }
        catch (mailError) {
            console.error('[Register AuthUseCase] Lỗi gửi email OTP:', mailError);
            // Vẫn cho đăng ký thành công, user có thể yêu cầu gửi lại OTP sau
        }
        return {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            isVerified: user.isVerified,
        };
    }
    async verifyEmail(email, otpCode) {
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_middleware_1.AppError('Không tìm thấy người dùng', 404);
        }
        if (user.isVerified) {
            throw new error_middleware_1.AppError('Tài khoản này đã được xác thực trước đó', 400);
        }
        if (!user.otpCode || user.otpCode !== otpCode) {
            throw new error_middleware_1.AppError('Mã OTP không chính xác', 400);
        }
        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new error_middleware_1.AppError('Mã OTP đã hết hạn sử dụng', 400);
        }
        // Xác thực thành công
        const updatedUser = await database_1.default.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
            },
        });
        return {
            email: updatedUser.email,
            isVerified: true,
        };
    }
    async resendOTP(email) {
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_middleware_1.AppError('Không tìm thấy người dùng', 404);
        }
        if (user.isVerified) {
            throw new error_middleware_1.AppError('Tài khoản đã được xác thực', 400);
        }
        const otpCode = this.generateOTP();
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);
        await database_1.default.user.update({
            where: { id: user.id },
            data: { otpCode, otpExpiresAt },
        });
        await mail_service_1.default.sendOTP(user.email, otpCode, user.fullName);
        return { success: true };
    }
    async login(data, userAgent, ipAddress) {
        const { email, password } = data;
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_middleware_1.AppError('Email hoặc mật khẩu không chính xác', 401);
        }
        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Email hoặc mật khẩu không chính xác', 401);
        }
        // Kiểm tra trạng thái xác thực
        if (!user.isVerified) {
            throw new error_middleware_1.AppError('Tài khoản chưa được xác thực email. Vui lòng xác thực trước.', 403);
        }
        // Sinh tokens
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role });
        const refreshTokenString = (0, jwt_1.generateRefreshToken)({ userId: user.id, role: user.role });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Hạn 7 ngày
        // Lưu Refresh Token vào Database
        await database_1.default.refreshToken.create({
            data: {
                token: refreshTokenString,
                userId: user.id,
                expiresAt,
            },
        });
        // Tạo Session đăng nhập
        await database_1.default.session.create({
            data: {
                userId: user.id,
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenString,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
                role: user.role,
            },
        };
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new error_middleware_1.AppError('Refresh token không được để trống', 401);
        }
        try {
            // 1. Verify token
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            // 2. Tìm token trong DB
            const dbToken = await database_1.default.refreshToken.findUnique({
                where: { token: refreshToken },
                include: { user: true },
            });
            if (!dbToken || dbToken.expiresAt < new Date()) {
                throw new error_middleware_1.AppError('Refresh Token không hợp lệ hoặc đã hết hạn', 401);
            }
            // 3. Tạo Access Token mới
            const accessToken = (0, jwt_1.generateAccessToken)({
                userId: dbToken.userId,
                role: dbToken.user.role,
            });
            return { accessToken };
        }
        catch (error) {
            throw new error_middleware_1.AppError('Refresh token không hợp lệ', 401);
        }
    }
    async logout(refreshToken) {
        if (!refreshToken)
            return;
        try {
            // Tìm session liên kết nếu cần, hoặc chỉ cần xóa Refresh Token khỏi DB
            await database_1.default.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }
        catch (error) {
            // Bỏ qua lỗi nếu token không tồn tại trong DB
        }
    }
    async forgotPassword(email) {
        const user = await database_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_middleware_1.AppError('Không tìm thấy người dùng đăng ký bằng email này', 404);
        }
        // Tạo token khôi phục ngẫu nhiên (dùng crypto uuid)
        const resetToken = crypto_1.default.randomUUID();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Hạn 15 phút
        // Lưu vào otpCode của user
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                otpCode: resetToken,
                otpExpiresAt: expiresAt,
            },
        });
        // Gửi email khôi phục mật khẩu
        await mail_service_1.default.sendResetPassword(email, resetToken, user.fullName);
        return { success: true };
    }
    async resetPassword(data) {
        const { token, password } = data;
        const user = await database_1.default.user.findFirst({
            where: {
                otpCode: token,
                otpExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Mã khôi phục không hợp lệ hoặc đã hết hạn', 400);
        }
        // Băm mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 10);
        // Cập nhật thông tin
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otpCode: null,
                otpExpiresAt: null,
            },
        });
        return { success: true };
    }
}
exports.AuthUseCase = AuthUseCase;
exports.default = new AuthUseCase();
