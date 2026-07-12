import { Router } from 'express';
import hotelController from '../controllers/hotel.controller';
import { validateRequest } from '../../infrastructure/middlewares/validation.middleware';
import { requireAuth, requireRole } from '../../infrastructure/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  createHotelSchema,
  updateHotelSchema,
  createRoomTypeSchema,
  updateRoomTypeSchema,
  createRoomSchema,
  updatePriceCalendarSchema,
} from '../dtos/hotel.dto';

const router = Router();

// --- Các route public (Không cần đăng nhập) ---
router.get('/', hotelController.search);
router.get('/meta/amenities-categories', hotelController.getMeta);
router.get('/meta/locations', hotelController.getLocations);
router.get('/favorites/my', requireAuth, hotelController.getMyFavorites);
router.get('/:id', hotelController.getDetail);

// --- Các route yêu cầu đăng nhập & phân quyền ---
router.post('/:id/favorite', requireAuth, hotelController.toggleFavorite);
router.post('/:id/reviews', requireAuth, hotelController.createReview);
router.post(
  '/',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  validateRequest(createHotelSchema),
  hotelController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRole([Role.HOTEL_OWNER, Role.ADMIN]),
  validateRequest(updateHotelSchema),
  hotelController.update
);

// Quản lý loại phòng
router.post(
  '/:id/room-types',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  validateRequest(createRoomTypeSchema),
  hotelController.createRoomType
);

router.put(
  '/room-types/:id',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  validateRequest(updateRoomTypeSchema),
  hotelController.updateRoomType
);

router.delete(
  '/room-types/:id',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  hotelController.deleteRoomType
);

// Quản lý phòng vật lý
router.post(
  '/rooms',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  validateRequest(createRoomSchema),
  hotelController.createRoom
);

router.delete(
  '/rooms/:id',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  hotelController.deleteRoom
);

// Quản lý lịch giá phòng động
router.get(
  '/room-types/:id/price-calendar',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  hotelController.getPriceCalendar
);

router.post(
  '/room-types/:id/price-calendar',
  requireAuth,
  requireRole([Role.HOTEL_OWNER]),
  validateRequest(updatePriceCalendarSchema),
  hotelController.updatePriceCalendar
);

// --- Route Admin duyệt khách sạn ---
router.put(
  '/:id/approve',
  requireAuth,
  requireRole([Role.ADMIN]),
  hotelController.approve
);

export default router;
