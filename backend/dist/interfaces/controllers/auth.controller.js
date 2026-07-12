"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_use_case_1 = __importDefault(require("../../use-cases/auth/auth.use-case"));
const user_use_case_1 = __importDefault(require("../../use-cases/user/user.use-case"));
const database_1 = __importDefault(require("../../config/database"));
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_use_case_1.default.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { email, otpCode } = req.body;
            const result = await auth_use_case_1.default.verifyEmail(email, otpCode);
            res.status(200).json({
                success: true,
                message: 'Xác thực tài khoản thành công. Bây giờ bạn có thể đăng nhập.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendOTP(req, res, next) {
        try {
            const { email } = req.body;
            await auth_use_case_1.default.resendOTP(email);
            res.status(200).json({
                success: true,
                message: 'Mã OTP mới đã được gửi đến email của bạn.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const userAgent = req.headers['user-agent'];
            const ipAddress = req.ip;
            const result = await auth_use_case_1.default.login(req.body, userAgent, ipAddress);
            // Lưu Refresh Token vào HTTP-Only Cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    accessToken: result.accessToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            const result = await auth_use_case_1.default.refresh(refreshToken);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            await auth_use_case_1.default.logout(refreshToken);
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });
            res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await auth_use_case_1.default.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: 'Mã khôi phục mật khẩu đã được gửi đến email của bạn.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            await auth_use_case_1.default.resetPassword(req.body);
            res.status(200).json({
                success: true,
                message: 'Thay đổi mật khẩu thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await user_use_case_1.default.getProfile(userId);
            res.status(200).json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const updatedProfile = await user_use_case_1.default.updateProfile(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật hồ sơ cá nhân thành công',
                data: updatedProfile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllUsers(req, res, next) {
        try {
            const { role, search, page = '1', limit = '20' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if (role && role !== 'ALL')
                where.role = role;
            if (search) {
                where.OR = [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [users, total] = await Promise.all([
                database_1.default.user.findMany({
                    where,
                    select: {
                        id: true, email: true, fullName: true, phoneNumber: true,
                        role: true, isVerified: true, createdAt: true, avatarUrl: true,
                        _count: { select: { bookings: true, hotels: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                database_1.default.user.count({ where })
            ]);
            res.status(200).json({ success: true, data: { users, total } });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllBookings(req, res, next) {
        try {
            const { status, search, page = '1', limit = '20' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if (status && status !== 'ALL')
                where.status = status;
            if (search) {
                where.OR = [
                    { guestName: { contains: search, mode: 'insensitive' } },
                    { guestEmail: { contains: search, mode: 'insensitive' } },
                    { guestPhone: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [bookings, total] = await Promise.all([
                database_1.default.booking.findMany({
                    where,
                    include: {
                        user: { select: { fullName: true, email: true } },
                        bookingItems: {
                            include: { roomType: { include: { hotel: { select: { name: true } } } } }
                        },
                        payment: { select: { method: true, status: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                database_1.default.booking.count({ where })
            ]);
            const formatted = bookings.map(b => ({
                id: b.id,
                guestName: b.guestName || b.user?.fullName || 'N/A',
                guestEmail: b.guestEmail || b.user?.email || 'N/A',
                guestPhone: b.guestPhone || 'N/A',
                hotelName: b.bookingItems[0]?.roomType?.hotel?.name || 'N/A',
                roomTypeName: b.bookingItems[0]?.roomType?.name || 'N/A',
                checkInDate: b.checkInDate.toISOString().split('T')[0],
                checkOutDate: b.checkOutDate.toISOString().split('T')[0],
                finalPrice: Number(b.finalPrice),
                status: b.status,
                paymentMethod: b.payment?.method || 'N/A',
                paymentStatus: b.payment?.status || 'N/A',
                createdAt: b.createdAt.toISOString(),
            }));
            res.status(200).json({ success: true, data: { bookings: formatted, total } });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllPayments(req, res, next) {
        try {
            const { method, status, page = '1', limit = '20' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if (method && method !== 'ALL')
                where.method = method;
            if (status && status !== 'ALL')
                where.status = status;
            const [payments, total] = await Promise.all([
                database_1.default.payment.findMany({
                    where,
                    include: {
                        booking: {
                            include: {
                                user: { select: { fullName: true, email: true } },
                                bookingItems: { include: { roomType: { include: { hotel: { select: { name: true } } } } } }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                database_1.default.payment.count({ where })
            ]);
            const formatted = payments.map(p => ({
                id: p.id,
                amount: Number(p.amount),
                method: p.method,
                status: p.status,
                transactionId: p.transactionId || 'N/A',
                guestName: p.booking?.user?.fullName || 'N/A',
                guestEmail: p.booking?.user?.email || 'N/A',
                hotelName: p.booking?.bookingItems[0]?.roomType?.hotel?.name || 'N/A',
                createdAt: p.createdAt.toISOString(),
            }));
            res.status(200).json({ success: true, data: { payments: formatted, total } });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllReviews(req, res, next) {
        try {
            const { page = '1', limit = '20', search } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { comment: { contains: search, mode: 'insensitive' } },
                    { hotel: { name: { contains: search, mode: 'insensitive' } } }
                ];
            }
            const [reviews, total] = await Promise.all([
                database_1.default.review.findMany({
                    where,
                    include: {
                        user: { select: { fullName: true, email: true, avatarUrl: true } },
                        hotel: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                database_1.default.review.count({ where })
            ]);
            const formatted = reviews.map(r => ({
                id: r.id,
                guestName: r.user.fullName,
                guestEmail: r.user.email,
                avatarUrl: r.user.avatarUrl,
                hotelName: r.hotel.name,
                ratingOverall: r.ratingOverall,
                comment: r.comment,
                createdAt: r.createdAt.toISOString(),
            }));
            res.status(200).json({ success: true, data: { reviews: formatted, total } });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
