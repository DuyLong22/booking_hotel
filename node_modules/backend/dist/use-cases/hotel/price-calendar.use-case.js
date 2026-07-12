"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCalendarUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
class PriceCalendarUseCase {
    async getPriceCalendar(roomTypeId, ownerId, startDate, endDate) {
        // Kiểm tra quyền chủ sở hữu
        const roomType = await database_1.default.roomType.findUnique({
            where: { id: roomTypeId },
            include: { hotel: true },
        });
        if (!roomType)
            throw new error_middleware_1.AppError('Không tìm thấy loại phòng', 404);
        if (roomType.hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn này', 403);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const calendar = await database_1.default.roomPriceCalendar.findMany({
            where: {
                roomTypeId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { date: 'asc' },
        });
        return calendar;
    }
    async updatePriceCalendar(roomTypeId, ownerId, prices) {
        // Kiểm tra quyền chủ sở hữu
        const roomType = await database_1.default.roomType.findUnique({
            where: { id: roomTypeId },
            include: { hotel: true },
        });
        if (!roomType)
            throw new error_middleware_1.AppError('Không tìm thấy loại phòng', 404);
        if (roomType.hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn này', 403);
        // Tiến hành upsert từng bản ghi lịch giá
        const transactions = prices.map((item) => {
            // Thiết lập ngày về 0h0m0s0ms theo giờ UTC/Local chuẩn để tránh lệch múi giờ
            const dateObj = new Date(item.date);
            dateObj.setHours(0, 0, 0, 0);
            return database_1.default.roomPriceCalendar.upsert({
                where: {
                    roomTypeId_date: {
                        roomTypeId,
                        date: dateObj,
                    },
                },
                update: {
                    price: item.price,
                    isBlocked: item.isBlocked !== undefined ? item.isBlocked : false,
                },
                create: {
                    roomTypeId,
                    date: dateObj,
                    price: item.price,
                    isBlocked: item.isBlocked !== undefined ? item.isBlocked : false,
                },
            });
        });
        // Thực hiện tất cả dưới dạng transaction
        await database_1.default.$transaction(transactions);
        return { success: true };
    }
}
exports.PriceCalendarUseCase = PriceCalendarUseCase;
exports.default = new PriceCalendarUseCase();
