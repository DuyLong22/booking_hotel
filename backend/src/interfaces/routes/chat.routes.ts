import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { requireAuth } from '../../infrastructure/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/conversations', chatController.getOrCreate);
router.get('/conversations', chatController.getMyConversations);
router.get('/conversations/:id/messages', chatController.getConversationMessages);

export default router;
