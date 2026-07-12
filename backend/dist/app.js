"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = __importDefault(require("./infrastructure/middlewares/error.middleware"));
const auth_routes_1 = __importDefault(require("./interfaces/routes/auth.routes"));
const hotel_routes_1 = __importDefault(require("./interfaces/routes/hotel.routes"));
const booking_routes_1 = __importDefault(require("./interfaces/routes/booking.routes"));
const coupon_routes_1 = __importDefault(require("./interfaces/routes/coupon.routes"));
const ai_routes_1 = __importDefault(require("./interfaces/routes/ai.routes"));
const payment_routes_1 = __importDefault(require("./interfaces/routes/payment.routes"));
const chat_routes_1 = __importDefault(require("./interfaces/routes/chat.routes"));
const app = (0, express_1.default)();
// Middlewares bảo mật & cấu hình CORS
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// Phân tích dữ liệu JSON và Cookie
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        if (req.originalUrl && req.originalUrl.includes('stripe-webhook')) {
            req.rawBody = buf;
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Route kiểm tra trạng thái hoạt động hệ thống
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
// Định tuyến API các modules
app.use('/api/auth', auth_routes_1.default);
app.use('/api/hotels', hotel_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.use('/api/coupons', coupon_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/chats', chat_routes_1.default);
// Middleware xử lý lỗi toàn cục (phải đặt cuối)
app.use(error_middleware_1.default);
exports.default = app;
