import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// --- Users ---
router.get('/users', authenticateToken, async (req: any, res) => {
    try {
        const isAdmin = req.user?.role === 'ADMIN';

        // Select fields based on role: Admins get everything, others get public info
        const select = isAdmin ? {
            id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true,
            student: { include: { group: true } },
            teacher: { include: { subjects: true } }
        } : {
            id: true, firstName: true, lastName: true, role: true,
            student: { include: { group: true } } // Helpful for identifying class
        };

        const users = await prisma.user.findMany({
            select
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// --- Promotions ---
router.get('/promotions', async (req, res) => {
    try {
        const promotions = await prisma.promotion.findMany({
            include: { groups: true },
            orderBy: { year: 'desc' },
            where: { isArchived: false }
        });
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching promotions' });
    }
});

// --- Groups ---
router.get('/groups', async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            include: { promotion: true, students: true }
        });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching groups' });
    }
});

// --- Subjects ---
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany();
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects' });
    }
});

// --- Users CRUD ---
router.put('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { email, role, isActive } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { email, role, isActive }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// --- Promotions CRUD ---
router.post('/promotions', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { name, year } = req.body;
        const promotion = await prisma.promotion.create({
            data: { name, year }
        });
        res.json(promotion);
    } catch (error) {
        res.status(500).json({ message: 'Error creating promotion' });
    }
});

router.put('/promotions/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { name, year } = req.body;
        const promotion = await prisma.promotion.update({
            where: { id },
            data: { name, year }
        });
        res.json(promotion);
    } catch (error) {
        res.status(500).json({ message: 'Error updating promotion' });
    }
});

router.delete('/promotions/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.promotion.delete({ where: { id } });
        res.json({ message: 'Promotion deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting promotion' });
    }
});

// --- Groups CRUD ---
router.post('/groups', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { name, promotionId } = req.body;
        const group = await prisma.group.create({
            data: { name, promotionId }
        });
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error creating group' });
    }
});

router.put('/groups/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { name, promotionId } = req.body;
        const group = await prisma.group.update({
            where: { id },
            data: { name, promotionId }
        });
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error updating group' });
    }
});

router.delete('/groups/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.group.delete({ where: { id } });
        res.json({ message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting group' });
    }
});

// --- Subjects CRUD ---
router.post('/subjects', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { name, code, coefficient } = req.body;
        const subject = await prisma.subject.create({
            data: { name, code, coefficient: coefficient || 1 }
        });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating subject' });
    }
});

router.delete('/subjects/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.subject.delete({ where: { id } });
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject' });
    }
});

export default router;
