"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = __importDefault(require("../controllers/coupon.controller"));
const auth_middleware_1 = require("../../infrastructure/middlewares/auth.middleware");
const validation_middleware_1 = require("../../infrastructure/middlewares/validation.middleware");
const booking_dto_1 = require("../dtos/booking.dto");
const router = (0, express_1.Router)();
router.get('/', coupon_controller_1.default.list);
router.get('/validate', (0, validation_middleware_1.validateRequest)(booking_dto_1.validateCouponSchema), coupon_controller_1.default.validate);
router.post('/', auth_middleware_1.requireAuth, (0, validation_middleware_1.validateRequest)(booking_dto_1.createCouponSchema), coupon_controller_1.default.create);
router.delete('/:id', auth_middleware_1.requireAuth, coupon_controller_1.default.delete);
exports.default = router;
