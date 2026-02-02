import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, groupId, subjectIds } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Transaction to create user and specific role entry
        const result = await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    role,
                },
            });

            if (role === 'STUDENT' && groupId) {
                await tx.student.create({
                    data: {
                        userId: user.id,
                        groupId,
                    },
                });
            } else if (role === 'TEACHER' && subjectIds && Array.isArray(subjectIds)) {
                await tx.teacher.create({
                    data: {
                        userId: user.id,
                        subjects: {
                            connect: subjectIds.map((id: string) => ({ id }))
                        }
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'REGISTER',
                    details: `New account created: ${user.email} (${user.role})`,
                    severity: 'INFO'
                }
            });

            // Notify all admins of new registration
            const admins = await tx.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });
            if (admins.length > 0) {
                await tx.appNotification.createMany({
                    data: admins.map((a: any) => ({
                        userId: a.id,
                        title: `Nouveau compte : ${user.firstName}`,
                        message: `L'utilisateur ${user.email} s'est inscrit en tant que ${user.role}.`,
                        type: 'SECURITY'
                    }))
                });
            }

            return user;
        });

        const token = jwt.sign({ userId: result.id, role: result.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { ...result, passwordHash: undefined } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { student: { include: { group: true } }, teacher: true }
        });

        if (!user) {
            console.log(`[AUTH] User not found: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            console.log(`[AUTH] User is inactive: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            console.log(`[AUTH] Password mismatch for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`Login Success: User ${email} logging in. Secret used length: ${JWT_SECRET.length}. Start: ${JWT_SECRET.substring(0, 3)}...`);
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Log login
        await prisma.loginLog.create({
            data: {
                userId: user.id,
                success: true,
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
            }
        });

        // Also add to global AuditLog
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                details: `User logged in from ${req.ip || 'unknown'}`,
                severity: 'INFO'
            }
        });

        res.json({ token, user: { ...user, passwordHash: undefined } });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        res.status(500).json({ message: 'Error logging in', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Me (Get current user)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No token provided' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { student: { include: { group: true } }, teacher: true }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default router;
