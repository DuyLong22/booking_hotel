"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentUseCase = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const payment_service_1 = require("../../infrastructure/services/payment.service");
const mail_service_1 = __importDefault(require("../../infrastructure/services/mail.service"));
class PaymentUseCase {
    prisma;
    paymentService;
    mailService;
    constructor(prisma, paymentService, mailService) {
        this.prisma = prisma;
        this.paymentService = paymentService;
        this.mailService = mailService;
    }
    async createStripeIntent(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { bookingItems: { include: { roomType: { include: { hotel: true } } } } }
        });
        if (!booking)
            throw new Error('Không tìm thấy đơn đặt phòng');
        if (userId && booking.userId !== userId)
            throw new Error('Không có quyền thanh toán đơn này');
        if (booking.status !== client_1.BookingStatus.PENDING && booking.status !== client_1.BookingStatus.PAYMENT_PROCESSING) {
            throw new Error('Đơn đặt phòng không ở trạng thái hợp lệ để thanh toán');
        }
        // Chuyển sang trạng thái PROCESSING
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.PAYMENT_PROCESSING }
        });
        // Tạo intent
        const { id: intentId, clientSecret } = await this.paymentService.createPaymentIntent(Number(booking.finalPrice), bookingId);
        // Lưu hoặc cập nhật thông tin Payment trong DB
        await this.prisma.payment.upsert({
            where: { bookingId },
            update: {
                amount: booking.finalPrice,
                method: 'STRIPE',
                status: client_1.PaymentStatus.PENDING,
                transactionId: intentId
            },
            create: {
                bookingId,
                amount: booking.finalPrice,
                method: 'STRIPE',
                status: client_1.PaymentStatus.PENDING,
                transactionId: intentId
            }
        });
        return { clientSecret, bookingId };
    }
    async confirmStripePayment(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });
        if (!booking)
            throw new Error('Không tìm thấy đơn đặt phòng');
        await this.confirmBookingPayment(bookingId, 'STRIPE', 'ch_' + Math.random().toString(36).substring(2, 10));
        return { success: true };
    }
    async handleStripeWebhook(rawBody, signature, secret) {
        let event;
        try {
            event = await this.paymentService.verifyStripeWebhook(rawBody, signature, secret);
        }
        catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            throw new Error(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata.bookingId;
            await this.confirmBookingPayment(bookingId, 'STRIPE', paymentIntent.id);
        }
    }
    async generateVnPayCheckoutUrl(bookingId, userId, ipAddress, returnUrl) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });
        if (!booking)
            throw new Error('Không tìm thấy đơn đặt phòng');
        if (userId && booking.userId !== userId)
            throw new Error('Không có quyền thanh toán đơn này');
        if (booking.status !== client_1.BookingStatus.PENDING && booking.status !== client_1.BookingStatus.PAYMENT_PROCESSING) {
            throw new Error('Đơn đặt phòng không ở trạng thái hợp lệ để thanh toán');
        }
        // Chuyển booking sang PAYMENT_PROCESSING
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.PAYMENT_PROCESSING }
        });
        // Sinh URL
        const paymentUrl = this.paymentService.generateVnPayUrl({
            bookingId,
            amount: Number(booking.finalPrice),
            ipAddress,
            returnUrl
        });
        // Upsert Payment
        await this.prisma.payment.upsert({
            where: { bookingId },
            update: {
                amount: booking.finalPrice,
                method: 'VNPAY',
                status: client_1.PaymentStatus.PENDING
            },
            create: {
                bookingId,
                amount: booking.finalPrice,
                method: 'VNPAY',
                status: client_1.PaymentStatus.PENDING
            }
        });
        return { paymentUrl };
    }
    async handleVnPayCallback(queryParams) {
        const isValid = this.paymentService.validateVnPayHash(queryParams);
        if (!isValid)
            throw new Error('Chữ ký Hash của VNPay không hợp lệ');
        const bookingId = queryParams['vnp_TxnRef'];
        const responseCode = queryParams['vnp_ResponseCode']; // '00' là thành công
        const transactionId = queryParams['vnp_TransactionNo'];
        if (responseCode === '00') {
            await this.confirmBookingPayment(bookingId, 'VNPAY', transactionId);
            return { success: true, bookingId };
        }
        else {
            // Thanh toán thất bại -> Quay lại PENDING để thanh toán lại
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.PENDING }
            });
            await this.prisma.payment.update({
                where: { bookingId },
                data: { status: client_1.PaymentStatus.FAILED, transactionId }
            });
            return { success: false, bookingId };
        }
    }
    async confirmBookingPayment(bookingId, method, transactionId) {
        // 1. Cập nhật booking sang CONFIRMED và payment sang COMPLETED
        const booking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.CONFIRMED },
            include: {
                user: true,
                bookingItems: {
                    include: {
                        roomType: {
                            include: {
                                hotel: true
                            }
                        }
                    }
                }
            }
        });
        await this.prisma.payment.update({
            where: { bookingId },
            data: {
                status: client_1.PaymentStatus.COMPLETED,
                transactionId,
                paidAt: new Date()
            }
        });
        // 2. Gửi mail kèm vé QR Code cho người dùng!
        try {
            await this.mailService.sendBookingTicketEmail({
                email: booking.guestEmail,
                guestName: booking.guestName,
                bookingId: booking.id,
                hotelName: booking.bookingItems[0]?.roomType.hotel.name || 'Khách sạn của chúng tôi',
                roomTypeName: booking.bookingItems[0]?.roomType.name || 'Phòng nghỉ',
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                finalPrice: Number(booking.finalPrice)
            });
            console.log(`[PaymentUseCase] Gửi email thành công tới ${booking.guestEmail}`);
        }
        catch (mailError) {
            console.error('[PaymentUseCase] Lỗi gửi email vé:', mailError);
        }
    }
}
exports.PaymentUseCase = PaymentUseCase;
// Khởi tạo và export singleton instance
const paymentUseCaseInstance = new PaymentUseCase(database_1.default, new payment_service_1.PaymentService(), mail_service_1.default);
exports.default = paymentUseCaseInstance;
