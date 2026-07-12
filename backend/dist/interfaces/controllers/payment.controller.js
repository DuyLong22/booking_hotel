"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_use_case_1 = __importDefault(require("../../use-cases/payment/payment.use-case"));
class PaymentController {
    paymentUseCase;
    constructor(paymentUseCase) {
        this.paymentUseCase = paymentUseCase;
    }
    createStripeIntent = async (req, res) => {
        try {
            const { bookingId } = req.body;
            const userId = req.user?.userId || null;
            const data = await this.paymentUseCase.createStripeIntent(bookingId, userId);
            return res.status(200).json({ success: true, data });
        }
        catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    };
    handleStripeWebhook = async (req, res) => {
        try {
            const signature = req.headers['stripe-signature'];
            const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
            const rawBody = req.rawBody || req.body;
            await this.paymentUseCase.handleStripeWebhook(rawBody, signature, secret);
            return res.status(200).json({ received: true });
        }
        catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    };
    generateVnPayUrl = async (req, res) => {
        try {
            const { bookingId, returnUrl } = req.body;
            const userId = req.user?.userId || null;
            const ipAddress = req.ip || '127.0.0.1';
            const data = await this.paymentUseCase.generateVnPayCheckoutUrl(bookingId, userId, ipAddress, returnUrl || 'http://localhost:5000/api/payment/vnpay-callback');
            return res.status(200).json({ success: true, data });
        }
        catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    };
    handleVnPayCallback = async (req, res) => {
        try {
            const queryParams = req.query;
            const result = await this.paymentUseCase.handleVnPayCallback(queryParams);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            if (result.success) {
                return res.redirect(`${frontendUrl}/my-bookings?payment=success&bookingId=${result.bookingId}`);
            }
            else {
                return res.redirect(`${frontendUrl}/checkout?payment=failed&bookingId=${result.bookingId}`);
            }
        }
        catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    };
    confirmStripePayment = async (req, res) => {
        try {
            const { bookingId } = req.body;
            const data = await this.paymentUseCase.confirmStripePayment(bookingId);
            return res.status(200).json({ success: true, data });
        }
        catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    };
}
exports.PaymentController = PaymentController;
// Export singleton instance
exports.default = new PaymentController(payment_use_case_1.default);
