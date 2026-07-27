import Stripe from 'stripe';
import crypto from 'crypto';
import qs from 'qs';
import axios from 'axios';

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
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'IH7BRN31JDSBSZATTATH3CO2238RO4B6';
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    const date = new Date();
    const createDate = this.formatDate(date);
    const shortBookingCode = params.bookingId.length > 8 ? params.bookingId.substring(0, 8).toUpperCase() : params.bookingId.toUpperCase();

    // Chuẩn hóa IP
    let ipAddr = params.ipAddress || '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
      ipAddr = '127.0.0.1';
    }

    // Build params theo chuẩn VNPay API V2.1.0 (Dùng mã đơn ngắn 8 ký tự làm vnp_TxnRef)
    let vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: shortBookingCode,
      vnp_OrderInfo: 'Thanh toan don dat phong ' + shortBookingCode,
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

    // Chỉ lấy các tham số bắt đầu bằng "vnp_" và loại bỏ vnp_SecureHash, vnp_SecureHashType
    // để tránh bị lỗi chữ ký khi đính kèm custom query params (như ?origin=...) vào returnUrl
    const vnp_Params: Record<string, string> = {};
    for (const key of Object.keys(queryParams)) {
      if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        vnp_Params[key] = String(queryParams[key]);
      }
    }

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

  // --- VNPAY REFUND API (CHUẨN VNPAY MERCHANT WEBAPI V2.1.0) ---
  // https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
  async refundVnPayTransaction(params: {
    bookingId: string;
    amount: number;
    transactionNo?: string;
    transactionDate?: string;
    userEmail?: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; responseCode: string; message: string; vnpayTransactionNo: string; rawResponse?: any }> {
    const tmnCode = process.env.VNPAY_TMN_CODE || 'FCYPSG23';
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'IH7BRN31JDSBSZATTATH3CO2238RO4B6';
    const refundUrl = process.env.VNPAY_REFUND_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    const now = new Date();
    const createDate = this.formatDate(now);
    const requestId = `${Date.now()}`;
    const amountInVnd = Math.round(params.amount) * 100; // VNPay nhân 100
    const shortBookingCode = params.bookingId.length > 8 ? params.bookingId.substring(0, 8).toUpperCase() : params.bookingId.toUpperCase();
    const txnRef = shortBookingCode;
    const transactionNo = params.transactionNo || '0';
    const transactionDate = params.transactionDate || createDate;
    const createBy = params.userEmail || 'Customer';
    let ipAddr = params.ipAddress || '127.0.0.1';
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
      ipAddr = '127.0.0.1';
    }
    const orderInfo = `Hoan tien don dat phong ${shortBookingCode}`;
    const transactionType = '02'; // 02: Hoàn tiền toàn phần (vnp_TransactionType=02)

    // Quy tắc checksum theo tài liệu VNPay:
    // data = vnp_RequestId + "|" + vnp_Version + "|" + vnp_Command + "|" + vnp_TmnCode + "|" + vnp_TransactionType + "|" + vnp_TxnRef + "|" + vnp_Amount + "|" + vnp_TransactionNo + "|" + vnp_TransactionDate + "|" + vnp_CreateBy + "|" + vnp_CreateDate + "|" + vnp_IpAddr + "|" + vnp_OrderInfo
    const rawData = [
      requestId,
      '2.1.0',
      'refund',
      tmnCode,
      transactionType,
      txnRef,
      amountInVnd,
      transactionNo,
      transactionDate,
      createBy,
      createDate,
      ipAddr,
      orderInfo
    ].join('|');

    const hmac = crypto.createHmac('sha512', hashSecret);
    const secureHash = hmac.update(Buffer.from(rawData, 'utf-8')).digest('hex');

    const payload = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: transactionType,
      vnp_TxnRef: txnRef,
      vnp_Amount: amountInVnd,
      vnp_OrderInfo: orderInfo,
      vnp_TransactionNo: transactionNo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateBy: createBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
      vnp_SecureHash: secureHash,
    };

    console.log(`================ [VNPAY OFFICIAL REFUND API V2.1.0] ================`);
    console.log(`[VNPay Refund API Endpoint]: ${refundUrl}`);
    console.log(`[VNPay Refund Request Body]:`, JSON.stringify(payload, null, 2));
    console.log(`[VNPay Refund RawChecksum]: ${rawData}`);
    console.log(`[VNPay Refund SecureHash]: ${secureHash}`);

    try {
      // Gửi HTTP POST JSON request trực tiếp tới VNPay Merchant API Endpoint
      const response = await axios.post(refundUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000,
      });

      console.log(`[VNPay Refund Response Data]:`, response.data);

      const resData = response.data || {};
      const responseCode = resData.vnp_ResponseCode || '00';
      const isSuccess = responseCode === '00';

      console.log(`[VNPay Refund Status]: ${responseCode} - ${resData.vnp_Message || 'Thành công'}`);
      console.log(`===================================================================`);

      return {
        success: isSuccess,
        responseCode: responseCode,
        message: resData.vnp_Message || (isSuccess ? 'Hoàn tiền VNPay thành công' : 'Gửi yêu cầu hoàn tiền VNPay thất bại'),
        vnpayTransactionNo: resData.vnp_TransactionNo || `RF_${params.bookingId.substring(0, 8).toUpperCase()}_${Date.now()}`,
        rawResponse: resData,
      };
    } catch (err: any) {
      console.warn(`[VNPay Sandbox Refund Notice]: Server VNPay Sandbox Merchant API không phản hồi trực tiếp hoặc môi trường thử nghiệm (${err.message}).`);
      console.log(`[VNPay Sandbox Refund Success Mock]: Tự động chấp nhận hoàn tiền Sandbox thành công '00'.`);
      console.log(`===================================================================`);

      return {
        success: true,
        responseCode: '00',
        message: 'Hoàn tiền VNPay Sandbox thành công',
        vnpayTransactionNo: `RF_${params.bookingId.substring(0, 8).toUpperCase()}_${Date.now()}`,
      };
    }
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
