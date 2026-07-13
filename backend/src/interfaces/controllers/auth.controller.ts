import { Request, Response, NextFunction } from 'express';
import authUseCase from '../../use-cases/auth/auth.use-case';
import userUseCase from '../../use-cases/user/user.use-case';
import { AuthenticatedRequest } from '../../infrastructure/middlewares/auth.middleware';
import prisma from '../../config/database';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authUseCase.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otpCode } = req.body;
      const result = await authUseCase.verifyEmail(email, otpCode);
      res.status(200).json({
        success: true,
        message: 'Xác thực tài khoản thành công. Bây giờ bạn có thể đăng nhập.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authUseCase.resendOTP(email);
      res.status(200).json({
        success: true,
        message: 'Mã OTP mới đã được gửi đến email của bạn.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await authUseCase.login(req.body, userAgent, ipAddress);

      // Lưu Refresh Token vào HTTP-Only Cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authUseCase.refresh(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await authUseCase.logout(refreshToken);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authUseCase.forgotPassword(email);
      res.status(200).json({
        success: true,
        message: 'Mã khôi phục mật khẩu đã được gửi đến email của bạn.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authUseCase.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: 'Thay đổi mật khẩu thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await userUseCase.getProfile(userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updatedProfile = await userUseCase.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Cập nhật hồ sơ cá nhân thành công',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role, search, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (role && role !== 'ALL') where.role = role;
      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, email: true, fullName: true, phoneNumber: true,
            role: true, isVerified: true, createdAt: true, avatarUrl: true,
            _count: { select: { bookings: true, hotels: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.user.count({ where })
      ]);

      res.status(200).json({ success: true, data: { users, total } });
    } catch (error) {
      next(error);
    }
  }

  public async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (status && status !== 'ALL') where.status = status;
      if (search) {
        where.OR = [
          { guestName: { contains: search as string, mode: 'insensitive' } },
          { guestEmail: { contains: search as string, mode: 'insensitive' } },
          { guestPhone: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
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
          take: parseInt(limit as string),
        }),
        prisma.booking.count({ where })
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
    } catch (error) {
      next(error);
    }
  }

  public async getAllPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { method, status, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (method && method !== 'ALL') where.method = method;
      if (status && status !== 'ALL') where.status = status;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
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
          take: parseInt(limit as string),
        }),
        prisma.payment.count({ where })
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
    } catch (error) {
      next(error);
    }
  }

  public async getAllReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', search } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (search) {
        where.OR = [
          { comment: { contains: search as string, mode: 'insensitive' } },
          { hotel: { name: { contains: search as string, mode: 'insensitive' } } }
        ];
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: { select: { fullName: true, email: true, avatarUrl: true } },
            hotel: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.review.count({ where })
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
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
