
import { Response, NextFunction } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from './auth.middleware';

export const auditLog = (action: string, getDetails?: (req: AuthRequest) => string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        // We only log successful operations usually, or we log the attempt
        // Let's hook into res.on('finish') to log only if status < 400
        const user = req.user;
        if (!user) return next();

        res.on('finish', async () => {
            if (res.statusCode < 400) {
                try {
                    const details = getDetails ? getDetails(req) : `User performed ${action} on ${req.method} ${req.path}`;
                    await prisma.auditLog.create({
                        data: {
                            userId: user.id,
                            action,
                            details,
                            severity: 'INFO',
                            ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
                        }
                    });
                } catch (error) {
                    console.error('Failed to create audit log:', error);
                }
            }
        });

        next();
    };
};
