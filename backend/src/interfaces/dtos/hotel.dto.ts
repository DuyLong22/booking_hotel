import { z } from 'zod';

export const createHotelSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Tên khách sạn phải từ 2 ký tự trở lên'),
    description: z.string().min(10, 'Mô tả phải từ 10 ký tự trở lên'),
    address: z.string().min(2, 'Địa chỉ chi tiết không được để trống'),
    categoryId: z.string().uuid('Danh mục không hợp lệ'),
    provinceId: z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
    districtId: z.string().min(1, 'Quận/Huyện không được để trống'),
    wardId: z.string().min(1, 'Phường/Xã không được để trống'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    starRating: z.number().int().min(1).max(5).default(3),
    amenityIds: z.array(z.string().uuid('ID tiện ích không hợp lệ')).default([]),
    images: z.array(z.object({
      url: z.string().url('Đường dẫn ảnh không hợp lệ'),
      isPrimary: z.boolean().default(false)
    })).default([]),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional()
  })
});

export const updateHotelSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    address: z.string().min(2).optional(),
    categoryId: z.string().uuid().optional(),
    provinceId: z.string().optional(),
    districtId: z.string().optional(),
    wardId: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    starRating: z.number().int().min(1).max(5).optional(),
    amenityIds: z.array(z.string().uuid()).optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional()
  })
});

export const createRoomTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Tên loại phòng không được để trống'),
    description: z.string().min(5, 'Mô tả ngắn về phòng không được để trống'),
    basePrice: z.number().positive('Giá gốc phải lớn hơn 0'),
    capacity: z.number().int().positive('Sức chứa tối đa phải lớn hơn 0'),
    bedCount: z.number().int().positive('Số giường phải lớn hơn 0').default(1),
    size: z.number().positive('Diện tích phòng phải lớn hơn 0').optional(),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.object({
      url: z.string().url('Đường dẫn ảnh không hợp lệ'),
      isPrimary: z.boolean().default(false)
    })).default([])
  })
});

export const updateRoomTypeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    basePrice: z.number().positive().optional(),
    capacity: z.number().int().positive().optional(),
    bedCount: z.number().int().positive().optional(),
    size: z.number().positive().optional(),
    amenities: z.array(z.string()).optional(),
  })
});

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Số phòng không được để trống'),
    roomTypeId: z.string().uuid('Loại phòng không hợp lệ')
  })
});

export const updatePriceCalendarSchema = z.object({
  body: z.object({
    prices: z.array(
      z.object({
        date: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: 'Định dạng ngày không hợp lệ (sử dụng YYYY-MM-DD)',
        }),
        price: z.number().positive('Giá phòng phải lớn hơn 0'),
        isBlocked: z.boolean().default(false),
      })
    ),
  }),
});
