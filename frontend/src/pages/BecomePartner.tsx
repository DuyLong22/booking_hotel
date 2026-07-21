import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Sparkles, CheckCircle2, TrendingUp, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

const partnerTranslations = {
  vi: {
    badge: 'Đối tác cùng CloudBooking',
    heroTitle: 'Đăng chỗ nghỉ của bạn trên CloudBooking và đón khách ngay hôm nay!',
    heroDesc: 'Tiếp cận hơn hàng triệu du khách tìm kiếm phòng mỗi ngày. Đăng ký dễ dàng, quản lý linh hoạt, chiết khấu cực ưu đãi.',
    startBtn: 'Bắt đầu đăng chỗ nghỉ',
    whyTitle: 'Tại sao nên hợp tác cùng CloudBooking?',
    whyDesc: 'Chúng tôi mang lại giải pháp quản lý bán phòng thông minh và toàn diện nhất.',
    benefit1Title: 'Tăng trưởng doanh thu',
    benefit1Desc: 'Mở rộng kênh bán phòng đến tệp khách du lịch trong nước và quốc tế. Tối ưu tỷ lệ lấp đầy phòng trống quanh năm.',
    benefit2Title: 'An toàn & Minh bạch',
    benefit2Desc: 'Hệ thống xác thực đặt phòng tự động, bảo mật tuyệt đối thông tin giao dịch và quản lý chính sách hủy phòng linh hoạt.',
    benefit3Title: 'Hỗ trợ 24/7 miễn phí',
    benefit3Desc: 'Đội ngũ chăm sóc khách hàng và chuyên viên hỗ trợ đối tác luôn đồng hành cùng bạn để giải quyết mọi sự cố phát sinh.',
    stepsTitle: 'Các bước hoạt động đơn giản',
    stepsDesc: 'Chỉ mất 5 phút để đưa khách sạn của bạn tiếp cận hàng triệu du khách.',
    step1Title: 'Đăng ký tài khoản',
    step1Desc: 'Đăng ký vai trò "Chủ khách sạn" (Hotel Owner) trên trang web.',
    step2Title: 'Thiết lập thông tin',
    step2Desc: 'Cập nhật hình ảnh, tiện ích, số sao, vị trí của chỗ nghỉ.',
    step3Title: 'Tạo danh sách phòng',
    step3Desc: 'Thiết lập các loại phòng, giá cả và số lượng phòng khả dụng.',
    step4Title: 'Đón những vị khách đầu tiên',
    step4Desc: 'Nhận lịch đặt phòng trực tuyến và quản lý doanh thu minh bạch.',
    ctaTitle: 'Bạn đã sẵn sàng để đột phá doanh số phòng?',
    ctaDesc: 'Tham gia cùng cộng đồng hàng nghìn đối tác nhà nghỉ, homestay và khách sạn đang kinh doanh thành công trên CloudBooking.',
    ctaBtn: 'Đăng ký ngay'
  },
  en: {
    badge: 'Partner with CloudBooking',
    heroTitle: 'List your property on CloudBooking and start welcoming guests today!',
    heroDesc: 'Reach millions of travelers searching for accommodation every day. Simple setup, flexible management, and low commissions.',
    startBtn: 'List your property',
    whyTitle: 'Why partner with CloudBooking?',
    whyDesc: 'We offer the most intelligent and comprehensive room booking management solution.',
    benefit1Title: 'Revenue Growth',
    benefit1Desc: 'Expand your channel reach to domestic and international travelers. Optimize occupancy rates all year round.',
    benefit2Title: 'Safe & Transparent',
    benefit2Desc: 'Automated booking verification system, secure transactional data, and flexible booking cancellation policies.',
    benefit3Title: '24/7 Free Support',
    benefit3Desc: 'Our customer care team and partner relationship managers are always there to resolve any issues immediately.',
    stepsTitle: 'Simple Steps to Start',
    stepsDesc: 'It only takes 5 minutes to list your hotel and reach millions of guests.',
    step1Title: 'Create an account',
    step1Desc: 'Register as a "Hotel Owner" on the platform.',
    step2Title: 'Set up details',
    step2Desc: 'Upload images, amenities, star rating, and exact location.',
    step3Title: 'Add room lists',
    step3Desc: 'Configure room types, pricing, and available room counts.',
    step4Title: 'Welcome first guests',
    step4Desc: 'Receive online bookings and track transparent dashboard revenues.',
    ctaTitle: 'Ready to boost your occupancy rate?',
    ctaDesc: 'Join thousands of guesthouses, homestays, and hotel partners thriving on CloudBooking.',
    ctaBtn: 'Register Now'
  }
};

export const BecomePartner: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state: RootState) => state.settings);
  const t = partnerTranslations[language];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> {t.badge}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {t.heroTitle}
          </h1>
          <p className="text-sm sm:text-lg text-slate-200 max-w-2xl mx-auto font-medium">
            {t.heroDesc}
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/register/owner')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-base px-8 py-3.5 rounded-premium shadow-lg shadow-amber-400/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
            >
              {t.startBtn} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{t.whyTitle}</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">{t.whyDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">{t.benefit1Title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefit1Desc}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">{t.benefit2Title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefit2Desc}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-premium border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">{t.benefit3Title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t.benefit3Desc}
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{t.stepsTitle}</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">{t.stepsDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: t.step1Title, desc: t.step1Desc },
            { step: '2', title: t.step2Title, desc: t.step2Desc },
            { step: '3', title: t.step3Title, desc: t.step3Desc },
            { step: '4', title: t.step4Title, desc: t.step4Desc }
          ].map((item, idx) => (
            <div key={idx} className="relative bg-white p-6 rounded-premium border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <span className="absolute top-4 right-4 text-slate-100 font-black text-5xl select-none leading-none">
                {item.step}
              </span>
              <div className="space-y-2 relative z-10 pt-4">
                <h4 className="font-extrabold text-slate-800 text-base">{item.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-8 sm:p-12 rounded-premium text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80')" }}></div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl sm:text-3xl font-black">{t.ctaTitle}</h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto">
              {t.ctaDesc}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/register/owner')}
                className="bg-white hover:bg-slate-100 text-primary font-extrabold text-sm px-6 py-3 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
              >
                {t.ctaBtn} <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomePartner;
