import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../infrastructure/middlewares/auth.middleware';
import chatUseCase from '../../use-cases/chat/chat.use-case';

export class ChatController {
  public async getOrCreate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const { hotelId } = req.body;
      const result = await chatUseCase.getOrCreateConversation(customerId, hotelId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMyConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.user!;
      const result = await chatUseCase.getConversationsOfUser(userId, role);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async getConversationMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const { userId } = req.user!;
      const result = await chatUseCase.getMessages(conversationId, userId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();
