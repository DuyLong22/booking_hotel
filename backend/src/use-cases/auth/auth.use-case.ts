import prisma from '../../config/database';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../infrastructure/security/jwt';
import mailService from '../../infrastructure/services/mail.service';

export class AuthUseCase {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public async register(data: any) {
    const { email, password, fullName, phoneNumber, role } = data;

    // Kiểm tra email tồn tại
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email đã được sử dụng trên hệ thống', 400);
    }

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới ở trạng thái đã xác thực trực tiếp (isVerified = true) để tiện thử nghiệm
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phoneNumber,
        role: role as Role,
        isVerified: true,
        isApproved: role !== Role.HOTEL_OWNER, // Chỉ cho đăng nhập trực tiếp nếu không phải HOTEL_OWNER
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
    };
  }

  public async verifyEmail(email: string, otpCode: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    if (user.isVerified) {
      throw new AppError('Tài khoản này đã được xác thực trước đó', 400);
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      throw new AppError('Mã OTP không chính xác', 400);
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new AppError('Mã OTP đã hết hạn sử dụng', 400);
    }

    // Xác thực thành công
    const updatedUser = await prisma.user.update({
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

  public async resendOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    if (user.isVerified) {
      throw new AppError('Tài khoản đã được xác thực', 400);
    }

    const otpCode = this.generateOTP();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    await mailService.sendOTP(user.email, otpCode, user.fullName);

    return { success: true };
  }

  public async login(data: any, userAgent?: string, ipAddress?: string) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    // Kiểm tra trạng thái xác thực
    if (!user.isVerified) {
      throw new AppError('Tài khoản chưa được xác thực email. Vui lòng xác thực trước.', 403);
    }

    // Kiểm tra trạng thái hoạt động của tài khoản (Trừ ADMIN)
    if (user.role !== Role.ADMIN && !user.isApproved) {
      throw new AppError('Tài khoản của bạn đã bị khóa hoặc đang chờ phê duyệt. Vui lòng liên hệ Admin.', 403);
    }

    // Sinh tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshTokenString = generateRefreshToken({ userId: user.id, role: user.role });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Hạn 7 ngày

    // Lưu Refresh Token vào Database
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // Tạo Session đăng nhập
    await prisma.session.create({
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

  public async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token không được để trống', 401);
    }

    try {
      // 1. Verify token
      const decoded = verifyRefreshToken(refreshToken);

      // 2. Tìm token trong DB
      const dbToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!dbToken || dbToken.expiresAt < new Date()) {
        throw new AppError('Refresh Token không hợp lệ hoặc đã hết hạn', 401);
      }

      // 3. Tạo Access Token mới
      const accessToken = generateAccessToken({
        userId: dbToken.userId,
        role: dbToken.user.role,
      });

      return { accessToken };
    } catch (error) {
      throw new AppError('Refresh token không hợp lệ', 401);
    }
  }

  public async logout(refreshToken: string) {
    if (!refreshToken) return;

    try {
      // Tìm session liên kết nếu cần, hoặc chỉ cần xóa Refresh Token khỏi DB
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (error) {
      // Bỏ qua lỗi nếu token không tồn tại trong DB
    }
  }

  public async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng đăng ký bằng email này', 404);
    }

    // Tạo token khôi phục ngẫu nhiên (dùng crypto uuid)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Hạn 15 phút

    // Lưu vào otpCode của user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: resetToken,
        otpExpiresAt: expiresAt,
      },
    });

    // Gửi email khôi phục mật khẩu
    await mailService.sendResetPassword(email, resetToken, user.fullName);

    return { success: true };
  }

  public async resetPassword(data: any) {
    const { token, password } = data;

    const user = await prisma.user.findFirst({
      where: {
        otpCode: token,
        otpExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Mã khôi phục không hợp lệ hoặc đã hết hạn', 400);
    }

    // Băm mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật thông tin
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return { success: true };
  }

  public async socialLogin(data: any, userAgent?: string, ipAddress?: string) {
    const { email, fullName, avatarUrl } = data;

    if (!email) {
      throw new AppError('Email không được để trống', 400);
    }

    // 1. Kiểm tra xem người dùng có tồn tại trong hệ thống chưa
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 2. Nếu chưa có, tự động đăng ký tài khoản CUSTOMER mới với mật khẩu ngẫu nhiên
      const randomPassword = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl: avatarUrl || null,
          password: hashedPassword,
          isVerified: true, // Tài khoản MXH được xem là đã xác thực email sẵn
          role: Role.CUSTOMER,
        },
      });
      console.log(`[AuthUseCase] Tự động đăng ký người dùng Google/Facebook mới: ${email}`);
    } else {
      // Cập nhật avatar nếu người dùng có đổi ảnh đại diện mới
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl },
        });
      }
    }

    // 3. Đăng nhập thành công -> Sinh tokens và lưu DB
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshTokenString = generateRefreshToken({ userId: user.id, role: user.role });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Hạn 7 ngày

    // Lưu Refresh Token
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // Tạo Session
    await prisma.session.create({
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
}

export default new AuthUseCase();
