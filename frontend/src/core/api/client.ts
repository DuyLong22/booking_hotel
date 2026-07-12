import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let _accessToken = '';

export const getAccessToken = () => _accessToken;
export const setAccessToken = (token: string) => {
  _accessToken = token;
};

// Request Interceptor: Tự động đính kèm Access Token vào Header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tự động refresh token nếu nhận mã lỗi 401 (Hết hạn Access Token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu gặp lỗi 401 và chưa từng thực hiện thử lại trước đó
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Gọi API làm mới token. HttpOnly Cookie chứa Refresh Token sẽ tự động được đính kèm nhờ withCredentials
        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Cập nhật token mới vào request ban đầu và thực thi lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn -> Hủy token hiện tại và yêu cầu đăng nhập lại
        setAccessToken('');
        // Có thể bắn sự kiện logout ra ngoài
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
