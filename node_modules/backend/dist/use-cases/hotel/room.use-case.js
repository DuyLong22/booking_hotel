"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
class RoomUseCase {
    // --- Quản lý Loại Phòng (RoomType) ---
    async createRoomType(hotelId, ownerId, data) {
        // Kiểm tra xem khách sạn có thuộc về owner này không
        const hotel = await database_1.default.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel)
            throw new error_middleware_1.AppError('Không tìm thấy khách sạn', 404);
        if (hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn này', 403);
        const { name, description, basePrice, capacity, bedCount, size, amenities, images } = data;
        const roomType = await database_1.default.roomType.create({
            data: {
                hotelId,
                name,
                description,
                basePrice,
                capacity,
                bedCount,
                size,
                amenities,
                images: {
                    create: images.map((img) => ({
                        url: img.url,
                        isPrimary: img.isPrimary,
                    })),
                },
            },
            include: {
                images: true,
            },
        });
        return roomType;
    }
    async updateRoomType(roomTypeId, ownerId, data) {
        const roomType = await database_1.default.roomType.findUnique({
            where: { id: roomTypeId },
            include: { hotel: true },
        });
        if (!roomType)
            throw new error_middleware_1.AppError('Không tìm thấy loại phòng', 404);
        if (roomType.hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);
        const { name, description, basePrice, capacity, bedCount, size, amenities } = data;
        const updated = await database_1.default.roomType.update({
            where: { id: roomTypeId },
            data: {
                name,
                description,
                basePrice,
                capacity,
                bedCount,
                size,
                amenities,
            },
            include: {
                images: true,
            },
        });
        return updated;
    }
    async deleteRoomType(roomTypeId, ownerId) {
        const roomType = await database_1.default.roomType.findUnique({
            where: { id: roomTypeId },
            include: { hotel: true },
        });
        if (!roomType)
            throw new error_middleware_1.AppError('Không tìm thấy loại phòng', 404);
        if (roomType.hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);
        await database_1.default.roomType.delete({ where: { id: roomTypeId } });
        return { success: true };
    }
    // --- Quản lý Phòng Vật Lý (Room) ---
    async createRoom(roomTypeId, roomNumber, ownerId) {
        // Kiểm tra loại phòng và khách sạn
        const roomType = await database_1.default.roomType.findUnique({
            where: { id: roomTypeId },
            include: { hotel: true },
        });
        if (!roomType)
            throw new error_middleware_1.AppError('Không tìm thấy loại phòng', 404);
        if (roomType.hotel.ownerId !== ownerId)
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);
        // Kiểm tra số phòng trùng lặp trong cùng một loại phòng hoặc khách sạn
        const existingRoom = await database_1.default.room.findFirst({
            where: {
                roomTypeId,
                roomNumber,
            },
        });
        if (existingRoom) {
            throw new error_middleware_1.AppError('Số phòng này đã tồn tại trong loại phòng này', 400);
        }
        const room = await database_1.default.room.create({
            data: {
                roomTypeId,
                roomNumber,
                isAvailable: true,
            },
        });
        return room;
    }
    async deleteRoom(roomId, ownerId) {
        const room = await database_1.default.room.findUnique({
            where: { id: roomId },
            include: {
                roomType: {
                    include: { hotel: true },
                },
            },
        });
        if (!room)
            throw new error_middleware_1.AppError('Không tìm thấy phòng vật lý', 404);
        if (room.roomType.hotel.ownerId !== ownerId) {
            throw new error_middleware_1.AppError('Bạn không sở hữu khách sạn chứa phòng này', 403);
        }
        await database_1.default.room.delete({ where: { id: roomId } });
        return { success: true };
    }
}
exports.RoomUseCase = RoomUseCase;
exports.default = new RoomUseCase();
