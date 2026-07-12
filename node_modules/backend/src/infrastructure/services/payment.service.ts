import Stripe from 'stripe';
import crypto from 'crypto';

export class PaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
    if (stripeKey && stripeKey !== 'sk_test_mock') {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16' as any,
      });
    }
  }

  // --- STRIPE METHODS ---
  async createPaymentIntent(amount: number, bookingId: string): Promise<{ id: string; clientSecret: string | null }> {
    if (!this.stripe) {
      // Mock mode khi chạy offline không có key
      console.log(`[Stripe Mock] Creating PaymentIntent for Booking: ${bookingId}, amount: ${amount}`);
      return {
        id: `pi_mock_${crypto.randomBytes(8).toString('hex')}`,
        clientSecret: `pi_mock_secret_${crypto.randomBytes(16).toString('hex')}`,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'vnd',
      metadata: { bookingId },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async verifyStripeWebhook(rawBody: string | Buffer, signature: string, secret: string): Promise<Stripe.Event> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  // --- VNPAY METHODS ---
  generateVnPayUrl(params: {
    bookingId: string;
    amount: number;
    ipAddress: string;
    returnUrl: string;
  }): string {
    const tmnCode = process.env.VNPAY_TMN_CODE || '2QXUI4J4';
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'SECRET_MOCK';
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const date = new Date();
    const createDate = this.formatDate(date);
    const orderId = params.bookingId;

    // Build params đúng chuẩn API V2.1.0 VNPay
    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don dat phong ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: (params.amount * 100).toString(),
      vnp_ReturnUrl: params.returnUrl,
      vnp_IpAddr: params.ipAddress,
      vnp_CreateDate: createDate,
    };

    // Sắp xếp key
    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
    return paymentUrl;
  }

  validateVnPayHash(queryParams: Record<string, any>): boolean {
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'SECRET_MOCK';
    const secureHash = queryParams['vnp_SecureHash'];

    const vnp_Params = { ...queryParams };
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  private formatDate(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }
}
export default PaymentService;
