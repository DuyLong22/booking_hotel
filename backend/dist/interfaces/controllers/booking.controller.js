"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_use_case_1 = __importDefault(require("../../use-cases/booking/booking.use-case"));
class BookingController {
    async create(req, res, next) {
        try {
            const userId = req.user?.userId || null;
            const result = await booking_use_case_1.default.createBooking(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo đơn đặt phòng thành công. Vui lòng tiến hành thanh toán.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDetail(req, res, next) {
        try {
            const bookingId = req.params.id;
            const userId = req.user?.userId || null;
            const role = req.user?.role || null;
            const result = await booking_use_case_1.default.getBookingDetail(bookingId, userId, role);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyBookings(req, res, next) {
        try {
            const userId = req.user.userId;
            const role = req.user.role;
            const result = await booking_use_case_1.default.getMyBookings(userId, role);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const bookingId = req.params.id;
            const { status } = req.body;
            const { userId, role } = req.user;
            const result = await booking_use_case_1.default.updateBookingStatus(bookingId, status, userId, role);
            res.status(200).json({
                success: true,
                message: `Đơn đặt phòng đã được chuyển sang trạng thái: ${status}`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BookingController = BookingController;
exports.default = new BookingController();
