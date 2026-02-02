import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn(`[AUTH] Missing token for ${req.method} ${req.path}`);
        return res.sendStatus(401);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            console.error(`Auth Error: User not found for ID ${decoded.userId}`);
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Error: JWT verification failed', err);
        return res.sendStatus(403);
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role?.toUpperCase();
        const requiredRoles = roles.map(r => r.toUpperCase());

        if (!req.user || (userRole !== 'ADMIN' && !requiredRoles.includes(userRole))) {
            console.warn(`[AUTH] Permission Denied: User ${req.user?.id} (Role: ${req.user?.role}) requested access for required roles: [${roles}]`);
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        console.log(`[AUTH] Permission Granted: User ${req.user?.id} (Role: ${req.user?.role}) for roles: [${roles}]`);
        next();
    }
}
