import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import apiClient from '../core/api/client';
import { 
  Lock, 
  ShieldCheck, 
  Clock, 
  ChevronDown,
  User,
  Users,
  Bed,
  Utensils,
  Calendar,
  XCircle
} from 'lucide-react';

interface BookingDetail {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string | null;
  insuranceSelected: boolean;
  createdAt: string;
  status: string;
  bookingItems: {
    roomType: {
      name: string;
      bedCount: number;
      hotel: {
        name: string;
        address: string;
        checkInTime: string | null;
        checkOutTime: string | null;
      };
    };
    quantity: number;
    price: number;
  }[];
}

export const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const { language } = useSelector((state: RootState) => state.settings);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment option selected (Accordion style)
  const [activeOption, setActiveOption] = useState<'card' | 'vietqr' | 'vietinbank' | 'wallet' | 'mobile' | 'store' | 'installment'>('card');
  const [subWallet, setSubWallet] = useState<'momo' | 'zalopay' | 'shopeepay' | 'vnpay'>('momo');

  // Form states for Credit Card
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});

  // Countdown states (10 minutes = 600 seconds)
  const [secondsLeft, setSecondsLeft] = useState(600);

  // Submit states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');



  useEffect(() => {
    if (!bookingId) {
      navigate('/');
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}`);
        if (res.data.success) {
          const fetchedBooking = res.data.data;
          setBooking(fetchedBooking);
          const elapsed = Math.floor((Date.now() - new Date(fetchedBooking.createdAt).getTime()) / 1000);
          const left = Math.max(0, 600 - elapsed);
          setSecondsLeft(left);
        } else {
          setError(language === 'vi' ? 'Không thể tải thông tin đặt phòng.' : 'Could not load booking details.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || (language === 'vi' ? 'Đã xảy ra lỗi khi tải dữ liệu.' : 'An error occurred.'));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate, language]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number with spaces every 4 digits
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      setExpiryDate(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiryDate(val);
    }
  };

  const validateCardForm = () => {
    const errs: { [key: string]: string } = {};
    const rawCard = cardNumber.replace(/\s/g, '');
    
    if (rawCard.length !== 16) {
      errs.cardNumber = language === 'vi' ? 'Số thẻ phải gồm 16 chữ số' : 'Card number must be 16 digits';
    }
    if (!expiryDate.includes('/') || expiryDate.length !== 5) {
      errs.expiryDate = language === 'vi' ? 'Định dạng MM/YY không hợp lệ' : 'Invalid MM/YY format';
    } else {
      const mm = Number(expiryDate.split('/')[0]);
      if (mm < 1 || mm > 12) {
        errs.expiryDate = language === 'vi' ? 'Tháng không hợp lệ' : 'Invalid month';
      }
    }
    if (cvv.length < 3 || cvv.length > 4) {
      errs.cvv = language === 'vi' ? 'Mã CVV phải từ 3-4 chữ số' : 'CVV must be 3-4 digits';
    }
    if (!cardName.trim()) {
      errs.cardName = language === 'vi' ? 'Tên trên thẻ không được để trống' : 'Card name cannot be empty';
    }

    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (activeOption !== 'card') {
      alert(language === 'vi' ? 'Vui lòng chọn phương thức thanh toán thẻ để thử nghiệm.' : 'Please select Credit Card method for demo.');
      return;
    }

    if (!validateCardForm()) return;

    setSubmitLoading(true);
    setSubmitMessage(language === 'vi' ? 'Đang khởi tạo kết nối an toàn SSL...' : 'Establishing SSL secure connection...');

    setTimeout(() => {
      setSubmitMessage(language === 'vi' ? 'Đang xác thực thông tin thẻ tín dụng...' : 'Verifying credit card credentials...');
      
      setTimeout(async () => {
        setSubmitMessage(language === 'vi' ? 'Đang tiến hành khấu trừ tài khoản...' : 'Processing account deduction...');
        
        try {
          const res = await apiClient.post('/payment/stripe/confirm', { bookingId });
          if (res.data.success) {
            setSubmitMessage(language === 'vi' ? 'Thanh toán thành công! Đang xuất vé điện tử...' : 'Payment successful! Generating ticket...');
            setTimeout(() => {
              navigate(`/my-bookings?payment=success&bookingId=${bookingId}`);
            }, 1000);
          } else {
            setSubmitLoading(false);
            alert(language === 'vi' ? 'Thanh toán thất bại. Vui lòng thử lại.' : 'Payment failed. Please try again.');
          }
        } catch (err: any) {
          console.error(err);
          setSubmitLoading(false);
          alert(err.response?.data?.message || (language === 'vi' ? 'Lỗi kết nối cổng thanh toán.' : 'Payment gateway connection error.'));
        }
      }, 1500);
    }, 1500);
  };

  // Helper date formats
  const formatVietnameseDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${shortDays[date.getDay()]}, ${date.getDate()} thg ${date.getMonth() + 1} ${date.getFullYear()}`;
  };

  const formatEnglishDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${daysOfWeek[date.getDay()]}, ${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()} ${date.getFullYear()}`;
  };

  const getNightsCount = () => {
    if (!booking) return 1;
    const inDate = new Date(booking.checkInDate);
    const outDate = new Date(booking.checkOutDate);
    const diffTime = outDate.getTime() - inDate.getTime();
    if (diffTime <= 0) return 1;
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="max-w-[1350px] mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4 text-slate-500 font-semibold">
        <span className="animate-spin text-3xl">⌛</span>
        <span>{language === 'vi' ? 'Đang tải thông tin thanh toán...' : 'Loading secure checkout details...'}</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-[1350px] mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500">⚠️ {language === 'vi' ? 'Đã xảy ra lỗi' : 'An error occurred'}</h2>
        <p className="text-slate-600 font-bold">{error || (language === 'vi' ? 'Không tìm thấy thông tin đặt phòng.' : 'Booking details not found.')}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-xs"
        >
          {language === 'vi' ? 'Quay lại trang chủ' : 'Return Home'}
        </button>
      </div>
    );
  }

  const nights = getNightsCount();
  const firstItem = booking.bookingItems[0];
  const hotel = firstItem?.roomType.hotel;
  const roomTypeName = firstItem?.roomType.name;

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-16 font-sans">
      {/* Dynamic Checkout Header */}
      <header className="bg-white shadow-sm border-b border-slate-100 py-3 mb-4">
        <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-[#0194f3] font-black text-2xl tracking-tighter">CloudBooking</span>
            <div className="w-5 h-5 bg-[#0194f3] rounded-full flex items-center justify-center text-white text-[10px] font-bold">☁</div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            {language === 'vi' ? 'Thanh toán bảo mật SSL 256-bit' : 'SSL 256-bit Secure Encryption'}
          </span>
        </div>
      </header>

      <div className="max-w-[1350px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Layout content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column - Payment methods */}
          <div className="lg:col-span-2 space-y-4">
            {(secondsLeft === 0 || booking.status === 'CANCELLED') ? (
              <div className="bg-white border border-slate-150 p-8 rounded-2xl shadow-sm text-center space-y-5">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  {language === 'vi' ? 'Đơn đặt phòng đã hết hạn thanh toán' : 'Payment Time Limit Expired'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
                  {language === 'vi' 
                    ? 'Thời gian giữ phòng nghỉ tối đa 10 phút đã trôi qua. Để đảm bảo phòng trống cho các khách hàng khác, đơn đặt phòng này đã tự động được hủy bỏ. Vui lòng quay lại tìm kiếm và đặt đơn mới.'
                    : 'The 10-minute payment window has expired. To release rooms for other guests, this reservation was automatically cancelled. Please create a new booking.'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-[#0194f3] hover:bg-[#007cc7] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
                >
                  {language === 'vi' ? 'Quay lại Trang chủ' : 'Return to Home'}
                </button>
              </div>
            ) : (
              <>
                <div className="border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col bg-white">
                  
                  {/* Integrated Countdown Alert Banner - touching payment body directly */}
                  <div className="bg-[#0052cc] text-white py-3.5 px-5 flex justify-between items-center shadow-inner">
                    <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
                      <span>🔔</span>
                      <span>
                        {language === 'vi' 
                          ? 'Đừng lo lắng, giá vẫn giữ nguyên. Hoàn tất thanh toán của bạn bằng' 
                          : 'Do not worry, price is locked. Complete your payment in'}
                      </span>
                    </p>
                    <div className="bg-[#003d99] px-3.5 py-1.5 rounded-lg text-sm font-black tracking-wider flex items-center gap-1.5 shrink-0">
                      <Clock className="w-4 h-4 animate-pulse text-amber-300" />
                      <span>{formatTime(secondsLeft)}</span>
                    </div>
                  </div>

                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-extrabold text-slate-800 text-[24px]">{language === 'vi' ? 'Bạn muốn thanh toán thế nào?' : 'How would you like to pay?'}</h2>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> {language === 'vi' ? 'Thanh toán an toàn' : 'Secure payment'}
                    </span>
                  </div>

                  {/* Accordion List */}
                  <div className="divide-y divide-slate-100">
                    
                    {/* 1. Credit Card Option */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('card')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'card'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'card' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            {language === 'vi' ? 'Thẻ thanh toán' : 'Credit Card'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src="/visa.webp" alt="Visa" className="h-[22px] w-auto object-contain" />
                          <img src="/Mastercard.webp" alt="MasterCard" className="h-[22px] w-auto object-contain" />
                          <img src="/jcb.png" alt="JCB" className="h-[22px] w-auto object-contain" />
                        </div>
                      </button>
                      {activeOption === 'card' && (
                        <div className="px-6 pb-6 pt-4 space-y-4 bg-slate-55/10 border-t border-slate-50">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 block">{language === 'vi' ? 'Số thẻ *' : 'Card number *'}</label>
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="0000 0000 0000 0000"
                                className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold ${
                                  cardErrors.cardNumber ? 'border-red-400' : 'border-slate-200'
                                }`}
                              />
                              {cardErrors.cardNumber && <p className="text-[10px] text-red-500 font-bold">{cardErrors.cardNumber}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 block">{language === 'vi' ? 'Ngày hết hạn *' : 'Expiry date *'}</label>
                                <input
                                  type="text"
                                  value={expiryDate}
                                  onChange={handleExpiryChange}
                                  placeholder="MM/YY"
                                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold text-center ${
                                    cardErrors.expiryDate ? 'border-red-400' : 'border-slate-200'
                                  }`}
                                />
                                {cardErrors.expiryDate && <p className="text-[10px] text-red-500 font-bold">{cardErrors.expiryDate}</p>}
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 block">CVV *</label>
                                <input
                                  type="password"
                                  value={cvv}
                                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                                  placeholder="123"
                                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold text-center ${
                                    cardErrors.cvv ? 'border-red-400' : 'border-slate-200'
                                  }`}
                                />
                                {cardErrors.cvv && <p className="text-[10px] text-red-500 font-bold">{cardErrors.cvv}</p>}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 block">{language === 'vi' ? 'Tên trên thẻ *' : 'Card holder name *'}</label>
                            <input
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value.toUpperCase())}
                              placeholder="NGUYEN VAN A"
                              className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-bold uppercase ${
                                cardErrors.cardName ? 'border-red-400' : 'border-slate-200'
                              }`}
                            />
                            {cardErrors.cardName && <p className="text-[10px] text-red-500 font-bold">{cardErrors.cardName}</p>}
                          </div>

                        </div>
                      )}
                    </div>

                    {/* 2. VietQR Option */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('vietqr')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'vietqr'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'vietqr' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            VietQR
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-[#ebf3ff] text-[#0194f3] px-2 py-0.5 rounded uppercase">QR Code</span>
                      </button>
                      {activeOption === 'vietqr' && (
                        <div className="px-6 pb-6 pt-4 text-center space-y-3 bg-slate-50/30 border-t border-slate-50">
                          <p className="text-xs text-slate-500 font-semibold">
                            {language === 'vi' 
                              ? 'Mã QR thanh toán chuyển khoản nhanh Napas247 sẽ được tự động hiển thị sau khi khởi tạo.'
                              : 'VietQR payment transfer code will be dynamically generated.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. VietinBank Direct Transfer */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('vietinbank')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'vietinbank'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'vietinbank' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            {language === 'vi' ? 'Chuyển khoản trực tiếp' : 'Direct Bank Transfer'}
                          </span>
                        </div>
                      </button>
                      {activeOption === 'vietinbank' && (
                        <div className="px-6 pb-6 pt-4 space-y-2 bg-slate-50/30 border-t border-slate-50 text-xs font-semibold text-slate-650">
                          <p>{language === 'vi' ? 'Vui lòng thực hiện chuyển khoản đến tài khoản bên dưới:' : 'Please transfer to the following bank account:'}</p>
                          <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                            <p>🏦 {language === 'vi' ? 'Ngân hàng: VietinBank' : 'Bank: VietinBank'}</p>
                            <p>💳 {language === 'vi' ? 'Số tài khoản: 102873492834' : 'Account No: 102873492834'}</p>
                            <p>👤 {language === 'vi' ? 'Tên thụ hưởng: CLOUDBOOKING JOINT STOCK' : 'Beneficiary: CLOUDBOOKING JOINT STOCK'}</p>
                            <p>📝 {language === 'vi' ? `Nội dung chuyển khoản: CBOOK ${bookingId}` : `Reference code: CBOOK ${bookingId}`}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Digital Wallet */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('wallet')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'wallet'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'wallet' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            {language === 'vi' ? 'Ví điện tử' : 'E-Wallet'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img src="/momo.jpg" alt="MoMo" className="h-[26px] w-[26px] rounded-lg object-contain border border-slate-100" />
                          <img src="/zalopay.jpg" alt="ZaloPay" className="h-[26px] w-[26px] rounded-lg object-contain border border-slate-100" />
                          <img src="/shopeepay.jpg" alt="ShopeePay" className="h-[26px] w-[26px] rounded-lg object-contain border border-slate-100" />
                          <img src="/vnpay.jpg" alt="VNPAY" className="h-[26px] w-[26px] rounded-lg object-contain border border-slate-100" />
                        </div>
                      </button>
                      {activeOption === 'wallet' && (
                        <div className="px-6 pb-6 pt-4 bg-slate-50/30 border-t border-slate-50 space-y-4">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* MoMo */}
                            <label 
                              onClick={() => setSubWallet('momo')}
                              className={`flex justify-between items-center bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${
                                subWallet === 'momo' ? 'border-[#0194f3] ring-1 ring-[#0194f3]' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="sub_wallet"
                                  value="momo"
                                  checked={subWallet === 'momo'}
                                  readOnly
                                  className="w-4 h-4 text-[#0194f3]"
                                />
                                <span className="text-xs font-black text-slate-800">MoMo</span>
                              </div>
                              <img src="/momo.jpg" alt="MoMo" className="w-10 h-10 rounded-xl object-contain border border-pink-100" />
                            </label>

                            {/* ZaloPay */}
                            <label 
                              onClick={() => setSubWallet('zalopay')}
                              className={`flex justify-between items-center bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${
                                subWallet === 'zalopay' ? 'border-[#0194f3] ring-1 ring-[#0194f3]' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="sub_wallet"
                                  value="zalopay"
                                  checked={subWallet === 'zalopay'}
                                  readOnly
                                  className="w-4 h-4 text-[#0194f3]"
                                />
                                <span className="text-xs font-black text-slate-800">ZaloPay</span>
                              </div>
                              <img src="/zalopay.jpg" alt="ZaloPay" className="w-10 h-10 rounded-xl object-contain border border-blue-100" />
                            </label>

                            {/* ShopeePay */}
                            <label 
                              onClick={() => setSubWallet('shopeepay')}
                              className={`flex justify-between items-center bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${
                                subWallet === 'shopeepay' ? 'border-[#0194f3] ring-1 ring-[#0194f3]' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="sub_wallet"
                                  value="shopeepay"
                                  checked={subWallet === 'shopeepay'}
                                  readOnly
                                  className="w-4 h-4 text-[#0194f3]"
                                />
                                <span className="text-xs font-black text-slate-800">ShopeePay</span>
                              </div>
                              <img src="/shopeepay.jpg" alt="ShopeePay" className="w-10 h-10 rounded-xl object-contain border border-orange-100" />
                            </label>

                            {/* VNPay */}
                            <label 
                              onClick={() => setSubWallet('vnpay')}
                              className={`flex justify-between items-center bg-white border rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm ${
                                subWallet === 'vnpay' ? 'border-[#0194f3] ring-1 ring-[#0194f3]' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="sub_wallet"
                                  value="vnpay"
                                  checked={subWallet === 'vnpay'}
                                  readOnly
                                  className="w-4 h-4 text-[#0194f3]"
                                />
                                <span className="text-xs font-black text-slate-800">VNPay Gateway</span>
                              </div>
                              <img src="/vnpay.jpg" alt="VNPAY" className="w-10 h-10 rounded-xl object-contain border border-blue-100" />
                            </label>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* 5. Mobile Banking */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('mobile')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'mobile'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'mobile' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            {language === 'vi' ? 'Ngân hàng di động' : 'Mobile Banking'}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* 6. Retail Store */}
                    <div className="bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveOption('store')}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-55/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_opt"
                            checked={activeOption === 'store'}
                            readOnly
                            className="w-4.5 h-4.5 text-[#0194f3]"
                          />
                          <span className={activeOption === 'store' ? "text-[20px] font-extrabold text-slate-800" : "text-[16px] font-bold text-slate-700"}>
                            {language === 'vi' ? 'Tại cửa hàng' : 'Convenience Store Pay'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">Circle K / FamilyMart</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Card - Fixed at bottom of left column */}
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-3 shrink-0">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{language === 'vi' ? 'Tổng tiền phải thanh toán' : 'Total Payment Amount'}</span>
                      <div className="text-slate-800 font-black text-xl flex items-center gap-1.5">
                        <span>{booking.finalPrice.toLocaleString('vi-VN')} VND</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer" />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={submitLoading}
                      onClick={handlePaymentSubmit}
                      className="bg-[#ff5e1f] hover:bg-[#e04f16] text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/10 transition-all hover:scale-[1.01] active:scale-95 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-white" />
                      <span>{language === 'vi' ? 'Thanh toán Thẻ thanh toán' : 'Pay with Credit Card'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    {language === 'vi'
                      ? 'Bằng cách tiếp tục thanh toán, bạn đã đồng ý với các Điều khoản & Điều kiện và Chính sách quyền riêng tư của CloudBooking.'
                      : 'By continuing to pay, you agree to our Terms & Conditions and Privacy Policy.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Hotel Summary - Sticky on scroll */}
          <div className="space-y-6 sticky top-6 self-start">
            
            {/* Summary card */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Premium Traveloka-style Header with background SVG and Icon */}
              <div className="relative overflow-hidden px-4 py-2 flex items-center shrink-0 border-b border-slate-100 h-[62px]">
                {/* Background image covering header */}
                <img
                  loading="eager"
                  src="https://d1785e74lyxkqq.cloudfront.net/_next/static/v4.6.0/f/fea6c9a03749dbee07609a72dfd96ad0.svg"
                  alt="header-bg"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
                
                {/* Content container */}
                <div className="relative z-10 flex items-center gap-6 w-full">
                  <img
                    src="https://d1785e74lyxkqq.cloudfront.net/_next/static/v4.6.0/6/6cf973b0aa7b1d2d5df2b1786233056c.svg"
                    width="24"
                    height="24"
                    alt="hotel-icon"
                    className="shrink-0 mr-3"
                  />
                  <div className="flex flex-col justify-center">
                    <h2 className="font-bold text-[20px] leading-tight" style={{ color: 'rgb(3, 18, 26)' }}>
                      {language === 'vi' ? 'Tóm tắt khách sạn' : 'Hotel Summary'}
                    </h2>
                    <div className="font-medium text-sm leading-tight mt-0.5" style={{ color: 'rgb(104, 113, 118)' }}>
                      {language === 'vi' 
                        ? `Mã đặt chỗ  ${booking ? (() => {
                            let hash = 0;
                            const idStr = booking.id;
                            for (let i = 0; i < idStr.length; i++) {
                              hash = (hash << 5) - hash + idStr.charCodeAt(i);
                              hash |= 0;
                            }
                            return Math.abs(hash) % 900000000 + 1000000000;
                          })() : ''}`
                        : `Booking ID  ${booking ? (() => {
                            let hash = 0;
                            const idStr = booking.id;
                            for (let i = 0; i < idStr.length; i++) {
                              hash = (hash << 5) - hash + idStr.charCodeAt(i);
                              hash |= 0;
                            }
                            return Math.abs(hash) % 900000000 + 1000000000;
                          })() : ''}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-sm font-semibold text-slate-650 flex-1">
                
                {/* Hotel Name */}
                <div className="space-y-1">
                  <h4 className="font-black text-base text-slate-800 leading-tight">{hotel?.name}</h4>
                </div>

                {/* Check-in / out timeline connector grid */}
                <div className="flex items-stretch justify-between gap-2.5">
                  {/* Check-in box */}
                  <div className="border border-slate-100 rounded-xl p-3 flex-1 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'vi' ? 'Nhận phòng' : 'Check-in'}</span>
                    <span className="text-xs font-black text-slate-850 mt-1 block">
                      {language === 'vi' ? formatVietnameseDate(booking.checkInDate) : formatEnglishDate(booking.checkInDate)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Từ {hotel?.checkInTime || '14:00'}</span>
                  </div>

                  {/* Days/Nights connector line */}
                  <div className="flex flex-col items-center justify-center px-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-black mb-1">{nights} {language === 'vi' ? 'đêm' : 'nights'}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                      <div className="w-6 h-[1px] bg-slate-200"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    </div>
                  </div>

                  {/* Check-out box */}
                  <div className="border border-slate-100 rounded-xl p-3 flex-1 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'vi' ? 'Trả phòng' : 'Check-out'}</span>
                    <span className="text-xs font-black text-slate-850 mt-1 block">
                      {language === 'vi' ? formatVietnameseDate(booking.checkOutDate) : formatEnglishDate(booking.checkOutDate)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">Trước {hotel?.checkOutTime || '12:00'}</span>
                  </div>
                </div>

                {/* Room type title */}
                <div className="space-y-2 pt-1">
                  <p className="font-extrabold text-slate-800 text-sm">({firstItem?.quantity}x) {roomTypeName}</p>
                  
                  {/* Premium Lucide icons specifications */}
                  <div className="space-y-2.5 text-xs text-slate-500 font-bold pt-0.5 pl-0.5">
                    <p className="flex items-center gap-2.5">
                      <Users className="w-4.5 h-4.5 text-slate-400" />
                      <span>2 {language === 'vi' ? 'khách' : 'guests'}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Bed className="w-4.5 h-4.5 text-slate-400" />
                      <span>{firstItem?.roomType.bedCount} {language === 'vi' ? 'giường đôi' : 'double bed'}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Utensils className="w-4.5 h-4.5 text-slate-400" />
                      <span className="text-slate-400">{language === 'vi' ? 'Không bao gồm bữa sáng' : 'Breakfast not included'}</span>
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Requests & Guest names */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide block">{language === 'vi' ? 'Yêu cầu đặc biệt (nếu có)' : 'Special requests (if any)'}</span>
                    <p className="text-slate-850 text-xs font-bold mt-1">{booking.notes || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide block">{language === 'vi' ? 'Tên khách' : 'Guest Name'}</span>
                    <p className="text-slate-850 text-xs font-black mt-1">{booking.guestName}</p>
                  </div>

                  {/* Policies outline items */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <XCircle className="w-4.5 h-4.5 text-slate-400" />
                      <span>{language === 'vi' ? 'Không hoàn tiền' : 'Non-refundable'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <Calendar className="w-4.5 h-4.5 text-slate-400" />
                      <span>{language === 'vi' ? 'Không đổi lịch' : 'Non-reschedulable'}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Contact person details with circular badge outline */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide block">{language === 'vi' ? 'Chi tiết người liên lạc' : 'Contact Person Details'}</span>
                  
                  <div className="flex items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                    <div className="w-9 h-9 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="w-5 h-5 text-slate-450" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 text-xs leading-snug">{booking.guestName}</p>
                      <p className="text-xs text-slate-450 font-semibold leading-normal mt-0.5">{booking.guestPhone}</p>
                      <p className="text-xs text-slate-450 font-semibold leading-normal truncate">{booking.guestEmail}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Green Choice Alert Box at the very bottom, full width without borders */}
              <div className="bg-[#8ff38f]/60 text-[#0d3c0d] py-4 px-6 text-center font-extrabold text-xs shrink-0 border-t border-emerald-100/30">
                {language === 'vi' ? 'Sự lựa chọn tuyệt vời cho kỳ nghỉ của bạn!' : 'Excellent choice for your trip!'}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Full-screen Loading Overlay for processing payment */}
      {submitLoading && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center">
              <span className="animate-spin text-4xl">🔒</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-slate-800 text-base">{language === 'vi' ? 'Thanh toán đang được bảo mật xử lý' : 'Secure payment processing'}</h3>
              <p className="text-xs text-slate-500 font-bold leading-normal">{submitMessage}</p>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
              <div className="h-full bg-primary rounded-full absolute inset-y-0 left-0 animate-progress w-2/3"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
