import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';

export class RatePlanUseCase {
  public async getRatePlansByRoomType(roomTypeId: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });
    if (!roomType) throw new AppError('Loại phòng không tồn tại', 404);

    const ratePlans = await (prisma.ratePlan as any).findMany({
      where: { roomTypeId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    // Nếu chưa có gói nào, tự động tạo 2 gói mặc định
    if (ratePlans.length === 0) {
      return await this.createDefaultRatePlans(roomTypeId, parseFloat(roomType.basePrice.toString()));
    }

    return ratePlans;
  }

  public async createDefaultRatePlans(roomTypeId: string, basePrice: number) {
    const flex = await (prisma.ratePlan as any).create({
      data: {
        roomTypeId,
        name: 'Flexible (Linh hoạt)',
        description: 'Miễn phí hủy phòng trước 24 giờ. Thanh toán tại khách sạn hoặc online.',
        priceModifierType: 'FIXED_PRICE',
        priceModifierValue: basePrice,
        paymentPolicy: 'PAY_AT_HOTEL',
        cancellationPolicy: 'FREE_CANCEL',
        freeCancelDaysBefore: 1,
        freeCancelHoursBefore: 24,
        cancellationFeeType: 'FIRST_NIGHT',
        noShowPolicy: 'PERCENT_100',
        isActive: true
      }
    });

    const nonRef = await (prisma.ratePlan as any).create({
      data: {
        roomTypeId,
        name: 'Non-refundable (Ưu đãi Không hoàn tiền)',
        description: 'Giảm 10% giá phòng. Thanh toán online ngay, không hoàn tiền nếu hủy.',
        priceModifierType: 'PERCENTAGE_DISCOUNT',
        priceModifierValue: 10, // Giảm 10%
        paymentPolicy: 'PAY_ONLINE',
        cancellationPolicy: 'NON_REFUNDABLE',
        cancellationFeeType: 'PERCENT_100',
        noShowPolicy: 'PERCENT_100',
        isActive: true
      }
    });

    return [flex, nonRef];
  }

  public async createRatePlan(userId: string, userRole: string, data: any) {
    const { roomTypeId, name, description, priceModifierType, priceModifierValue, paymentPolicy, depositType, depositValue, cancellationPolicy, freeCancelDaysBefore, freeCancelHoursBefore, cancellationFeeType, noShowPolicy } = data;

    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true }
    });
    if (!roomType) throw new AppError('Loại phòng không tồn tại', 404);

    if (userRole !== 'ADMIN' && roomType.hotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền quản lý gói đặt phòng này', 403);
    }

    const ratePlan = await (prisma.ratePlan as any).create({
      data: {
        roomTypeId,
        name,
        description: description || null,
        priceModifierType: priceModifierType || 'FIXED_PRICE',
        priceModifierValue: Number(priceModifierValue) || 0,
        paymentPolicy: paymentPolicy || 'PAY_AT_HOTEL',
        depositType: depositType || null,
        depositValue: depositValue ? Number(depositValue) : null,
        cancellationPolicy: cancellationPolicy || 'FREE_CANCEL',
        freeCancelDaysBefore: freeCancelDaysBefore !== undefined ? Number(freeCancelDaysBefore) : 1,
        freeCancelHoursBefore: freeCancelHoursBefore !== undefined ? Number(freeCancelHoursBefore) : 24,
        cancellationFeeType: cancellationFeeType || 'FIRST_NIGHT',
        noShowPolicy: noShowPolicy || 'PERCENT_100',
        isActive: true
      }
    });

    return ratePlan;
  }

  public async updateRatePlan(userId: string, userRole: string, ratePlanId: string, data: any) {
    const ratePlan = await (prisma.ratePlan as any).findUnique({
      where: { id: ratePlanId },
      include: { roomType: { include: { hotel: true } } }
    });
    if (!ratePlan) throw new AppError('Gói đặt phòng không tồn tại', 404);

    if (userRole !== 'ADMIN' && ratePlan.roomType.hotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền chỉnh sửa gói đặt phòng này', 403);
    }

    const updated = await (prisma.ratePlan as any).update({
      where: { id: ratePlanId },
      data: {
        ...data,
        priceModifierValue: data.priceModifierValue !== undefined ? Number(data.priceModifierValue) : undefined,
        depositValue: data.depositValue !== undefined ? (data.depositValue ? Number(data.depositValue) : null) : undefined,
      }
    });

    return updated;
  }

  public async deleteRatePlan(userId: string, userRole: string, ratePlanId: string) {
    const ratePlan = await (prisma.ratePlan as any).findUnique({
      where: { id: ratePlanId },
      include: { roomType: { include: { hotel: true } } }
    });
    if (!ratePlan) throw new AppError('Gói đặt phòng không tồn tại', 404);

    if (userRole !== 'ADMIN' && ratePlan.roomType.hotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền xóa gói đặt phòng này', 403);
    }

    await (prisma.ratePlan as any).delete({
      where: { id: ratePlanId }
    });

    return { id: ratePlanId };
  }
}

export default new RatePlanUseCase();
