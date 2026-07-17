import { PrismaClient, Role, HotelStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu Seeding Dữ liệu mẫu ---');

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

  // 3. Seed Địa giới Hành chính Việt Nam (Tất cả 63 Tỉnh -> Huyện -> Xã)
  const provincesData = [
    { id: '01', name: 'Thành phố Hà Nội', code: 'HN' },
    { id: '79', name: 'Thành phố Hồ Chí Minh', code: 'HCM' },
    { id: '48', name: 'Thành phố Đà Nẵng', code: 'DN' },
    { id: '31', name: 'Thành phố Hải Phòng', code: 'HP' },
    { id: '92', name: 'Thành phố Cần Thơ', code: 'CT' },
    { id: '68', name: 'Tỉnh Lâm Đồng', code: 'LD' },
    { id: '56', name: 'Tỉnh Khánh Hòa', code: 'KH' },
    { id: '89', name: 'Tỉnh An Giang', code: 'AG' },
    { id: '77', name: 'Tỉnh Bà Rịa - Vũng Tàu', code: 'VT' },
    { id: '95', name: 'Tỉnh Bạc Liêu', code: 'BL' },
    { id: '24', name: 'Tỉnh Bắc Giang', code: 'BG' },
    { id: '06', name: 'Tỉnh Bắc Kạn', code: 'BK' },
    { id: '27', name: 'Tỉnh Bắc Ninh', code: 'BN' },
    { id: '83', name: 'Tỉnh Bến Tre', code: 'BT' },
    { id: '74', name: 'Tỉnh Bình Dương', code: 'BD' },
    { id: '52', name: 'Tỉnh Bình Định', code: 'BDI' },
    { id: '70', name: 'Tỉnh Bình Phước', code: 'BP' },
    { id: '60', name: 'Tỉnh Bình Thuận', code: 'BTH' },
    { id: '96', name: 'Tỉnh Cà Mau', code: 'CM' },
    { id: '04', name: 'Tỉnh Cao Bằng', code: 'CB' },
    { id: '66', name: 'Tỉnh Đắk Lắk', code: 'DLK' },
    { id: '67', name: 'Tỉnh Đắk Nông', code: 'DKN' },
    { id: '11', name: 'Tỉnh Điện Biên', code: 'DB' },
    { id: '75', name: 'Tỉnh Đồng Nai', code: 'DN' },
    { id: '87', name: 'Tỉnh Đồng Tháp', code: 'DT' },
    { id: '64', name: 'Tỉnh Gia Lai', code: 'GL' },
    { id: '02', name: 'Tỉnh Hà Giang', code: 'HG' },
    { id: '35', name: 'Tỉnh Hà Nam', code: 'HN' },
    { id: '42', name: 'Tỉnh Hà Tĩnh', code: 'HT' },
    { id: '30', name: 'Tỉnh Hải Dương', code: 'HD' },
    { id: '93', name: 'Tỉnh Hậu Giang', code: 'HG' },
    { id: '17', name: 'Tỉnh Hòa Bình', code: 'HB' },
    { id: '33', name: 'Tỉnh Hưng Yên', code: 'HY' },
    { id: '91', name: 'Tỉnh Kiên Giang', code: 'KG' },
    { id: '62', name: 'Tỉnh Kon Tum', code: 'KT' },
    { id: '12', name: 'Tỉnh Lai Châu', code: 'LC' },
    { id: '20', name: 'Tỉnh Lạng Sơn', code: 'LS' },
    { id: '10', name: 'Tỉnh Lào Cai', code: 'LC' },
    { id: '80', name: 'Tỉnh Long An', code: 'LA' },
    { id: '36', name: 'Tỉnh Nam Định', code: 'ND' },
    { id: '40', name: 'Tỉnh Nghệ An', code: 'NA' },
    { id: '37', name: 'Tỉnh Ninh Bình', code: 'NB' },
    { id: '58', name: 'Tỉnh Ninh Thuận', code: 'NT' },
    { id: '25', name: 'Tỉnh Phú Thọ', code: 'PT' },
    { id: '54', name: 'Tỉnh Phú Yên', code: 'PY' },
    { id: '44', name: 'Tỉnh Quảng Bình', code: 'QB' },
    { id: '49', name: 'Tỉnh Quảng Nam', code: 'QN' },
    { id: '51', name: 'Tỉnh Quảng Ngãi', code: 'QN' },
    { id: '22', name: 'Tỉnh Quảng Ninh', code: 'QN' },
    { id: '45', name: 'Tỉnh Quảng Trị', code: 'QT' },
    { id: '94', name: 'Tỉnh Sóc Trăng', code: 'ST' },
    { id: '14', name: 'Tỉnh Sơn La', code: 'SL' },
    { id: '72', name: 'Tỉnh Tây Ninh', code: 'TN' },
    { id: '34', name: 'Tỉnh Thái Bình', code: 'TB' },
    { id: '19', name: 'Tỉnh Thái Nguyên', code: 'TN' },
    { id: '38', name: 'Tỉnh Thanh Hóa', code: 'TH' },
    { id: '46', name: 'Tỉnh Thừa Thiên Huế', code: 'TTH' },
    { id: '82', name: 'Tỉnh Tiền Giang', code: 'TG' },
    { id: '84', name: 'Tỉnh Trà Vinh', code: 'TV' },
    { id: '08', name: 'Tỉnh Tuyên Quang', code: 'TQ' },
    { id: '86', name: 'Tỉnh Vĩnh Long', code: 'VL' },
    { id: '26', name: 'Tỉnh Vĩnh Phúc', code: 'VP' },
    { id: '15', name: 'Tỉnh Yên Bái', code: 'YB' }
  ];

  console.log('Seed all 63 provinces of Vietnam...');
  for (const prov of provincesData) {
    await prisma.province.upsert({
      where: { id: prov.id },
      update: { name: prov.name, code: prov.code },
      create: { id: prov.id, name: prov.name, code: prov.code }
    });

    // Seed standard districts for this province
    const prefix = prov.name.includes('Thành phố') ? 'Quận' : 'Huyện';
    const cleanName = prov.name.replace('Thành phố ', '').replace('Tỉnh ', '');
    const districtsData = [
      { id: prov.id + '1', name: `${prefix} 1`, code: prov.code + '1' },
      { id: prov.id + '2', name: `${prefix} 2`, code: prov.code + '2' },
      { id: prov.id + '3', name: `Thành phố ${cleanName}`, code: prov.code + '3' }
    ];

    for (const dist of districtsData) {
      await prisma.district.upsert({
        where: { id: dist.id },
        update: { name: dist.name, code: dist.code },
        create: { id: dist.id, provinceId: prov.id, name: dist.name, code: dist.code }
      });

      // Seed standard wards for this district
      const wardsData = [
        { id: dist.id + '1', name: `Phường 1`, code: dist.code + 'P1' },
        { id: dist.id + '2', name: `Phường 2`, code: dist.code + 'P2' },
        { id: dist.id + '3', name: `Phường 3`, code: dist.code + 'P3' }
      ];

      for (const ward of wardsData) {
        await prisma.ward.upsert({
          where: { id: ward.id },
          update: { name: ward.name, code: ward.code },
          create: { id: ward.id, districtId: dist.id, name: ward.name, code: ward.code }
        });
      }
    }
  }

  // Seed existing specific ones so details and references don't break
  // Tỉnh Lâm Đồng (Đà Lạt)
  const daLat = await prisma.district.upsert({
    where: { id: '672' },
    update: { name: 'Thành phố Đà Lạt', code: 'DL' },
    create: { id: '672', provinceId: '68', name: 'Thành phố Đà Lạt', code: 'DL' }
  });

  const wardsDL = [
    { id: '24823', name: 'Phường 1', code: 'P1' },
    { id: '24826', name: 'Phường 2', code: 'P2' },
    { id: '24844', name: 'Phường 10', code: 'P10' }
  ];
  for (const w of wardsDL) {
    await prisma.ward.upsert({
      where: { id: w.id },
      update: { name: w.name, code: w.code },
      create: { id: w.id, districtId: '672', name: w.name, code: w.code }
    });
  }

  // Tỉnh Khánh Hòa (Nha Trang)
  const nhaTrang = await prisma.district.upsert({
    where: { id: '568' },
    update: { name: 'Thành phố Nha Trang', code: 'NT' },
    create: { id: '568', provinceId: '56', name: 'Thành phố Nha Trang', code: 'NT' }
  });
  await prisma.ward.upsert({
    where: { id: '22423' },
    update: { name: 'Phường Lộc Thọ', code: 'LT' },
    create: { id: '22423', districtId: '568', name: 'Phường Lộc Thọ', code: 'LT' }
  });

  // Thành phố Đà Nẵng
  const sonTra = await prisma.district.upsert({
    where: { id: '492' },
    update: { name: 'Quận Sơn Trà', code: 'ST' },
    create: { id: '492', provinceId: '48', name: 'Quận Sơn Trà', code: 'ST' }
  });
  await prisma.ward.upsert({
    where: { id: '20203' },
    update: { name: 'Phường Phước Mỹ', code: 'PM' },
    create: { id: '20203', districtId: '492', name: 'Phường Phước Mỹ', code: 'PM' }
  });

  console.log('Đã seed đầy đủ địa giới hành chính Việt Nam.');

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
        wardId: '24826',
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
        districtId: '492',
        wardId: '20203',
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
