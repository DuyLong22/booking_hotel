"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelController = void 0;
const hotel_use_case_1 = __importDefault(require("../../use-cases/hotel/hotel.use-case"));
const room_use_case_1 = __importDefault(require("../../use-cases/hotel/room.use-case"));
const price_calendar_use_case_1 = __importDefault(require("../../use-cases/hotel/price-calendar.use-case"));
const jwt_1 = require("../../infrastructure/security/jwt");
const database_1 = __importDefault(require("../../config/database"));
class HotelController {
    // --- Khách Sạn (Hotels) ---
    async create(req, res, next) {
        try {
            const ownerId = req.user.userId;
            const result = await hotel_use_case_1.default.createHotel(ownerId, req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo khách sạn thành công. Vui lòng chờ kiểm duyệt từ Admin.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const hotelId = req.params.id;
            const { userId, role } = req.user;
            const result = await hotel_use_case_1.default.updateHotel(hotelId, userId, role, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin khách sạn thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const { checkIn, checkOut } = req.query;
            const result = await hotel_use_case_1.default.getHotelDetail(id, checkIn, checkOut);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async search(req, res, next) {
        try {
            let userId = undefined;
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    const decoded = (0, jwt_1.verifyAccessToken)(token);
                    userId = decoded.userId;
                }
                catch (e) {
                    // Bỏ qua lỗi token nếu là public search
                }
            }
            const result = await hotel_use_case_1.default.searchHotels(req.query, userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async approve(req, res, next) {
        try {
            const { id } = req.params;
            const { status, rejectReason } = req.body;
            const result = await hotel_use_case_1.default.approveHotel(id, status, rejectReason);
            res.status(200).json({
                success: true,
                message: `Đã thay đổi trạng thái khách sạn thành: ${status}`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Loại Phòng (Room Types) ---
    async createRoomType(req, res, next) {
        try {
            const hotelId = req.params.id;
            const ownerId = req.user.userId;
            const result = await room_use_case_1.default.createRoomType(hotelId, ownerId, req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo loại phòng thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateRoomType(req, res, next) {
        try {
            const roomTypeId = req.params.id;
            const ownerId = req.user.userId;
            const result = await room_use_case_1.default.updateRoomType(roomTypeId, ownerId, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật loại phòng thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteRoomType(req, res, next) {
        try {
            const roomTypeId = req.params.id;
            const ownerId = req.user.userId;
            await room_use_case_1.default.deleteRoomType(roomTypeId, ownerId);
            res.status(200).json({
                success: true,
                message: 'Xóa loại phòng thành công',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Phòng Vật Lý (Rooms) ---
    async createRoom(req, res, next) {
        try {
            const ownerId = req.user.userId;
            const { roomTypeId, roomNumber } = req.body;
            const result = await room_use_case_1.default.createRoom(roomTypeId, roomNumber, ownerId);
            res.status(201).json({
                success: true,
                message: 'Thêm số phòng vật lý thành công',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteRoom(req, res, next) {
        try {
            const roomId = req.params.id;
            const ownerId = req.user.userId;
            await room_use_case_1.default.deleteRoom(roomId, ownerId);
            res.status(200).json({
                success: true,
                message: 'Xóa phòng vật lý thành công',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Lịch Giá Động (Price Calendar) ---
    async getPriceCalendar(req, res, next) {
        try {
            const roomTypeId = req.params.id;
            const ownerId = req.user.userId;
            const { startDate, endDate } = req.query;
            const result = await price_calendar_use_case_1.default.getPriceCalendar(roomTypeId, ownerId, startDate, endDate);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePriceCalendar(req, res, next) {
        try {
            const roomTypeId = req.params.id;
            const ownerId = req.user.userId;
            const { prices } = req.body;
            await price_calendar_use_case_1.default.updatePriceCalendar(roomTypeId, ownerId, prices);
            res.status(200).json({
                success: true,
                message: 'Cập nhật lịch giá phòng thành công',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async toggleFavorite(req, res, next) {
        try {
            const userId = req.user.userId;
            const hotelId = req.params.id;
            const result = await hotel_use_case_1.default.toggleFavorite(userId, hotelId);
            res.status(200).json({
                success: true,
                message: result.isFavorite ? 'Đã thêm khách sạn vào mục yêu thích' : 'Đã xóa khách sạn khỏi mục yêu thích',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyFavorites(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await hotel_use_case_1.default.getMyFavorites(userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createReview(req, res, next) {
        try {
            const userId = req.user.userId;
            const hotelId = req.params.id;
            const { ratingCleanliness, ratingLocation, ratingService, ratingFacilities, ratingValue, comment } = req.body;
            if (!comment || typeof comment !== 'string') {
                res.status(400).json({ success: false, message: 'Nhận xét không được để trống.' });
                return;
            }
            const rc = Number(ratingCleanliness) || 5;
            const rl = Number(ratingLocation) || 5;
            const rs = Number(ratingService) || 5;
            const rf = Number(ratingFacilities) || 5;
            const rv = Number(ratingValue) || 5;
            const ratingOverall = parseFloat(((rc + rl + rs + rf + rv) / 5).toFixed(1));
            const review = await database_1.default.review.create({
                data: {
                    userId,
                    hotelId,
                    ratingCleanliness: rc,
                    ratingLocation: rl,
                    ratingService: rs,
                    ratingFacilities: rf,
                    ratingValue: rv,
                    ratingOverall,
                    comment,
                },
                include: {
                    user: {
                        select: {
                            fullName: true,
                            avatarUrl: true,
                        },
                    },
                },
            });
            res.status(201).json({
                success: true,
                message: 'Gửi đánh giá thành công',
                data: review,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMeta(req, res, next) {
        try {
            const amenities = await database_1.default.amenity.findMany({ orderBy: { name: 'asc' } });
            const categories = await database_1.default.category.findMany({ orderBy: { name: 'asc' } });
            res.status(200).json({
                success: true,
                data: { amenities, categories },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getLocations(req, res, next) {
        try {
            const { provinceId, districtId } = req.query;
            if (districtId) {
                const wards = await database_1.default.ward.findMany({
                    where: { districtId: districtId },
                    orderBy: { name: 'asc' }
                });
                res.status(200).json({ success: true, data: wards });
                return;
            }
            if (provinceId) {
                const districts = await database_1.default.district.findMany({
                    where: { provinceId: provinceId },
                    orderBy: { name: 'asc' }
                });
                res.status(200).json({ success: true, data: districts });
                return;
            }
            const provinces = await database_1.default.province.findMany({ orderBy: { name: 'asc' } });
            res.status(200).json({ success: true, data: provinces });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HotelController = HotelController;
exports.default = new HotelController();
