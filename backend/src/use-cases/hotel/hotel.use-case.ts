import prisma from '../../config/database';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import { HotelStatus, Role } from '@prisma/client';

export class HotelUseCase {
  public async createHotel(ownerId: string, data: any) {
    const {
      name,
      description,
      address,
      categoryId,
      provinceId,
      districtId,
      wardId,
      latitude,
      longitude,
      starRating,
      amenityIds,
      images,
      checkInTime,
      checkOutTime,
    } = data;

    // Kiểm tra Category, Province, District, Ward có tồn tại không
    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) throw new AppError('Danh mục khách sạn không tồn tại', 400);

    const provinceExists = await prisma.province.findUnique({ where: { id: provinceId } });
    if (!provinceExists) throw new AppError('Tỉnh/Thành phố không hợp lệ', 400);

    const districtExists = await prisma.district.findUnique({ where: { id: districtId } });
    if (!districtExists) throw new AppError('Quận/Huyện không hợp lệ', 400);

    const wardExists = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!wardExists) throw new AppError('Phường/Xã không hợp lệ', 400);

    // Tạo khách sạn mới ở trạng thái PENDING
    const hotel = await prisma.hotel.create({
      data: {
        ownerId,
        categoryId,
        name,
        description,
        address,
        provinceId,
        districtId,
        wardId,
        latitude,
        longitude,
        starRating,
        checkInTime,
        checkOutTime,
        status: HotelStatus.PENDING,
        images: {
          create: images.map((img: any) => ({
            url: img.url,
            isPrimary: img.isPrimary,
          })),
        },
        amenities: {
          create: amenityIds.map((id: string) => ({
            amenityId: id,
          })),
        },
      },
      include: {
        images: true,
        amenities: {
          include: { amenity: true },
        },
      },
    });

    return hotel;
  }

  public async updateHotel(hotelId: string, userId: string, userRole: Role, data: any) {
    const {
      name,
      description,
      address,
      categoryId,
      provinceId,
      districtId,
      wardId,
      latitude,
      longitude,
      starRating,
      amenityIds,
      checkInTime,
      checkOutTime,
    } = data;

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

    // Kiểm tra quyền sở hữu (chỉ Owner của khách sạn hoặc Admin mới được sửa)
    if (userRole !== Role.ADMIN && hotel.ownerId !== userId) {
      throw new AppError('Bạn không có quyền sửa khách sạn này', 403);
    }

    // Cập nhật quan hệ tiện ích nếu được truyền lên
    if (amenityIds) {
      // Xóa các tiện ích cũ
      await prisma.hotelAmenity.deleteMany({ where: { hotelId } });
      // Thêm tiện ích mới
      await prisma.hotelAmenity.createMany({
        data: amenityIds.map((id: string) => ({
          hotelId,
          amenityId: id,
        })),
      });
    }

    // Cập nhật danh sách hình ảnh nếu được truyền lên
    if (data.images) {
      await prisma.hotelImage.deleteMany({ where: { hotelId } });
      await prisma.hotelImage.createMany({
        data: data.images.map((img: any) => ({
          hotelId,
          url: img.url,
          isPrimary: img.isPrimary || false,
        })),
      });
    }

    // Cập nhật thông tin khách sạn
    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        name,
        description,
        address,
        categoryId,
        provinceId,
        districtId,
        wardId,
        latitude,
        longitude,
        starRating,
        checkInTime,
        checkOutTime,
        status: userRole === Role.ADMIN ? undefined : HotelStatus.PENDING, // Reset về PENDING để duyệt lại nếu owner sửa đổi thông tin
      },
      include: {
        images: true,
        amenities: {
          include: { amenity: true },
        },
      },
    });

    return updatedHotel;
  }

  public async getHotelDetail(id: string, checkIn?: string, checkOut?: string) {
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        category: true,
        province: true,
        district: true,
        ward: true,
        images: true,
        amenities: {
          include: { amenity: true },
        },
        roomTypes: {
          include: {
            images: true,
            rooms: true,
          },
        },
        reviews: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

    // Tính toán điểm đánh giá trung bình
    let averageRating = 0;
    if (hotel.reviews.length > 0) {
      const sum = hotel.reviews.reduce((acc, rev) => acc + rev.ratingOverall, 0);
      averageRating = parseFloat((sum / hotel.reviews.length).toFixed(1));
    }

    // Nếu người dùng có chọn ngày, ta tính toán giá động và số phòng trống của từng loại phòng
    const roomTypesWithAvailability = await Promise.all(
      hotel.roomTypes.map(async (rt) => {
        let price = parseFloat(rt.basePrice.toString());
        let availableCount = rt.rooms.length;
        let isBlocked = false;

        if (checkIn && checkOut) {
          const start = new Date(checkIn);
          const end = new Date(checkOut);

          // 1. Kiểm tra chặn phòng và giá động trong khoảng thời gian lưu trú
          const calendarOverrides = await prisma.roomPriceCalendar.findMany({
            where: {
              roomTypeId: rt.id,
              date: {
                gte: start,
                lt: end,
              },
            },
          });

          // Nếu có bất cứ ngày nào bị chặn, xem như phòng không khả dụng
          if (calendarOverrides.some((c) => c.isBlocked)) {
            isBlocked = true;
            availableCount = 0;
          }

          // Tính tổng giá các ngày
          let totalPrice = 0;
          let days = 0;
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const override = calendarOverrides.find(
              (c) => c.date.toISOString().split('T')[0] === dateStr
            );
            
            totalPrice += override ? parseFloat(override.price.toString()) : parseFloat(rt.basePrice.toString());
            days++;
          }
          price = days > 0 ? totalPrice / days : price; // Giá trung bình mỗi đêm

          // 2. Tính số lượng phòng đã bị đặt trong khoảng thời gian này
          const overlappingBookings = await prisma.booking.findMany({
            where: {
              status: {
                in: ['PENDING', 'PAYMENT_PROCESSING', 'CONFIRMED', 'CHECKED_IN'],
              },
              checkInDate: { lt: end },
              checkOutDate: { gt: start },
              bookingItems: {
                some: { roomTypeId: rt.id },
              },
            },
            include: {
              bookingItems: true,
            },
          });

          const bookedQuantity = overlappingBookings.reduce((sum, b) => {
            const item = b.bookingItems.find((i) => i.roomTypeId === rt.id);
            return sum + (item ? item.quantity : 0);
          }, 0);

          availableCount = Math.max(0, rt.rooms.length - bookedQuantity);
        }

        return {
          id: rt.id,
          name: rt.name,
          description: rt.description,
          basePrice: parseFloat(rt.basePrice.toString()),
          calculatedPrice: isBlocked ? 0 : price,
          capacity: rt.capacity,
          bedCount: rt.bedCount,
          size: rt.size,
          amenities: rt.amenities,
          images: rt.images,
          availableRooms: availableCount,
          isBlocked,
        };
      })
    );

    return {
      ...hotel,
      averageRating,
      roomTypes: roomTypesWithAvailability,
    };
  }

  public async searchHotels(filters: any, userId?: string) {
    // Tự động giải phóng các phòng từ những đơn hàng hết hạn thanh toán (quá 10 phút)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.booking.updateMany({
      where: {
        status: { in: ['PENDING', 'PAYMENT_PROCESSING'] },
        createdAt: { lt: tenMinutesAgo }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    const {
      provinceId,
      districtId,
      wardId,
      categoryId,
      starRating,
      priceMin,
      priceMax,
      amenityIds,
      searchQuery,
      status,
      ownerId,
      limit = 10,
      page = 1,
    } = filters;

    // Phân trang an toàn
    const parsedLimit = isNaN(parseInt(limit)) ? 10 : parseInt(limit);
    const parsedPage = isNaN(parseInt(page)) ? 1 : parseInt(page);
    const skip = (parsedPage - 1) * parsedLimit;

    // Xây dựng các điều kiện WHERE cho Prisma
    const where: any = {};

    if (status) {
      if (status !== 'ALL') {
        where.status = status;
      }
    } else if (ownerId) {
      where.ownerId = ownerId;
    } else {
      where.status = HotelStatus.APPROVED;
    }

    if (provinceId) where.provinceId = provinceId;
    if (districtId) where.districtId = districtId;
    if (wardId) where.wardId = wardId;
    if (categoryId) where.categoryId = categoryId;
    
    if (starRating && !isNaN(parseInt(starRating))) {
      where.starRating = parseInt(starRating);
    }

    // Tìm kiếm theo từ khóa tên hoặc mô tả
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { address: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Hỗ trợ amenityIds gửi lên dạng string đơn lẻ hoặc array
    let parsedAmenityIds: string[] = [];
    if (amenityIds) {
      if (Array.isArray(amenityIds)) {
        parsedAmenityIds = amenityIds;
      } else if (typeof amenityIds === 'string') {
        parsedAmenityIds = [amenityIds];
      }
    }

    // Lọc theo tên tiện ích để tránh lỗi ép kiểu UUID trong Postgres
    if (parsedAmenityIds.length > 0) {
      where.amenities = {
        some: {
          amenity: {
            name: {
              in: parsedAmenityIds,
            },
          },
        },
      };
    }

    // Lọc theo khoảng giá an toàn
    if (priceMin || priceMax) {
      const gteVal = priceMin && !isNaN(parseFloat(priceMin)) ? parseFloat(priceMin) : undefined;
      const lteVal = priceMax && !isNaN(parseFloat(priceMax)) ? parseFloat(priceMax) : undefined;
      if (gteVal !== undefined || lteVal !== undefined) {
        where.roomTypes = {
          some: {
            basePrice: {
              gte: gteVal,
              lte: lteVal,
            },
          },
        };
      }
    }

    // Query đếm tổng số bản ghi phục vụ phân trang
    const total = await prisma.hotel.count({ where });

    // Query lấy dữ liệu chính
    const hotels = await prisma.hotel.findMany({
      where,
      include: {
        images: true,
        category: true,
        province: true,
        district: true,
        ward: true,
        owner: {
          select: {
            fullName: true,
            email: true,
          },
        },
        roomTypes: {
          select: { basePrice: true },
          orderBy: { basePrice: 'asc' },
          take: 1, // Lấy giá phòng thấp nhất
        },
        reviews: {
          select: { ratingOverall: true },
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      skip,
      take: parsedLimit,
      orderBy: { createdAt: 'desc' },
    });

    // Lấy danh sách favorite của user nếu có
    const userFavorites = userId ? await prisma.favorite.findMany({
      where: { userId },
      select: { hotelId: true }
    }) : [];
    const favoriteSet = new Set(userFavorites.map(f => f.hotelId));

    // Format kết quả trả về
    const formattedHotels = hotels.map((hotel) => {
      let averageRating = 0;
      if (hotel.reviews.length > 0) {
        const sum = hotel.reviews.reduce((acc, rev) => acc + rev.ratingOverall, 0);
        averageRating = parseFloat((sum / hotel.reviews.length).toFixed(1));
      }

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        province: hotel.province.name,
        district: hotel.district.name,
        ward: hotel.ward.name,
        starRating: hotel.starRating,
        status: hotel.status,
        rejectReason: hotel.rejectReason,
        owner: hotel.owner,
        images: hotel.images,
        category: hotel.category.name,
        priceFrom: hotel.roomTypes[0] ? parseFloat(hotel.roomTypes[0].basePrice.toString()) : 0,
        averageRating,
        reviewCount: hotel.reviews.length,
        isFavorite: favoriteSet.has(hotel.id),
        amenities: hotel.amenities.map(ha => ({
          id: ha.amenity.id,
          name: ha.amenity.name
        }))
      };
    });

    return {
      hotels: formattedHotels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Quản trị phê duyệt khách sạn (Admin)
  public async approveHotel(id: string, status: HotelStatus, rejectReason?: string) {
    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

    const updatedHotel = await prisma.hotel.update({
      where: { id },
      data: {
        status,
        rejectReason: status === HotelStatus.REJECTED ? rejectReason : null,
      },
    });

    return updatedHotel;
  }

  // Quản lý Wishlist (Favorites) của khách hàng
  public async toggleFavorite(userId: string, hotelId: string) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_hotelId: { userId, hotelId }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          userId_hotelId: { userId, hotelId }
        }
      });
      return { isFavorite: false };
    } else {
      await prisma.favorite.create({
        data: { userId, hotelId }
      });
      return { isFavorite: true };
    }
  }

  public async getMyFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        hotel: {
          include: {
            images: true,
            category: true,
            province: true,
            district: true,
            ward: true,
            roomTypes: {
              select: { basePrice: true },
              orderBy: { basePrice: 'asc' },
              take: 1
            },
            reviews: {
              select: { ratingOverall: true }
            }
          }
        }
      }
    });

    return favorites.map((f) => {
      const hotel = f.hotel;
      let averageRating = 0;
      if (hotel.reviews.length > 0) {
        const sum = hotel.reviews.reduce((acc, rev) => acc + rev.ratingOverall, 0);
        averageRating = parseFloat((sum / hotel.reviews.length).toFixed(1));
      }

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        province: hotel.province.name,
        district: hotel.district.name,
        ward: hotel.ward.name,
        starRating: hotel.starRating,
        images: hotel.images,
        category: hotel.category.name,
        priceFrom: hotel.roomTypes[0] ? parseFloat(hotel.roomTypes[0].basePrice.toString()) : 0,
        averageRating,
        reviewCount: hotel.reviews.length,
        isFavorite: true
      };
    });
  }
}

export default new HotelUseCase();
