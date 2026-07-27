import { Router } from 'express';
import ratePlanController from '../controllers/rate-plan.controller';
import { requireAuth } from '../../infrastructure/middlewares/auth.middleware';
import { validateRequest } from '../../infrastructure/middlewares/validation.middleware';
import { createRatePlanSchema, updateRatePlanSchema } from '../dtos/rate-plan.dto';

const router = Router();

router.get('/room-type/:roomTypeId', ratePlanController.getByRoomType);

router.post(
  '/',
  requireAuth,
  validateRequest(createRatePlanSchema),
  ratePlanController.create
);

router.put(
  '/:id',
  requireAuth,
  validateRequest(updateRatePlanSchema),
  ratePlanController.update
);

router.delete(
  '/:id',
  requireAuth,
  ratePlanController.delete
);

export default router;
