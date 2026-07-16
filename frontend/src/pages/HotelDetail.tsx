import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchCriteria } from '../store/slices/searchSlice';
import type { RootState } from '../store';
import apiClient from '../core/api/client';
import { 
  MapPin, 
  Waves, 
  Wifi, 
  ParkingCircle, 
  Dumbbell, 
  Sparkles, 
  Utensils, 
  GlassWater, 
  User,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Compass,
  MoreHorizontal,
  Bath,
  Bed,
  Trees,
  ShieldCheck,
  Tv,
  Globe
} from 'lucide-react';
import { formatPrice } from '../utils/price';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const StarIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      fill="#FFDC00"
      d="M3.48181495,11.5430154 C3.01970697,11.7914814 2.44367293,11.6182904 2.19520692,11.1561824 C2.09540205,10.9705609 2.06015424,10.7570215 2.09501099,10.5491721 L2.58088786,7.65190901 L0.521517564,5.5988966 C0.149946355,5.22847254 0.149016407,4.62696653 0.519440465,4.25539532 C0.663624686,4.11076458 0.850578093,4.01644739 1.05258287,3.98642726 L3.88066099,3.56614383 L5.14441015,0.947312068 C5.37243489,0.474782844 5.94034608,0.276572791 6.4128753,0.504597525 C6.60623248,0.597904384 6.76228299,0.753954894 6.85558985,0.947312068 L8.11933901,3.56614383 L10.9474171,3.98642726 C11.4663881,4.06355205 11.8245753,4.54678317 11.7474505,5.06575419 C11.7174304,5.26775897 11.6231132,5.45471238 11.4784824,5.5988966 L9.41911214,7.65190901 L9.90498901,10.5491721 C9.99176552,11.0666168 9.64264,11.5564348 9.12519533,11.6432113 C8.91734599,11.6780681 8.70380652,11.6428203 8.51818505,11.5430154 L6,10.1890388 L3.48181495,11.5430154 Z"
    />
  </svg>
);

