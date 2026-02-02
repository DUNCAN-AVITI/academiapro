import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AuthRequest } from '../types/express';

const router = Router();

// Get all messages for current user (conversations)
router.get('/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const messages = await prisma.internalMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true, role: true } },
                receiver: { select: { id: true, firstName: true, lastName: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Get conversation with specific user
router.get('/messages/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const currentUserId = req.user!.id;
        const { userId } = req.params as { userId: string };

        const messages = await prisma.internalMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } },
                receiver: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching conversation' });
    }
});

// Send message
router.post('/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const senderId = req.user!.id;
        const { receiverId, subject, content } = req.body;

        const message = await prisma.internalMessage.create({
            data: {
                senderId,
                receiverId,
                subject,
                content
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } },
                receiver: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        // Create notification for receiver
        await prisma.appNotification.create({
            data: {
                userId: receiverId,
                title: `Nouveau message de ${message.sender.firstName}`,
                message: `Sujet: ${subject}`,
                type: 'MESSAGE'
            }
        });

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Mark message as read
router.put('/messages/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        const message = await prisma.internalMessage.update({
            where: { id },
            data: { isRead: true }
        });
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error marking message as read' });
    }
});

// Mark all messages from a user as read
router.put('/messages/read-all/:senderId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const receiverId = req.user!.id;
        const { senderId } = req.params as { senderId: string };

        await prisma.internalMessage.updateMany({
            where: {
                senderId,
                receiverId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking messages as read' });
    }
});

export default router;
