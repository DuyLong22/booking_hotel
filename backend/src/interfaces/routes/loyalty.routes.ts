import { Router } from 'express';
import loyaltyController from '../controllers/loyalty.controller';
import { requireAuth } from '../../infrastructure/middlewares/auth.middleware';

const router = Router();

router.get('/summary', requireAuth, loyaltyController.getSummary);
router.get('/history', requireAuth, loyaltyController.getHistory);

export default router;
