import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../core/api/client';
import { Sparkles, Mail, Lock, User, Phone, CheckCircle, ShieldCheck } from 'lucide-react';

export const RegisterOwner: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/register', {
        email,
        password,
        fullName,
        phoneNumber,
        role: 'HOTEL_OWNER'
      });

      if (res.data.success) {
        alert('Đăng ký tài khoản Chủ chỗ nghỉ thành công! Vui lòng liên hệ Admin phê duyệt hoặc tiến hành đăng nhập.');
        navigate('/login');
      } else {
        setError(res.data.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await apiClient.post('/auth/verify-email', {
        email,
        otpCode: otp
      });

      if (res.data.success) {
        alert('Xác thực email thành công! Bạn có thể tiến hành đăng nhập.');
        setShowOtpModal(false);
        navigate('/login');
      } else {
        setOtpError(res.data.message || 'Mã OTP không hợp lệ');
      }
    } catch (err: any) {
      console.error(err);
      setOtpError(err.response?.data?.message || 'OTP không đúng hoặc đã hết hạn.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 relative">
      <div className="bg-white border border-slate-100 rounded-premium p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Đăng ký Đối tác Chủ chỗ nghỉ</h2>
          <p className="text-xs text-slate-400 font-medium">Bắt đầu tiếp cận hàng triệu khách hàng cùng CloudBooking</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {/* Họ tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên chủ sở hữu</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Địa chỉ Email doanh nghiệp</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nguyenvana@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại liên hệ</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0912345678"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-250 text-slate-900 font-black text-sm py-3 rounded-premium transition-all shadow-md"
          >
            {loading ? 'Đang gửi thông tin đăng ký...' : 'Đăng ký tài khoản Đối tác'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-50 text-xs font-medium text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 p-6 rounded-premium shadow-2xl w-full max-w-sm text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Xác thực tài khoản</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mã xác thực OTP gồm 6 ký tự đã được gửi tới email <strong>{email}</strong>. Vui lòng kiểm tra và nhập mã bên dưới.
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 text-red-700 p-2 rounded text-[11px] font-semibold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                placeholder="Nhập 6 ký tự OTP"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 text-center text-lg font-bold letter-spacing-4 focus:outline-none focus:border-primary focus:bg-white"
              />
              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-250 text-white font-bold text-xs py-2.5 rounded-premium transition-colors"
              >
                {otpLoading ? 'Đang kiểm duyệt...' : 'Xác thực OTP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterOwner;
