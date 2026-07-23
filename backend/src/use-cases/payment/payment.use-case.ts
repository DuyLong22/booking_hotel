import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';
import { PaymentService } from '../../infrastructure/services/payment.service';
import mailService, { MailService } from '../../infrastructure/services/mail.service';
import socketService from '../../infrastructure/services/socket.service';
import loyaltyUseCase from '../user/loyalty.use-case';

export class PaymentUseCase {
  constructor(
    private prisma: PrismaClient,
    private paymentService: PaymentService,
    private mailService: MailService
  ) {}

  async createStripeIntent(bookingId: string, userId: string | null) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingItems: { include: { roomType: { include: { hotel: true } } } } }
    });

    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
    if (userId && booking.userId !== userId) throw new Error('Không có quyền thanh toán đơn này');
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.PAYMENT_PROCESSING) {
      throw new Error('Đơn đặt phòng không ở trạng thái hợp lệ để thanh toán');
    }

    // Chuyển sang trạng thái PROCESSING
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAYMENT_PROCESSING }
    });
    socketService.emitBookingStatusUpdate(bookingId, BookingStatus.PAYMENT_PROCESSING);

    // Tạo intent
    const { id: intentId, clientSecret } = await this.paymentService.createPaymentIntent(
      Number(booking.finalPrice),
      bookingId
    );

    // Lưu hoặc cập nhật thông tin Payment trong DB
    await this.prisma.payment.upsert({
      where: { bookingId },
      update: {
        amount: booking.finalPrice,
        method: 'STRIPE',
        status: PaymentStatus.PENDING,
        transactionId: intentId
      },
      create: {
        bookingId,
        amount: booking.finalPrice,
        method: 'STRIPE',
        status: PaymentStatus.PENDING,
        transactionId: intentId
      }
    });

    return { clientSecret, bookingId };
  }

  async confirmStripePayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');

    await this.confirmBookingPayment(bookingId, 'STRIPE', 'ch_' + Math.random().toString(36).substring(2, 10));
    return { success: true };
  }

  async handleStripeWebhook(rawBody: string | Buffer, signature: string, secret: string) {
    let event;
    try {
      event = await this.paymentService.verifyStripeWebhook(rawBody, signature, secret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;

      await this.confirmBookingPayment(bookingId, 'STRIPE', paymentIntent.id);
    }
  }

  async generateVnPayCheckoutUrl(bookingId: string, userId: string | null, ipAddress: string, returnUrl: string, bankCode?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
    if (userId && booking.userId !== userId) throw new Error('Không có quyền thanh toán đơn này');
    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.PAYMENT_PROCESSING) {
      throw new Error('Đơn đặt phòng không ở trạng thái hợp lệ để thanh toán');
    }

    // Chuyển booking sang PAYMENT_PROCESSING
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAYMENT_PROCESSING }
    });
    socketService.emitBookingStatusUpdate(bookingId, BookingStatus.PAYMENT_PROCESSING);

    // Sinh URL
    const paymentUrl = this.paymentService.generateVnPayUrl({
      bookingId,
      amount: Number(booking.finalPrice),
      ipAddress,
      returnUrl,
      bankCode,
    });

    // Upsert Payment
    await this.prisma.payment.upsert({
      where: { bookingId },
      update: {
        amount: booking.finalPrice,
        method: 'VNPAY',
        status: PaymentStatus.PENDING
      },
      create: {
        bookingId,
        amount: booking.finalPrice,
        method: 'VNPAY',
        status: PaymentStatus.PENDING
      }
    });

    return { paymentUrl };
  }

  async handleVnPayCallback(queryParams: Record<string, any>) {
    const isValid = this.paymentService.validateVnPayHash(queryParams);
    if (!isValid) throw new Error('Chữ ký Hash của VNPay không hợp lệ');

    const bookingId = queryParams['vnp_TxnRef'];
    const responseCode = queryParams['vnp_ResponseCode']; // '00' là thành công
    const transactionId = queryParams['vnp_TransactionNo'];

    if (responseCode === '00') {
      await this.confirmBookingPayment(bookingId, 'VNPAY', transactionId);
      return { success: true, bookingId };
    } else {
      // Thanh toán thất bại -> Quay lại PENDING để thanh toán lại
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PENDING }
      });
      socketService.emitBookingStatusUpdate(bookingId, BookingStatus.PENDING);
      await this.prisma.payment.update({
        where: { bookingId },
        data: { status: PaymentStatus.FAILED, transactionId }
      });
      return { success: false, bookingId };
    }
  }

  private async confirmBookingPayment(bookingId: string, method: string, transactionId: string) {
    // 1. Cập nhật booking sang CONFIRMED và payment sang COMPLETED
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
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
    socketService.emitBookingStatusUpdate(bookingId, BookingStatus.CONFIRMED);

    await this.prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.COMPLETED,
        transactionId,
        paidAt: new Date()
      }
    });

    try {
      await loyaltyUseCase.earnPoints(bookingId);
    } catch (err) {
      console.error('Failed to earn points on payment confirmation:', err);
    }

    // 2. Gửi mail kèm vé QR Code cho người dùng!
    //try {
      //await this.mailService.sendBookingTicketEmail({
      //email: booking.guestEmail,
      //guestName: booking.guestName,
      //bookingId: booking.id,
      //hotelName: booking.bookingItems[0]?.roomType.hotel.name || 'Khách sạn của chúng tôi',
      //roomTypeName: booking.bookingItems[0]?.roomType.name || 'Phòng nghỉ',
      //checkInDate: booking.checkInDate,
      //checkOutDate: booking.checkOutDate,
      //finalPrice: Number(booking.finalPrice)
      //});
      //console.log(`[PaymentUseCase] Gửi email thành công tới ${booking.guestEmail}`);
    //} catch (mailError) {
      //console.error('[PaymentUseCase] Lỗi gửi email vé:', mailError);
    //}
  }
}

// Khởi tạo và export singleton instance
const paymentUseCaseInstance = new PaymentUseCase(
  prisma,
  new PaymentService(),
  mailService
);

export default paymentUseCaseInstance;
