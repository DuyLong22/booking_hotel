import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../core/api/client';
import { Calendar, MapPin, QrCode, CreditCard, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BookingItem {
  id: string;
  price: number;
  roomType: {
    name: string;
    hotel: {
      name: string;
      address: string;
      province: { name: string };
    }
  }
}

interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  status: 'PENDING' | 'PAYMENT_PROCESSING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED';
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  bookingItems: BookingItem[];
}

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrBooking, setSelectedQrBooking] = useState<Booking | null>(null);
  
  // States cho việc viết đánh giá
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);
  const [ratingCleanliness, setRatingCleanliness] = useState(5);
  const [ratingLocation, setRatingLocation] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingFacilities, setRatingFacilities] = useState(5);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Nhận thông báo thanh toán thành công nếu chuyển hướng từ VNPay/Stripe callback
  const paymentStatus = searchParams.get('payment');
  const queryBookingId = searchParams.get('bookingId');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ thanh toán</span>;
      case 'PAYMENT_PROCESSING':
        return <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1"><Clock className="w-3 h-3" /> Đang xử lý</span>;
      case 'CONFIRMED':
        return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã thanh toán</span>;
      case 'CHECKED_IN':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">Đã nhận phòng</span>;
      case 'CHECKED_OUT':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">Đã trả phòng</span>;
      case 'COMPLETED':
        return <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Đã hủy</span>;
      default:
        return null;
    }
  };

  const handlePayNow = (booking: Booking) => {
    const item = booking.bookingItems[0];
    if (!item) return;

    navigate('/checkout', {
      state: {
        hotelId: '', // Có thể tìm từ api chi tiết nếu cần, hoặc lưu trong item
        hotelName: item.roomType.hotel.name,
        roomTypeId: item.roomType.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate
      }
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewBooking) return;
    const item = selectedReviewBooking.bookingItems[0];
    if (!item) return;

    const hotelId = (item.roomType as any).hotelId || (item.roomType.hotel as any).id;
    if (!hotelId) {
      alert("Không tìm thấy thông tin khách sạn để gửi đánh giá.");
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        ratingCleanliness,
        ratingLocation,
        ratingService,
        ratingFacilities,
        ratingValue,
        comment: reviewComment.trim(),
      };

      await apiClient.post(`/hotels/${hotelId}/reviews`, payload);
      
      setSuccessToast("Gửi đánh giá phòng nghỉ thành công!");
      setTimeout(() => setSuccessToast(''), 3000);
      setSelectedReviewBooking(null);
      setReviewComment('');
      // Refresh list
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Không thể gửi đánh giá phòng nghỉ lúc này.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Lịch sử đặt phòng</h1>
        <p className="text-sm text-slate-400 font-medium">Theo dõi và quản lý phòng nghỉ của bạn</p>
      </div>

      {paymentStatus === 'success' && queryBookingId && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded text-xs font-semibold space-y-1">
          <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Thanh toán đặt phòng thành công!</p>
          <p className="font-normal text-slate-600">Vé check-in và hóa đơn chi tiết đã được gửi về email đăng ký của bạn. Bạn cũng có thể xem mã QR Code vé trực tiếp dưới đây.</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-premium h-40 animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 text-center rounded-premium space-y-3 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700">Bạn chưa đặt chỗ nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Khám phá ngay hàng trăm ưu đãi chỗ nghỉ cao cấp trên CloudBooking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const item = booking.bookingItems[0];
            return (
              <div
                key={booking.id}
                className="bg-white border border-slate-100 rounded-premium overflow-hidden shadow-sm p-5 space-y-4 hover:border-slate-200 transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{item?.roomType.hotel.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{item?.roomType.hotel.address}</span>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Info body */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">NHẬN PHÒNG</span>
                    <span>{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">TRẢ PHÒNG</span>
                    <span>{new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">HỌ TÊN KHÁCH</span>
                    <span className="line-clamp-1">{booking.guestName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">TỔNG TIỀN</span>
                    <span className="text-red-500 font-bold">{booking.finalPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-medium">Mã vé: {booking.id.substring(0, 8).toUpperCase()}</span>
                  
                  <div className="flex gap-2">
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handlePayNow(booking)}
                        className="bg-primary hover:bg-primary-dark text-white font-bold text-[10px] px-3 py-1.5 rounded-premium transition-colors shadow flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Thanh toán ngay
                      </button>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setSelectedQrBooking(booking)}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-premium transition-colors flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Hiển thị vé QR
                      </button>
                    )}

                    {(booking.status === 'CHECKED_OUT' || booking.status === 'COMPLETED') && (
                      <button
                        onClick={() => setSelectedReviewBooking(booking)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-premium transition-colors flex items-center gap-1 shadow-sm"
                      >
                        Viết đánh giá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Ticket View Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 p-6 rounded-premium shadow-2xl w-full max-w-sm text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Vé điện tử Check-in</h3>
              <button
                onClick={() => setSelectedQrBooking(null)}
                className="text-slate-400 hover:text-slate-650 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-sm">{selectedQrBooking.bookingItems[0]?.roomType.hotel.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium">Mã đặt phòng: {selectedQrBooking.id}</p>
            </div>

            {/* QR Code generator online service */}
            <div className="bg-slate-50 border border-slate-100 rounded-premium p-4 inline-block mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=booking_id:${selectedQrBooking.id}`}
                alt="QR Code Ticket"
                className="w-44 h-44 bg-white p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="bg-green-50 border border-green-100 rounded-premium p-3 text-left space-y-1 font-semibold text-green-700 text-xs">
              <p className="flex items-center gap-1 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Hướng dẫn làm thủ tục:</p>
              <p className="font-normal text-[10px] text-green-600 leading-normal">
                Vui lòng xuất trình màn hình mã QR Code này cho nhân viên lễ tân khách sạn khi check-in để làm thủ tục nhận phòng nhanh chóng không cần giấy tờ.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 text-left border-t border-slate-50 pt-4">
              <div>
                <span className="text-[9px] text-slate-400 block">KHÁCH HÀNG</span>
                <span className="line-clamp-1">{selectedQrBooking.guestName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">LOẠI PHÒNG</span>
                <span className="line-clamp-1">{selectedQrBooking.bookingItems[0]?.roomType.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {selectedReviewBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReview} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 text-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-950 text-sm">Viết đánh giá phòng nghỉ</h3>
              <button
                type="button"
                onClick={() => setSelectedReviewBooking(null)}
                className="text-slate-400 hover:text-slate-655 p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-sm">{selectedReviewBooking.bookingItems[0]?.roomType.hotel.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium">Mã đặt phòng: {selectedReviewBooking.id}</p>
            </div>

            {/* Criteria Scores */}
            <div className="space-y-3 pt-2 text-xs font-bold text-slate-600 border-t border-slate-50">
              {[
                { name: 'Độ sạch sẽ', value: ratingCleanliness, setter: setRatingCleanliness },
                { name: 'Vị trí', value: ratingLocation, setter: setRatingLocation },
                { name: 'Dịch vụ phục vụ', value: ratingService, setter: setRatingService },
                { name: 'Tiện nghi', value: ratingFacilities, setter: setRatingFacilities },
                { name: 'Giá trị xứng đáng', value: ratingValue, setter: setRatingValue },
              ].map((crit) => (
                <div key={crit.name} className="flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">{crit.name}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => crit.setter(star)}
                        className={`text-base leading-none focus:outline-none transition-all ${
                          star <= crit.value ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment */}
            <div className="space-y-1 pt-2 border-t border-slate-50 text-xs font-bold text-slate-600">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Ý kiến nhận xét của bạn</label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Khách sạn sạch sẽ, nhân viên thân thiện, đồ ăn sáng ngon..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-600 focus:bg-white text-slate-800 font-semibold placeholder-slate-400 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReviewBooking(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={submittingReview || !reviewComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white font-extrabold px-6 py-4 rounded-xl shadow-2xl z-55 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};
export default MyBookings;
