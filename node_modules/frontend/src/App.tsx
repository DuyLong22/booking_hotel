import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { setAuth, clearAuth } from './store/slices/authSlice';
import apiClient, { getAccessToken } from './core/api/client';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import HotelDetail from './pages/HotelDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import MyBookings from './pages/MyBookings';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Wishlist from './pages/Wishlist';
import BecomePartner from './pages/BecomePartner';

// --- Các trang Mockup/Placeholder để tránh lỗi điều hướng ---
const Profile: React.FC = () => (
  <div className="max-w-md mx-auto my-20 p-8 bg-white border border-slate-100 rounded-premium shadow text-center space-y-4">
    <h2 className="text-xl font-bold text-slate-800">Trang Cá Nhân</h2>
    <p className="text-xs text-slate-400">Trang hồ sơ cá nhân đang được xây dựng (Phase 6)</p>
  </div>
);

// --- Component tự động kiểm tra Session (Auto Login) khi load trang ---
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          const res = await apiClient.post('/auth/refresh-token');
          const newAccessToken = res.data.data.accessToken;
          
          const profileRes = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${newAccessToken}` }
          });
          
          if (profileRes.data.success) {
            dispatch(setAuth({
              user: profileRes.data.data,
              accessToken: newAccessToken
            }));
          }
        }
      } catch (err) {
        dispatch(clearAuth());
      }
    };

    initializeAuth();

    const handleLogoutEvent = () => {
      dispatch(clearAuth());
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [dispatch]);

  return <>{children}</>;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthInitializer>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/become-partner" element={<BecomePartner />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<div className="text-center py-20 font-bold text-slate-500">404 - Không tìm thấy trang</div>} />
          </Routes>
        </Layout>
      </AuthInitializer>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
