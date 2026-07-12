import { Request, Response, NextFunction } from 'express';
import aiSearchUseCase from '../../use-cases/ai-search/ai-search.use-case';
import { AppError } from '../../infrastructure/middlewares/error.middleware';
import prisma from '../../config/database';

export class AiController {
  public async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new AppError('Nội dung tin nhắn tìm kiếm không được để trống', 400);
      }

      const result = await aiSearchUseCase.search(message);
      res.status(200).json({
        success: true,
        message: 'Tìm kiếm AI hoàn tất',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.aiSearchAnalytics.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AiController();
