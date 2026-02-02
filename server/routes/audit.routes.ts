import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/audit-logs', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: "Error fetching logs" });
    }
});

export default router;
