import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';
import apiClient from '../core/api/client';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy trang chuyển hướng sau khi login thành công
  const from = (location.state as any)?.from || '/';

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  const handleFacebookLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiBaseUrl}/auth/facebook`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { success, message, data } = res.data;

      if (success) {
        dispatch(setAuth({
          user: data.user,
          accessToken: data.accessToken
        }));
        navigate(from, { replace: true });
      } else {
        setError(message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi kết nối hệ thống. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white border border-slate-100 rounded-premium p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>

        <div className="text-center space-y-2 relative">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mừng bạn quay lại!</h2>
          <p className="text-xs text-slate-400 font-medium">Đăng nhập tài khoản CloudBooking của bạn</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Email đăng nhập</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@viethu.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu</label>
              <Link to="#" className="text-[10px] text-primary font-bold hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nút bấm */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-250 text-white font-bold text-sm py-3 rounded-premium transition-all shadow-md shadow-primary/20"
          >
            {loading ? 'Đang xác minh...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Hoặc đăng nhập bằng</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 border border-slate-200 rounded-premium transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.05-5.136 4.05-3.324 0-6.023-2.7-6.023-6.023 0-3.324 2.7-6.023 6.023-6.023 1.542 0 2.946.579 4.024 1.53l3.056-3.056C19.23 2.13 15.93.9 12.24.9 6.12.9 1.14 5.88 1.14 12s4.98 11.1 11.1 11.1c5.96 0 10.74-4.26 10.74-10.74 0-.585-.054-1.125-.135-1.665H12.24z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs py-2.5 px-4 rounded-premium transition-all shadow-sm shadow-[#1877F2]/20"
          >
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>

        <div className="text-center pt-4 border-t border-slate-50 text-xs font-medium text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Login;
