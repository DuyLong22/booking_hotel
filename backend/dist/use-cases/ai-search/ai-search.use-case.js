"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSearchUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const ai_search_service_1 = __importDefault(require("../../infrastructure/services/ai-search.service"));
const client_1 = require("@prisma/client");
class AiSearchUseCase {
    async search(queryText) {
        const startTime = Date.now();
        // 1. Gọi AI Service để bóc tách câu lệnh
        const parsed = await ai_search_service_1.default.parseQuery(queryText);
        // 2. Xây dựng câu query Prisma động
        const where = {
            status: client_1.HotelStatus.APPROVED,
        };
        // A. Xử lý địa điểm (city) thông minh
        if (parsed.city) {
            // Tìm xem có khớp với Tỉnh/Thành phố không
            const province = await database_1.default.province.findFirst({
                where: { name: { contains: parsed.city, mode: 'insensitive' } },
            });
            if (province) {
                where.provinceId = province.id;
            }
            else {
                // Nếu không khớp Tỉnh, tìm Quận/Huyện (ví dụ: "Đà Lạt" là Quận/Huyện thuộc Lâm Đồng)
                const district = await database_1.default.district.findFirst({
                    where: { name: { contains: parsed.city, mode: 'insensitive' } },
                });
                if (district) {
                    where.districtId = district.id;
                }
                else {
                    // Nếu vẫn không khớp, tìm theo địa chỉ tương đối trong khách sạn
                    where.OR = [
                        { address: { contains: parsed.city, mode: 'insensitive' } },
                        { name: { contains: parsed.city, mode: 'insensitive' } }
                    ];
                }
            }
        }
        // B. Xử lý khoảng giá
        if (parsed.priceMin !== null || parsed.priceMax !== null) {
            where.roomTypes = {
                some: {
                    basePrice: {
                        gte: parsed.priceMin !== null ? parsed.priceMin : undefined,
                        lte: parsed.priceMax !== null ? parsed.priceMax : undefined,
                    },
                },
            };
        }
        // C. Xếp hạng sao
        if (parsed.starRating !== null) {
            where.starRating = {
                gte: parsed.starRating,
            };
        }
        // D. Sức chứa tối thiểu (capacity)
        if (parsed.capacity !== null) {
            if (where.roomTypes) {
                // Ghép thêm điều kiện sức chứa vào quan hệ roomTypes đã khai báo
                where.roomTypes.some.capacity = {
                    gte: parsed.capacity,
                };
            }
            else {
                where.roomTypes = {
                    some: {
                        capacity: {
                            gte: parsed.capacity,
                        },
                    },
                };
            }
        }
        // E. Tiện ích (Phải chứa đầy đủ tất cả các tiện ích được yêu cầu)
        if (parsed.amenities && parsed.amenities.length > 0) {
            // Đảm bảo mỗi tiện ích đều có liên kết trong HotelAmenity
            where.AND = parsed.amenities.map((name) => ({
                amenities: {
                    some: {
                        amenity: {
                            name: { contains: name, mode: 'insensitive' },
                        },
                    },
                },
            }));
        }
        // F. Tìm theo địa danh/mốc địa lý (landmark)
        if (parsed.landmark) {
            const landmarkCondition = [
                { name: { contains: parsed.landmark, mode: 'insensitive' } },
                { description: { contains: parsed.landmark, mode: 'insensitive' } },
                { address: { contains: parsed.landmark, mode: 'insensitive' } },
            ];
            if (where.OR) {
                // Tránh ghi đè nếu OR đã có giá trị từ tìm kiếm địa điểm
                where.AND = [
                    { OR: where.OR },
                    { OR: landmarkCondition }
                ];
                delete where.OR;
            }
            else {
                where.OR = landmarkCondition;
            }
        }
        // 3. Thực hiện truy vấn database
        const hotels = await database_1.default.hotel.findMany({
            where,
            include: {
                images: true,
                category: true,
                province: true,
                district: true,
                ward: true,
                roomTypes: {
                    orderBy: { basePrice: 'asc' },
                },
                reviews: {
                    select: { ratingOverall: true },
                },
            },
            take: 15, // Giới hạn 15 kết quả trả về trong chatbox
        });
        // Format kết quả trả về cho client
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
                images: hotel.images,
                category: hotel.category.name,
                priceFrom: hotel.roomTypes[0] ? parseFloat(hotel.roomTypes[0].basePrice.toString()) : 0,
                averageRating,
                reviewCount: hotel.reviews.length,
            };
        });
        const executionMs = Date.now() - startTime;
        // 4. Lưu lại log phân tích phục vụ Dashboard Admin AI Analytics
        try {
            await database_1.default.aiSearchAnalytics.create({
                data: {
                    queryText,
                    parsedQuery: JSON.parse(JSON.stringify(parsed)),
                    isSuccess: formattedHotels.length > 0,
                    executionMs,
                },
            });
        }
        catch (logError) {
            console.error('[AiSearchUseCase Log Error]: Không ghi được log analytics:', logError);
        }
        return {
            aiAnalysis: parsed,
            hotels: formattedHotels,
            executionMs,
        };
    }
}
exports.AiSearchUseCase = AiSearchUseCase;
exports.default = new AiSearchUseCase();
