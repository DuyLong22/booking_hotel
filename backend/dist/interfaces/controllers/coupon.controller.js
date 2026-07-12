"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponController = void 0;
const coupon_use_case_1 = __importDefault(require("../../use-cases/coupon/coupon.use-case"));
class CouponController {
    async create(req, res, next) {
        try {
            const { userId, role } = req.user;
            const result = await coupon_use_case_1.default.createCoupon(userId, role, req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo mã giảm giá coupon thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async validate(req, res, next) {
        try {
            const { code, hotelId, amount } = req.query;
            const result = await coupon_use_case_1.default.validateCoupon(code, hotelId, amount ? Number(amount) : undefined);
            res.status(200).json({
                success: true,
                message: 'Mã giảm giá hợp lệ',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const { hotelId, all } = req.query;
            const result = await coupon_use_case_1.default.getCoupons(hotelId, all === 'true');
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const { userId, role } = req.user;
            const { id } = req.params;
            const result = await coupon_use_case_1.default.deleteCoupon(userId, role, id);
            res.status(200).json({
                success: true,
                message: 'Xóa mã giảm giá coupon thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CouponController = CouponController;
exports.default = new CouponController();
