import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorMiddleware from './infrastructure/middlewares/error.middleware';
import authRoutes from './interfaces/routes/auth.routes';
import hotelRoutes from './interfaces/routes/hotel.routes';
import bookingRoutes from './interfaces/routes/booking.routes';
import couponRoutes from './interfaces/routes/coupon.routes';
import aiRoutes from './interfaces/routes/ai.routes';
import paymentRoutes from './interfaces/routes/payment.routes';
import chatRoutes from './interfaces/routes/chat.routes';

const app = express();

// Middlewares bảo mật & cấu hình CORS
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Phân tích dữ liệu JSON và Cookie
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      if (req.originalUrl && req.originalUrl.includes('stripe-webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route kiểm tra trạng thái hoạt động hệ thống
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Định tuyến API các modules
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chats', chatRoutes);



// Middleware xử lý lỗi toàn cục (phải đặt cuối)
app.use(errorMiddleware);

export default app;
