import { Router } from 'express';
import bookingController from '../controllers/booking.controller';
import statsController from '../controllers/stats.controller';
import { requireAuth, requireRole } from '../../infrastructure/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { validateRequest } from '../../infrastructure/middlewares/validation.middleware';
import { createBookingSchema } from '../dtos/booking.dto';

const router = Router();

// Route tạo đặt phòng cho phép cả khách vãng lai và thành viên đăng nhập
router.post('/', validateRequest(createBookingSchema), bookingController.create);

// Route thống kê cho quản trị viên và đối tác chủ phòng
router.get('/admin-stats', requireAuth, requireRole([Role.ADMIN]), statsController.getAdminStats);
router.get('/owner-stats', requireAuth, requireRole([Role.HOTEL_OWNER]), statsController.getOwnerStats);

// Các route xem lịch sử và quản lý đơn vẫn yêu cầu xác thực người dùng
router.get('/my', requireAuth, bookingController.getMyBookings);
router.get('/:id', bookingController.getDetail);
router.put('/:id/status', requireAuth, bookingController.updateStatus);

export default router;
