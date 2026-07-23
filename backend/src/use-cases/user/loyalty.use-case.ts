import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import { BookingStatus } from '@prisma/client';

export class LoyaltyUseCase {
  /**
   * Tính số điểm khả dụng hiện tại của người dùng.
   * Công thức: Điểm cộng trong 1 năm qua (365 ngày) + Điểm đã tiêu (âm) + Điểm đã hoàn (dương)
   */
  public async getUserPointsBalance(userId: string): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const earnSum = await prisma.loyaltyTransaction.aggregate({
      where: {
        userId,
        type: 'EARN',
        createdAt: { gte: oneYearAgo }
      },
      _sum: { points: true }
    });

    const spendSum = await prisma.loyaltyTransaction.aggregate({
      where: {
        userId,
        type: { in: ['SPEND', 'REFUND'] }
      },
      _sum: { points: true }
    });

    const earned = earnSum._sum.points || 0;
    const spentAndRefunded = spendSum._sum.points || 0; // SPEND là âm, REFUND là dương

    const balance = Math.max(0, earned + spentAndRefunded);
    return balance;
  }

  /**
   * Tính số điểm sắp hết hạn trong vòng 30 ngày tới.
   * Tìm các giao dịch EARN được tạo từ (1 năm trước) đến (1 năm trước + 30 ngày)
   */
  public async getPointsExpiringSoon(userId: string): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oneYearAgoPlus30Days = new Date(oneYearAgo);
    oneYearAgoPlus30Days.setDate(oneYearAgoPlus30Days.getDate() + 30);

    const expiringSum = await prisma.loyaltyTransaction.aggregate({
      where: {
        userId,
        type: 'EARN',
        createdAt: {
          gte: oneYearAgo,
          lt: oneYearAgoPlus30Days
        }
      },
      _sum: { points: true }
    });

    return expiringSum._sum.points || 0;
  }

  /**
   * Xác định hạng thành viên hiện tại của người dùng
   */
  public getTierDetails(points: number) {
    let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
    let multiplier = 1.0;
    let nextTierPoints = 1000;
    let nextTierName = 'Silver';
    let benefitsVi: string[] = ['Tích lũy x1.0 điểm cho mỗi đơn phòng'];
    let benefitsEn: string[] = ['Earn x1.0 points on stays'];

    if (points >= 10000) {
      tier = 'Platinum';
      multiplier = 1.5;
      nextTierPoints = 10000;
      nextTierName = '';
      benefitsVi = ['Tích lũy x1.5 điểm', 'Voucher độc quyền giảm 20%', 'Hỗ trợ ưu tiên 24/7'];
      benefitsEn = ['Earn x1.5 points', 'Exclusive 20% discount voucher', '24/7 Priority Support'];
    } else if (points >= 5000) {
      tier = 'Gold';
      multiplier = 1.25;
      nextTierPoints = 10000;
      nextTierName = 'Platinum';
      benefitsVi = ['Tích lũy x1.25 điểm', 'Quà tặng & Voucher sinh nhật'];
      benefitsEn = ['Earn x1.25 points', 'Birthday Gift & Vouchers'];
    } else if (points >= 1000) {
      tier = 'Silver';
      multiplier = 1.1;
      nextTierPoints = 5000;
      nextTierName = 'Gold';
      benefitsVi = ['Tích lũy x1.1 điểm', 'Ưu tiên chăm sóc khách hàng'];
      benefitsEn = ['Earn x1.1 points', 'Priority Customer Service'];
    }

    const pointsToNext = nextTierName ? nextTierPoints - points : 0;

    return {
      tier,
      multiplier,
      nextTierPoints,
      nextTierName,
      pointsToNext,
      benefitsVi,
      benefitsEn
    };
  }

  /**
   * Lấy tóm tắt Loyalty của người dùng
   */
  public async getLoyaltySummary(userId: string) {
    const balance = await this.getUserPointsBalance(userId);
    const expiringSoon = await this.getPointsExpiringSoon(userId);
    const tierDetails = this.getTierDetails(balance);

    return {
      pointsBalance: balance,
      expiringSoon,
      ...tierDetails
    };
  }

  /**
   * Lấy lịch sử giao dịch điểm Loyalty
   */
  public async getLoyaltyHistory(userId: string) {
    return prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Cộng điểm Loyalty sau khi khách thanh toán thành công và đã check-out
   */
  public async earnPoints(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) return;
    const allowedStatuses: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
      BookingStatus.CHECKED_OUT,
      BookingStatus.COMPLETED
    ];
    if (!allowedStatuses.includes(booking.status)) {
      return; // Chỉ cộng khi đã thanh toán thành công (CONFIRMED) trở đi
    }

    // Kiểm tra xem đã cộng điểm cho booking này chưa
    const existingEarn = await prisma.loyaltyTransaction.findFirst({
      where: { bookingId, type: 'EARN' }
    });
    if (existingEarn) return;

    const user = booking.user;
    const currentPoints = await this.getUserPointsBalance(user.id);
    const tierDetails = this.getTierDetails(currentPoints);

    // Tính điểm: 10.000 VNĐ = 1 điểm, nhân với hệ số hạng thành viên
    const basePoints = Math.floor(Number(booking.finalPrice) / 10000);
    const earnedPoints = Math.floor(basePoints * tierDetails.multiplier);

    if (earnedPoints <= 0) return;

    const expiredAt = new Date();
    expiredAt.setFullYear(expiredAt.getFullYear() + 1); // Có hiệu lực 1 năm

    await prisma.$transaction(async (tx) => {
      // 1. Tạo giao dịch cộng điểm
      await tx.loyaltyTransaction.create({
        data: {
          userId: user.id,
          bookingId,
          points: earnedPoints,
          type: 'EARN',
          description: `Cộng điểm tích lũy từ đơn đặt phòng #${bookingId.substring(0, 8).toUpperCase()}`,
          expiredAt
        }
      });

      // 2. Cập nhật cache loyaltyPoints trên User
      const newPointsBalance = currentPoints + earnedPoints;
      await tx.user.update({
        where: { id: user.id },
        data: { loyaltyPoints: newPointsBalance }
      });

      // 3. Tạo thông báo cộng điểm
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Cộng điểm tích lũy thành công 🎉',
          content: `Bạn vừa được cộng ${earnedPoints} điểm Loyalty từ đơn phòng nghỉ đã hoàn thành.`,
          type: 'SYSTEM'
        }
      });

      // 4. Kiểm tra xem có lên hạng mới không
      const newTierDetails = this.getTierDetails(newPointsBalance);
      const oldTierDetails = this.getTierDetails(currentPoints);

      if (newTierDetails.tier !== oldTierDetails.tier) {
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Chúc mừng thăng hạng thành viên 🏆',
            content: `Chúc mừng bạn đã được thăng hạng thành viên lên ${newTierDetails.tier.toUpperCase()}! Hãy khám phá ngay các đặc quyền mới dành riêng cho bạn.`,
            type: 'SYSTEM'
          }
        });
      }
    });
  }

  /**
   * Hoàn điểm Loyalty khi đơn đặt phòng có sử dụng điểm bị hủy (CANCELLED)
   */
  public async refundPoints(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return;

    // 1. Hoàn lại số điểm khách đã TIÊU (nếu có)
    if (booking.pointsUsed > 0) {
      const existingRefund = await prisma.loyaltyTransaction.findFirst({
        where: { bookingId, type: 'REFUND' }
      });
      if (!existingRefund) {
        const currentPoints = await this.getUserPointsBalance(booking.userId);
        await prisma.$transaction(async (tx) => {
          await tx.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              bookingId,
              points: booking.pointsUsed, // Số điểm dương hoàn trả
              type: 'REFUND',
              description: `Hoàn điểm tích lũy từ đơn đặt phòng bị hủy #${bookingId.substring(0, 8).toUpperCase()}`
            }
          });
          const newPointsBalance = currentPoints + booking.pointsUsed;
          await tx.user.update({
            where: { id: booking.userId },
            data: { loyaltyPoints: newPointsBalance }
          });
          await tx.notification.create({
            data: {
              userId: booking.userId,
              title: 'Hoàn trả điểm tích lũy 🔄',
              content: `Hệ thống đã hoàn trả ${booking.pointsUsed} điểm Loyalty từ đơn phòng đã hủy của bạn.`,
              type: 'SYSTEM'
            }
          });
        });
      }
    }

    // 2. Thu hồi số điểm khách đã NHẬN từ booking này (nếu có)
    const existingEarn = await prisma.loyaltyTransaction.findFirst({
      where: { bookingId, type: 'EARN' }
    });
    if (existingEarn) {
      const existingReversal = await prisma.loyaltyTransaction.findFirst({
        where: { bookingId, type: 'SPEND', description: { startsWith: 'Thu hồi' } }
      });
      if (!existingReversal) {
        const currentPoints = await this.getUserPointsBalance(booking.userId);
        await prisma.$transaction(async (tx) => {
          await tx.loyaltyTransaction.create({
            data: {
              userId: booking.userId,
              bookingId,
              points: -existingEarn.points, // Số điểm âm thu hồi
              type: 'SPEND',
              description: `Thu hồi điểm tích lũy từ đơn đặt phòng bị hủy #${bookingId.substring(0, 8).toUpperCase()}`
            }
          });
          const newPointsBalance = Math.max(0, currentPoints - existingEarn.points);
          await tx.user.update({
            where: { id: booking.userId },
            data: { loyaltyPoints: newPointsBalance }
          });
          await tx.notification.create({
            data: {
              userId: booking.userId,
              title: 'Thu hồi điểm tích lũy ⚠️',
              content: `Hệ thống đã thu hồi ${existingEarn.points} điểm Loyalty từ đơn đặt phòng đã hủy của bạn.`,
              type: 'SYSTEM'
            }
          });
        });
      }
    }
  }
}

export default new LoyaltyUseCase();
