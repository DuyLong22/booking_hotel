import Stripe from 'stripe';
import crypto from 'crypto';
import qs from 'qs';

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
  // Theo tài liệu chính thức VNPay NodeJS:
  // https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
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

    // Chuẩn hóa IP
    let ipAddr = params.ipAddress || '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
      ipAddr = '127.0.0.1';
    }

    // Build params theo chuẩn VNPay API V2.1.0
    let vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.bookingId,
      vnp_OrderInfo: 'Thanh toan don dat phong ' + params.bookingId,
      vnp_OrderType: 'other',
      vnp_Amount: String(Math.round(params.amount) * 100),
      vnp_ReturnUrl: params.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (params.bankCode && params.bankCode !== '') {
      vnp_Params['vnp_BankCode'] = params.bankCode;
    }

    // Sắp xếp key theo alphabet — BẮT BUỘC theo tài liệu VNPay
    vnp_Params = this.sortObject(vnp_Params);

    // ===================================================
    // QUAN TRỌNG: Build signData từ các tham số đã được mã hóa URL
    // ===================================================
    const signData = qs.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Build URL cuối (có encode value cho trình duyệt)
    const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;

    console.log(`[VNPay] Booking: ${params.bookingId} | Amount: ${params.amount} VND`);
    console.log(`[VNPay] SignData: ${signData}`);
    console.log(`[VNPay] SecureHash: ${signed}`);

    return paymentUrl;
  }

  validateVnPayHash(queryParams: Record<string, any>): boolean {
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'ODN95MIKS6BPYEN1R6V0ERD5C9AYGP14';
    const secureHash = queryParams['vnp_SecureHash'];

    if (!secureHash) {
      console.error('[VNPay] Missing vnp_SecureHash in callback');
      return false;
    }

    // Xóa SecureHash ra khỏi params trước khi tính lại
    const vnp_Params = { ...queryParams };
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp và mã hóa URL từng giá trị tham số để kiểm tra chữ ký
    const sorted = this.sortObject(vnp_Params);
    const signData = qs.stringify(sorted, { encode: false });

    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    console.log(`[VNPay Callback] SignData: ${signData}`);
    console.log(`[VNPay Callback] Expected: ${signed}`);
    console.log(`[VNPay Callback] Received: ${secureHash}`);

    return secureHash === signed;
  }

  // Sắp xếp object theo key alphabet và mã hóa URL từng giá trị theo chuẩn VNPay
  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) {
        sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
      }
    }
    return sorted;
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
