"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const qrcode_1 = __importDefault(require("qrcode"));
class MailService {
    transporter;
    constructor() {
        const isEthereal = process.env.EMAIL_USER === 'placeholder@ethereal.email' || !process.env.EMAIL_USER;
        if (isEthereal) {
            // Dùng Ethereal SMTP test account
            this.transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'myles.pouros65@ethereal.email',
                    pass: 'rV6K1GqK7dCY7FzGk2'
                }
            });
        }
        else {
            this.transporter = nodemailer_1.default.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: process.env.EMAIL_PORT === '465',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        }
    }
    async sendOTP(to, otp, name) {
        const mailOptions = {
            from: `"Cloud Booking Support" <${process.env.EMAIL_FROM || 'no-reply@cloudbooking.com'}>`,
            to,
            subject: 'Xác Thực Email Của Bạn - Cloud Booking Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #2563eb; text-align: center;">Chào mừng bạn đến với Cloud Booking!</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng của chúng tôi. Để hoàn tất đăng ký, vui lòng sử dụng mã OTP dưới đây để xác thực tài khoản email của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background-color: #eff6ff; padding: 10px 30px; border-radius: 8px; border: 1px dashed #bfdbfe;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">Lưu ý: Mã OTP này có hiệu lực trong vòng 10 phút. Không chia sẻ mã này cho bất kỳ ai.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Đây là email tự động, vui lòng không phản hồi email này.</p>
        </div>
      `,
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[MailService]: OTP sent to ${to}. MessageId: ${info.messageId}`);
        }
        catch (error) {
            console.error('[MailService Error]:', error);
            throw error;
        }
    }
    async sendResetPassword(to, token, name) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"Cloud Booking Support" <${process.env.EMAIL_FROM || 'no-reply@cloudbooking.com'}>`,
            to,
            subject: 'Yêu Cầu Khôi Phục Mật Khẩu - Cloud Booking Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #2563eb; text-align: center;">Khôi phục mật khẩu</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Bạn đã gửi yêu cầu khôi phục mật khẩu. Vui lòng nhấp vào liên kết bên dưới để tiến hành đổi mật khẩu mới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Khôi phục mật khẩu</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Lưu ý: Đường dẫn này có hiệu lực trong vòng 15 phút. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 Cloud Booking Platform. All rights reserved.</p>
        </div>
      `,
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[MailService]: Reset token sent to ${to}. MessageId: ${info.messageId}`);
        }
        catch (error) {
            console.error('[MailService Error]:', error);
            throw error;
        }
    }
    async sendBookingTicketEmail(params) {
        const qrData = `booking_id:${params.bookingId}`;
        const qrBuffer = await qrcode_1.default.toBuffer(qrData, {
            type: 'png',
            width: 250,
            margin: 1,
        });
        const mailOptions = {
            from: `"Cloud Booking Confirmation" <${process.env.EMAIL_FROM || 'no-reply@cloudbooking.com'}>`,
            to: params.email,
            subject: `Xác Nhận Đặt Phòng Thành Công: ${params.hotelName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 24px; font-weight: 800; color: #2563eb;">CloudBooking<span style="color: #0ea5e9;">.AI</span></span>
            <h2 style="color: #0f172a; margin-top: 10px;">Đặt Phòng Đã Được Xác Nhận!</h2>
            <p style="color: #64748b; font-size: 14px;">Mã đặt phòng: <strong>${params.bookingId}</strong></p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1e293b; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Thông Tin Khách Sạn</h3>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Khách sạn:</strong> ${params.hotelName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Loại phòng:</strong> ${params.roomTypeName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Khách hàng:</strong> ${params.guestName}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Nhận phòng (Check-in):</strong> ${new Date(params.checkInDate).toLocaleDateString('vi-VN')} (Từ 14:00)</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Trả phòng (Check-out):</strong> ${new Date(params.checkOutDate).toLocaleDateString('vi-VN')} (Trước 12:00)</p>
            <p style="margin: 6px 0; font-size: 14px; color: #ef4444; font-weight: bold;"><strong>Tổng tiền đã thanh toán:</strong> ${params.finalPrice.toLocaleString('vi-VN')} đ</p>
          </div>

          <div style="text-align: center; border: 1px dashed #bfdbfe; background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">VÉ ĐIỆN TỬ CHECK-IN</h4>
            <p style="color: #1e40af; font-size: 12px; margin-bottom: 12px;">Vui lòng đưa mã QR này cho nhân viên lễ tân khi nhận phòng để làm thủ tục nhanh chóng</p>
            <img src="cid:qrcode_ticket" alt="QR Code Check-in" style="width: 180px; height: 180px; display: inline-block; background-color: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px;" />
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center;">Nếu cần hỗ trợ gấp hoặc hủy phòng theo quy định, vui lòng truy cập trang cá nhân hoặc liên hệ Hotline: 1900-xxxx.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 CloudBooking.AI. Bảo lưu mọi quyền.</p>
        </div>
      `,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrBuffer,
                    cid: 'qrcode_ticket',
                },
            ],
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[MailService]: Ticket email with QR sent to ${params.email}. MessageId: ${info.messageId}`);
        }
        catch (error) {
            console.error('[MailService Error]: Failed to send booking confirmation email:', error);
            throw error;
        }
    }
}
exports.MailService = MailService;
exports.default = new MailService();
