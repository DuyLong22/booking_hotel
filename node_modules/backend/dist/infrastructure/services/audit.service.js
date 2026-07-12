"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class AuditService {
    async log({ userId, action, entityName, entityId, oldValues = null, newValues = null, ipAddress = null, }) {
        try {
            await database_1.default.auditLog.create({
                data: {
                    userId,
                    action,
                    entityName,
                    entityId,
                    oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
                    newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
                    ipAddress,
                },
            });
        }
        catch (error) {
            console.error('[AuditService Error]: Failed to create audit log:', error);
        }
    }
}
exports.AuditService = AuditService;
exports.default = new AuditService();
