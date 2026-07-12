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
    bankCode?: string;
    locale?: string;
  }): string {
    const tmnCode = process.env.VNPAY_TMN_CODE || 'FCYPSG23';
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'ODN95MIKS6BPYEN1R6V0ERD5C9AYGP14';
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const date = new Date();
    const createDate = this.formatDate(date);

    // Build params đúng chuẩn API V2.1.0 VNPay
    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.bookingId,
      vnp_OrderInfo: `Thanh toan don dat phong ${params.bookingId}`,
      vnp_OrderType: 'other',
      vnp_Amount: (Math.round(params.amount) * 100).toString(),
      vnp_ReturnUrl: params.returnUrl,
      vnp_IpAddr: params.ipAddress === '::1' ? '127.0.0.1' : params.ipAddress,
      vnp_CreateDate: createDate,
    };

    // Thêm bankCode nếu có (để pre-select ngân hàng)
    if (params.bankCode) {
      vnp_Params['vnp_BankCode'] = params.bankCode;
    }

    // Sắp xếp key theo thứ tự alphabet
    const sortedKeys = Object.keys(vnp_Params).sort();

    // Build chuỗi ký: KHÔNG encodeURIComponent(key), chỉ encode value
    // Đây là format chuẩn theo tài liệu VNPay API v2.1.0
    const signData = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Build query string cho URL (encode cả key lẫn value cho URL)
    const queryString = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
      .join('&');

    const paymentUrl = `${vnpUrl}?${queryString}&vnp_SecureHash=${signed}`;

    console.log(`[VNPay] Generated URL for booking: ${params.bookingId}`);
    console.log(`[VNPay] Amount: ${params.amount} VND`);

    return paymentUrl;
  }

  validateVnPayHash(queryParams: Record<string, any>): boolean {
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'ODN95MIKS6BPYEN1R6V0ERD5C9AYGP14';
    const secureHash = queryParams['vnp_SecureHash'];

    if (!secureHash) {
      console.error('[VNPay] Missing vnp_SecureHash in callback');
      return false;
    }

    const vnp_Params = { ...queryParams };
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedKeys = Object.keys(vnp_Params).sort();

    // Build chuỗi ký theo format chuẩn VNPay (KHÔNG encode key)
    const signData = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, '+')}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash === signed;
    if (!isValid) {
      console.error('[VNPay] Hash mismatch!');
      console.error('[VNPay] Expected:', signed);
      console.error('[VNPay] Received:', secureHash);
    }

    return isValid;
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
