import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        const notifications = await prisma.appNotification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

router.put('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        const user = req.user;
        await prisma.appNotification.updateMany({
            where: { id, userId: user.id },
            data: { isRead: true }
        });
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification' });
    }
});

router.delete('/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        await prisma.appNotification.deleteMany({
            where: { userId: user.id }
        });
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ message: 'Error clearing notifications' });
    }
});

export default router;
