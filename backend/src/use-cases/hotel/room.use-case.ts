import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';

export class RoomUseCase {
  // --- Quản lý Loại Phòng (RoomType) ---
  
  public async createRoomType(hotelId: string, ownerId: string, data: any) {
    // Kiểm tra xem khách sạn có thuộc về owner này không
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);
    if (hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn này', 403);

    const { name, description, basePrice, capacity, bedCount, size, amenities, images } = data;

    const roomType = await prisma.roomType.create({
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
          create: images.map((img: any) => ({
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

  public async updateRoomType(roomTypeId: string, ownerId: string, data: any) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) throw new AppError('Không tìm thấy loại phòng', 404);
    if (roomType.hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);

    const { name, description, basePrice, capacity, bedCount, size, amenities, images } = data;

    if (images && Array.isArray(images)) {
      await prisma.roomImage.deleteMany({ where: { roomTypeId } });
      await prisma.roomImage.createMany({
        data: images.map((img: any) => ({
          roomTypeId,
          url: img.url,
          isPrimary: img.isPrimary ?? false,
        })),
      });
    }

    const updated = await prisma.roomType.update({
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

  public async deleteRoomType(roomTypeId: string, ownerId: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) throw new AppError('Không tìm thấy loại phòng', 404);
    if (roomType.hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);

    await prisma.roomType.delete({ where: { id: roomTypeId } });
    return { success: true };
  }

  // --- Quản lý Phòng Vật Lý (Room) ---

  public async createRoom(roomTypeId: string, roomNumber: string, ownerId: string) {
    // Kiểm tra loại phòng và khách sạn
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType) throw new AppError('Không tìm thấy loại phòng', 404);
    if (roomType.hotel.ownerId !== ownerId) throw new AppError('Bạn không sở hữu khách sạn chứa loại phòng này', 403);

    // Kiểm tra số phòng trùng lặp trong cùng một loại phòng hoặc khách sạn
    const existingRoom = await prisma.room.findFirst({
      where: {
        roomTypeId,
        roomNumber,
      },
    });
    if (existingRoom) {
      throw new AppError('Số phòng này đã tồn tại trong loại phòng này', 400);
    }

    const room = await prisma.room.create({
      data: {
        roomTypeId,
        roomNumber,
        isAvailable: true,
      },
    });

    return room;
  }

  public async deleteRoom(roomId: string, ownerId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: {
          include: { hotel: true },
        },
      },
    });

    if (!room) throw new AppError('Không tìm thấy phòng vật lý', 404);
    if (room.roomType.hotel.ownerId !== ownerId) {
      throw new AppError('Bạn không sở hữu khách sạn chứa phòng này', 403);
    }

    await prisma.room.delete({ where: { id: roomId } });
    return { success: true };
  }
}

export default new RoomUseCase();
