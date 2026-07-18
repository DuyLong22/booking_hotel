import { PrismaClient, Role, HotelStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu Seeding Dữ liệu mẫu ---');

  console.log('--- Cleaning Database ---');
  // Clear order to avoid foreign key violations:
  await prisma.roomPriceCalendar.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.hotelImage.deleteMany();
  await prisma.hotelAmenity.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.hotel.deleteMany();
  
  await prisma.ward.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  // 1. Seed Categories
  const categories = [
    { name: 'Khách sạn', slug: 'khach-san', description: 'Khách sạn tiêu chuẩn tiện nghi đầy đủ' },
    { name: 'Resort / Khu nghỉ dưỡng', slug: 'resort', description: 'Khu nghỉ dưỡng cao cấp view đẹp' },
    { name: 'Homestay', slug: 'homestay', description: 'Trải nghiệm văn hóa địa phương gần gũi' },
    { name: 'Biệt thự / Villa', slug: 'villa', description: 'Biệt thự sang trọng cho gia đình' }
  ];

  const seededCategories = [];
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
    seededCategories.push(record);
  }
  console.log(`Đã seed ${seededCategories.length} danh mục.`);

  // 2. Seed Amenities
  const amenities = [
    // Internet & Parking
    { name: 'Wifi miễn phí', icon: 'Wifi' },
    { name: 'Bãi đỗ xe', icon: 'ParkingCircle' },
    { name: 'Chỗ đỗ xe miễn phí', icon: 'ParkingCircle' },

    // Leisure & Facilities
    { name: 'Hồ bơi', icon: 'Waves' },
    { name: 'Phòng Gym / Thể hình', icon: 'Dumbbell' },
    { name: 'Dịch vụ Spa / Massage', icon: 'Sparkles' },
    { name: 'Nhà hàng ăn uống', icon: 'Utensils' },
    { name: 'Quầy bar / Lounge', icon: 'GlassWater' },
    { name: 'Dịch vụ phòng', icon: 'Sparkles' },

    // Bathroom (Phòng tắm)
    { name: 'Giấy vệ sinh', icon: 'Bath' },
    { name: 'Khăn tắm', icon: 'Bath' },
    { name: 'Chậu rửa vệ sinh (bidet)', icon: 'Bath' },
    { name: 'Dép lê', icon: 'Bath' },
    { name: 'Phòng tắm riêng', icon: 'Bath' },
    { name: 'Nhà vệ sinh', icon: 'Bath' },
    { name: 'Đồ vệ sinh cá nhân miễn phí', icon: 'Bath' },
    { name: 'Máy sấy tóc', icon: 'Bath' },
    { name: 'Vòi sen', icon: 'Bath' },
    { name: 'Bồn tắm', icon: 'Bath' },

    // Bedroom (Phòng ngủ)
    { name: 'Bộ khăn trải giường', icon: 'Bed' },
    { name: 'Tủ hoặc phòng để quần áo', icon: 'Bed' },

    // Outdoors (Ngoài trời)
    { name: 'Bàn ghế ngoài trời', icon: 'Trees' },
    { name: 'Sân thượng / hiên', icon: 'Trees' },
    { name: 'Sân vườn', icon: 'Trees' },

    // Kitchen (Nhà bếp)
    { name: 'Bếp chung', icon: 'Utensils' },
    { name: 'Ấm đun nước điện', icon: 'Utensils' },
    { name: 'Lò vi sóng', icon: 'Utensils' },
    { name: 'Tủ lạnh', icon: 'Utensils' },

    // Room Amenities (Tiện ích trong phòng)
    { name: 'Giá treo quần áo', icon: 'Sparkles' },
    { name: 'Két sắt an toàn', icon: 'Sparkles' },

    // Media & Technology (Truyền thông & Công nghệ)
    { name: 'TV màn hình phẳng', icon: 'Tv' },
    { name: 'Truyền hình cáp', icon: 'Tv' },

    // Services (Dịch vụ)
    { name: 'Dọn phòng hàng ngày', icon: 'User' },
    { name: 'Khu vực xem TV / sảnh chung', icon: 'User' },
    { name: 'Lễ tân 24 giờ', icon: 'User' },
    { name: 'Dịch vụ trông trẻ', icon: 'User' },
    { name: 'Nhận/trả phòng riêng', icon: 'User' },

    // Security (An ninh)
    { name: 'Bình chữa cháy', icon: 'ShieldCheck' },
    { name: 'Hệ thống CCTV bên ngoài chỗ nghỉ', icon: 'ShieldCheck' },
    { name: 'Hệ thống CCTV trong khu vực chung', icon: 'ShieldCheck' },
    { name: 'Thiết bị báo cháy', icon: 'ShieldCheck' },
    { name: 'Bảo vệ 24/7', icon: 'ShieldCheck' },

    // General (Tổng quát)
    { name: 'Điều hòa nhiệt độ', icon: 'Building2' },
    { name: 'Thang máy', icon: 'Building2' },
    { name: 'Quạt máy', icon: 'Building2' },
    { name: 'Phòng gia đình', icon: 'Building2' },
    { name: 'Phòng không hút thuốc', icon: 'Building2' },
    { name: 'Cấm hút thuốc trong toàn bộ khuôn viên', icon: 'Building2' },

    // Languages Spoken (Ngôn ngữ sử dụng)
    { name: 'Tiếng Anh', icon: 'Globe' },
    { name: 'Tiếng Việt', icon: 'Globe' }
  ];

  const seededAmenities = [];
  for (const am of amenities) {
    const record = await prisma.amenity.upsert({
      where: { name: am.name },
      update: am,
      create: am
    });
    seededAmenities.push(record);
  }
  console.log(`Đã seed ${seededAmenities.length} tiện nghi.`);

  // 3. Seed Địa giới Hành chính Việt Nam (Tất cả 63 Tỉnh -> Huyện -> Xã từ data.json)
  console.log('--- Đang đọc dữ liệu địa giới hành chính từ data.json ---');
  const rawLocationData = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
  const locationsList = JSON.parse(rawLocationData);

  const provincesToCreate: any[] = [];
  const districtsToCreate: any[] = [];
  const wardsToCreate: any[] = [];

  for (const prov of locationsList) {
    if (!prov.Id || !prov.Name) continue;
    provincesToCreate.push({
      id: prov.Id,
      name: prov.Name,
      code: prov.Id
    });

    if (prov.Districts) {
      for (const dist of prov.Districts) {
        if (!dist.Id || !dist.Name) continue;
        districtsToCreate.push({
          id: dist.Id,
          provinceId: prov.Id,
          name: dist.Name,
          code: dist.Id
        });

        if (dist.Wards) {
          for (const ward of dist.Wards) {
            if (!ward.Id || !ward.Name) continue;
            wardsToCreate.push({
              id: ward.Id,
              districtId: dist.Id,
              name: ward.Name,
              code: ward.Id
            });
          }
        }
      }
    }
  }

  console.log(`Đang nạp ${provincesToCreate.length} Tỉnh/Thành phố...`);
  await prisma.province.createMany({ data: provincesToCreate });

  console.log(`Đang nạp ${districtsToCreate.length} Quận/Huyện...`);
  await prisma.district.createMany({ data: districtsToCreate });

  console.log(`Đang nạp ${wardsToCreate.length} Phường/Xã...`);
  const chunkSize = 2000;
  for (let i = 0; i < wardsToCreate.length; i += chunkSize) {
    const chunk = wardsToCreate.slice(i, i + chunkSize);
    await prisma.ward.createMany({ data: chunk });
  }

  console.log('Đã seed thành công đầy đủ địa giới hành chính Việt Nam.');

  // 4. Seed Users (Admin, Owner, Customer)
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cloudbooking.com' },
    update: {},
    create: {
      email: 'admin@cloudbooking.com',
      password: hashedPassword,
      fullName: 'Hệ Thống Admin',
      role: Role.ADMIN,
      isVerified: true
    }
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@cloudbooking.com' },
    update: {},
    create: {
      email: 'owner@cloudbooking.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn Chủ',
      role: Role.HOTEL_OWNER,
      isVerified: true
    }
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      email: 'customer@gmail.com',
      password: hashedPassword,
      fullName: 'Trần Văn Khách',
      role: Role.CUSTOMER,
      isVerified: true
    }
  });

  console.log('Đã seed các tài khoản cơ bản.');

  // 5. Seed Khách sạn mẫu (Đà Lạt & Sơn Trà Đà Nẵng)
  // 5. Seed Khách sạn mẫu (Đà Lạt & Sơn Trà Đà Nẵng)
  let hotelDalat = await prisma.hotel.findFirst({
    where: { name: 'Dalat Flower Hotel & Spa' }
  });

  if (!hotelDalat) {
    hotelDalat = await prisma.hotel.create({
      data: {
        ownerId: ownerUser.id,
        categoryId: seededCategories.find(c => c.slug === 'hotel')?.id || seededCategories[0].id,
        name: 'Dalat Flower Hotel & Spa',
        description: 'Khách sạn phong cách thơ mộng nằm ngay trung tâm thành phố Đà Lạt, cách hồ Xuân Hương chỉ 200m đi bộ. Rất phù hợp cho gia đình có con nhỏ nghỉ ngơi thư giãn.',
        address: '22 Bùi Thị Xuân, Phường 2',
        provinceId: '68',
        districtId: '672',
        wardId: '24781',
        latitude: 11.9472,
        longitude: 108.4419,
        starRating: 4,
        status: HotelStatus.APPROVED,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', isPrimary: true },
            { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', isPrimary: false }
          ]
        },
        amenities: {
          create: seededAmenities.map(am => ({
            amenityId: am.id
          }))
        },
        roomTypes: {
          create: [
            {
              name: 'Phòng Deluxe Double (Hướng Hồ)',
              description: 'Phòng rộng 30m2 giường đôi cực lớn, hướng nhìn thẳng ra Hồ Xuân Hương thơ mộng.',
              basePrice: 1200000.00,
              capacity: 2,
              bedCount: 1,
              size: 30,
              amenities: ['Wifi', 'Điều hòa', 'Mini Bar', 'Ấm đun nước'],
              images: {
                create: [
                  { url: 'https://images.unsplash.com/photo-1611891405788-d880227f73b4?auto=format&fit=crop&w=800&q=80', isPrimary: true }
                ]
              },
              rooms: {
                create: [
                  { roomNumber: '201' },
                  { roomNumber: '202' },
                  { roomNumber: '203' },
                  { roomNumber: '204' },
                  { roomNumber: '205' }
                ]
              }
            },
            {
              name: 'Phòng Gia Đình Family Suite',
              description: 'Phòng gia đình rộng 50m2 với 2 giường đôi lớn, bồn tắm nằm và khu vực ban công rộng rãi.',
              basePrice: 2200000.00,
              capacity: 4,
              bedCount: 2,
              size: 50,
              amenities: ['Wifi', 'Hồ bơi riêng', 'Điều hòa', 'Khu bếp nhẹ'],
              images: {
                create: [
                  { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', isPrimary: true }
                ]
              },
              rooms: {
                create: [
                  { roomNumber: '301' },
                  { roomNumber: '302' },
                  { roomNumber: '303' }
                ]
              }
            }
          ]
        }
      }
    });
  }

  let hotelDanang = await prisma.hotel.findFirst({
    where: { name: 'Danang Beachside Resort & Villas' }
  });

  if (!hotelDanang) {
    hotelDanang = await prisma.hotel.create({
      data: {
        ownerId: ownerUser.id,
        categoryId: seededCategories.find(c => c.slug === 'resort')?.id || seededCategories[1].id,
        name: 'Danang Beachside Resort & Villas',
        description: 'Resort nghỉ dưỡng sát bãi biển Mỹ Khê tuyệt đẹp. Có hồ bơi ngoài trời tràn viền lớn, bãi đỗ xe ô tô rộng rãi và spa chuyên nghiệp.',
        address: '292 Võ Nguyên Giáp, Phường Phước Mỹ',
        provinceId: '48',
        districtId: '493',
        wardId: '20275',
        latitude: 16.0612,
        longitude: 108.2471,
        starRating: 5,
        status: HotelStatus.APPROVED,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', isPrimary: true },
            { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80', isPrimary: false }
          ]
        },
        amenities: {
          create: seededAmenities.map(am => ({
            amenityId: am.id
          }))
        },
        roomTypes: {
          create: [
            {
              name: 'Standard Twin Room',
              description: 'Phòng đôi tiêu chuẩn hướng vườn rộng 35m2 với 2 giường đơn.',
              basePrice: 1500000.00,
              capacity: 2,
              bedCount: 2,
              size: 35,
              amenities: ['Wifi', 'Điều hòa', 'Tivi'],
              images: {
                create: [
                  { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', isPrimary: true }
                ]
              },
              rooms: {
                create: [
                  { roomNumber: '101' },
                  { roomNumber: '102' },
                  { roomNumber: '103' },
                  { roomNumber: '104' },
                  { roomNumber: '105' },
                  { roomNumber: '106' }
                ]
              }
            },
            {
              name: 'Ocean View Villa',
              description: 'Villa biệt thự riêng biệt view biển, có bồn Jacuzzi ngoài trời cực kỳ lãng mạn.',
              basePrice: 4500000.00,
              capacity: 2,
              bedCount: 1,
              size: 80,
              amenities: ['Wifi', 'Bể sục jacuzzi', 'Điều hòa', 'Quầy bar nhỏ'],
              images: {
                create: [
                  { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80', isPrimary: true }
                ]
              },
              rooms: {
                create: [
                  { roomNumber: 'V-01' },
                  { roomNumber: 'V-02' },
                  { roomNumber: 'V-03' },
                  { roomNumber: 'V-04' }
                ]
              }
            }
          ]
        }
      }
    });
  }

  console.log('Đã seed khách sạn và loại phòng mẫu.');

  // 6. Seed Lịch Giá Phòng Động (RoomPriceCalendar)
  // Đặt giá ngày cuối tuần (Thứ 7 chủ nhật) tăng 20% cho phòng Family của Khách sạn Đà Lạt
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSunday.getDate() + 1);

  // Tìm roomType Family Suite
  const familyRoomType = await prisma.roomType.findFirst({
    where: { name: 'Phòng Gia Đình Family Suite' }
  });

  if (familyRoomType) {
    const existingPrice = await prisma.roomPriceCalendar.findFirst({
      where: {
        roomTypeId: familyRoomType.id,
        date: new Date(nextSaturday.toDateString())
      }
    });
    if (!existingPrice) {
      await prisma.roomPriceCalendar.createMany({
        data: [
          {
            roomTypeId: familyRoomType.id,
            date: new Date(nextSaturday.toDateString()),
            price: 2640000.00, // 2,200,000 + 20%
            isBlocked: false
          },
          {
            roomTypeId: familyRoomType.id,
            date: new Date(nextSunday.toDateString()),
            price: 2640000.00,
            isBlocked: false
          }
        ]
      });
      console.log('Đã seed lịch giá phòng động cuối tuần.');
    }
  }

  // 7. Seed Banners
  const existingBanners = await prisma.banner.findMany();
  if (existingBanners.length === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'Mừng Hè Rực Rỡ - Giảm Ngay 20%',
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          linkUrl: '/search?discount=true',
          position: 'HOME_HERO',
          isActive: true
        },
        {
          title: 'Trải Nghiệm Đà Lạt Lãng Mạn',
          imageUrl: 'https://images.unsplash.com/photo-1542296332-2e4473fac563?auto=format&fit=crop&w=1200&q=80',
          linkUrl: '/search?city=Đà Lạt',
          position: 'HOME_SIDEBAR',
          isActive: true
        }
      ]
    });
    console.log('Đã seed Banners quảng cáo.');
  }

  console.log('--- Hoàn tất Seeding Dữ liệu ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
