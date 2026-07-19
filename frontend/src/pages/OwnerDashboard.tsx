import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store';
import apiClient from '../core/api/client';
import { io, Socket } from 'socket.io-client';
import {
  Percent, Plus, Search, Bell, MessageSquare,
  Sun, Moon, Globe, LogOut, Settings, User, Menu,
  Hotel, Bed, CalendarRange, CreditCard, Star, FileText, BarChart3,
  CheckCircle, Trash2, ChevronDown, Sliders, RefreshCw, X,
  Download, Send, ShieldAlert, Edit3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- Interfaces ---
interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  finalPrice: number;
  status: string;
}

interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  description?: string;
  capacity?: number;
  bedCount?: number;
  size?: number;
  amenities?: string[];
  images?: { url: string; isPrimary: boolean }[];
  rooms?: any[];
  includeBreakfast?: boolean;
  childSurcharge?: number;
  cancellationPolicy?: string;
  paymentPolicy?: string;
}

interface Conversation {
  id: string;
  customer: { fullName: string; avatarUrl: string | null };
  hotel: { name: string };
  messages: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string; avatarUrl: string | null };
}

export const OwnerDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState<
    'dashboard' | 'hotel' | 'rooms' | 'bookings' | 'calendar' | 'promotions' | 'customers' | 'reviews' | 'reports' | 'finance' | 'support' | 'settings'
  >('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [successToast, setSuccessToast] = useState('');

  // Dropdowns
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Common UI Filters / Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  // Real States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [calendarDays, setCalendarDays] = useState<{ date: string; price: number; isBlocked: boolean }[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [editDay, setEditDay] = useState<{ date: string; price: number; isBlocked: boolean } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newBlocked, setNewBlocked] = useState(false);

  // --- Owner Stats States ---
  const [stats, setStats] = useState<any>({
    todayBookings: 0, upcomingCheckIn: 0, upcomingCheckOut: 0,
    availableRooms: 0, occupiedRooms: 0, revenueToday: 0, revenueMonth: 0,
    averageRating: 4.8, occupancyRate: 72, cancellationRate: 4
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  // Chat States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Hotel Info States
  const [hotelId, setHotelId] = useState('');
  const [hotelName, setHotelName] = useState('Rex Hotel Plaza');
  const [hotelDesc, setHotelDesc] = useState('Khách sạn trung tâm đẳng cấp 5 sao với đầy đủ hồ bơi vô cực, rooftop bar và trung tâm hội nghị.');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [hotelPolicies, setHotelPolicies] = useState('Không hút thuốc trong phòng, không mang theo thú cưng.');

  // Administrative regions
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);

  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [wardId, setWardId] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelLat, setHotelLat] = useState<number | ''>('');
  const [hotelLng, setHotelLng] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');

  const [systemAmenities, setSystemAmenities] = useState<{ id: string; name: string; icon?: string | null }[]>([]);
  const [systemCategories, setSystemCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenityName, setCustomAmenityName] = useState('');
  const [customAmenityCategory, setCustomAmenityCategory] = useState('general');
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [hotelImages, setHotelImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Owner promotions (coupons)
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponLimit, setNewCouponLimit] = useState('');
  const [newCouponEnd, setNewCouponEnd] = useState('');

  // Owner reviews list (all reviews for owner's hotel)
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allReviewsLoading, setAllReviewsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create Room State
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<any | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('2');
  const [newRoomBed, setNewRoomBed] = useState('King Size');
  const [newRoomBedCount, setNewRoomBedCount] = useState('1');
  const [newRoomSize, setNewRoomSize] = useState('30');
  const [newRoomCount, setNewRoomCount] = useState('1');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>(['Wifi', 'Điều hòa', 'Tivi']);
  const [newRoomIncludeBreakfast, setNewRoomIncludeBreakfast] = useState(false);
  const [newRoomChildSurcharge, setNewRoomChildSurcharge] = useState('0');
  const [newRoomCancellationPolicy, setNewRoomCancellationPolicy] = useState('FREE_24H');
  const [newRoomPaymentPolicy, setNewRoomPaymentPolicy] = useState('PAY_AT_HOTEL');

  const [refreshCalendarTrigger, setRefreshCalendarTrigger] = useState(0);
  const [showBulkConfig, setShowBulkConfig] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkEndDate, setBulkEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [bulkDaysOfWeek, setBulkDaysOfWeek] = useState<boolean[]>([true, true, true, true, true, true, true]); // Mon to Sun
  const [bulkAction, setBulkAction] = useState('PRICE'); // 'PRICE', 'SURCHARGE_WEEKEND', 'DISCOUNT'
  const [bulkValue, setBulkValue] = useState('');
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState('PERCENTAGE'); // 'PERCENTAGE', 'FIXED'
  const [bulkBaseOn, setBulkBaseOn] = useState('BASE'); // 'BASE' or 'CALENDAR'

  // Toast Trigger
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const fetchOwnerStats = async () => {
    try {
      const res = await apiClient.get('/bookings/owner-stats');
      setStats(res.data.data.stats);
      setChartData(res.data.data.chartData);
      setOccupancyData(res.data.data.occupancyData);
      setRecentReviews(res.data.data.recentReviews || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch initial room types, bookings, and system meta
  useEffect(() => {
    const fetchOwnerHotelsAndRooms = async () => {
      try {
        if (!user?.id) return;
        const res = await apiClient.get(`/hotels?ownerId=${user.id}`);
        const myHotels = res.data.data.hotels;

        if (myHotels && myHotels.length > 0) {
          const hId = myHotels[0].id;
          setHotelId(hId);

          const hotelDetailRes = await apiClient.get(`/hotels/${hId}`);
          const detail = hotelDetailRes.data.data;

          setHotelName(detail.name);
          setHotelDesc(detail.description || 'Chưa cập nhật mô tả.');
          setCheckInTime(detail.checkInTime || '14:00');
          setCheckOutTime(detail.checkOutTime || '12:00');
          setHotelAddress(detail.address || '');
          setProvinceId(detail.provinceId || '');
          setDistrictId(detail.districtId || '');
          setWardId(detail.wardId || '');
          setHotelLat(detail.latitude !== null && detail.latitude !== undefined ? detail.latitude : '');
          setHotelLng(detail.longitude !== null && detail.longitude !== undefined ? detail.longitude : '');
          setCategoryId(detail.categoryId || '');

          setRoomTypes(detail.roomTypes || []);
          if (detail.roomTypes && detail.roomTypes.length > 0) {
            setSelectedRoomTypeId(detail.roomTypes[0].id);
          }

          // Populate amenities
          const activeAmens = detail.amenities?.map((a: any) => a.amenity.id) || [];
          setSelectedAmenities(activeAmens);

          // Populate images
          const activeImgs = detail.images?.map((img: any) => ({
            url: img.url,
            isPrimary: img.isPrimary
          })) || [];
          setHotelImages(activeImgs);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAllBookings = async () => {
      setBookingsLoading(true);
      try {
        const res = await apiClient.get('/bookings/my');
        setBookings(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setBookingsLoading(false);
      }
    };

    const fetchMeta = async () => {
      try {
        const [metaRes, provincesRes] = await Promise.all([
          apiClient.get('/hotels/meta/amenities-categories'),
          apiClient.get('/hotels/meta/locations')
        ]);
        if (metaRes.data.success) {
          setSystemAmenities(metaRes.data.data.amenities || []);
          setSystemCategories(metaRes.data.data.categories || []);
        }
        if (provincesRes.data.success) {
          setProvinces(provincesRes.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchOwnerHotelsAndRooms();
    fetchAllBookings();
    fetchOwnerStats();
    fetchMeta();
  }, [user]);

  // Sync stats when returning to dashboard tab
  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchOwnerStats();
    }
    if (activeMenu === 'promotions') {
      fetchOwnerCoupons();
    }
    if (activeMenu === 'reviews') {
      fetchOwnerReviews();
    }
  }, [activeMenu, hotelId]);

  // Load districts when provinceId changes
  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await apiClient.get(`/hotels/meta/locations?provinceId=${provinceId}`);
        if (res.data.success) {
          setDistricts(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDistricts();
  }, [provinceId]);

  // Load wards when districtId changes
  useEffect(() => {
    if (!districtId) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const res = await apiClient.get(`/hotels/meta/locations?districtId=${districtId}`);
        if (res.data.success) {
          setWards(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchWards();
  }, [districtId]);

  // Price calendar builder for 15 days
  useEffect(() => {
    if (!selectedRoomTypeId) return;

    const fetchPriceCalendar = async () => {
      setCalendarLoading(true);
      try {
        const daysArray: { date: string; price: number; isBlocked: boolean }[] = [];
        const basePrice = roomTypes.find((r) => r.id === selectedRoomTypeId)?.basePrice || 1200000;

        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 14);

        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];

        // Lấy lịch đặt/giá tùy chỉnh thực tế từ database
        const res = await apiClient.get(`/hotels/room-types/${selectedRoomTypeId}/price-calendar?startDate=${startDateStr}&endDate=${endDateStr}`);
        const overrides = res.data.data || [];

        for (let i = 0; i < 15; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];

          const override = overrides.find((o: any) => {
            const oDate = new Date(o.date).toISOString().split('T')[0];
            return oDate === dateStr;
          });

          daysArray.push({
            date: dateStr,
            price: override ? parseFloat(override.price) : Number(basePrice),
            isBlocked: override ? override.isBlocked : false,
          });
        }
        setCalendarDays(daysArray);
      } catch (err) {
        console.error(err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchPriceCalendar();
  }, [selectedRoomTypeId, roomTypes, refreshCalendarTrigger]);

  // Socket.io connection for owner chat
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });

    socketRef.current.on('receiveMessage', (message: Message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Click outside listener to close header dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Conversations list for owner
  useEffect(() => {
    if (activeMenu !== 'support') return;

    const fetchConvs = async () => {
      try {
        const res = await apiClient.get('/chats/conversations');
        setConversations(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConvs();
  }, [activeMenu]);

  // Join Chat room and load messages
  useEffect(() => {
    if (!activeConv) return;

    const loadMessagesAndJoin = async () => {
      try {
        socketRef.current?.emit('joinConversation', activeConv.id);
        const res = await apiClient.get(`/chats/conversations/${activeConv.id}/messages`);
        setChatMessages(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadMessagesAndJoin();
  }, [activeConv]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await apiClient.put(`/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        triggerToast('Cập nhật trạng thái đơn thành công!');
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật trạng thái đơn.');
    }
  };

  const handleSavePriceCalendar = async () => {
    if (!editDay || !selectedRoomTypeId) return;

    try {
      const updateData = {
        prices: [
          {
            date: editDay.date,
            price: Number(newPrice) || editDay.price,
            isBlocked: newBlocked,
          },
        ],
      };

      await apiClient.post(`/hotels/room-types/${selectedRoomTypeId}/price-calendar`, updateData);

      setCalendarDays((prev) =>
        prev.map((d) =>
          d.date === editDay.date
            ? { ...d, price: Number(newPrice) || d.price, isBlocked: newBlocked }
            : d
        )
      );
      setEditDay(null);
      triggerToast('Cập nhật lịch ngày thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể lưu cấu hình lịch.');
    }
  };

  const handleRestoreDay = async () => {
    if (!editDay || !selectedRoomTypeId) return;
    try {
      const updateData = {
        prices: [
          {
            date: editDay.date,
            price: 0,
            isRestore: true,
          },
        ],
      };

      await apiClient.post(`/hotels/room-types/${selectedRoomTypeId}/price-calendar`, updateData);
      
      setRefreshCalendarTrigger((prev) => prev + 1);
      setEditDay(null);
      triggerToast('Đã khôi phục giá gốc thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể khôi phục giá gốc.');
    }
  };

  const handleSaveBulkPriceCalendar = async () => {
    if (!selectedRoomTypeId) return;
    if (!bulkStartDate || !bulkEndDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);

    if (start > end) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    const basePrice = roomTypes.find((r) => r.id === selectedRoomTypeId)?.basePrice || 1200000;
    const pricesPayload: { date: string; price: number; isBlocked?: boolean }[] = [];

    // Lặp qua từng ngày trong khoảng
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
      // Ánh xạ getDay (0=CN, 1=T2, ..., 6=T7) sang chỉ số bulkDaysOfWeek (0=T2, 1=T3, ..., 5=T7, 6=CN)
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (bulkDaysOfWeek[index]) {
        const dateStr = d.toISOString().split('T')[0];
        
        if (bulkAction === 'RESTORE') {
          pricesPayload.push({
            date: dateStr,
            price: 0,
            isRestore: true,
          } as any);
        } else {
          let referencePrice = Number(basePrice);
          if (bulkBaseOn === 'CALENDAR') {
            const existingDay = calendarDays.find(cd => cd.date === dateStr);
            if (existingDay) {
              referencePrice = Number(existingDay.price);
            }
          }

          let calculatedPrice = referencePrice;

          if (bulkAction === 'PRICE') {
            calculatedPrice = Number(bulkValue) || referencePrice;
          } else if (bulkAction === 'SURCHARGE_WEEKEND') {
            const val = Number(bulkValue) || 0;
            if (bulkAdjustmentType === 'PERCENTAGE') {
              calculatedPrice = referencePrice * (1 + val / 100);
            } else {
              calculatedPrice = referencePrice + val;
            }
          } else if (bulkAction === 'DISCOUNT') {
            const val = Number(bulkValue) || 0;
            if (bulkAdjustmentType === 'PERCENTAGE') {
              calculatedPrice = referencePrice * (1 - val / 100);
            } else {
              calculatedPrice = Math.max(0, referencePrice - val);
            }
          }

          pricesPayload.push({
            date: dateStr,
            price: calculatedPrice,
            isBlocked: false,
          });
        }
      }
    }

    if (pricesPayload.length === 0) {
      alert('Không có ngày nào khớp với tiêu chí lựa chọn của bạn.');
      return;
    }

    try {
      await apiClient.post(`/hotels/room-types/${selectedRoomTypeId}/price-calendar`, {
        prices: pricesPayload,
      });

      // Kích hoạt load lại lịch giá
      setRefreshCalendarTrigger((prev) => prev + 1);
      setShowBulkConfig(false);
      setBulkValue('');
      triggerToast('Đã thiết lập giá hàng loạt thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể lưu cấu hình giá hàng loạt.');
    }
  };

  const handleSendChatMessage = () => {
    if (!inputMsg.trim() || !activeConv || !user) return;

    const payload = {
      conversationId: activeConv.id,
      senderId: user.id,
      content: inputMsg.trim(),
    };

    socketRef.current?.emit('sendMessage', payload);
    setInputMsg('');
  };

  const fetchOwnerCoupons = async () => {
    if (!hotelId) return;
    setCouponsLoading(true);
    try {
      const res = await apiClient.get(`/coupons?hotelId=${hotelId}&all=true`);
      setCoupons(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchOwnerReviews = async () => {
    if (!hotelId) return;
    setAllReviewsLoading(true);
    try {
      const res = await apiClient.get(`/hotels/${hotelId}`);
      setAllReviews(res.data.data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAllReviewsLoading(false);
    }
  };

  const handleCreateOwnerCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    try {
      const payload = {
        code: newCouponCode.toUpperCase(),
        description: newCouponDesc,
        discountType: newCouponType,
        discountValue: Number(newCouponValue),
        minOrderValue: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(newCouponEnd).toISOString(),
        usageLimit: Number(newCouponLimit),
        hotelId
      };

      await apiClient.post('/coupons', payload);
      triggerToast('Tạo mã giảm giá khách sạn thành công!');
      setShowAddCoupon(false);
      setNewCouponCode('');
      setNewCouponDesc('');
      setNewCouponValue('');
      setNewCouponLimit('');
      setNewCouponEnd('');
      fetchOwnerCoupons();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tạo mã giảm giá.');
    }
  };

  const handleDeleteOwnerCoupon = async (id: string) => {
    try {
      await apiClient.delete(`/coupons/${id}`);
      setDeleteConfirmId(null);
      triggerToast('Xóa mã giảm giá thành công!');
      fetchOwnerCoupons();
    } catch (err) {
      console.error(err);
      alert('Không thể xóa mã giảm giá này.');
    }
  };

  // Derived unique customer list from bookings
  const getUniqueCustomers = () => {
    const seen = new Set();
    const result: any[] = [];
    bookings.forEach(b => {
      const key = `${b.guestEmail || ''}-${b.guestPhone || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: b.id,
          guestName: b.guestName,
          guestPhone: b.guestPhone,
          guestEmail: b.guestEmail,
          totalBookings: bookings.filter(x => x.guestEmail === b.guestEmail || x.guestPhone === b.guestPhone).length,
          totalSpent: bookings.filter(x => x.guestEmail === b.guestEmail || x.guestPhone === b.guestPhone).reduce((acc, curr) => acc + curr.finalPrice, 0)
        });
      }
    });
    return result;
  };

  const handleOpenAddRoomType = () => {
    setEditingRoomType(null);
    setNewRoomName('');
    setNewRoomPrice('');
    setNewRoomCapacity('2');
    setNewRoomBedCount('1');
    setNewRoomSize('30');
    setNewRoomCount('1');
    setNewRoomDesc('');
    setNewRoomImageUrl('');
    setNewRoomAmenities(['Wifi', 'Điều hòa', 'Tivi']);
    setNewRoomIncludeBreakfast(false);
    setNewRoomChildSurcharge('0');
    setNewRoomCancellationPolicy('FREE_24H');
    setNewRoomPaymentPolicy('PAY_AT_HOTEL');
    setShowAddRoom(true);
  };

  const handleOpenEditRoomType = (rt: any) => {
    setEditingRoomType(rt);
    setNewRoomName(rt.name);
    setNewRoomPrice(rt.basePrice.toString());
    setNewRoomCapacity(rt.capacity.toString());
    setNewRoomBedCount(rt.bedCount?.toString() || '1');
    setNewRoomSize(rt.size?.toString() || '30');
    setNewRoomCount(rt.rooms?.length?.toString() || '1');
    setNewRoomDesc(rt.description || '');
    setNewRoomImageUrl(rt.images?.[0]?.url || '');
    setNewRoomAmenities(rt.amenities || ['Wifi', 'Điều hòa', 'Tivi']);
    setNewRoomIncludeBreakfast(rt.includeBreakfast ?? false);
    setNewRoomChildSurcharge(rt.childSurcharge?.toString() || '0');
    setNewRoomCancellationPolicy(rt.cancellationPolicy || 'FREE_24H');
    setNewRoomPaymentPolicy(rt.paymentPolicy || 'PAY_AT_HOTEL');
    setShowAddRoom(true);
  };

  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    try {
      const defaultImg = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
      const imageUrl = newRoomImageUrl.trim() || defaultImg;

      const payload = {
        name: newRoomName,
        description: newRoomDesc.trim() || `Hạng phòng ${newRoomName} đầy đủ tiện nghi, sạch sẽ thoáng mát.`,
        basePrice: newRoomPrice !== '' ? Number(newRoomPrice) : 800000,
        capacity: newRoomCapacity !== '' ? Number(newRoomCapacity) : 2,
        bedCount: newRoomBedCount !== '' ? Number(newRoomBedCount) : 1,
        size: newRoomSize !== '' ? Number(newRoomSize) : 30,
        roomCount: newRoomCount !== '' ? Number(newRoomCount) : 0,
        amenities: newRoomAmenities.length > 0 ? newRoomAmenities : ['Wifi', 'Điều hòa', 'Tivi'],
        images: [{ url: imageUrl, isPrimary: true }],
        includeBreakfast: newRoomIncludeBreakfast,
        childSurcharge: Number(newRoomChildSurcharge) || 0,
        cancellationPolicy: newRoomCancellationPolicy,
        paymentPolicy: newRoomPaymentPolicy
      };

      if (editingRoomType) {
        const res = await apiClient.put(`/hotels/room-types/${editingRoomType.id}`, payload);
        const updatedRoom = res.data.data;
        setRoomTypes(prev => prev.map(rt => rt.id === updatedRoom.id ? updatedRoom : rt));
        triggerToast('Cập nhật hạng phòng thành công!');
      } else {
        const res = await apiClient.post(`/hotels/${hotelId}/room-types`, payload);
        const newRoom = res.data.data;
        setRoomTypes(prev => [...prev, newRoom]);
        triggerToast('Thêm hạng phòng thành công!');
      }

      setShowAddRoom(false);
      setEditingRoomType(null);
      setNewRoomName('');
      setNewRoomPrice('');
      setNewRoomCapacity('2');
      setNewRoomBedCount('1');
      setNewRoomSize('30');
      setNewRoomCount('1');
      setNewRoomDesc('');
      setNewRoomImageUrl('');
      setNewRoomAmenities(['Wifi', 'Điều hòa', 'Tivi']);
      setNewRoomIncludeBreakfast(false);
      setNewRoomChildSurcharge('0');
      setNewRoomCancellationPolicy('FREE_24H');
      setNewRoomPaymentPolicy('PAY_AT_HOTEL');
    } catch (err) {
      console.error(err);
      alert('Không thể lưu thông tin hạng phòng.');
    }
  };

  const handleCreatePhysicalRoom = async (roomTypeId: string, roomNumber: string) => {
    try {
      await apiClient.post('/hotels/rooms', { roomTypeId, roomNumber });
      triggerToast(`Đã thêm số phòng ${roomNumber} thành công!`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tạo phòng vật lý mới.');
    }
  };

  const handleSaveHotelInfo = async () => {
    if (!hotelId) return;
    try {
      await apiClient.put(`/hotels/${hotelId}`, {
        name: hotelName,
        description: hotelDesc,
        checkInTime,
        checkOutTime,
        address: hotelAddress,
        provinceId,
        districtId,
        wardId,
        latitude: hotelLat !== '' ? Number(hotelLat) : null,
        longitude: hotelLng !== '' ? Number(hotelLng) : null,
        categoryId,
        amenityIds: selectedAmenities,
        images: hotelImages
      });
      triggerToast('Cập nhật hồ sơ khách sạn thành công.');
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật thông tin hồ sơ.');
    }
  };

  const handleAddCustomAmenity = async () => {
    if (!customAmenityName.trim()) return;
    try {
      const res = await apiClient.post('/hotels/meta/amenities', {
        name: customAmenityName.trim(),
        icon: customAmenityCategory
      });
      if (res.data.success) {
        const newAmenity = res.data.data;
        setSystemAmenities(prev => {
          if (prev.some(a => a.id === newAmenity.id)) return prev;
          return [...prev, newAmenity].sort((a, b) => a.name.localeCompare(b.name));
        });
        setSelectedAmenities(prev => {
          if (prev.includes(newAmenity.id)) return prev;
          return [...prev, newAmenity.id];
        });
        setCustomAmenityName('');
        triggerToast('Đã thêm tiện ích mới thành công!');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể thêm tiện ích mới.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrls: { url: string; isPrimary: boolean }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        const res = await apiClient.post('/hotels/upload-image', { image: base64 });
        if (res.data.success) {
          uploadedUrls.push({
            url: res.data.data.url,
            isPrimary: hotelImages.length === 0 && uploadedUrls.length === 0
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setHotelImages(prev => {
          const hasPrimary = prev.some(img => img.isPrimary);
          const updated = [...prev, ...uploadedUrls];
          if (!hasPrimary && updated.length > 0) {
            updated[0].isPrimary = true;
          }
          return updated;
        });
        triggerToast(`Đã tải lên thành công ${uploadedUrls.length} hình ảnh!`);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi trong quá trình tải ảnh lên.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const getGroupedSystemAmenities = () => {
    const grouped: Record<string, { title: string; items: { id: string; name: string; icon?: string | null }[] }> = {
      internet: { title: 'Internet & Truyền thông', items: [] },
      parking: { title: 'Chỗ đậu xe', items: [] },
      bathroom: { title: 'Phòng tắm', items: [] },
      bedroom: { title: 'Phòng ngủ', items: [] },
      outdoor: { title: 'Ngoài trời', items: [] },
      kitchen: { title: 'Nhà bếp', items: [] },
      room: { title: 'Tiện ích trong phòng', items: [] },
      media: { title: 'Truyền thông & Công nghệ', items: [] },
      services: { title: 'Dịch vụ & Tiện ích giải trí', items: [] },
      security: { title: 'An ninh', items: [] },
      general: { title: 'Tổng quát', items: [] },
      languages: { title: 'Ngôn ngữ được sử dụng', items: [] },
      other: { title: 'Tiện ích khác', items: [] }
    };

    systemAmenities.forEach((amenity) => {
      const iconKey = (amenity.icon || '').toLowerCase();
      if (grouped[iconKey]) {
        grouped[iconKey].items.push(amenity);
        return;
      }

      const lower = amenity.name.toLowerCase();
      if (lower.includes('wifi') || lower.includes('internet')) {
        grouped.internet.items.push(amenity);
      } else if (lower.includes('đỗ xe') || lower.includes('đậu xe') || lower.includes('bãi xe') || lower.includes('parking')) {
        grouped.parking.items.push(amenity);
      } else if (lower.includes('tắm') || lower.includes('sen') || lower.includes('toilet') || lower.includes('bồn') || lower.includes('khăn tắm') || lower.includes('vệ sinh')) {
        grouped.bathroom.items.push(amenity);
      } else if (lower.includes('giường') || lower.includes('mền') || lower.includes('gối') || lower.includes('chăn') || lower.includes('tủ quần áo') || lower.includes('bed')) {
        grouped.bedroom.items.push(amenity);
      } else if (lower.includes('ngoài trời') || lower.includes('sân') || lower.includes('vườn') || lower.includes('ban công') || lower.includes('hiên') || lower.includes('thượng')) {
        grouped.outdoor.items.push(amenity);
      } else if (lower.includes('bếp') || lower.includes('lò') || lower.includes('ấm đun') || lower.includes('nấu') || lower.includes('tủ lạnh')) {
        grouped.kitchen.items.push(amenity);
      } else if (lower.includes('tv') || lower.includes('tivi') || lower.includes('màn hình') || lower.includes('truyền hình')) {
        grouped.media.items.push(amenity);
      } else if (lower.includes('an ninh') || lower.includes('bảo vệ') || lower.includes('cctv') || lower.includes('báo cháy') || lower.includes('báo động') || lower.includes('chữa cháy')) {
        grouped.security.items.push(amenity);
      } else if (lower.includes('tiếng') || lower.includes('ngôn ngữ') || lower.includes('dịch thuật')) {
        grouped.languages.items.push(amenity);
      } else if (lower.includes('dọn phòng') || lower.includes('giặt') || lower.includes('đón tiễn') || lower.includes('lễ tân') || lower.includes('trông trẻ')) {
        grouped.services.items.push(amenity);
      } else if (lower.includes('điều hòa') || lower.includes('máy lạnh') || lower.includes('thang máy') || lower.includes('hút thuốc') || lower.includes('cách âm') || lower.includes('quạt')) {
        grouped.general.items.push(amenity);
      } else if (lower.includes('giá treo') || lower.includes('két sắt') || lower.includes('tiện ích phòng') || lower.includes('bàn làm việc')) {
        grouped.room.items.push(amenity);
      } else {
        if (lower.includes('dịch vụ') || lower.includes('spa') || lower.includes('massage') || lower.includes('bar') || lower.includes('hồ bơi') || lower.includes('bể bơi') || lower.includes('gym')) {
          grouped.services.items.push(amenity);
        } else {
          grouped.other.items.push(amenity);
        }
      }
    });

    return Object.values(grouped).filter(g => g.items.length > 0);
  };

  const handleDeleteRoomType = async (rtId: string) => {
    try {
      await apiClient.delete(`/hotels/room-types/${rtId}`);
      setRoomTypes(prev => prev.filter(r => r.id !== rtId));
      triggerToast('Xóa hạng phòng thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể xóa hạng phòng này.');
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.dispatchEvent(new Event('auth:logout'));
      navigate('/');
    }
  };



  return (
    <div className="min-h-screen font-sans flex flex-col bg-[#F8FAFC] text-[#1E293B]">

      {/* TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white font-extrabold px-6 py-4 rounded-xl shadow-2xl z-55 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER (70px height) */}
      <header className="h-[70px] border-b border-[#E2E8F0] px-6 flex justify-between items-center z-40 sticky top-0 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.02)]">

        {/* Left header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-[#64748B]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-black text-sm">
              CB
            </div>
            <span className="font-black tracking-wide text-md text-[#0F172A] hidden sm:inline-block">
              {language === 'vi' ? 'CHỦ KHÁCH SẠN' : 'OWNER EXTRANET'}
            </span>
          </div>
        </div>

        {/* Middle search */}
        <div className="hidden md:flex items-center w-80 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#2563EB]/25 focus-within:border-[#2563EB] focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-[#94A3B8] mr-2" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm đơn đặt phòng...' : 'Search booking...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-[#1E293B] font-semibold placeholder-[#94A3B8]"
          />
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3.5">

          {/* Language selection */}
          <button
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#2563EB] transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme switch */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-[#64748B] hover:text-[#2563EB]"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
          </button>

          {/* Notification bell */}
          <div ref={notificationsDropdownRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 rounded-xl hover:bg-slate-100 relative transition-colors text-[#64748B] hover:text-[#2563EB]"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#E2E8F0] p-4 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] z-55 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                  <h4 className="font-extrabold text-xs text-[#1E293B]">{language === 'vi' ? 'Hộp thư thông báo' : 'Notifications'}</h4>
                  <span className="text-[8px] bg-rose-55 text-rose-500 px-1.5 py-0.5 rounded font-black uppercase">NEW</span>
                </div>
                <div className="space-y-3">
                  <div className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] space-y-1 text-[#1E293B]">
                    <p className="font-bold">Đơn đặt phòng mới từ Nguyễn Văn A</p>
                    <p className="text-[#64748B]">Rex Hotel - Standard Room - 12/07 - 14/07.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div ref={profileDropdownRef} className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-[#1E293B] flex items-center justify-center font-black text-sm border border-[#CBD5E1]">
                {user?.fullName?.charAt(0) || 'O'}
              </div>
              <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-[#E2E8F0] p-2 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] z-55 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-black text-[#1E293B]">{user?.fullName || 'Owner Partner'}</p>
                  <p className="text-[9px] text-[#64748B] mt-0.5">{user?.email}</p>
                </div>
                <button onClick={() => setActiveMenu('settings')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold text-left text-[#334155] hover:bg-[#F8FAFC]">
                  <User className="w-3.5 h-3.5 text-[#64748B]" /> My Profile
                </button>
                <button onClick={() => setActiveMenu('hotel')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold text-left text-[#334155] hover:bg-[#F8FAFC]">
                  <Hotel className="w-3.5 h-3.5 text-[#64748B]" /> Hotel Profile
                </button>
                <button onClick={() => setActiveMenu('finance')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold text-left text-[#334155] hover:bg-[#F8FAFC]">
                  <CreditCard className="w-3.5 h-3.5 text-[#64748B]" /> Bank Account
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-extrabold text-left text-rose-500 hover:bg-rose-50">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* DASHBOARD WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row relative">

        {/* COLLAPSIBLE SIDEBAR */}
        <aside className={`shrink-0 z-35 transition-all duration-300 lg:sticky lg:top-[70px] lg:h-[calc(100vh-70px)] ${sidebarCollapsed ? 'w-0 lg:w-20' : 'w-full lg:w-72'} bg-[#0F172A] border-r border-[#1E293B]`}>
          <div className="p-5 flex flex-col gap-1.5 h-full overflow-y-auto">

            <div className="space-y-6">

              {/* OPERATE */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-2 text-slate-400 ${sidebarCollapsed ? 'lg:text-center' : ''}`}>
                  {!sidebarCollapsed ? (language === 'vi' ? 'Vận hành' : 'Operate') : '••'}
                </span>

                <button
                  onClick={() => setActiveMenu('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeMenu === 'dashboard' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('hotel')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'hotel' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Hotel className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Khách sạn của tôi' : 'My Hotel'}</span>}
                </button>
              </div>

              {/* ROOMS & RESERVATIONS */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-2 text-slate-400 ${sidebarCollapsed ? 'lg:text-center' : ''}`}>
                  {!sidebarCollapsed ? (language === 'vi' ? 'Khách hàng & Đặt phòng' : 'Rooms & Bookings') : '••'}
                </span>

                <button
                  onClick={() => setActiveMenu('rooms')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeMenu === 'rooms' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Bed className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Danh sách phòng' : 'Rooms List'}</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('bookings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'bookings' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <CalendarRange className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Đơn đặt phòng' : 'Bookings'}</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('calendar')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'calendar' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Lịch giá & Availability' : 'Avail Calendar'}</span>}
                </button>
              </div>

              {/* RETAIL & FINANCIALS */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-2 text-slate-400 ${sidebarCollapsed ? 'lg:text-center' : ''}`}>
                  {!sidebarCollapsed ? (language === 'vi' ? 'Khuyến mãi & Tài chính' : 'Finance') : '••'}
                </span>

                <button
                  onClick={() => setActiveMenu('promotions')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeMenu === 'promotions' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Percent className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Voucher & Flash Sale' : 'Promotions'}</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('finance')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'finance' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Giao dịch & Số dư' : 'Finance Info'}</span>}
                </button>
              </div>

              {/* CRM & MESSAGES */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-2 text-slate-400 ${sidebarCollapsed ? 'lg:text-center' : ''}`}>
                  {!sidebarCollapsed ? (language === 'vi' ? 'Chăm sóc & Phản hồi' : 'CRM & Support') : '••'}
                </span>

                <button
                  onClick={() => setActiveMenu('reviews')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeMenu === 'reviews' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Star className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Đánh giá & Trả lời' : 'Reviews'}</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('support')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'support' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Tư vấn trực tuyến' : 'Live Chat'}</span>}
                </button>
              </div>

              {/* REPORT & GENERAL */}
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-2 text-slate-400 ${sidebarCollapsed ? 'lg:text-center' : ''}`}>
                  {!sidebarCollapsed ? (language === 'vi' ? 'Cấu hình chung' : 'Reports & Settings') : '••'}
                </span>

                <button
                  onClick={() => setActiveMenu('reports')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeMenu === 'reports' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Thống kê vận hành' : 'Operational Reports'}</span>}
                </button>

                <button
                  onClick={() => setActiveMenu('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all mt-1 ${activeMenu === 'settings' ? 'bg-[#2563EB] text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{language === 'vi' ? 'Cấu hình tài khoản' : 'Settings'}</span>}
                </button>
              </div>

            </div>

          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 p-6 sm:p-8 bg-[#F8FAFC]">

          {/* Breadcrumbs */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight uppercase">
                {activeMenu}
              </h2>
              <p className="text-[10px] text-[#64748B] font-extrabold uppercase mt-1">
                Owner Extranet &gt; {activeMenu}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl shadow-sm transition-all"><RefreshCw className="w-4 h-4" /></button>
              <button className="p-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl shadow-sm transition-all"><Download className="w-4 h-4" /></button>
            </div>
          </div>

          {/* 1. DASHBOARD VIEW */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">

              {/* 10 STAT STATISTIC CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Đơn đặt hôm nay</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.todayBookings}</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Nhận phòng sắp tới</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.upcomingCheckIn}</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Trả phòng sắp tới</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.upcomingCheckOut}</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Phòng trống khả dụng</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.availableRooms}</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Phòng đang lấp đầy</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.occupiedRooms}</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Doanh thu hôm nay</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{stats.revenueToday.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Doanh thu tháng này</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{stats.revenueMonth.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Đánh giá trung bình</span>
                  <p className="text-2xl font-black text-[#92400E] mt-1">{stats.averageRating} ★</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tỷ lệ lấp đầy</span>
                  <p className="text-2xl font-black mt-1 text-[#0F172A]">{stats.occupancyRate}%</p>
                </div>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tỷ lệ hủy phòng</span>
                  <p className="text-2xl font-black text-rose-600 mt-1">{stats.cancellationRate}%</p>
                </div>
              </div>

              {/* QUICK ACTIONS GRID */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-[#64748B] uppercase tracking-wider">{language === 'vi' ? 'Thao tác nhanh' : 'Quick Actions'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <button onClick={() => { setActiveMenu('rooms'); setShowAddRoom(true); }} className="p-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all text-center shadow-sm">Add Room</button>
                  <button onClick={() => setActiveMenu('calendar')} className="p-3.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl text-xs font-bold transition-all text-center shadow-sm">Update Price</button>
                  <button onClick={() => setActiveMenu('calendar')} className="p-3.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl text-xs font-bold transition-all text-center shadow-sm">Close Room</button>
                  <button onClick={() => setActiveMenu('promotions')} className="p-3.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl text-xs font-bold transition-all text-center shadow-sm">Create Voucher</button>
                  <button onClick={() => setActiveMenu('reviews')} className="p-3.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl text-xs font-bold transition-all text-center shadow-sm">Reply Review</button>
                  <button className="p-3.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] rounded-xl text-xs font-bold transition-all text-center shadow-sm">Export Report</button>
                </div>
              </div>

              {/* CHARTS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.04)] rounded-2xl lg:col-span-2">
                  <h3 className="font-bold text-sm text-[#1E293B] mb-4 uppercase">
                    {language === 'vi' ? 'Biến động doanh thu & đơn đặt phòng tuần qua' : 'Weekly Revenue & Bookings'}
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevenueOwner" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                        <YAxis fontSize={10} stroke="#94a3b8" />
                        <Tooltip />
                        <Area type="monotone" dataKey="DoanhThu" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueOwner)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-5 bg-white border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.04)] rounded-2xl">
                  <h3 className="font-bold text-sm text-[#1E293B] mb-4 uppercase">
                    {language === 'vi' ? 'Tỉ lệ lấp đầy phòng theo hạng' : 'Occupancy Rate by Category'}
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} fontSize={10} />
                        <YAxis type="category" dataKey="name" fontSize={9} width={80} />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#2563EB" radius={[0, 10, 10, 0]}>
                          {occupancyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>


              {/* RECENT BOOKING & RECENT REVIEWS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings Table */}
                <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-[#1E293B] uppercase">
                      {language === 'vi' ? 'Khách đang ở / sắp nhận phòng' : 'Upcoming / Check-in List'}
                    </h3>
                    <button onClick={() => setActiveMenu('bookings')} className="text-[10px] font-black text-[#2563EB] hover:underline uppercase">View All</button>
                  </div>

                  <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                    <table className="min-w-full text-xs font-semibold text-slate-650 text-left">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase text-[#475569] font-bold">
                        <tr>
                          <th className="px-4 py-3">Khách</th>
                          <th className="px-4 py-3">Nhận / Trả</th>
                          <th className="px-4 py-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white">
                        {(() => {
                          const filteredBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
                          return filteredBookings.length > 0 ? filteredBookings.slice(0, 5).map((b, idx) => (
                            <tr key={b.id} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#EFF6FF] transition-colors`}>
                              <td className="px-4 py-3">
                                <p className="font-bold text-[#1E293B]">{b.guestName}</p>
                                <p className="text-[9px] text-[#64748B]">{b.guestPhone}</p>
                              </td>
                              <td className="px-4 py-3 text-[#64748B]">
                                <p>{new Date(b.checkInDate).toLocaleDateString('vi-VN')} / {new Date(b.checkOutDate).toLocaleDateString('vi-VN')}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5">
                                  {b.status === 'CONFIRMED' && (
                                    <button onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-[9px] px-2.5 py-1 rounded-xl shadow-sm">Check In</button>
                                  )}
                                  {b.status === 'CHECKED_IN' && (
                                    <span className="bg-[#DBEAFE] text-[#1D4ED8] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Đang ở</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="text-center py-6 text-[#64748B] font-bold bg-white">Không có khách đang ở hoặc sắp nhận phòng</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reviews */}
                <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-[#1E293B] uppercase">
                      {language === 'vi' ? 'Đánh giá khách hàng gần đây' : 'Guest Reviews'}
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {recentReviews.length > 0 ? recentReviews.map((review: any) => (
                      <div key={review.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-[#1E293B]">{review.guestName}</span>
                          <span className="text-amber-600 font-extrabold">{review.ratingOverall} ★</span>
                        </div>
                        <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">"{review.comment}"</p>
                        <p className="text-[8px] text-[#94A3B8] font-semibold">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-[#64748B] font-bold text-xs">Chưa có đánh giá nào từ khách hàng</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. HOTEL INFORMATION */}
          {activeMenu === 'hotel' && (
            <div className="bg-white border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.04)] rounded-2xl p-6 space-y-6">
              <div className="border-b border-[#E2E8F0] pb-3 flex justify-between items-center">
                <h3 className="font-bold text-base text-[#0F172A] uppercase">Hồ sơ khách sạn của bạn</h3>
                <span className="text-[10px] text-[#64748B] font-extrabold uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Cập nhật yêu cầu phê duyệt lại
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">

                {/* Cột 1: Thông tin cơ bản & Thời gian */}
                <div className="space-y-4">
                  <h4 className="font-black text-[#2563EB] uppercase tracking-wider text-[10px]">1. Thông tin cơ bản & Thời gian</h4>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748B] font-bold uppercase">Tên khách sạn</label>
                    <input type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748B] font-bold uppercase">Danh mục loại hình</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold cursor-pointer">
                      <option value="">Chọn loại hình</option>
                      {systemCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748B] font-bold uppercase">Mô tả tổng quan</label>
                    <textarea rows={4} value={hotelDesc} onChange={(e) => setHotelDesc(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748B] font-bold uppercase">Thời gian nhận phòng (Check-in)</label>
                      <input type="text" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748B] font-bold uppercase">Thời gian trả phòng (Check-out)</label>
                      <input type="text" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748B] font-bold uppercase">Chính sách chung</label>
                    <input type="text" value={hotelPolicies} onChange={(e) => setHotelPolicies(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                  </div>
                </div>

                {/* Cột 2: Địa chỉ & Vị trí tọa độ */}
                <div className="space-y-4">
                  <h4 className="font-black text-[#2563EB] uppercase tracking-wider text-[10px]">2. Địa điểm & Vị trí bản đồ</h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#64748B] font-bold uppercase">Tỉnh / Thành phố</label>
                      <select value={provinceId} onChange={(e) => { setProvinceId(e.target.value); setDistrictId(''); setWardId(''); }} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold cursor-pointer">
                        <option value="">Chọn Tỉnh/Thành</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#64748B] font-bold uppercase">Quận / Huyện</label>
                      <select value={districtId} disabled={!provinceId} onChange={(e) => { setDistrictId(e.target.value); setWardId(''); }} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold cursor-pointer disabled:bg-slate-50 disabled:text-slate-400">
                        <option value="">Chọn Quận/Huyện</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#64748B] font-bold uppercase">Phường / Xã</label>
                      <select value={wardId} disabled={!districtId} onChange={(e) => setWardId(e.target.value)} className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold cursor-pointer disabled:bg-slate-50 disabled:text-slate-400">
                        <option value="">Chọn Phường/Xã</option>
                        {wards.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748B] font-bold uppercase">Địa chỉ (Số nhà, Tên đường)</label>
                    <input type="text" value={hotelAddress} onChange={(e) => setHotelAddress(e.target.value)} placeholder="VD: 141 Nguyễn Huệ" className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748B] font-bold uppercase">Vĩ độ (Latitude)</label>
                      <input type="number" step="any" value={hotelLat} onChange={(e) => setHotelLat(e.target.value !== '' ? Number(e.target.value) : '')} placeholder="VD: 10.776" className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748B] font-bold uppercase">Kinh độ (Longitude)</label>
                      <input type="number" step="any" value={hotelLng} onChange={(e) => setHotelLng(e.target.value !== '' ? Number(e.target.value) : '')} placeholder="VD: 106.701" className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] p-2.5 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Dưới: Tiện ích & Hình ảnh */}
              <div className="border-t border-[#E2E8F0] pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">

                {/* 3. Tiện ích khách sạn */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                    <h4 className="font-black text-[#2563EB] uppercase tracking-wider text-[10px]">3. Tiện ích khách sạn</h4>
                    <button
                      type="button"
                      onClick={() => setIsAmenitiesModalOpen(true)}
                      className="text-[10px] text-[#2563EB] hover:text-[#1d4ed8] font-black underline flex items-center gap-1"
                    >
                      Thiết lập tiện ích ({selectedAmenities.length})
                    </button>
                  </div>

                  {/* Tóm tắt các tiện ích đã chọn */}
                  {selectedAmenities.length > 0 ? (
                    <div
                      onClick={() => setIsAmenitiesModalOpen(true)}
                      className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto cursor-pointer hover:bg-slate-100/50 transition-colors"
                    >
                      {systemAmenities
                        .filter(a => selectedAmenities.includes(a.id))
                        .map(a => (
                          <span key={a.id} className="bg-white border border-slate-150 text-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm">
                            ✓ {a.name}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsAmenitiesModalOpen(true)}
                      className="border border-dashed border-slate-300 hover:border-[#2563EB] rounded-2xl p-6 text-center cursor-pointer text-slate-400 hover:text-[#2563EB] transition-colors"
                    >
                      <p className="text-[10px] font-bold">Chưa chọn tiện ích nào.</p>
                      <p className="text-[9px] mt-0.5">Nhấp vào đây để cấu hình tiện ích khách sạn</p>
                    </div>
                  )}
                </div>

                {/* 4. Album Hình ảnh */}
                <div className="space-y-3">
                  <h4 className="font-black text-[#2563EB] uppercase tracking-wider text-[10px]">4. Hình ảnh khách sạn</h4>

                  {/* Tải ảnh từ thiết bị cục bộ */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/10 rounded-2xl p-4 cursor-pointer transition-all text-center relative group min-h-[90px] bg-slate-50/20">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                          <span className="text-[10px] font-black text-[#2563EB] uppercase">Đang tải ảnh lên...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">📁</span>
                          <span className="text-[10px] font-black text-slate-700 uppercase group-hover:text-[#2563EB] transition-colors">
                            Chọn ảnh từ máy tính
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold">
                            Hỗ trợ chọn nhiều ảnh cùng lúc
                          </span>
                        </div>
                      )}
                    </label>

                    {/* Hoặc thêm từ URL */}
                    <div className="flex flex-col justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 sm:w-56 gap-2">
                      <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider">
                        Hoặc thêm URL ảnh:
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="https://example.com/img.jpg"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="flex-1 bg-white border border-[#CBD5E1] text-[#1E293B] px-2.5 py-1.5 rounded-xl outline-none text-[10px] font-semibold focus:border-[#2563EB] placeholder-[#94A3B8]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newImageUrl.trim()) return;
                            setHotelImages(prev => [...prev, { url: newImageUrl.trim(), isPrimary: prev.length === 0 }]);
                            setNewImageUrl('');
                            triggerToast('Đã thêm liên kết ảnh!');
                          }}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách ảnh hiện tại */}
                  <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                    {hotelImages.map((img, idx) => (
                      <div key={idx} className="relative border border-slate-200 rounded-xl overflow-hidden group shadow-sm bg-slate-50 flex items-center p-1.5 gap-2">
                        <img src={img.url} alt="Hotel Preview" className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-100" />
                        <div className="flex-1 flex flex-col justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setHotelImages(prev => prev.map((item, i) => ({ ...item, isPrimary: i === idx })));
                            }}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full w-fit ${img.isPrimary ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-650 border border-slate-200 hover:bg-slate-200'
                              }`}
                          >
                            {img.isPrimary ? 'Ảnh chính' : 'Đặt chính'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHotelImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-rose-50 text-rose-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

              {/* Nút lưu */}
              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveHotelInfo}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  Lưu thông tin hồ sơ
                </button>
              </div>

            </div>
          )}

          {/* 3. ROOM TYPES & CRUD */}
          {activeMenu === 'rooms' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3.5">
                <h3 className="font-extrabold text-[#0F172A] text-sm uppercase tracking-wider">Danh sách hạng phòng</h3>
                <button 
                  onClick={handleOpenAddRoomType} 
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> {language === 'vi' ? 'Thêm hạng phòng' : 'Add Room Type'}
                </button>
              </div>

              {roomTypes.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#E2E8F0] rounded-3xl p-6 text-slate-450 font-bold text-xs space-y-2">
                  <p>Chưa có hạng phòng nào được thiết lập cho khách sạn này.</p>
                  <p className="text-[10px] text-slate-400">Hãy nhấn "Thêm hạng phòng" ở trên để bắt đầu thêm!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {roomTypes.map((rt) => {
                    const roomImg = rt.images?.[0]?.url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
                    return (
                      <div key={rt.id} className="bg-white rounded-3xl border border-slate-100 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                        {/* Room Image with overlay badges */}
                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                          <img src={roomImg} alt={rt.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {rt.size && (
                              <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20">
                                {rt.size} m²
                              </span>
                            )}
                            <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20">
                              {rt.capacity} Khách
                            </span>
                            <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/20">
                              {rt.bedCount || 1} Giường
                            </span>
                            <span className="bg-amber-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/20 shadow-sm animate-pulse">
                              {rt.rooms?.length || 0} phòng
                            </span>
                          </div>
                        </div>

                        {/* Room Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-black text-slate-800 text-sm sm:text-base">{rt.name}</h4>
                              <span className="text-[#2563EB] font-black text-xs sm:text-sm whitespace-nowrap bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                                {Number(rt.basePrice).toLocaleString()} đ
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                              {rt.description || 'Chưa có mô tả cho hạng phòng này.'}
                            </p>

                            {/* Amenities list */}
                            {rt.amenities && rt.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1.5">
                                {rt.amenities.slice(0, 5).map((am: string) => (
                                  <span key={am} className="bg-slate-100 text-slate-650 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    {am}
                                  </span>
                                ))}
                                {rt.amenities.length > 5 && (
                                  <span className="bg-slate-105 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                    +{rt.amenities.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span className="text-[#334155] bg-slate-50 border border-slate-200 text-[10px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                              Số lượng: {rt.rooms?.length || 0} phòng
                            </span>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEditRoomType(rt)}
                                className="text-slate-650 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-all shadow-sm"
                                title="Chỉnh sửa hạng phòng"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoomType(rt.id)}
                                className="text-[#DC2626] hover:text-[#B91C1C] bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-all shadow-sm"
                                title="Xóa hạng phòng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. RESERVATIONS & BOOKINGS LIST */}
          {activeMenu === 'bookings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-[#E2E8F0]">
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nhập tên khách hàng cần tìm...' : 'Search guest name...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl px-4 py-2 text-xs outline-none font-semibold focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl px-4 py-2 text-xs outline-none font-semibold focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                >
                  <option value="ALL">Tất cả đơn đặt</option>
                  <option value="PENDING">PENDING (Chờ xác nhận)</option>
                  <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
                  <option value="CHECKED_IN">CHECKED_IN (Đang lưu trú)</option>
                  <option value="CHECKED_OUT">CHECKED_OUT (Đã trả phòng)</option>
                </select>
              </div>

              {bookingsLoading ? (
                <div className="h-64 bg-slate-500/5 rounded-2xl animate-pulse"></div>
              ) : (
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <table className="min-w-full divide-y divide-[#E2E8F0] text-xs font-semibold text-slate-650 text-left">
                    <thead className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-[#475569]">
                      <tr>
                        <th className="px-4 py-3">Khách hàng</th>
                        <th className="px-4 py-3">Ngày đến/đi</th>
                        <th className="px-4 py-3">Giá tiền</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#1E293B]">
                      {bookings.filter(b => {
                        const matchSearch = b.guestName.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
                        return matchSearch && matchStatus;
                      }).map((b, idx) => (
                        <tr key={b.id} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#EFF6FF] transition-colors`}>
                          <td className="px-4 py-4">
                            <p className="font-extrabold text-[#1E293B]">{b.guestName}</p>
                            <p className="text-[10px] text-[#64748B]">{b.guestPhone} | {b.guestEmail}</p>
                          </td>
                          <td className="px-4 py-4 text-[#64748B]">{b.checkInDate} / {b.checkOutDate}</td>
                          <td className="px-4 py-4 font-black text-[#0F172A]">{b.finalPrice.toLocaleString()} đ</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] ${b.status === 'CONFIRMED' ? 'bg-[#DCFCE7] text-[#166534]' :
                                b.status === 'CHECKED_IN' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                                  b.status === 'PENDING' ? 'bg-[#FEF3C7] text-[#92400E]' :
                                    b.status === 'CANCELLED' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                                      b.status === 'CHECKED_OUT' ? 'bg-[#EDE9FE] text-[#6D28D9]' : 'bg-[#F3F4F6] text-[#6B7280]'
                              }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 flex gap-1.5">
                            {b.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl shadow-sm">Xác nhận</button>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')} className="bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition-all">Từ chối</button>
                              </>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_IN')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl shadow-sm">Check In</button>
                            )}
                            {b.status === 'CHECKED_IN' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'CHECKED_OUT')} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl shadow-sm">Check Out</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. PRICE CALENDAR */}
          {activeMenu === 'calendar' && (
            <div className="space-y-4">
              {/* Nút bấm cấu hình hàng loạt */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="flex gap-4 items-center">
                  <label className="text-xs font-bold text-[#64748B]">Hạng phòng hiển thị:</label>
                  <select
                    value={selectedRoomTypeId}
                    onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                    className="bg-white border border-[#CBD5E1] text-[#2563EB] rounded-xl px-4 py-2 text-xs outline-none font-bold focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  >
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowBulkConfig(!showBulkConfig)}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Sliders className="w-4 h-4" /> Cấu hình giá hàng loạt / Cuối tuần
                </button>
              </div>

              {/* Form Cấu hình giá hàng loạt */}
              {showBulkConfig && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-5 space-y-4 animate-in slide-in-from-top-3 duration-250">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Cài đặt giá hàng loạt / Cuối tuần</h4>
                    <button onClick={() => setShowBulkConfig(false)} className="text-slate-450 hover:text-slate-700"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={bulkStartDate}
                        onChange={(e) => setBulkStartDate(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={bulkEndDate}
                        onChange={(e) => setBulkEndDate(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase">Tính toán dựa trên</label>
                      <select
                        value={bulkBaseOn}
                        onChange={(e) => setBulkBaseOn(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all cursor-pointer"
                      >
                        <option value="BASE">Giá gốc hạng phòng</option>
                        <option value="CALENDAR">Giá hiện tại trên lịch</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase">Hình thức điều chỉnh</label>
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all cursor-pointer"
                      >
                        <option value="PRICE">Giá cố định (mới)</option>
                        <option value="SURCHARGE_WEEKEND">Tăng giá (Cuối tuần / Lễ)</option>
                        <option value="DISCOUNT">Giảm giá phòng</option>
                        <option value="RESTORE">Khôi phục giá gốc</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      {bulkAction !== 'RESTORE' && (
                        <>
                          <label className="text-[10px] font-bold text-[#64748B] uppercase">
                            {bulkAction === 'PRICE' ? 'Mức giá (đ)' : 'Giá trị điều chỉnh'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={bulkValue}
                              onChange={(e) => setBulkValue(e.target.value)}
                              placeholder={bulkAction === 'PRICE' ? '1500000' : '10'}
                              className="flex-1 bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all"
                            />
                            {bulkAction !== 'PRICE' && (
                              <select
                                value={bulkAdjustmentType}
                                onChange={(e) => setBulkAdjustmentType(e.target.value)}
                                className="bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl px-2.5 outline-none font-semibold focus:border-[#2563EB] transition-all cursor-pointer"
                              >
                                <option value="PERCENTAGE">%</option>
                                <option value="FIXED">đ</option>
                              </select>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase block">Áp dụng cho các thứ trong tuần</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBulkDaysOfWeek([true, true, true, true, true, true, true])}
                          className="text-[9px] font-black text-[#2563EB] hover:underline"
                        >
                          Tất cả các ngày
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setBulkDaysOfWeek([false, false, false, false, true, true, true])}
                          className="text-[9px] font-black text-[#2563EB] hover:underline"
                        >
                          Cuối tuần (T6, T7, CN)
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 p-3 bg-white border border-[#E2E8F0] rounded-2xl">
                      {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map((day, idx) => (
                        <label key={day} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bulkDaysOfWeek[idx]}
                            onChange={(e) => {
                              const newDays = [...bulkDaysOfWeek];
                              newDays[idx] = e.target.checked;
                              setBulkDaysOfWeek(newDays);
                            }}
                            className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 w-4 h-4 cursor-pointer"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200">
                    <button
                      onClick={handleSaveBulkPriceCalendar}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Áp dụng cấu hình hàng loạt
                    </button>
                  </div>
                </div>
              )}

              {calendarLoading ? (
                <div className="h-48 bg-slate-500/5 rounded-2xl animate-pulse"></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-7 gap-4">
                  {calendarDays.map((day) => (
                    <div
                      key={day.date}
                      onClick={() => {
                        setEditDay(day);
                        setNewPrice(day.price.toString());
                        setNewBlocked(day.isBlocked);
                      }}
                      className={`p-4 border rounded-2xl cursor-pointer text-center space-y-1.5 transition-all shadow-sm ${day.isBlocked
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:border-red-400 text-red-700 dark:text-red-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        }`}
                    >
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{day.date}</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">{day.price.toLocaleString()} đ</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${day.isBlocked
                          ? 'bg-red-200/60 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                        {day.isBlocked ? (language === 'vi' ? 'Đã khóa' : 'BLOCKED') : (language === 'vi' ? 'Trống' : 'AVAILABLE')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. SUPPORT LIVE CHAT */}
          {activeMenu === 'support' && (
            <div className="h-[550px] border border-[#E2E8F0] rounded-2xl flex overflow-hidden bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)] text-[#1E293B]">

              {/* Left sidebar chats list */}
              <div className="w-80 border-r border-[#E2E8F0] h-full flex flex-col">
                <div className="p-4 border-b border-[#E2E8F0]">
                  <h4 className="font-extrabold text-xs uppercase text-[#64748B]">Danh sách hội thoại</h4>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`p-3.5 cursor-pointer transition-colors ${activeConv?.id === conv.id ? 'bg-[#2563EB]/10 border-l-2 border-[#2563EB]' : 'hover:bg-[#F8FAFC]'
                        }`}
                    >
                      <p className="text-xs font-bold text-[#1E293B]">{conv.customer.fullName}</p>
                      <p className="text-[9px] text-[#64748B] mt-0.5">{conv.hotel.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat window */}
              <div className="flex-1 h-full flex flex-col">
                {activeConv ? (
                  <>
                    <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                      <p className="text-xs font-bold text-[#1E293B]">{activeConv.customer.fullName}</p>
                      <span className="text-[8px] font-black text-emerald-600 uppercase">ONLINE</span>
                    </div>

                    <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3.5 rounded-2xl max-w-sm text-xs font-semibold leading-relaxed shadow-sm ${msg.senderId === user?.id
                              ? 'bg-[#2563EB] text-white rounded-br-none'
                              : 'bg-white text-[#1E293B] rounded-bl-none border border-[#E2E8F0]'
                            }`}>
                            <p className="font-bold text-[9px] opacity-75 mb-0.5">{msg.sender.fullName}</p>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-[#E2E8F0] flex gap-2 bg-white">
                      <input
                        type="text"
                        placeholder="Nhập nội dung tư vấn..."
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="flex-grow bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs outline-none font-semibold text-[#1E293B] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                      />
                      <button onClick={handleSendChatMessage} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white p-2.5 rounded-xl transition-all shadow-md"><Send className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-center text-[#64748B] p-6">
                    <MessageSquare className="w-12 h-12 text-[#2563EB] animate-pulse" />
                    <p className="text-xs font-black uppercase">Chọn một hội thoại bên trái để bắt đầu chat tư vấn khách hàng</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 7. PROMOTIONS & COUPONS */}
          {activeMenu === 'promotions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3.5">
                <h3 className="font-bold text-sm text-[#1E293B] uppercase">Quản lý mã giảm giá khách sạn</h3>
                <button
                  onClick={() => setShowAddCoupon(true)}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm mã giảm giá
                </button>
              </div>

              {couponsLoading ? (
                <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
              ) : (
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <table className="min-w-full divide-y divide-[#E2E8F0] text-xs font-semibold text-slate-650 text-left">
                    <thead className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-[#475569]">
                      <tr>
                        <th className="px-4 py-3">Mã giảm giá</th>
                        <th className="px-4 py-3">Mô tả</th>
                        <th className="px-4 py-3">Loại giảm</th>
                        <th className="px-4 py-3">Mức giảm</th>
                        <th className="px-4 py-3">Giới hạn dùng</th>
                        <th className="px-4 py-3">Ngày hết hạn</th>
                        <th className="px-4 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#1E293B]">
                      {coupons.length > 0 ? coupons.map((c, idx) => (
                        <tr key={c.id} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#EFF6FF] transition-colors`}>
                          <td className="px-4 py-4 font-mono font-extrabold text-[#2563EB] text-[13px]">{c.code}</td>
                          <td className="px-4 py-4 text-[#64748B]">{c.description}</td>
                          <td className="px-4 py-4 text-[#64748B]">
                            {c.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                          </td>
                          <td className="px-4 py-4 font-black text-[#0F172A]">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `${Number(c.discountValue).toLocaleString()} đ`}
                          </td>
                          <td className="px-4 py-4 text-[#64748B]">{c.usageLimit} lần</td>
                          <td className="px-4 py-4 text-[#64748B]">
                            {new Date(c.endDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setDeleteConfirmId(c.id)}
                              className="text-[#DC2626] bg-[#FEE2E2] hover:bg-[#FECACA] p-2 rounded-xl transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-[#64748B] font-bold bg-white">
                            Chưa có chương trình khuyến mãi nào được tạo
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 8. CUSTOMERS (Derived dynamically) */}
          {activeMenu === 'customers' && (
            <div className="space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-sm text-[#1E293B] uppercase">Danh sách khách hàng đã đặt phòng</h3>
              </div>

              <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-xs font-semibold text-slate-650 text-left">
                  <thead className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-[#475569]">
                    <tr>
                      <th className="px-4 py-3">Khách hàng</th>
                      <th className="px-4 py-3">Số điện thoại</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Tổng số đơn đặt</th>
                      <th className="px-4 py-3">Tổng tiền tích lũy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#1E293B]">
                    {getUniqueCustomers().length > 0 ? getUniqueCustomers().map((cust, idx) => (
                      <tr key={cust.id} className={`${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'} hover:bg-[#EFF6FF] transition-colors`}>
                        <td className="px-4 py-4 font-black">{cust.guestName}</td>
                        <td className="px-4 py-4 text-[#64748B]">{cust.guestPhone}</td>
                        <td className="px-4 py-4 text-[#64748B]">{cust.guestEmail}</td>
                        <td className="px-4 py-4 text-center font-bold text-[#2563EB]">{cust.totalBookings} đơn</td>
                        <td className="px-4 py-4 font-black text-[#0F172A]">{cust.totalSpent.toLocaleString()} đ</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-[#64748B] font-bold bg-white">
                          Chưa có khách hàng nào đặt phòng tại khách sạn này
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. REVIEWS tab */}
          {activeMenu === 'reviews' && (
            <div className="space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="font-bold text-sm text-[#1E293B] uppercase">Tất cả nhận xét & đánh giá từ khách hàng</h3>
              </div>

              {allReviewsLoading ? (
                <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allReviews.length > 0 ? allReviews.map((r) => (
                    <div key={r.id} className="p-4 bg-white border border-[#E2E8F0] shadow-[0_4px_12px_rgba(15,23,42,0.02)] rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                            {r.user?.fullName?.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#1E293B] text-xs">{r.user?.fullName || 'Khách ẩn danh'}</p>
                            <p className="text-[10px] text-[#64748B]">{r.user?.email || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-black">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          <span>{r.ratingOverall} / 5</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-50">
                        <p className="text-xs text-[#475569] font-medium leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                          "{r.comment}"
                        </p>
                        <p className="text-[8px] text-[#94A3B8] font-bold mt-2">Gửi ngày: {new Date(r.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center py-12 text-[#64748B] font-bold bg-white border border-dashed border-[#CBD5E1] rounded-2xl">
                      Khách sạn của bạn chưa nhận được đánh giá nào từ khách hàng
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OTHER MOCK TABS */}
          {['reports', 'finance', 'settings'].includes(activeMenu) && (
            <div className="p-8 border border-dashed border-[#CBD5E1] rounded-2xl text-center space-y-3 bg-white shadow-sm">
              <Sliders className="w-12 h-12 text-[#2563EB] mx-auto animate-pulse" />
              <h3 className="text-sm font-bold uppercase text-[#1E293B]">
                Giao diện quản lý {activeMenu} đang được thiết lập kết nối
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Bản nâng cấp full-width UI của tab này đã sẵn sàng. Giao diện CRUD chuẩn và các trường dữ liệu hiển thị đã sẵn sàng liên kết với các thực thể trong Prisma.
              </p>
            </div>
          )}

        </main>
      </div>

      {/* EDIT DAY PRICE MODAL */}
      {editDay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 text-[#1E293B] border border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A] text-sm">Điều chỉnh lịch ngày {editDay.date}</h3>

            <div className="space-y-3 font-semibold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Giá phòng tùy chỉnh</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E293B]">Đóng phòng / Khóa phòng</label>
                <input
                  type="checkbox"
                  checked={newBlocked}
                  onChange={(e) => setNewBlocked(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-between pt-2 border-t border-[#E2E8F0] flex-wrap items-center">
              <button onClick={handleRestoreDay} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#DC2626] rounded-xl text-[10px] font-extrabold transition-all shadow-sm">
                Khôi phục giá gốc
              </button>
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => setEditDay(null)} className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] rounded-xl text-[10px] font-bold transition-all shadow-sm">Quay lại</button>
                <button onClick={handleSavePriceCalendar} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD COUPON MODAL */}
      {showAddCoupon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOwnerCoupon} className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 text-[#1E293B] border border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-2">Tạo khuyến mãi mới</h3>

            <div className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Mã giảm giá</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="VD: BANMAI20"
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Mô tả chương trình</label>
                <input
                  type="text"
                  required
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="VD: Giảm 20% đặt phòng trong tháng"
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Loại giảm giá</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] transition-all font-semibold cursor-pointer"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Giá trị giảm</label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder="VD: 20 hoặc 150000"
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    required
                    value={newCouponLimit}
                    onChange={(e) => setNewCouponLimit(e.target.value)}
                    placeholder="100"
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Ngày hết hạn</label>
                  <input
                    type="date"
                    required
                    value={newCouponEnd}
                    onChange={(e) => setNewCouponEnd(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-[#E2E8F0]">
              <button type="button" onClick={() => setShowAddCoupon(false)} className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold transition-all shadow-sm">Quay lại</button>
              <button type="submit" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">Tạo khuyến mãi</button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE COUPON CONFIRMATION MODAL */}
      {deleteConfirmId && activeMenu === 'promotions' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 text-[#1E293B] text-center">
            <ShieldAlert className="w-12 h-12 text-[#DC2626] mx-auto animate-bounce" />
            <h3 className="font-bold text-sm text-[#0F172A]">Xác nhận xóa khuyến mãi này?</h3>
            <p className="text-xs text-[#64748B]">Hành động này sẽ xóa vĩnh viễn dữ liệu mã giảm giá này. Bạn có chắc chắn không?</p>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold transition-all shadow-sm">Hủy bỏ</button>
              <button onClick={() => handleDeleteOwnerCoupon(deleteConfirmId)} className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all shadow-sm">Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT ROOM TYPE MODAL */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveRoomType} className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl w-full max-w-lg space-y-5 text-[#1E293B] border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#E2E8F0] pb-3 flex justify-between items-center">
              <h3 className="font-extrabold text-[#0F172A] text-sm uppercase tracking-wider">
                {editingRoomType ? 'Chỉnh sửa hạng phòng' : 'Tạo hạng phòng mới'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddRoom(false); setEditingRoomType(null); }}
                className="text-slate-450 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Tên hạng phòng</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Standard King Room / Deluxe Ocean View"
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Giá cơ bản (đ)</label>
                  <input
                    type="number"
                    required
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(e.target.value)}
                    placeholder="1200000"
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Diện tích (m²)</label>
                  <input
                    type="number"
                    required
                    value={newRoomSize}
                    onChange={(e) => setNewRoomSize(e.target.value)}
                    placeholder="30"
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Sức chứa</label>
                  <input
                    type="number"
                    required
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Số giường</label>
                  <input
                    type="number"
                    required
                    value={newRoomBedCount}
                    onChange={(e) => setNewRoomBedCount(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase">Số lượng phòng</label>
                  <input
                    type="number"
                    required
                    value={newRoomCount}
                    onChange={(e) => setNewRoomCount(e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Mô tả phòng</label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Mô tả các điểm đặc biệt, hướng phòng, tiện nghi nổi bật..."
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Ảnh hạng phòng (URL)</label>
                <input
                  type="text"
                  value={newRoomImageUrl}
                  onChange={(e) => setNewRoomImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2.5 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                />
              </div>

              {/* Chính sách phòng & Phụ thu */}
              <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-2xl space-y-3.5">
                <h4 className="font-extrabold text-[#2563EB] text-[10px] uppercase tracking-wider">Chính sách & Phụ thu</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase">Chính sách hủy phòng</label>
                    <select
                      value={newRoomCancellationPolicy}
                      onChange={(e) => setNewRoomCancellationPolicy(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] transition-all font-semibold outline-none cursor-pointer"
                    >
                      <option value="FREE_24H">Hủy miễn phí trước 24h</option>
                      <option value="FREE_48H">Hủy miễn phí trước 48h</option>
                      <option value="NON_REFUNDABLE">Không hoàn tiền</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase">Chính sách thanh toán</label>
                    <select
                      value={newRoomPaymentPolicy}
                      onChange={(e) => setNewRoomPaymentPolicy(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] transition-all font-semibold outline-none cursor-pointer"
                    >
                      <option value="PAY_AT_HOTEL">Thanh toán tại khách sạn</option>
                      <option value="PAY_ONLINE">Thanh toán online</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase">Phụ thu trẻ em (đ/đêm)</label>
                    <input
                      type="number"
                      required
                      value={newRoomChildSurcharge}
                      onChange={(e) => setNewRoomChildSurcharge(e.target.value)}
                      placeholder="150000"
                      min="0"
                      className="w-full bg-white border border-[#CBD5E1] text-[#1E293B] rounded-xl p-2 text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-4 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newRoomIncludeBreakfast}
                      onChange={(e) => setNewRoomIncludeBreakfast(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 w-4 h-4 cursor-pointer"
                    />
                    Bao gồm bữa sáng miễn phí
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#64748B] uppercase block">Tiện ích phòng</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-100 rounded-2xl max-h-[120px] overflow-y-auto">
                  {['Wifi', 'Điều hòa', 'Tivi', 'Tủ lạnh', 'Bồn tắm', 'Ban công', 'Ấm đun nước', 'Dép đi trong nhà', 'Két an toàn', 'Máy sấy tóc'].map((am) => {
                    const isChecked = newRoomAmenities.includes(am);
                    return (
                      <label key={am} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRoomAmenities(prev => [...prev, am]);
                            } else {
                              setNewRoomAmenities(prev => prev.filter(x => x !== am));
                            }
                          }}
                          className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 w-3.5 h-3.5 cursor-pointer"
                        />
                        {am}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-[#E2E8F0]">
              <button 
                type="button" 
                onClick={() => { setShowAddRoom(false); setEditingRoomType(null); }} 
                className="px-4 py-2.5 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {editingRoomType ? 'Lưu thay đổi' : 'Tạo phòng'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AMENITIES CONFIGURATION MODAL */}
      {isAmenitiesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base uppercase tracking-wider">
                  Thiết lập tiện ích khách sạn
                </h3>
                <p className="text-[10px] text-[#64748B] font-bold mt-0.5">
                  Chọn các tiện ích có sẵn hoặc tự định nghĩa thêm tiện ích mới cho khách sạn của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAmenitiesModalOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

              {/* Section 1: Thêm tiện ích mới */}
              <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl space-y-3">
                <h4 className="font-black text-[#2563EB] text-[10px] uppercase tracking-wider">
                  Tự thêm tiện ích mới vào hệ thống
                </h4>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Tên tiện ích... (VD: Sân golf, Lò nướng...)"
                    value={customAmenityName}
                    onChange={(e) => setCustomAmenityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      }
                    }}
                    className="flex-1 bg-white border border-[#CBD5E1] text-[#1E293B] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#2563EB] text-[11px] font-semibold placeholder-[#94A3B8]"
                  />
                  <select
                    value={customAmenityCategory}
                    onChange={(e) => setCustomAmenityCategory(e.target.value)}
                    className="bg-white border border-[#CBD5E1] text-[#1E293B] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#2563EB] text-[11px] font-semibold"
                  >
                    <option value="bathroom">Phòng tắm</option>
                    <option value="bedroom">Phòng ngủ</option>
                    <option value="outdoor">Ngoài trời</option>
                    <option value="kitchen">Nhà bếp</option>
                    <option value="room">Tiện ích trong phòng</option>
                    <option value="media">Truyền thông & Công nghệ</option>
                    <option value="internet">Internet</option>
                    <option value="parking">Chỗ đậu xe</option>
                    <option value="services">Dịch vụ & Giải trí</option>
                    <option value="security">An ninh</option>
                    <option value="general">Tổng quát</option>
                    <option value="languages">Ngôn ngữ sử dụng</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl font-black text-[11px] hover:bg-[#1d4ed8] active:scale-95 transition-all whitespace-nowrap"
                  >
                    Thêm tiện ích
                  </button>
                </div>
              </div>

              {/* Section 2: Checklist phân loại */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider pb-2 border-b border-slate-100 flex justify-between items-center">
                  <span>Danh mục tiện nghi hiện có</span>
                  <span className="text-[10px] text-[#2563EB] font-black bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Đã chọn: {selectedAmenities.length}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getGroupedSystemAmenities().map((group) => (
                    <div key={group.title} className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-2.5">
                      <h5 className="font-black text-slate-700 text-[10px] uppercase border-b border-slate-200 pb-1.5 flex items-center justify-between">
                        <span>{group.title}</span>
                        <span className="text-[9px] text-[#2563EB] font-extrabold">({group.items.length})</span>
                      </h5>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {group.items.map((amenity) => {
                          const isChecked = selectedAmenities.includes(amenity.id);
                          return (
                            <label key={amenity.id} className="flex items-center gap-2 cursor-pointer py-0.5 text-[#334155] font-bold text-[10px] hover:text-[#2563EB] select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAmenities(prev => prev.filter(id => id !== amenity.id));
                                  } else {
                                    setSelectedAmenities(prev => [...prev, amenity.id]);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                              />
                              <span className="line-clamp-1" title={amenity.name}>{amenity.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 gap-2">
              <button
                type="button"
                onClick={() => setIsAmenitiesModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-[11px] transition-colors active:scale-95"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAmenitiesModalOpen(false);
                  triggerToast('Cấu hình tiện ích hoàn tất!');
                }}
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-black text-[11px] transition-colors active:scale-95 shadow-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
