import { Response, NextFunction } from 'express';
import ratePlanUseCase from '../../use-cases/hotel/rate-plan.use-case';

export class RatePlanController {
  public async getByRoomType(req: any, res: Response, next: NextFunction) {
    try {
      const { roomTypeId } = req.params;
      const result = await ratePlanUseCase.getRatePlansByRoomType(roomTypeId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const result = await ratePlanUseCase.createRatePlan(userId, role, req.body);
      res.status(201).json({
        success: true,
        message: 'Tạo gói đặt phòng (Rate Plan) mới thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const { id } = req.params;
      const result = await ratePlanUseCase.updateRatePlan(userId, role, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Cập nhật gói đặt phòng thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const { id } = req.params;
      const result = await ratePlanUseCase.deleteRatePlan(userId, role, id);
      res.status(200).json({
        success: true,
        message: 'Xóa gói đặt phòng thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RatePlanController();
