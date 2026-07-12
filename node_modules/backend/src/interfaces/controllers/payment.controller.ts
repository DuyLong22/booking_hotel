import { Response } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/middlewares/auth.middleware';
import { PaymentUseCase } from '../../use-cases/payment/payment.use-case';
import paymentUseCaseInstance from '../../use-cases/payment/payment.use-case';

export class PaymentController {
  constructor(private paymentUseCase: PaymentUseCase) {}

  createStripeIntent = async (req: any, res: Response) => {
    try {
      const { bookingId } = req.body;
      const userId = req.user?.userId || null;

      const data = await this.paymentUseCase.createStripeIntent(bookingId, userId);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  handleStripeWebhook = async (req: any, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
      const rawBody = req.rawBody || req.body;

      await this.paymentUseCase.handleStripeWebhook(rawBody, signature, secret);
      return res.status(200).json({ received: true });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  generateVnPayUrl = async (req: any, res: Response) => {
    try {
      const { bookingId, returnUrl } = req.body;
      const userId = req.user?.userId || null;
      const ipAddress = req.ip || '127.0.0.1';

      const data = await this.paymentUseCase.generateVnPayCheckoutUrl(
        bookingId,
        userId,
        ipAddress,
        returnUrl || 'http://localhost:5000/api/payment/vnpay-callback'
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  handleVnPayCallback = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const queryParams = req.query;
      const result = await this.paymentUseCase.handleVnPayCallback(queryParams);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (result.success) {
        return res.redirect(`${frontendUrl}/my-bookings?payment=success&bookingId=${result.bookingId}`);
      } else {
        return res.redirect(`${frontendUrl}/checkout?payment=failed&bookingId=${result.bookingId}`);
      }
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  confirmStripePayment = async (req: any, res: Response) => {
    try {
      const { bookingId } = req.body;
      const data = await this.paymentUseCase.confirmStripePayment(bookingId);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };
}

// Export singleton instance
export default new PaymentController(paymentUseCaseInstance);
