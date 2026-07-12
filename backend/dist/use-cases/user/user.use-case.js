"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUseCase = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../infrastructure/middlewares/error.middleware");
class UserUseCase {
    async getProfile(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Không tìm thấy thông tin người dùng', 404);
        }
        return user;
    }
    async updateProfile(userId, data) {
        const { fullName, phoneNumber, avatarUrl } = data;
        const user = await database_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new error_middleware_1.AppError('Không tìm thấy người dùng', 404);
        }
        const updatedUser = await database_1.default.user.update({
            where: { id: userId },
            data: {
                fullName: fullName || undefined,
                phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                updatedAt: true,
            },
        });
        return updatedUser;
    }
}
exports.UserUseCase = UserUseCase;
exports.default = new UserUseCase();
