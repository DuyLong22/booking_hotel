import prisma from '../../config/database';

export class AuditService {
  public async log({
    userId,
    action,
    entityName,
    entityId,
    oldValues = null,
    newValues = null,
    ipAddress = null,
  }: {
    userId: string;
    action: string;
    entityName: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
  }) {
    try {
      await prisma.auditLog.create({
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
    } catch (error) {
      console.error('[AuditService Error]: Failed to create audit log:', error);
    }
  }
}

export default new AuditService();
