import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';

export class UserUseCase {
  public async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('Không tìm thấy thông tin người dùng', 404);
    }

    return user;
  }

  public async updateProfile(userId: string, data: any) {
    const { fullName, phoneNumber, avatarUrl } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

export default new UserUseCase();
