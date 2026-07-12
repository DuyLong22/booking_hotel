"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const validation_middleware_1 = require("../../infrastructure/middlewares/validation.middleware");
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const auth_dto_1 = require("../dtos/auth.dto");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_middleware_1.validateRequest)(auth_dto_1.registerSchema), auth_controller_1.default.register);
router.post('/verify-email', (0, validation_middleware_1.validateRequest)(auth_dto_1.verifyEmailSchema), auth_controller_1.default.verifyEmail);
router.post('/resend-otp', auth_controller_1.default.resendOTP);
router.post('/login', (0, validation_middleware_1.validateRequest)(auth_dto_1.loginSchema), auth_controller_1.default.login);
router.post('/refresh-token', auth_controller_1.default.refresh);
router.post('/logout', auth_controller_1.default.logout);
router.post('/forgot-password', (0, validation_middleware_1.validateRequest)(auth_dto_1.forgotPasswordSchema), auth_controller_1.default.forgotPassword);
router.post('/reset-password', (0, validation_middleware_1.validateRequest)(auth_dto_1.resetPasswordSchema), auth_controller_1.default.resetPassword);
// Các route yêu cầu đăng nhập
router.get('/me', auth_middleware_1.requireAuth, auth_controller_1.default.getMe);
router.put('/profile', auth_middleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(auth_dto_1.updateProfileSchema), auth_controller_1.default.updateProfile);
// --- Admin routes ---
router.get('/admin/users', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), auth_controller_1.default.getAllUsers);
router.get('/admin/bookings', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), auth_controller_1.default.getAllBookings);
router.get('/admin/payments', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), auth_controller_1.default.getAllPayments);
router.get('/admin/reviews', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)([client_1.Role.ADMIN]), auth_controller_1.default.getAllReviews);
exports.default = router;
