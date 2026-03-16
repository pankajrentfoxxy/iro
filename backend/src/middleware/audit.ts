import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';

export function auditLog(action: string, entity?: string, entityId?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (data) {
      res.send = originalSend;
      const status = res.statusCode;
      if (status >= 200 && status < 400) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user?.userId,
              action,
              entity,
              entityId,
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          })
          .catch(console.error);
      }
      return originalSend.call(this, data);
    };
    next();
  };
}
