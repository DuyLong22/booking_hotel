"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = __importDefault(require("../controllers/booking.controller"));
const stats_controller_1 = __importDefault(require("../controllers/stats.controller"));
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const validation_middleware_1 = require("../../infrastructure/middlewares/validation.middleware");
const booking_dto_1 = require("../dtos/booking.dto");
const router = (0, express_1.Router)();
// Route tạo đặt phòng cho phép cả khách vãng lai và thành viên đăng nhập
router.post('/', (0, validation_middleware_1.validateRequest)(booking_dto_1.createBookingSchema), booking_controller_1.default.create);
// Route thống kê cho quản trị viên và đối tác chủ phòng
router.get('/admin-stats', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), stats_controller_1.default.getAdminStats);
router.get('/owner-stats', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.HOTEL_OWNER]), stats_controller_1.default.getOwnerStats);
// Các route xem lịch sử và quản lý đơn vẫn yêu cầu xác thực người dùng
router.get('/my', auth_middleware_1.requireAuth, booking_controller_1.default.getMyBookings);
router.get('/:id', booking_controller_1.default.getDetail);
router.put('/:id/status', auth_middleware_1.requireAuth, booking_controller_1.default.updateStatus);
exports.default = router;
