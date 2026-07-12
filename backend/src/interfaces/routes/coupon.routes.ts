import { Router } from 'express';
import couponController from '../controllers/coupon.controller';
import { requireAuth } from '../../infrastructure/middlewares/auth.middleware';
import { validateRequest } from '../../infrastructure/middlewares/validation.middleware';
import { createCouponSchema, validateCouponSchema } from '../dtos/booking.dto';

const router = Router();

router.get('/', couponController.list);
router.get('/validate', validateRequest(validateCouponSchema), couponController.validate);

router.post(
  '/',
  requireAuth,
  validateRequest(createCouponSchema),
  couponController.create
);

router.delete(
  '/:id',
  requireAuth,
  couponController.delete
);

export default router;
