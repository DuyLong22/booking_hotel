import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { requireAuth, requireRole } from '../../infrastructure/middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Route tìm kiếm AI ở chế độ public (khách vãng lai cũng có thể tìm phòng qua chat)
router.post('/search', aiController.search);

// Các route quản trị AI Analytics và Audit Logs dành riêng cho Admin
router.get('/logs', requireAuth, requireRole([Role.ADMIN]), aiController.getLogs);
router.get('/audit-logs', requireAuth, requireRole([Role.ADMIN]), aiController.getAuditLogs);

export default router;
