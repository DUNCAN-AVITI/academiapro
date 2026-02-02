import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthRequest } from '../types/express';

const router = Router();

// Get system emails for current user
router.get('/emails', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const emails = await prisma.systemEmail.findMany({
            where: { userId },
            orderBy: { sentAt: 'desc' }
        });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emails' });
    }
});

// Mark email as read
router.put('/emails/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        const email = await prisma.systemEmail.update({
            where: { id },
            data: { isRead: true }
        });
        res.json(email);
    } catch (error) {
        res.status(500).json({ message: 'Error marking email as read' });
    }
});

export default router;
