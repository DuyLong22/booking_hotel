"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePriceCalendarSchema = exports.createRoomSchema = exports.updateRoomTypeSchema = exports.createRoomTypeSchema = exports.updateHotelSchema = exports.createHotelSchema = void 0;
const zod_1 = require("zod");
exports.createHotelSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Tên khách sạn phải từ 2 ký tự trở lên'),
        description: zod_1.z.string().min(10, 'Mô tả phải từ 10 ký tự trở lên'),
        address: zod_1.z.string().min(2, 'Địa chỉ chi tiết không được để trống'),
        categoryId: zod_1.z.string().uuid('Danh mục không hợp lệ'),
        provinceId: zod_1.z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
        districtId: zod_1.z.string().min(1, 'Quận/Huyện không được để trống'),
        wardId: zod_1.z.string().min(1, 'Phường/Xã không được để trống'),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        starRating: zod_1.z.number().int().min(1).max(5).default(3),
        amenityIds: zod_1.z.array(zod_1.z.string().uuid('ID tiện ích không hợp lệ')).default([]),
        images: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string().url('Đường dẫn ảnh không hợp lệ'),
            isPrimary: zod_1.z.boolean().default(false)
        })).default([]),
        checkInTime: zod_1.z.string().optional(),
        checkOutTime: zod_1.z.string().optional()
    })
});
exports.updateHotelSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(10).optional(),
        address: zod_1.z.string().min(2).optional(),
        categoryId: zod_1.z.string().uuid().optional(),
        provinceId: zod_1.z.string().optional(),
        districtId: zod_1.z.string().optional(),
        wardId: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        starRating: zod_1.z.number().int().min(1).max(5).optional(),
        amenityIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
        checkInTime: zod_1.z.string().optional(),
        checkOutTime: zod_1.z.string().optional()
    })
});
exports.createRoomTypeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Tên loại phòng không được để trống'),
        description: zod_1.z.string().min(5, 'Mô tả ngắn về phòng không được để trống'),
        basePrice: zod_1.z.number().positive('Giá gốc phải lớn hơn 0'),
        capacity: zod_1.z.number().int().positive('Sức chứa tối đa phải lớn hơn 0'),
        bedCount: zod_1.z.number().int().positive('Số giường phải lớn hơn 0').default(1),
        size: zod_1.z.number().positive('Diện tích phòng phải lớn hơn 0').optional(),
        amenities: zod_1.z.array(zod_1.z.string()).default([]),
        images: zod_1.z.array(zod_1.z.object({
            url: zod_1.z.string().url('Đường dẫn ảnh không hợp lệ'),
            isPrimary: zod_1.z.boolean().default(false)
        })).default([])
    })
});
exports.updateRoomTypeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().min(5).optional(),
        basePrice: zod_1.z.number().positive().optional(),
        capacity: zod_1.z.number().int().positive().optional(),
        bedCount: zod_1.z.number().int().positive().optional(),
        size: zod_1.z.number().positive().optional(),
        amenities: zod_1.z.array(zod_1.z.string()).optional(),
    })
});
exports.createRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        roomNumber: zod_1.z.string().min(1, 'Số phòng không được để trống'),
        roomTypeId: zod_1.z.string().uuid('Loại phòng không hợp lệ')
    })
});
exports.updatePriceCalendarSchema = zod_1.z.object({
    body: zod_1.z.object({
        prices: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
                message: 'Định dạng ngày không hợp lệ (sử dụng YYYY-MM-DD)',
            }),
            price: zod_1.z.number().positive('Giá phòng phải lớn hơn 0'),
            isBlocked: zod_1.z.boolean().default(false),
        })),
    }),
});