const RoomDetailsModal = ({
  room,
  onClose,
  language,
  currency,
  onBook,
}: {
  room: RoomTypeDetail;
  onClose: () => void;
  language: string;
  currency: string;
  onBook: (roomTypeId: string) => void;
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const images = room.images && room.images.length > 0
    ? room.images
    : [{ url: 'https://images.unsplash.com/photo-1611891405788-d880227f73b4' }];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx(prev => (prev + 1) % images.length);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6 transition-all duration-300">
      {/* Backdrop click close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <div className="bg-white rounded-t-2xl md:rounded-3xl overflow-hidden shadow-2xl w-full max-w-[1000px] h-[100vh] md:h-[85vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-2 rounded-full transition-all z-20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 pr-16 bg-white">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{room.name}</h2>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-slate-900 md:bg-white">
          {/* Left Column: Image Slider */}
          <div className="w-full md:w-[60%] bg-slate-950 flex flex-col p-4 justify-between gap-3 select-none min-h-[350px] md:h-full">
            {/* Main Image Slider */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 group">
              <img
                src={images[activeImgIdx]?.url}
                alt={`${room.name} view ${activeImgIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-300 max-h-[400px] md:max-h-[500px]"
              />
              
              {/* Slider Prev/Next (Visible on Hover) */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-slate-800 hover:bg-slate-100 p-2 rounded-full shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-800" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-slate-800 hover:bg-slate-100 p-2 rounded-full shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-800" />
                  </button>
                </>
              )}
            </div>

            {/* Photo description & Index indicator */}
            <div className="flex justify-between items-center text-slate-300 text-xs font-bold px-1 py-1 shrink-0">
              <span>{language === 'vi' ? 'Ảnh phòng' : 'Bedroom'}</span>
              <span>{activeImgIdx + 1}/{images.length}</span>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin shrink-0 select-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImgIdx(i)}
                    className={`h-[48px] w-[72px] rounded-md overflow-hidden shrink-0 transition-all border-2 ${
                      i === activeImgIdx ? 'border-blue-500 scale-102 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Room Specs and Pricing */}
          <div className="w-full md:w-[40%] bg-white p-6 overflow-y-auto flex flex-col justify-between gap-6 md:h-full">
            <div className="space-y-6">
              {/* Specs block */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">{language === 'vi' ? 'Thông tin phòng' : 'Room info'}</h3>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">📏</span>
                    <span>{language === 'vi' ? 'Diện tích:' : 'Size:'} {room.size || 25} m²</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🛏️</span>
                    <span>{room.bedCount} {language === 'vi' ? 'giường đôi' : 'large beds'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">👤</span>
                    <span>{room.capacity} {language === 'vi' ? 'khách' : 'guests'}</span>
                  </div>
                </div>
              </div>

              {/* Loved Features */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">{language === 'vi' ? 'Tính năng phòng bạn thích' : 'Features you like'}</h3>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">🚿</span>
                    <span>{language === 'vi' ? 'Vòi tắm đứng' : 'Standing shower'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">♨️</span>
                    <span>{language === 'vi' ? 'Nước nóng' : 'Hot water'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#006ce4]" />
                    <span>{language === 'vi' ? 'WiFi miễn phí' : 'Free WiFi'}</span>
                  </div>
                </div>
              </div>

              {/* Full Amenities list */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">{language === 'vi' ? 'Tiện nghi phòng' : 'Room amenities'}</h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-slate-600 list-inside">
                  {room.amenities.map((a) => (
                    <li key={a} className="truncate">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Price tag & Call to action */}
            <div className="pt-5 border-t border-slate-100 flex flex-col gap-3 shrink-0">
              <div className="text-slate-500 font-bold text-xs">
                {language === 'vi' ? 'Khởi điểm từ:' : 'Starting from:'}
                <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                  <span className="text-xl md:text-2xl font-black text-[#ff4d42]">
                    {formatPrice(room.calculatedPrice, currency)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    / {language === 'vi' ? 'Phòng / đêm' : 'Room / night'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onBook(room.id);
                  onClose();
                }}
                disabled={room.isBlocked || room.availableRooms <= 0}
                className="w-full bg-[#006ce4] hover:bg-[#0056b3] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm py-3 rounded-lg transition-all active:scale-[0.98] shadow-md text-center"
              >
                {language === 'vi' ? 'Thêm lựa chọn phòng' : 'Select room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RoomTypeDetail {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  calculatedPrice: number;
  capacity: number;
  bedCount: number;
  size: number | null;
  amenities: string[];
  images: { url: string }[];
  availableRooms: number;
  isBlocked: boolean;
}

interface ReviewDetail {
  id: string;
  ratingCleanliness: number;
  ratingLocation: number;
  ratingService: number;
  ratingFacilities: number;
  ratingValue: number;
  ratingOverall: number;
  comment: string;
  createdAt: string;
  user: { fullName: string; avatarUrl: string | null };
}

interface HotelDetailData {
  id: string;
  name: string;
  description: string;
  address: string;
  starRating: number;
  images: { url: string }[];
  category: { name: string };
  province: { name: string };
  district: { name: string };
  ward: { name: string };
  amenities: { amenity: { name: string; icon: string } }[];
  roomTypes: RoomTypeDetail[];
  reviews: ReviewDetail[];
  averageRating: number;
  latitude: number | null;
  longitude: number | null;
  nearbyLocations?: { name: string; distance: string; type: string }[];
}

const detailTranslations = {
  vi: {
    loadingText: 'Đang tải thông tin...',
    notFound: 'Không tìm thấy thông tin khách sạn.',
    stars: 'Sao',
    about: 'Giới thiệu chỗ nghỉ',
    amenities: 'Tiện nghi có sẵn',
    selectDates: 'Chọn ngày đi & đặt phòng',
    checkInLabel: 'Ngày nhận phòng',
    checkOutLabel: 'Ngày trả phòng',
    updateBtn: 'Cập nhật giá và phòng trống',
    roomTypes: 'Các loại phòng khả dụng',
    colDesc: 'Mô tả phòng',
    colCapacity: 'Sức chứa',
    colPrice: 'Giá mỗi đêm (Trung bình)',
    colStatus: 'Tình trạng',
    guestsCount: 'Khách',
    bedsCount: 'giường',
    notSupported: 'Không hỗ trợ',
    roomClosed: 'Đã đóng phòng',
    roomsAvailable: (n: number) => `Còn ${n} phòng trống`,
    noRoomsAvailable: 'Hết phòng trống',
    bookNow: 'Đặt ngay',
    reviewsTitle: 'Đánh giá từ khách hàng',
    noReviews: 'Chưa có đánh giá nào cho khách sạn này.',
    avgScore: 'Điểm trung bình',
    reviewsCount: (n: number) => `Dựa trên ${n} đánh giá khách quan`,
    cleanliness: 'Sạch sẽ',
    location: 'Vị trí',
    service: 'Dịch vụ',
    facilities: 'Tiện nghi',
    valueRating: 'Giá trị',
    bedroomFallback: 'Hình ảnh phòng ngủ',
    contact: 'Liên hệ',
  },
  en: {
    loadingText: 'Loading details...',
    notFound: 'Hotel details not found.',
    stars: 'Stars',
    about: 'About the Property',
    amenities: 'Available Amenities',
    selectDates: 'Select dates & book room',
    checkInLabel: 'Check-in date',
    checkOutLabel: 'Check-out date',
    updateBtn: 'Update prices & availability',
    roomTypes: 'Available Room Types',
    colDesc: 'Room description',
    colCapacity: 'Capacity',
    colPrice: 'Price per night (Avg)',
    colStatus: 'Status',
    guestsCount: 'Guests',
    bedsCount: 'beds',
    notSupported: 'Not supported',
    roomClosed: 'Room closed',
    roomsAvailable: (n: number) => `${n} rooms available`,
    noRoomsAvailable: 'No rooms available',
    bookNow: 'Book Now',
    reviewsTitle: 'Customer Reviews',
    noReviews: 'No reviews yet for this hotel.',
    avgScore: 'Average score',
    reviewsCount: (n: number) => `Based on ${n} objective reviews`,
    cleanliness: 'Cleanliness',
    location: 'Location',
    service: 'Service',
    facilities: 'Facilities',
    valueRating: 'Value',
    bedroomFallback: 'Bedroom image',
    contact: 'Contact Us',
  }
};

const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str;
};

const translateCategoryName = (name: string, lang: string) => {
  if (!name) return '';
  if (lang === 'vi') return name;
  switch (name.toLowerCase()) {
    case 'khách sạn':
    case 'hotel':
      return 'Hotel';
    case 'khu nghỉ dưỡng':
    case 'resort':
      return 'Resort';
    case 'biệt thự / villa':
    case 'villa':
      return 'Villa';
    case 'căn hộ':
    case 'apartment':
      return 'Apartment';
    case 'homestay':
      return 'Homestay';
    default:
      return name;
  }
};

const translateAddress = (address: string, district: string, province: string, lang: string) => {
  if (lang === 'vi') {
    const parts = [address, district, province].filter(Boolean);
    return parts.join(', ');
  }

  const translateValue = (val: string) => {
    if (!val) return '';
    let res = val;

    res = res.replace(/^Quận\s+(\d+)/i, 'District $1');
    res = res.replace(/^Phường\s+(\d+)/i, 'Ward $1');
    
    res = res.replace(/^Quận\s+(.+)/i, (_, p1) => {
      if (/^\d+/.test(p1.trim())) return `District ${p1.trim()}`;
      return `${removeVietnameseTones(p1.trim())} District`;
    });
    
    res = res.replace(/^Phường\s+(.+)/i, (_, p1) => {
      if (/^\d+/.test(p1.trim())) return `Ward ${p1.trim()}`;
      return `${removeVietnameseTones(p1.trim())} Ward`;
    });

    res = res.replace(/^Đường\s+(.+)/i, (_, p1) => {
      return `${removeVietnameseTones(p1.trim())} Street`;
    });

    res = res.replace(/^Thị xã\s+(.+)/i, (_, p1) => `${removeVietnameseTones(p1.trim())} Town`);
    res = res.replace(/^Huyện\s+(.+)/i, (_, p1) => `${removeVietnameseTones(p1.trim())} District`);
    res = res.replace(/^Xã\s+(.+)/i, (_, p1) => `${removeVietnameseTones(p1.trim())} Commune`);
    
    const cleanProvince = res.replace(/^Thành phố\s+/i, '').replace(/^Tỉnh\s+/i, '').trim();
    if (cleanProvince.includes('Hồ Chí Minh') || cleanProvince.toLowerCase().includes('hcm') || cleanProvince.toLowerCase().includes('ho chi minh')) {
      return 'Ho Chi Minh City';
    }
    if (cleanProvince.includes('Đà Lạt') || cleanProvince.toLowerCase().includes('da lat')) {
      return 'Da Lat';
    }
    if (cleanProvince.includes('Đà Nẵng') || cleanProvince.toLowerCase().includes('da nang')) {
      return 'Da Nang';
    }
    if (cleanProvince.includes('Nha Trang') || cleanProvince.toLowerCase().includes('nha trang') || cleanProvince.includes('Khánh Hòa')) {
      return 'Nha Trang, Khanh Hoa';
    }
    if (cleanProvince.includes('Hà Nội') || cleanProvince.toLowerCase().includes('ha noi') || cleanProvince.toLowerCase().includes('hanoi')) {
      return 'Hanoi';
    }
    if (cleanProvince.includes('Vũng Tàu') || cleanProvince.toLowerCase().includes('vung tau') || cleanProvince.toLowerCase().includes('ba ria')) {
      return 'Vung Tau';
    }
    if (cleanProvince.includes('Lâm Đồng')) {
      return 'Lam Dong';
    }
    if (cleanProvince.includes('Kiên Giang') || cleanProvince.toLowerCase().includes('phu quoc')) {
      return 'Phu Quoc, Kien Giang';
    }

    return removeVietnameseTones(res);
  };

  const cleanAddr = translateValue(address);
  const cleanDist = translateValue(district);
  const cleanProv = translateValue(province);

  const parts = [cleanAddr, cleanDist, cleanProv].filter(Boolean);
  
  const uniqueParts: string[] = [];
  parts.forEach(p => {
    if (!uniqueParts.some(up => up.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(up.toLowerCase()))) {
      uniqueParts.push(p);
    } else {
      const index = uniqueParts.findIndex(up => up.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(up.toLowerCase()));
      if (p.length > uniqueParts[index].length) {
        uniqueParts[index] = p;
      }
    }
  });

  return uniqueParts.join(', ');
};

const PROVINCES = [
  { id: '01', name: 'TP. Hồ Chí Minh', keywords: ['hcm', 'ho chi minh', 'sai gon', 'saigon'] },
  { id: '48', name: 'Đà Nẵng', keywords: ['da nang', 'danang', 'dn'] },
  { id: '56', name: 'Nha Trang', keywords: ['nha trang', 'nhatrang', 'nt'] },
  { id: '68', name: 'Đà Lạt', keywords: ['da lat', 'dalat', 'dl'] },
  { id: '91', name: 'Vũng Tàu', keywords: ['vung tau', 'vungtau', 'vt'] }
];

const translateProvinceName = (name: string, lang: string) => {
  if (!name) return '';
  if (lang === 'vi') return name;
  const lower = name.toLowerCase().trim();
  if (lower.includes('hồ chí minh') || lower.includes('hcm') || lower.includes('sai gon')) return 'Ho Chi Minh City';
  if (lower.includes('đà nẵng') || lower.includes('da nang')) return 'Da Nang';
  if (lower.includes('nha trang')) return 'Nha Trang';
  if (lower.includes('đà lạt') || lower.includes('da lat')) return 'Da Lat';
  if (lower.includes('vũng tàu') || lower.includes('vung tau')) return 'Vung Tau';
  return removeVietnameseTones(name);
};

const normalizeRating = (rating: number) => {
  if (!rating) return 0;
  return rating <= 5 ? rating * 2 : rating;
};

const getRatingLabel = (score: number, lang: string) => {
  if (score >= 9.0) return lang === 'vi' ? 'Tuyệt hảo' : 'Exceptional';
  if (score >= 8.0) return lang === 'vi' ? 'Rất tốt' : 'Very Good';
  if (score >= 7.0) return lang === 'vi' ? 'Tốt' : 'Good';
  if (score >= 5.0) return lang === 'vi' ? 'Chấp nhận được' : 'Pleasant';
  return lang === 'vi' ? 'Điểm kém' : 'Disappointing';
};


interface LeafletMapProps {
  lat: number;
  lng: number;
  hotelName: string;
  queryPlace?: string;
  nearbyLocations?: { name: string; distance: string; type: string }[];
}

const LeafletMap: React.FC<LeafletMapProps> = ({ lat, lng, hotelName, queryPlace, nearbyLocations }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerGroupRef = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, [lat, lng]);

  React.useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    markerGroup.clearLayers();

    const hotelIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const hotelMarker = L.marker([lat, lng], { icon: hotelIcon })
      .bindPopup(`<b>${hotelName}</b><br/>Địa điểm khách sạn`)
      .addTo(markerGroup);

    if (queryPlace && queryPlace !== hotelName) {
      const matchedLoc = nearbyLocations?.find(
        (loc) => loc.name === queryPlace.split(' ')[0] || queryPlace.includes(loc.name)
      );

      const attractionIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      let angle = Math.random() * Math.PI * 2;
      let distanceMultiplier = 0.005;
      if (matchedLoc) {
        const distNum = parseFloat(matchedLoc.distance);
        if (matchedLoc.distance.includes('m')) {
          distanceMultiplier = (distNum / 1000) * 0.009;
        } else {
          distanceMultiplier = distNum * 0.009;
        }
      }

      const targetLat = lat + Math.sin(angle) * distanceMultiplier;
      const targetLng = lng + Math.cos(angle) * distanceMultiplier;

      const marker = L.marker([targetLat, targetLng], { icon: attractionIcon })
        .bindPopup(`<b>${queryPlace}</b><br/>Địa điểm lân cận`)
        .addTo(markerGroup);

      marker.openPopup();

      const group = L.featureGroup([hotelMarker, marker]);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      hotelMarker.openPopup();
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, queryPlace, hotelName, nearbyLocations]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export const HotelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchCriteria = useSelector((state: RootState) => state.search);
  const { language, currency } = useSelector((state: RootState) => state.settings);
  const t = detailTranslations[language];

  const [hotel, setHotel] = useState<HotelDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceShowOption, setPriceShowOption] = useState<string>('per_night_excl');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<RoomTypeDetail | null>(null);

  // Auth & Review States
  const auth = useSelector((state: RootState) => state.auth);
  const isLoggedIn = !!auth.user;

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [ratingCleanliness, setRatingCleanliness] = useState(10);
  const [ratingLocation, setRatingLocation] = useState(10);
  const [ratingService, setRatingService] = useState(10);
  const [ratingFacilities, setRatingFacilities] = useState(10);
  const [ratingValue, setRatingValue] = useState(10);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setReviewError(language === 'vi' ? 'Nhận xét không được để trống.' : 'Comment cannot be empty.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await apiClient.post(`/hotels/${id}/reviews`, {
        ratingCleanliness,
        ratingLocation,
        ratingService,
        ratingFacilities,
        ratingValue,
        comment: reviewComment,
      });

      if (res.data.success) {
        const newReview = res.data.data;
        setHotel((prev) => {
          if (!prev) return null;
          const updatedReviews = [newReview, ...prev.reviews];
          const sum = updatedReviews.reduce((acc, rev) => acc + rev.ratingOverall, 0);
          const avg = parseFloat((sum / updatedReviews.length).toFixed(1));
          return {
            ...prev,
            reviews: updatedReviews,
            averageRating: avg,
          };
        });

        setReviewComment('');
        setRatingCleanliness(10);
        setRatingLocation(10);
        setRatingService(10);
        setRatingFacilities(10);
        setRatingValue(10);
        setShowReviewForm(false);

        alert(language === 'vi' ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for your review!');
      }
    } catch (err: any) {
      console.error('[Submit Review Error]:', err);
      setReviewError(
        err.response?.data?.message ||
        (language === 'vi' ? 'Gửi đánh giá thất bại. Vui lòng thử lại.' : 'Failed to submit review. Please try again.')
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // States cho Bản đồ tương tác
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [activeMapQuery, setActiveMapQuery] = useState('');
  const [selectedMapCategory, setSelectedMapCategory] = useState<'ALL' | 'NEARBY' | 'TRANSPORT' | 'ENTERTAINMENT' | 'OTHER'>('ALL');

  // States đồng bộ cho ô tìm kiếm
  const [provinceId, setProvinceId] = useState(searchCriteria.provinceId || '');
  const [destInputText, setDestInputText] = useState('');
  const [destError, setDestError] = useState(false);
  const [checkIn, setCheckIn] = useState(searchCriteria.checkInDate || '');
  const [checkOut, setCheckOut] = useState(searchCriteria.checkOutDate || '');
  const [adults, setAdults] = useState(searchCriteria.guests > 2 ? searchCriteria.guests : 2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const [showDestPopover, setShowDestPopover] = useState(false);
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showGuestPopover, setShowGuestPopover] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const today = new Date();
  const [month1, setMonth1] = useState(today.getMonth());
  const [year1, setYear1] = useState(today.getFullYear());

  const monthNames = [
    'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
    'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
  ];

  const getProvinceName = (id: string) => {
    const prov = PROVINCES.find((p) => p.id === id);
    return prov ? prov.name : '';
  };

  // Đồng bộ hóa destInputText ban đầu theo provinceId
  useEffect(() => {
    if (provinceId) {
      setDestInputText(translateProvinceName(getProvinceName(provinceId), language));
    }
  }, [provinceId, language]);

  // Date list utilities cho Popover lịch
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const startDayOfWeek = date.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    const numDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= numDays; d++) {
      days.push(new Date(year, month, d));
    }

    const totalCells = days.length;
    const remaining = 42 - totalCells;
    for (let i = 0; i < remaining; i++) {
      days.push(null);
    }

    return days;
  };

  const handlePrevMonths = () => {
    if (month1 === 0) {
      setMonth1(11);
      setYear1(year1 - 1);
    } else {
      setMonth1(month1 - 1);
    }
  };

  const handleNextMonths = () => {
    if (month1 === 11) {
      setMonth1(0);
      setYear1(year1 + 1);
    } else {
      setMonth1(month1 + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    const todayStr = today.toISOString().split('T')[0];
    if (dateStr < todayStr) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut('');
      setHoveredDate(null);
    } else if (checkIn && !checkOut) {
      if (dateStr >= checkIn) {
        setCheckOut(dateStr);
        setHoveredDate(null);
      } else {
        setCheckIn(dateStr);
        setHoveredDate(null);
      }
    }
  };

  const handleDayMouseEnter = (dateStr: string) => {
    if (checkIn && !checkOut) {
      setHoveredDate(dateStr);
    }
  };

  const formatDateDisplay = () => {
    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const daysOfWeek = language === 'vi' 
        ? ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const inStr = language === 'vi'
        ? `${daysOfWeek[inDate.getDay()]}, ${inDate.getDate()} thg ${inDate.getMonth() + 1}`
        : `${daysOfWeek[inDate.getDay()]}, ${inDate.toLocaleString('en-US', { month: 'short' })} ${inDate.getDate()}`;
      const outStr = language === 'vi'
        ? `${daysOfWeek[outDate.getDay()]}, ${outDate.getDate()} thg ${outDate.getMonth() + 1}`
        : `${daysOfWeek[outDate.getDay()]}, ${outDate.toLocaleString('en-US', { month: 'short' })} ${outDate.getDate()}`;
      return `${inStr} — ${outStr}`;
    }
    return language === 'vi' ? 'Nhận phòng — Trả phòng' : 'Check-in — Check-out';
  };

  const isSelected = (dateStr: string) => checkIn === dateStr || checkOut === dateStr;
  const isInRange = (dateStr: string) => checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

  const isInHoverRange = (dateStr: string) => {
    if (checkIn && !checkOut && hoveredDate && dateStr > checkIn && dateStr <= hoveredDate) {
      return true;
    }
    return false;
  };

  const handleDestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestInputText(val);
    setShowDestPopover(true);

    const matched = PROVINCES.find((p) => p.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      setProvinceId(matched.id);
    } else {
      setProvinceId('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!destInputText.trim()) {
      setDestError(true);
      return;
    }

    const matchedProv = PROVINCES.find(
      (p) => p.name.toLowerCase() === destInputText.trim().toLowerCase()
    );

    let finalProvinceId = provinceId;
    let finalSearchQuery = destInputText.trim();

    if (matchedProv) {
      finalProvinceId = matchedProv.id;
    }

    dispatch(setSearchCriteria({
      provinceId: finalProvinceId,
      searchQuery: finalSearchQuery,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests: adults + children
    }));
    
    navigate('/search');
  };

  const matchedProvinces = destInputText
    ? PROVINCES.filter((p) => {
        const normInput = removeVietnameseTones(destInputText.toLowerCase()).trim();
        const normName = removeVietnameseTones(p.name.toLowerCase());
        const matchesName = normName.includes(normInput);
        const matchesKeywords = p.keywords?.some(
          (k) => k.includes(normInput) || normInput.includes(k)
        ) || false;
        return matchesName || matchesKeywords;
      })
    : [];

  const getNightsCount = () => {
    if (!checkIn || !checkOut) return 1;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = outDate.getTime() - inDate.getTime();
    if (diffTime <= 0) return 1;
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getDisplayPrice = (rt: RoomTypeDetail) => {
    const nights = getNightsCount();
    switch (priceShowOption) {
      case 'per_night_incl':
        return Math.round(rt.calculatedPrice * 1.15);
      case 'total_excl':
        return rt.calculatedPrice * nights;
      case 'total_incl':
        return Math.round(rt.calculatedPrice * 1.15 * nights);
      case 'per_night_excl':
      default:
        return rt.calculatedPrice;
    }
  };

  const getDisplayBasePrice = (rt: RoomTypeDetail) => {
    const nights = getNightsCount();
    switch (priceShowOption) {
      case 'per_night_incl':
        return Math.round(rt.basePrice * 1.15);
      case 'total_excl':
        return rt.basePrice * nights;
      case 'total_incl':
        return Math.round(rt.basePrice * 1.15 * nights);
      case 'per_night_excl':
      default:
        return rt.basePrice;
    }
  };

  const getPriceSubtitle = () => {
    const nights = getNightsCount();
    switch (priceShowOption) {
      case 'per_night_incl':
        return language === 'vi' ? 'Mỗi phòng mỗi đêm (bao gồm thuế và phí)' : 'Room per night (incl. tax & fees)';
      case 'total_excl':
        return language === 'vi' ? `Tổng giá cho ${nights} đêm (chưa bao gồm thuế và phí)` : `Total price for ${nights} nights (excl. tax & fees)`;
      case 'total_incl':
        return language === 'vi' ? `Tổng giá cho ${nights} đêm (bao gồm thuế và phí)` : `Total price for ${nights} nights (incl. tax & fees)`;
      case 'per_night_excl':
      default:
        return language === 'vi' ? 'Mỗi phòng mỗi đêm (chưa bao gồm thuế và phí)' : 'Room per night (excl. tax & fees)';
    }
  };

  const matchTag = (rt: RoomTypeDetail, tag: string) => {
    const lowerName = rt.name.toLowerCase();
    const lowerDesc = rt.description.toLowerCase();
    switch (tag) {
      case 'Miễn phí hủy phòng':
        return true;
      case 'Extra Benefit':
        return rt.basePrice > 1500000 || lowerName.includes('suite') || lowerName.includes('deluxe') || lowerDesc.includes('hồ');
      case 'Giường lớn':
        return rt.bedCount >= 1 || lowerName.includes('double') || lowerName.includes('suite') || lowerName.includes('đôi') || lowerName.includes('giường lớn');
      case 'Miễn phí bữa sáng':
        return rt.basePrice > 1000000 || lowerName.includes('sáng') || lowerDesc.includes('sáng') || lowerName.includes('breakfast');
      default:
        return true;
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const groupRoomTypes = () => {
    if (!hotel || !hotel.roomTypes) return [];
    
    const groups: { baseName: string; roomTypes: RoomTypeDetail[] }[] = [];
    
    // Lọc theo tag được chọn
    const filteredRoomTypes = hotel.roomTypes.filter((rt) => {
      return selectedTags.every((tag) => matchTag(rt, tag));
    });
    
    filteredRoomTypes.forEach((rt) => {
      // Tách tên loại phòng dựa trên ký tự -, ( hoặc [ để lấy tên cơ sở (ví dụ: "Phòng Deluxe Double")
      const parts = rt.name.split(/[-([|]/);
      const baseName = parts[0].trim();
      
      const existing = groups.find(g => g.baseName.toLowerCase() === baseName.toLowerCase());
      if (existing) {
        existing.roomTypes.push(rt);
      } else {
        groups.push({
          baseName,
          roomTypes: [rt]
        });
      }
    });
    
    return groups;
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/hotels/${id}`, {
        params: { checkIn, checkOut }
      });
      if (res.data.success) {
        setHotel(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch hotel details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, checkIn, checkOut]);

  // Icon mapping
  const getAmenityIcon = (name: string, className: string = "w-5 h-5") => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className={className} />;
    if (lower.includes('hồ bơi') || lower.includes('bể bơi') || lower.includes('pool') || lower.includes('bể sục')) return <Waves className={className} />;
    if (lower.includes('đỗ xe') || lower.includes('đậu xe') || lower.includes('bãi xe') || lower.includes('parking')) return <ParkingCircle className={className} />;
    if (lower.includes('gym') || lower.includes('thể hình') || lower.includes('fitness') || lower.includes('tập thể dục')) return <Dumbbell className={className} />;
    if (lower.includes('điều hòa') || lower.includes('máy lạnh') || lower.includes('air') || lower.includes('lạnh')) return <Sparkles className={className} />;
    if (lower.includes('nhà hàng') || lower.includes('ăn uống') || lower.includes('dining')) return <Utensils className={className} />;
    if (lower.includes('bar') || lower.includes('lounge') || lower.includes('cocktail')) return <GlassWater className={className} />;
    if (lower.includes('spa') || lower.includes('massage') || lower.includes('xông hơi')) return <Sparkles className={className} />;
    if (lower.includes('tắm') || lower.includes('vòi sen') || lower.includes('toilet') || lower.includes('bath') || lower.includes('vệ sinh')) return <Bath className={className} />;
    if (lower.includes('giường') || lower.includes('phòng ngủ') || lower.includes('tủ') || lower.includes('ga') || lower.includes('pillow') || lower.includes('bed')) return <Bed className={className} />;
    if (lower.includes('ngoài trời') || lower.includes('sân') || lower.includes('vườn') || lower.includes('hiên') || lower.includes('ban công') || lower.includes('outdoor')) return <Trees className={className} />;
    if (lower.includes('an ninh') || lower.includes('bảo vệ') || lower.includes('cctv') || lower.includes('báo cháy') || lower.includes('báo động') || lower.includes('security')) return <ShieldCheck className={className} />;
    if (lower.includes('tv') || lower.includes('tivi') || lower.includes('truyền hình') || lower.includes('màn hình')) return <Tv className={className} />;
    if (lower.includes('tiếng') || lower.includes('ngôn ngữ') || lower.includes('language')) return <Globe className={className} />;
    return <Sparkles className={className} />;
  };

  const translateAmenityName = (name: string) => {
    if (language === 'vi') return name;
    const lower = name.toLowerCase().trim();
    if (lower.includes('wifi') || lower.includes('internet')) return 'Free Wifi';
    if (lower === 'hồ bơi') return 'Swimming Pool';
    if (lower === 'bãi đỗ xe') return 'Parking Space';
    if (lower === 'phòng gym / thể hình') return 'Fitness Center / Gym';
    if (lower === 'điều hòa nhiệt độ') return 'Air Conditioning';
    if (lower === 'nhà hàng ăn uống') return 'Restaurant & Dining';
    if (lower === 'dịch vụ spa / massage') return 'Spa & Massage';
    if (lower === 'quầy bar / lounge') return 'Bar & Lounge';
    return name;
  };

  const handleBookRoom = (roomTypeId: string) => {
    navigate('/checkout', {
      state: {
        hotelId: hotel?.id,
        hotelName: hotel?.name,
        roomTypeId,
        quantity: selectedQuantities[roomTypeId] || 1,
        checkInDate: checkIn,
        checkOutDate: checkOut
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-96 bg-slate-200 rounded-premium"></div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-48 bg-slate-200 rounded-premium"></div>
          <div className="h-48 bg-slate-200 rounded-premium"></div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-semibold">{t.notFound}</p>
      </div>
    );
  }

  // Airbnb style photos layout
  const mainPhoto = hotel.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945';
  const subPhotos = hotel.images.slice(1, 5);

  // Tính điểm đánh giá theo tiêu chí mẫu nếu chưa lưu chi tiết
  const criteriaScores = hotel.reviews.length > 0 ? {
    cleanliness: parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingCleanliness), 0) / hotel.reviews.length).toFixed(1)),
    location: parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingLocation), 0) / hotel.reviews.length).toFixed(1)),
    service: parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingService), 0) / hotel.reviews.length).toFixed(1)),
    facilities: parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingFacilities), 0) / hotel.reviews.length).toFixed(1)),
    value: parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingValue), 0) / hotel.reviews.length).toFixed(1)),
  } : { cleanliness: 0, location: 0, service: 0, facilities: 0, value: 0 };

  const displayAverageRating = hotel.reviews.length > 0
    ? parseFloat((hotel.reviews.reduce((s, r) => s + normalizeRating(r.ratingOverall), 0) / hotel.reviews.length).toFixed(1))
    : 0;

  // Group amenities by category for detailed display
  const groupAmenities = () => {
    const grouped: Record<string, { titleVi: string; titleEn: string; icon: React.ReactNode; items: string[] }> = {
      bathroom: {
        titleVi: 'Phòng tắm',
        titleEn: 'Bathroom',
        icon: <Bath className="w-5 h-5 text-slate-800" />,
        items: []
      },
      bedroom: {
        titleVi: 'Phòng ngủ',
        titleEn: 'Bedroom',
        icon: <Bed className="w-5 h-5 text-slate-800" />,
        items: []
      },
      outdoor: {
        titleVi: 'Ngoài trời',
        titleEn: 'Outdoors',
        icon: <Trees className="w-5 h-5 text-slate-800" />,
        items: []
      },
      kitchen: {
        titleVi: 'Nhà bếp',
        titleEn: 'Kitchen',
        icon: <Utensils className="w-5 h-5 text-slate-800" />,
        items: []
      },
      room: {
        titleVi: 'Tiện ích trong phòng',
        titleEn: 'Room Amenities',
        icon: <Sparkles className="w-5 h-5 text-slate-800" />,
        items: []
      },
      media: {
        titleVi: 'Truyền thông & Công nghệ',
        titleEn: 'Media & Technology',
        icon: <Tv className="w-5 h-5 text-slate-800" />,
        items: []
      },
      internet: {
        titleVi: 'Internet',
        titleEn: 'Internet',
        icon: <Wifi className="w-5 h-5 text-slate-800" />,
        items: []
      },
      parking: {
        titleVi: 'Chỗ đậu xe',
        titleEn: 'Parking',
        icon: <ParkingCircle className="w-5 h-5 text-slate-800" />,
        items: []
      },
      services: {
        titleVi: 'Dịch vụ & Tiện ích giải trí',
        titleEn: 'Services & Leisure',
        icon: <User className="w-5 h-5 text-slate-800" />,
        items: []
      },
      security: {
        titleVi: 'An ninh',
        titleEn: 'Security',
        icon: <ShieldCheck className="w-5 h-5 text-slate-800" />,
        items: []
      },
      general: {
        titleVi: 'Tổng quát',
        titleEn: 'General',
        icon: <Building2 className="w-5 h-5 text-slate-800" />,
        items: []
      },
      languages: {
        titleVi: 'Ngôn ngữ được sử dụng',
        titleEn: 'Languages Spoken',
        icon: <Globe className="w-5 h-5 text-slate-800" />,
        items: []
      }
    };

    hotel.amenities.forEach(({ amenity }) => {
      const name = amenity.name;
      const lower = name.toLowerCase();

      if (lower.includes('wifi') || lower.includes('internet')) {
        grouped.internet.items.push(name);
      } else if (lower.includes('đỗ xe') || lower.includes('đậu xe') || lower.includes('bãi xe') || lower.includes('parking')) {
        grouped.parking.items.push(name);
      } else if (lower.includes('tắm') || lower.includes('sen') || lower.includes('toilet') || lower.includes('bồn') || lower.includes('khăn tắm') || lower.includes('vệ sinh')) {
        grouped.bathroom.items.push(name);
      } else if (lower.includes('giường') || lower.includes('mền') || lower.includes('gối') || lower.includes('chăn') || lower.includes('tủ quần áo') || lower.includes('bed')) {
        grouped.bedroom.items.push(name);
      } else if (lower.includes('ngoài trời') || lower.includes('sân') || lower.includes('vườn') || lower.includes('ban công') || lower.includes('hiên') || lower.includes('thượng')) {
        grouped.outdoor.items.push(name);
      } else if (lower.includes('bếp') || lower.includes('lò') || lower.includes('ấm đun') || lower.includes('nấu') || lower.includes('tủ lạnh')) {
        grouped.kitchen.items.push(name);
      } else if (lower.includes('tv') || lower.includes('tivi') || lower.includes('màn hình') || lower.includes('truyền hình')) {
        grouped.media.items.push(name);
      } else if (lower.includes('an ninh') || lower.includes('bảo vệ') || lower.includes('cctv') || lower.includes('báo cháy') || lower.includes('báo động') || lower.includes('chữa cháy')) {
        grouped.security.items.push(name);
      } else if (lower.includes('tiếng') || lower.includes('ngôn ngữ') || lower.includes('dịch thuật')) {
        grouped.languages.items.push(name);
      } else if (lower.includes('dọn phòng') || lower.includes('giặt') || lower.includes('đón tiễn') || lower.includes('lễ tân') || lower.includes('trông trẻ')) {
        grouped.services.items.push(name);
      } else if (lower.includes('điều hòa') || lower.includes('máy lạnh') || lower.includes('thang máy') || lower.includes('hút thuốc') || lower.includes('cách âm') || lower.includes('quạt')) {
        grouped.general.items.push(name);
      } else if (lower.includes('giá treo') || lower.includes('két sắt') || lower.includes('tiện ích phòng') || lower.includes('bàn làm việc')) {
        grouped.room.items.push(name);
      } else {
        if (lower.includes('dịch vụ') || lower.includes('spa') || lower.includes('massage') || lower.includes('bar') || lower.includes('hồ bơi') || lower.includes('bể bơi') || lower.includes('gym')) {
          grouped.services.items.push(name);
        } else {
          grouped.general.items.push(name);
        }
      }
    });

    return Object.values(grouped).filter(cat => cat.items.length > 0);
  };

  const groupedAmenities = groupAmenities();

  return (
    <div>
      {/* Banner & Search bar section wrapper */}
      <div className="relative">
        {/* Hero Section */}
        <section
          style={{ backgroundImage: "url('/banner.webp')" }}
          className="relative bg-cover bg-center text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8 shadow-2xl overflow-hidden min-h-[170px] flex items-center justify-center"
        >
          {/* Lớp phủ tối nhẹ sắc nét bảo vệ độ tương phản chữ */}
          <div className="absolute inset-0 bg-black/35 z-0"></div>

          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="max-w-4xl mx-auto w-full text-center space-y-1 relative z-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              {language === 'vi' ? 'Khám phá chi tiết phòng nghỉ lý tưởng' : 'Discover Your Perfect Room Details'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-200 max-w-xl mx-auto font-light">
              {language === 'vi' ? 'Tìm phòng, so sánh giá cả và đặt phòng trống ngay tức thì.' : 'Find rooms, compare prices and book available rooms instantly.'}
            </p>
          </div>
        </section>

        {/* Booking.com Style Standard Search Bar */}
        <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 relative z-30 -mt-8">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-[#febb02] p-[4px] rounded-lg flex flex-col lg:flex-row gap-[4px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] w-full items-stretch"
          >
            {/* Destination Panel - Interactive text input */}
            <div className={`flex-grow lg:flex-[2.4] bg-white px-4 h-[62px] flex items-center gap-3 rounded-t-md lg:rounded-l-md lg:rounded-tr-none relative border-2 ${destError ? 'border-red-500' : 'border-transparent'}`}>
              <Building2 className={`w-6 h-6 shrink-0 ${destError ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              <input
                type="text"
                value={destInputText}
                onChange={handleDestInputChange}
                onFocus={() => {
                  setShowDestPopover(true);
                  setShowDatePopover(false);
                  setShowGuestPopover(false);
                }}
                placeholder={destError ? (language === 'vi' ? 'Vui lòng nhập địa điểm!' : 'Please enter a destination!') : (language === 'vi' ? 'Bạn muốn đến đâu?' : 'Where are you going?')}
                className={`w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none border-none p-1 ${destError ? 'placeholder-red-500 text-red-500' : 'placeholder-slate-450 placeholder:font-bold placeholder:text-slate-800'}`}
              />
              {destInputText && (
                <button
                  type="button"
                  onClick={() => {
                    setDestInputText('');
                    setProvinceId('');
                  }}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Popover Destination */}
              {showDestPopover && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDestPopover(false)} />
                  <div className="absolute top-full left-0 mt-2 w-full sm:w-[400px] bg-white rounded-lg shadow-2xl border border-slate-100 p-4 z-40 text-slate-800">
                    <div className="space-y-4 text-left">
                      {!destInputText.trim() ? (
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2">{language === 'vi' ? 'Điểm đến phổ biến' : 'Popular destinations'}</h4>
                          <div className="space-y-1">
                            {PROVINCES.map((prov) => (
                              <div
                                key={prov.id}
                                onClick={() => {
                                  setProvinceId(prov.id);
                                  setDestInputText(translateProvinceName(prov.name, language));
                                  setShowDestPopover(false);
                                }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="font-bold text-sm text-slate-900">{translateProvinceName(prov.name, language)}</p>
                                  <p className="text-[10px] font-bold text-slate-550">{language === 'vi' ? 'Việt Nam' : 'Vietnam'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {matchedProvinces.length > 0 ? (
                            <div className="space-y-1">
                              {matchedProvinces.map((prov) => (
                                <div
                                  key={prov.id}
                                  onClick={() => {
                                    setProvinceId(prov.id);
                                    setDestInputText(translateProvinceName(prov.name, language));
                                    setShowDestPopover(false);
                                  }}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                                  <div>
                                    <p className="font-bold text-sm text-slate-900">{translateProvinceName(prov.name, language)}</p>
                                    <p className="text-[10px] font-bold text-slate-550">{language === 'vi' ? 'Điểm đến · Việt Nam' : 'Destination · Vietnam'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-slate-400 py-2 text-center">{language === 'vi' ? 'Không tìm thấy kết quả phù hợp' : 'No matching results found'}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dates Panel */}
            <div className="flex-grow lg:flex-[2.0] bg-white px-4 h-[62px] flex items-center gap-3 relative">
              <CalendarIcon className="w-6 h-6 text-slate-400 shrink-0" />
              <div
                onClick={() => {
                  setShowDatePopover(!showDatePopover);
                  setShowDestPopover(false);
                  setShowGuestPopover(false);
                }}
                className="flex-grow text-left cursor-pointer select-none"
              >
                <p className="text-sm font-bold text-slate-900">{formatDateDisplay()}</p>
              </div>

              {/* Popover Dates Calendar Grid */}
              {showDatePopover && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowDatePopover(false)} />
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 lg:translate-x-0 lg:left-0 mt-2 w-[90vw] sm:w-[760px] bg-white rounded-lg shadow-2xl border border-slate-155 p-5 z-40 text-slate-800">
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex pb-1">
                        <button
                          type="button"
                          className="flex-1 pb-2 text-sm font-bold border-b-2 border-blue-600 text-blue-600"
                        >
                          {language === 'vi' ? 'Lịch' : 'Calendar'}
                        </button>
                      </div>

                      {/* Two calendars side by side */}
                      <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                        {/* Month 1 */}
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-4">
                            <button type="button" onClick={handlePrevMonths} className="p-1 hover:bg-slate-100 rounded">
                              &lt;
                            </button>
                            <span className="text-sm font-extrabold capitalize text-slate-900">
                              {monthNames[month1]} {year1}
                            </span>
                            <span className="w-6"></span>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <span key={d}>{d}</span>)}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(year1, month1).map((date, idx) => {
                              if (!date) return <div key={`empty-1-${idx}`} className="h-9"></div>;
                              const dStr = date.toISOString().split('T')[0];
                              const isToday = dStr === today.toISOString().split('T')[0];
                              const isPast = dStr < today.toISOString().split('T')[0];
                              const selected = isSelected(dStr);
                              const range = isInRange(dStr) || isInHoverRange(dStr);

                              return (
                                <button
                                  type="button"
                                  key={`day-1-${dStr}`}
                                  disabled={isPast}
                                  onClick={() => handleDayClick(dStr)}
                                  onMouseEnter={() => handleDayMouseEnter(dStr)}
                                  className={`h-9 w-9 text-xs rounded-full flex items-center justify-center font-bold transition-all relative
                                    ${isPast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-800 hover:bg-slate-100'}
                                    ${selected ? 'bg-[#006ce4] text-white hover:bg-[#006ce4]' : ''}
                                    ${range && !selected ? 'bg-blue-50 text-[#006ce4] rounded-none' : ''}
                                    ${isToday && !selected ? 'border border-primary' : ''}
                                  `}
                                >
                                  {date.getDate()}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Month 2 */}
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-4">
                            <span className="w-6"></span>
                            <span className="text-sm font-extrabold capitalize text-slate-900">
                              {monthNames[month1 === 11 ? 0 : month1 + 1]} {month1 === 11 ? year1 + 1 : year1}
                            </span>
                            <button type="button" onClick={handleNextMonths} className="p-1 hover:bg-slate-100 rounded">
                              &gt;
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <span key={d}>{d}</span>)}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(month1 === 11 ? year1 + 1 : year1, month1 === 11 ? 0 : month1 + 1).map((date, idx) => {
                              if (!date) return <div key={`empty-2-${idx}`} className="h-9"></div>;
                              const dStr = date.toISOString().split('T')[0];
                              const isPast = dStr < today.toISOString().split('T')[0];
                              const selected = isSelected(dStr);
                              const range = isInRange(dStr) || isInHoverRange(dStr);

                              return (
                                <button
                                  type="button"
                                  key={`day-2-${dStr}`}
                                  disabled={isPast}
                                  onClick={() => handleDayClick(dStr)}
                                  onMouseEnter={() => handleDayMouseEnter(dStr)}
                                  className={`h-9 w-9 text-xs rounded-full flex items-center justify-center font-bold transition-all relative
                                    ${isPast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-800 hover:bg-slate-100'}
                                    ${selected ? 'bg-[#006ce4] text-white hover:bg-[#006ce4]' : ''}
                                    ${range && !selected ? 'bg-blue-50 text-[#006ce4] rounded-none' : ''}
                                  `}
                                >
                                  {date.getDate()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowDatePopover(false)}
                          className="bg-[#006ce4] hover:bg-[#0056b3] text-white font-bold text-sm px-8 py-2.5 rounded-lg transition-colors"
                        >
                          {language === 'vi' ? 'Xong' : 'Done'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Guests Panel */}
            <div className="flex-grow lg:flex-[2.6] bg-white px-4 h-[62px] flex items-center gap-3 relative">
              <User className="w-6 h-6 text-slate-400 shrink-0" />
              <div
                onClick={() => {
                  setShowGuestPopover(!showGuestPopover);
                  setShowDestPopover(false);
                  setShowDatePopover(false);
                }}
                className="flex-grow flex items-center justify-between cursor-pointer select-none"
              >
                <p className="text-sm font-bold text-slate-900">
                  {adults} {language === 'vi' ? 'người lớn' : 'adults'} · {children} {language === 'vi' ? 'trẻ em' : 'children'} · {rooms} {language === 'vi' ? 'phòng' : 'rooms'}
                </p>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              </div>

              {/* Popover Guests */}
              {showGuestPopover && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowGuestPopover(false)} />
                  <div className="absolute top-full right-0 mt-2 w-full sm:w-[280px] bg-white rounded-lg shadow-2xl border border-slate-100 p-4 z-40 text-slate-800">
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-slate-900">{language === 'vi' ? 'Người lớn' : 'Adults'}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={adults <= 1}
                            onClick={() => setAdults(adults - 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 disabled:border-slate-200 disabled:text-slate-300 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            —
                          </button>
                          <span className="w-5 text-center font-bold text-sm text-slate-900">{adults}</span>
                          <button
                            type="button"
                            onClick={() => setAdults(adults + 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-slate-900">{language === 'vi' ? 'Trẻ em' : 'Children'}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={children <= 0}
                            onClick={() => setChildren(children - 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 disabled:border-slate-200 disabled:text-slate-300 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            —
                          </button>
                          <span className="w-5 text-center font-bold text-sm text-slate-900">{children}</span>
                          <button
                            type="button"
                            onClick={() => setChildren(children + 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Rooms */}
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-slate-900">{language === 'vi' ? 'Phòng' : 'Rooms'}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={rooms <= 1}
                            onClick={() => setRooms(rooms - 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 disabled:border-slate-200 disabled:text-slate-300 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            —
                          </button>
                          <span className="w-5 text-center font-bold text-sm text-slate-900">{rooms}</span>
                          <button
                            type="button"
                            onClick={() => setRooms(rooms + 1)}
                            className="w-8 h-8 rounded border border-blue-600 text-blue-600 flex items-center justify-center font-bold text-lg hover:bg-blue-50/50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowGuestPopover(false)}
                        className="w-full bg-[#006ce4] hover:bg-[#0056b3] text-white font-bold text-xs py-2 rounded-lg transition-colors mt-2"
                      >
                        {language === 'vi' ? 'Xong' : 'Done'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-[#006ce4] hover:bg-[#0056b3] text-white font-bold text-base px-8 h-[62px] rounded-b-md lg:rounded-r-md lg:rounded-bl-none transition-colors shrink-0 flex items-center justify-center min-w-[120px]"
            >
              {language === 'vi' ? 'Tìm' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Details Body Container - A single unified white box sheet */}
      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 space-y-10 shadow-sm">
          
          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{hotel.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-[#ebf3ff] text-[#006ce4] px-2.5 py-1 rounded">
                  {translateCategoryName(hotel.category.name, language)}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                    <StarIcon key={i} size={16} />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 shrink-0">
              <MapPin className="w-5 h-5 text-[#006ce4] shrink-0" />
              <span className="text-sm font-bold text-slate-700">
                {translateAddress(hotel.address, hotel.district.name, hotel.province.name, language)}
              </span>
            </div>
          </div>

          {/* Airbnb style Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[350px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-100 bg-white">
            <div className="md:col-span-2 h-full overflow-hidden">
              <img src={mainPhoto} alt={hotel.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="hidden md:grid grid-cols-2 col-span-2 gap-3 h-full">
              {subPhotos.map((img, i) => (
                <div key={i} className="w-full h-full overflow-hidden">
                  <img
                    src={img.url}
                    alt={`${hotel.name} room ${i}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
              {/* Fallback if less than 5 photos */}
              {Array.from({ length: 4 - subPhotos.length }).map((_, i) => (
                <div key={i} className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 text-xs font-medium border border-dashed border-slate-200 rounded-lg">
                  {t.bedroomFallback}
                </div>
              ))}
            </div>
          </div>

          {/* Main Details and Amenities Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            {/* About Property */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#006ce4] rounded-full inline-block"></span>
                {t.about}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {hotel.description}
              </p>
            </div>

            {/* Amenities List */}
            <div className="space-y-4">
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#006ce4] rounded-full inline-block"></span>
                {t.amenities}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hotel.amenities.map(({ amenity }) => (
                  <div key={amenity.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                    <div className="text-[#006ce4] shrink-0">{getAmenityIcon(amenity.name)}</div>
                    <span className="text-xs font-bold text-slate-700 leading-tight">{translateAmenityName(amenity.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />
          <section className="space-y-6">
            {/* Header of Room Selection */}
            <div className="pb-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {language === 'vi' ? `Những phòng còn trống tại ${hotel.name}` : `Available rooms at ${hotel.name}`}
              </h2>
            </div>

            {/* Quick Filters and Price Display Options */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-slate-800 font-bold text-sm sm:text-base leading-tight">
                  {language === 'vi' ? 'Tìm kiếm nhanh hơn bằng cách chọn những tiện nghi bạn cần' : 'Find faster by selecting the amenities you need'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Miễn phí hủy phòng', 'Extra Benefit', 'Giường lớn ⓘ', 'Miễn phí bữa sáng'].map((tag) => {
                    const lookupTag = tag.replace(' ⓘ', '');
                    const isActive = selectedTags.includes(lookupTag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(lookupTag)}
                        className={`font-semibold text-xs px-4 py-2 rounded-full transition-colors active:scale-95 shadow-sm ${
                          isActive
                            ? 'bg-[#006ce4] text-white hover:bg-[#0056b3]'
                            : 'bg-[#f0f4fa] text-[#006ce4] hover:bg-[#e2edf8]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-l border-slate-200 pl-6 flex flex-col justify-center min-w-[260px] self-stretch md:self-auto">
                <span className="text-[10px] font-bold text-slate-500 mb-1">
                  {language === 'vi' ? 'Hiển thị giá' : 'Show price'}
                </span>
                <div className="relative">
                  <select
                    value={priceShowOption}
                    onChange={(e) => setPriceShowOption(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-xs pl-3 pr-8 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm w-full cursor-pointer"
                  >
                    <option value="per_night_excl">
                      {language === 'vi' ? 'Mỗi phòng mỗi đêm (chưa bao gồm thuế và phí)' : 'Room per night (excl. tax & fees)'}
                    </option>
                    <option value="per_night_incl">
                      {language === 'vi' ? 'Mỗi phòng mỗi đêm (bao gồm thuế và phí)' : 'Room per night (incl. tax & fees)'}
                    </option>
                    <option value="total_excl">
                      {language === 'vi' ? `Tổng giá (chưa bao gồm thuế và phí)` : `Total price (excl. tax & fees)`}
                    </option>
                    <option value="total_incl">
                      {language === 'vi' ? `Tổng giá (bao gồm thuế và phí)` : `Total price (incl. tax & fees)`}
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* List of Room Types Blocks */}
            <div className="space-y-6">
              {groupRoomTypes().map((group) => {
                const representative = group.roomTypes[0];
                return (
                  <div key={group.baseName} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                    {/* Room Type Header spanning full width at top */}
                    <h3 className="font-extrabold text-slate-900 text-xl pb-1">{group.baseName}</h3>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* Left Column: Room visual info (no borders, no backgrounds, larger image) */}
                      <div className="w-full lg:w-[350px] flex flex-col gap-4 shrink-0 bg-white">
                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] w-full bg-slate-100 shadow-sm group">
                          {(() => {
                            const imgIdx = activeImageIndices[group.baseName] || 0;
                            const roomImages = representative.images && representative.images.length > 0
                              ? representative.images
                              : [{ url: 'https://images.unsplash.com/photo-1611891405788-d880227f73b4' }];
                            return (
                              <>
                                <img
                                  src={roomImages[imgIdx]?.url}
                                  alt={group.baseName}
                                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                                />
                                {roomImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setActiveImageIndices(prev => ({
                                        ...prev,
                                        [group.baseName]: imgIdx === 0 ? roomImages.length - 1 : imgIdx - 1
                                      }))}
                                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 active:scale-95 flex items-center justify-center"
                                    >
                                      <ChevronLeft className="w-4 h-4 text-slate-800" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveImageIndices(prev => ({
                                        ...prev,
                                        [group.baseName]: (imgIdx + 1) % roomImages.length
                                      }))}
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 active:scale-95 flex items-center justify-center"
                                    >
                                      <ChevronRight className="w-4 h-4 text-slate-800" />
                                    </button>
                                  </>
                                )}
                                {/* Carousel dots */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                                  {roomImages.map((_, i) => (
                                    <span
                                      key={i}
                                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        i === imgIdx ? 'bg-[#006ce4]' : 'bg-white/70'
                                      }`}
                                    ></span>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Specs: NO background, NO borders, larger text */}
                        <div className="space-y-3 text-sm text-slate-700 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-base">📐</span>
                            <span>{language === 'vi' ? 'Diện tích:' : 'Size:'} {representative.size || 25} m²</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-base">🛏️</span>
                            <span>{representative.bedCount} {language === 'vi' ? 'Giường lớn' : 'Large beds'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Wifi className="w-4.5 h-4.5 text-[#006ce4] shrink-0" />
                            <span>{language === 'vi' ? 'WiFi miễn phí' : 'Free WiFi'}</span>
                          </div>

                          {/* Basic amenities list */}
                          <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-slate-500 font-semibold text-xs">
                            {representative.amenities.slice(0, 4).map((a) => (
                              <div key={a} className="flex items-center gap-1.5">
                                <span className="text-slate-355">•</span>
                                <span>{translateAmenityName(a)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Details button */}
                        <button
                          type="button"
                          onClick={() => setSelectedRoomForModal(representative)}
                          className="w-full bg-[#006ce4] hover:bg-[#0056b3] text-white font-extrabold text-xs py-2.5 px-4 rounded-full flex items-center justify-center gap-1 shadow transition-colors active:scale-95 mt-2"
                        >
                          {language === 'vi' ? 'Xem chi tiết phòng' : 'View room details'}
                          <span className="text-[10px]">▶</span>
                        </button>
                      </div>

                      {/* Right Column: Options Table wrapped in a border box, larger text */}
                      <div className="w-full lg:flex-1 overflow-x-auto">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="min-w-full divide-y divide-slate-200 text-sm table-fixed w-full">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <tr>
                                <th className="px-5 py-3.5 w-[32%] text-left border-r border-slate-200">{language === 'vi' ? 'Lựa chọn phòng' : 'Room options'}</th>
                                <th className="px-2 py-3.5 text-center w-[10%] border-r border-slate-200">{language === 'vi' ? 'Khách' : 'Guests'}</th>
                                <th className="px-4 py-3.5 w-[25%] text-right border-r border-slate-200">{language === 'vi' ? 'Giá/phòng/đêm' : 'Price/room/night'}</th>
                                <th className="px-2 py-3.5 text-center w-[15%] border-r border-slate-200">{language === 'vi' ? 'Phòng' : 'Rooms'}</th>
                                <th className="px-2 py-3.5 text-center w-[18%]"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium bg-white text-xs sm:text-sm">
                              {group.roomTypes.map((rt) => {
                                const maxQty = rt.availableRooms;
                                const qty = maxQty <= 0 ? 0 : Math.min(selectedQuantities[rt.id] || 1, maxQty);
                                const priceQty = Math.max(1, qty);
                                return (
                                  <tr key={rt.id} className="hover:bg-slate-50/50 transition-colors">
                                    {/* Option Name & Description from DB */}
                                    <td className="px-5 py-5 w-[32%] space-y-2 border-r border-slate-100 break-words">
                                      <p className="font-extrabold text-slate-900 text-sm sm:text-base break-words">{rt.name}</p>
                                      <p className="text-xs text-slate-500 font-normal leading-relaxed break-words">{rt.description}</p>
                                      
                                      {/* Policy based on DB amenities */}
                                      <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                                        <span>✓</span> {language === 'vi' ? 'Chính sách tiêu chuẩn' : 'Standard policy'}
                                      </p>
                                      
                                      {/* Render DB amenities as mini badges */}
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {rt.amenities.map((a) => (
                                          <span key={a} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                            {translateAmenityName(a)}
                                          </span>
                                        ))}
                                      </div>
                                    </td>

                                    {/* Capacity */}
                                    <td className="px-2 py-5 w-[10%] border-r border-slate-100">
                                      <div className="flex justify-center items-center gap-0.5 text-slate-600">
                                        {Array.from({ length: Math.min(rt.capacity, 3) }).map((_, i) => (
                                          <span key={i} className="text-base">👤</span>
                                        ))}
                                        {rt.capacity > 3 && <span className="text-xs font-bold">+{rt.capacity - 3}</span>}
                                      </div>
                                    </td>

                                    {/* Price per night */}
                                    <td className="px-4 py-5 w-[25%] border-r border-slate-100 text-right">
                                      <p className="font-black text-[#ff4d42] text-base sm:text-lg leading-none">
                                        {formatPrice(getDisplayPrice(rt) * priceQty, currency)}
                                      </p>
                                      {rt.calculatedPrice !== rt.basePrice && (
                                        <p className="text-xs text-slate-400 font-normal line-through mt-1.5">
                                          {formatPrice(getDisplayBasePrice(rt) * priceQty, currency)}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-500 font-normal mt-1 leading-tight">
                                        {getPriceSubtitle()}
                                      </p>
                                    </td>

                                    {/* Room Select Dropdown */}
                                    <td className="px-2 py-5 w-[15%] border-r border-slate-100 font-bold text-slate-800">
                                      <div className="flex justify-center items-center">
                                        <select
                                          value={qty}
                                          disabled={maxQty <= 0}
                                          onChange={(e) => setSelectedQuantities(prev => ({ ...prev, [rt.id]: Number(e.target.value) }))}
                                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm w-16 disabled:bg-slate-50 disabled:text-slate-400"
                                        >
                                          {maxQty <= 0 ? (
                                            <option value={0}>x0</option>
                                          ) : (
                                            Array.from({ length: maxQty }).map((_, i) => (
                                              <option key={i + 1} value={i + 1}>x{i + 1}</option>
                                            ))
                                          )}
                                        </select>
                                      </div>
                                    </td>

                                    {/* Action Button */}
                                    <td className="px-2 py-5 w-[18%] text-center">
                                      <div className="space-y-1.5 flex flex-col items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => handleBookRoom(rt.id)}
                                          disabled={rt.isBlocked || rt.availableRooms <= 0}
                                          className="bg-[#006ce4] hover:bg-[#0056b3] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm py-2.5 rounded-lg transition-all active:scale-[0.98] shadow-sm w-24 text-center"
                                        >
                                          {language === 'vi' ? 'Chọn' : 'Select'}
                                        </button>
                                        {rt.isBlocked ? (
                                          <p className="text-[10px] text-slate-400 font-black whitespace-nowrap">
                                            {t.roomClosed}
                                          </p>
                                        ) : rt.availableRooms <= 0 ? (
                                          <p className="text-[10px] text-red-500 font-black whitespace-nowrap">
                                            {t.noRoomsAvailable}
                                          </p>
                                        ) : rt.availableRooms <= 5 ? (
                                          <p className="text-[10px] text-red-500 font-black whitespace-nowrap">
                                            {language === 'vi' ? `Chỉ còn ${rt.availableRooms} phòng` : `Only ${rt.availableRooms} left`}
                                          </p>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Nearby Locations Section */}
          <section className="space-y-6 pt-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-1.5 h-6 bg-[#006ce4] rounded-full inline-block"></span>
              {language === 'vi' ? `Xung quanh ${hotel.name} có gì` : `What's around ${hotel.name}`}
            </h2>
            {hotel.address && (
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 -mt-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {translateAddress(hotel.address, hotel.district.name, hotel.province.name, language)}
              </p>
            )}

            {/* Google Map Embed Iframe Container (Click to open Fullscreen Modal) */}
            <div
              onClick={() => {
                setActiveMapQuery(hotel.name + ' ' + (hotel.address || ''));
                setIsMapModalOpen(true);
              }}
              className="w-full h-[280px] rounded-premium overflow-hidden border border-slate-200 shadow-sm relative cursor-pointer group"
            >
              {/* Overlay blocking events and showing prompt on hover */}
              <div className="absolute inset-0 z-10 bg-transparent hover:bg-slate-900/5 transition-all flex items-center justify-center">
                <span className="bg-white/95 text-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1.5 border border-slate-100">
                  <Compass className="w-3.5 h-3.5 animate-spin-slow text-[#006ce4]" />
                  {language === 'vi' ? 'Nhấn để mở bản đồ tương tác' : 'Click to open interactive map'}
                </span>
              </div>
              <LeafletMap
                lat={hotel.latitude || 11.94}
                lng={hotel.longitude || 108.44}
                hotelName={hotel.name}
              />
            </div>

            {/* 4 Column Nearby Grid */}
            {hotel.nearbyLocations && hotel.nearbyLocations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                {/* Column 1: Địa Điểm Lân Cận */}
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MapPin className="w-4.5 h-4.5 text-[#006ce4]" />
                    {language === 'vi' ? 'Địa Điểm Lân Cận' : 'Nearby Landmarks'}
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-655 font-bold">
                    {hotel.nearbyLocations
                      .filter((loc: any) => loc.type === 'NEARBY')
                      .map((loc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className="line-clamp-1 font-semibold text-slate-700">{loc.name}</span>
                          <span className="text-slate-450 font-normal shrink-0">{loc.distance}</span>
                        </div>
                      ))}
                    {hotel.nearbyLocations.filter((loc: any) => loc.type === 'NEARBY').length === 0 && (
                      <p className="text-slate-400 font-normal text-[11px] italic">{language === 'vi' ? 'Không có thông tin' : 'No information'}</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Trung tâm Giao thông */}
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Compass className="w-4.5 h-4.5 text-[#006ce4]" />
                    {language === 'vi' ? 'Trung tâm Giao thông' : 'Transportation'}
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-655 font-bold">
                    {hotel.nearbyLocations
                      .filter((loc: any) => loc.type === 'TRANSPORT')
                      .map((loc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className="line-clamp-1 font-semibold text-slate-700">{loc.name}</span>
                          <span className="text-slate-450 font-normal shrink-0">{loc.distance}</span>
                        </div>
                      ))}
                    {hotel.nearbyLocations.filter((loc: any) => loc.type === 'TRANSPORT').length === 0 && (
                      <p className="text-slate-400 font-normal text-[11px] italic">{language === 'vi' ? 'Không có thông tin' : 'No information'}</p>
                    )}
                  </div>
                </div>

                {/* Column 3: Trung tâm giải trí */}
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#006ce4]" />
                    {language === 'vi' ? 'Trung tâm giải trí' : 'Entertainment'}
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-655 font-bold">
                    {hotel.nearbyLocations
                      .filter((loc: any) => loc.type === 'ENTERTAINMENT')
                      .map((loc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className="line-clamp-1 font-semibold text-slate-700">{loc.name}</span>
                          <span className="text-slate-450 font-normal shrink-0">{loc.distance}</span>
                        </div>
                      ))}
                    {hotel.nearbyLocations.filter((loc: any) => loc.type === 'ENTERTAINMENT').length === 0 && (
                      <p className="text-slate-400 font-normal text-[11px] italic">{language === 'vi' ? 'Không có thông tin' : 'No information'}</p>
                    )}
                  </div>
                </div>

                {/* Column 4: Khác */}
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MoreHorizontal className="w-4.5 h-4.5 text-[#006ce4]" />
                    {language === 'vi' ? 'Khác' : 'Others'}
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-655 font-bold">
                    {hotel.nearbyLocations
                      .filter((loc: any) => loc.type === 'OTHER')
                      .map((loc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className="line-clamp-1 font-semibold text-slate-700">{loc.name}</span>
                          <span className="text-slate-450 font-normal shrink-0">{loc.distance}</span>
                        </div>
                      ))}
                    {hotel.nearbyLocations.filter((loc: any) => loc.type === 'OTHER').length === 0 && (
                      <p className="text-slate-400 font-normal text-[11px] italic">{language === 'vi' ? 'Không có thông tin' : 'No information'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <hr className="border-slate-100" />

          {/* Detailed Grouped Amenities Section */}
          <section className="space-y-6 pt-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-1.5 h-6 bg-[#006ce4] rounded-full inline-block"></span>
              {language === 'vi' ? 'Các tiện nghi tại khách sạn' : 'Hotel Facilities & Amenities'}
            </h2>

            {/* Popular amenities bar (Horizontal) */}
            {(() => {
              const popularKeywords = ['wifi', 'hồ bơi', 'đỗ xe', 'đậu xe', 'phòng gym', 'thể hình', 'spa', 'massage', 'nhà hàng', 'quầy bar', 'dịch vụ phòng'];
              const popularItems = hotel.amenities.filter(({ amenity }) =>
                popularKeywords.some(kw => amenity.name.toLowerCase().includes(kw))
              );

              if (popularItems.length === 0) return null;
              return (
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {language === 'vi' ? 'Các tiện nghi được ưa chuộng nhất' : 'Most popular facilities'}
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 text-emerald-600 font-extrabold text-xs sm:text-sm">
                    {popularItems.map(({ amenity }) => (
                      <div key={amenity.name} className="flex items-center gap-2">
                        <span className="shrink-0 text-emerald-650">
                          {getAmenityIcon(amenity.name, "w-4 h-4 sm:w-4.5 sm:h-4.5")}
                        </span>
                        <span>{translateAmenityName(amenity.name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Columns of Grouped Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
              {groupedAmenities.map((cat) => (
                <div key={cat.titleVi} className="space-y-3.5">
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <span className="text-[#006ce4] shrink-0">{cat.icon}</span>
                    <span>{language === 'vi' ? cat.titleVi : cat.titleEn}</span>
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-655 font-bold pl-0.5">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-black text-xs shrink-0 mt-0.5">✓</span>
                        <span className="text-slate-700 font-semibold leading-tight">{translateAmenityName(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Review and Ratings */}
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-1.5 h-6.5 bg-[#006ce4] rounded-full inline-block"></span>
              {t.reviewsTitle}
            </h2>

            {/* Top Part: Ratings Summary (Horizontal Layout) */}
            {hotel.reviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/50 p-6 rounded-2xl">
                {/* Column 1: Big Overall Rating Score */}
                <div className="flex flex-col justify-center items-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black text-[#006ce4] tracking-tighter">
                      {displayAverageRating}
                    </span>
                    <span className="text-base font-bold text-slate-400">/ 10</span>
                  </div>
                  <div className="mt-3">
                    <p className="font-extrabold text-slate-800 text-lg">
                      {getRatingLabel(displayAverageRating, language)}
                    </p>
                    <p className="text-xs text-slate-455 font-bold mt-0.5">
                      {t.reviewsCount(hotel.reviews.length)}
                    </p>
                  </div>

                  {/* Write review button */}
                  {isLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="mt-5 w-full bg-[#006ce4] hover:bg-[#0056b3] text-white font-extrabold text-sm py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {showReviewForm 
                        ? (language === 'vi' ? 'Đóng khung đánh giá' : 'Close review form')
                        : (language === 'vi' ? 'Viết đánh giá của bạn' : 'Write a review')
                      }
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 font-bold mt-5 text-center bg-slate-100/60 px-3 py-2.5 rounded-xl border border-slate-250/50 w-full">
                      {language === 'vi' ? 'Đăng nhập để gửi đánh giá' : 'Log in to submit a review'}
                    </p>
                  )}
                </div>

                {/* Column 2 & 3: 5 Criteria Progress Bars */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-2 justify-center content-center text-sm font-bold text-slate-600">
                  {[
                    { name: t.cleanliness, score: criteriaScores.cleanliness },
                    { name: t.location, score: criteriaScores.location },
                    { name: t.service, score: criteriaScores.service },
                    { name: t.facilities, score: criteriaScores.facilities },
                    { name: t.valueRating, score: criteriaScores.value },
                  ].map((crit) => (
                    <div key={crit.name} className="space-y-1.5">
                      <div className="flex justify-between text-slate-700 text-sm">
                        <span>{crit.name}</span>
                        <span className="text-[#006ce4] font-extrabold">{crit.score} / 10</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006ce4] h-full rounded-full" style={{ width: `${(crit.score / 10) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Part: Review Form & Comments List */}
            <div className="space-y-6">
              {/* If no reviews and logged in */}
              {hotel.reviews.length === 0 && (
                <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-2xl text-center space-y-4">
                  <p className="text-slate-400 text-sm font-semibold">{t.noReviews}</p>
                  {isLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-[#006ce4] hover:bg-[#0056b3] text-white font-extrabold text-sm py-2.5 px-5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      {showReviewForm 
                        ? (language === 'vi' ? 'Đóng khung đánh giá' : 'Close review form')
                        : (language === 'vi' ? 'Viết đánh giá đầu tiên' : 'Write the first review')
                      }
                    </button>
                  ) : (
                    <p className="text-xs text-slate-455 font-bold">
                      {language === 'vi' ? 'Vui lòng đăng nhập để gửi đánh giá.' : 'Please log in to submit a review.'}
                    </p>
                  )}
                </div>
              )}

              {/* Review Submission Form (full-width) */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl space-y-5 animate-in slide-in-from-top-3 duration-200">
                  <div className="border-b border-slate-200/80 pb-3">
                    <h3 className="font-black text-slate-800 text-base">
                      {language === 'vi' ? 'Gửi nhận xét & Đánh giá của bạn' : 'Submit your Rating & Review'}
                    </h3>
                    <p className="text-[11px] text-slate-455 font-bold uppercase tracking-wider mt-0.5">Thang điểm đánh giá từ 1 đến 10</p>
                  </div>

                  {reviewError && (
                    <div className="bg-red-50 text-red-700 text-sm font-semibold p-3 rounded-lg border-l-4 border-red-500">
                      {reviewError}
                    </div>
                  )}

                  {/* 10-Star Criteria selection grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm font-bold text-slate-600">
                    {[
                      { name: t.cleanliness, value: ratingCleanliness, setter: setRatingCleanliness },
                      { name: t.location, value: ratingLocation, setter: setRatingLocation },
                      { name: t.service, value: ratingService, setter: setRatingService },
                      { name: t.facilities, value: ratingFacilities, setter: setRatingFacilities },
                      { name: t.valueRating, value: ratingValue, setter: setRatingValue },
                    ].map((crit) => (
                      <div key={crit.name} className="flex justify-between items-center bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm">
                        <span className="text-slate-700 font-extrabold">{crit.name}</span>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => crit.setter(star)}
                                className={`text-lg leading-none focus:outline-none transition-all ${
                                  star <= crit.value ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <span className="text-xs text-[#006ce4] font-black">{crit.value} / 10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Text Comment */}
                  <div className="space-y-1.5 text-sm font-bold text-slate-600">
                    <label className="text-[11px] text-slate-400 uppercase">Nhận xét chi tiết</label>
                    <textarea
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={language === 'vi' ? 'Hãy chia sẻ chi tiết trải nghiệm lưu trú của bạn tại đây...' : 'Share your detailed stay experience here...'}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-blue-600 text-slate-800 font-semibold placeholder-slate-400 transition-all shadow-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all"
                    >
                      {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      {submittingReview ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...') : (language === 'vi' ? 'Gửi đánh giá' : 'Submit Review')}
                    </button>
                  </div>
                </form>
              )}

              {/* List of comments (Full-width card layout) */}
              {hotel.reviews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-2">
                    {language === 'vi' ? 'Ý kiến chi tiết từ khách hàng' : 'Detailed Guest Reviews'}
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3">
                    {hotel.reviews.map((rev) => (
                      <div key={rev.id} className="space-y-3 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                              {rev.user.avatarUrl ? (
                                <img src={rev.user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-slate-450" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-sm">{rev.user.fullName}</h4>
                              <span className="text-[10px] text-[#006ce4] font-extrabold">{new Date(rev.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                            </div>
                          </div>
                          <span className="bg-[#ebf3ff] text-[#006ce4] px-3.5 py-1.5 rounded-full font-black text-sm border border-blue-100">
                            ★ {normalizeRating(rev.ratingOverall)} / 10
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-semibold pl-1">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
      {selectedRoomForModal && (
        <RoomDetailsModal
          room={selectedRoomForModal}
          onClose={() => setSelectedRoomForModal(null)}
          language={language}
          currency={currency}
          onBook={handleBookRoom}
        />
      )}

      {/* Fullscreen Interactive Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col h-screen overflow-hidden animate-in fade-in duration-150">
          {/* Modal Header */}
          <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white">
            <div className="space-y-0.5">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#006ce4]" />
                {language === 'vi' ? `Bản đồ vị trí xung quanh ${hotel.name}` : `Map around ${hotel.name}`}
              </h3>
              <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">
                {language === 'vi' ? 'Chọn địa điểm để ghim trên bản đồ' : 'Select a location to pin on the map'}
              </p>
            </div>
            <button
              onClick={() => setIsMapModalOpen(false)}
              className="bg-slate-105 hover:bg-slate-200 text-slate-705 font-extrabold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span>✕</span> {language === 'vi' ? 'Đóng / Quay lại' : 'Close / Go back'}
            </button>
          </div>

          {/* Modal Body (Flex layout: Map Left, Sidebar Right) */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            {/* Map (70% width on desktop) */}
            <div className="flex-grow h-[45vh] md:h-full relative bg-slate-50 border-r border-slate-100">
              <LeafletMap
                lat={hotel.latitude || 11.94}
                lng={hotel.longitude || 108.44}
                hotelName={hotel.name}
                queryPlace={activeMapQuery}
                nearbyLocations={hotel.nearbyLocations}
              />
              {/* Floating current location badge */}
              <div className="absolute top-4 left-4 bg-white/95 border border-slate-200 px-4 py-2.5 rounded-xl shadow-lg z-10 max-w-sm backdrop-blur-sm">
                <p className="text-[9px] text-slate-455 font-bold uppercase tracking-wider leading-none">VỊ TRÍ ĐANG XEM</p>
                <p className="text-xs font-black text-[#006ce4] mt-1 line-clamp-1">{activeMapQuery}</p>
              </div>
            </div>

            {/* Sidebar (30% width on desktop, scrollable) */}
            <div className="w-full md:w-[350px] shrink-0 h-[55vh] md:h-full flex flex-col bg-slate-50">
              {/* Category tabs filters */}
              <div className="bg-white border-b border-slate-200 p-3 flex gap-1.5 overflow-x-auto shrink-0">
                {[
                  { id: 'ALL', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { id: 'NEARBY', label: language === 'vi' ? 'Lân cận' : 'Nearby' },
                  { id: 'TRANSPORT', label: language === 'vi' ? 'Giao thông' : 'Transit' },
                  { id: 'ENTERTAINMENT', label: language === 'vi' ? 'Giải trí' : 'Leisure' },
                  { id: 'OTHER', label: language === 'vi' ? 'Khác' : 'Other' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedMapCategory(tab.id as any)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all shrink-0 uppercase tracking-wider ${
                      selectedMapCategory === tab.id
                        ? 'bg-[#006ce4] text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-605'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Locations List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {/* Hotel default location card */}
                <div
                  onClick={() => setActiveMapQuery(hotel.name + ' ' + (hotel.address || ''))}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    activeMapQuery === hotel.name + ' ' + (hotel.address || '')
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#006ce4]" />
                      {hotel.name}
                    </span>
                    <span className="bg-[#006ce4] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">HOTEL</span>
                  </div>
                  <p className="text-[10px] text-slate-455 font-medium line-clamp-1">{hotel.address}</p>
                </div>

                {/* Nearby list filter */}
                {hotel.nearbyLocations && hotel.nearbyLocations
                  .filter((loc: any) => selectedMapCategory === 'ALL' || loc.type === selectedMapCategory)
                  .map((loc: any, idx: number) => {
                    const getIcon = () => {
                      if (loc.type === 'NEARBY') return <MapPin className="w-3.5 h-3.5 text-[#006ce4]" />;
                      if (loc.type === 'TRANSPORT') return <Compass className="w-3.5 h-3.5 text-[#006ce4]" />;
                      if (loc.type === 'ENTERTAINMENT') return <Sparkles className="w-3.5 h-3.5 text-[#006ce4]" />;
                      return <MoreHorizontal className="w-3.5 h-3.5 text-[#006ce4]" />;
                    };
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveMapQuery(loc.name + ' ' + (hotel.address?.split(',').pop() || ''))}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                          activeMapQuery === loc.name + ' ' + (hotel.address?.split(',').pop() || '')
                            ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 line-clamp-1">
                          {getIcon()}
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-455 shrink-0">{loc.distance}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetail;
