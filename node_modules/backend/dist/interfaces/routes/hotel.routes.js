"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hotel_controller_1 = __importDefault(require("../controllers/hotel.controller"));
const validation_middleware_1 = require("../../infrastructure/middlewares/validation.middleware");
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const hotel_dto_1 = require("../dtos/hotel.dto");
const router = (0, express_1.Router)();
// --- Các route public (Không cần đăng nhập) ---
router.get('/', hotel_controller_1.default.search);
router.get('/meta/amenities-categories', hotel_controller_1.default.getMeta);
router.get('/meta/locations', hotel_controller_1.default.getLocations);
router.get('/favorites/my', auth_middleware_1.requireAuth, hotel_controller_1.default.getMyFavorites);
router.get('/:id', hotel_controller_1.default.getDetail);
// --- Các route yêu cầu đăng nhập & phân quyền ---
router.post('/:id/favorite', auth_middleware_1.requireAuth, hotel_controller_1.default.toggleFavorite);
router.post('/:id/reviews', auth_middleware_1.requireAuth, hotel_controller_1.default.createReview);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.createHotelSchema), hotel_controller_1.default.create);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER, client_1.Role.ADMIN]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.updateHotelSchema), hotel_controller_1.default.update);
// Quản lý loại phòng
router.post('/:id/room-types', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.createRoomTypeSchema), hotel_controller_1.default.createRoomType);
router.put('/room-types/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.updateRoomTypeSchema), hotel_controller_1.default.updateRoomType);
router.delete('/room-types/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), hotel_controller_1.default.deleteRoomType);
// Quản lý phòng vật lý
router.post('/rooms', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.createRoomSchema), hotel_controller_1.default.createRoom);
router.delete('/rooms/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), hotel_controller_1.default.deleteRoom);
// Quản lý lịch giá phòng động
router.get('/room-types/:id/price-calendar', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), hotel_controller_1.default.getPriceCalendar);
router.post('/room-types/:id/price-calendar', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), (0, validation_middleware_1.validateRequest)(hotel_dto_1.updatePriceCalendarSchema), hotel_controller_1.default.updatePriceCalendar);
// --- Route Admin duyệt khách sạn ---
router.put('/:id/approve', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), hotel_controller_1.default.approve);
exports.default = router;
