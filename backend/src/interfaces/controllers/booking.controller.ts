import { Response, NextFunction } from 'express';
import bookingUseCase from '../../use-cases/booking/booking.use-case';
import { AuthenticatedRequest } from '../../infrastructure/middlewares/auth.middleware';
import { BookingStatus } from '@prisma/client';

export class BookingController {
  public async create(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || null;
      const result = await bookingUseCase.createBooking(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Tạo đơn đặt phòng thành công. Vui lòng tiến hành thanh toán.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getDetail(req: any, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id;
      const userId = req.user?.userId || null;
      const role = req.user?.role || null;
      const result = await bookingUseCase.getBookingDetail(bookingId, userId, role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const result = await bookingUseCase.getMyBookings(userId, role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id;
      const { status } = req.body;
      const { userId, role } = req.user!;
      const result = await bookingUseCase.updateBookingStatus(
        bookingId,
        status as BookingStatus,
        userId,
        role
      );
      res.status(200).json({
        success: true,
        message: `Đơn đặt phòng đã được chuyển sang trạng thái: ${status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();
