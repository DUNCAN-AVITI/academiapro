import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';

const router = Router();

// --- Assignments ---
router.get('/assignments', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        let whereClause = {};

        if (user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId: user.id } });
            if (student) {
                whereClause = { groupId: student.groupId };
            }
        } else if (user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
            if (teacher) {
                whereClause = { teacherId: teacher.id };
            }
        }
        // ADMIN falls through here with empty whereClause -> gets all assignments

        const assignments = await prisma.assignment.findMany({
            where: whereClause,
            include: {
                subject: true,
                teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
                group: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assignments' });
    }
});

router.post('/assignments', authenticateToken, requireRole(['TEACHER', 'ADMIN']), auditLog('CREATE_ASSIGNMENT', (req) => `Titre: ${req.body.title}`), async (req: AuthRequest, res) => {
    try {
        const { title, description, deadline, subjectId, groupId, allowedFormats, maxSizeMB } = req.body;
        const user = req.user;

        // Find teacher profile
        const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
        if (!teacher && user.role !== 'ADMIN') return res.status(400).json({ message: 'Teacher profile not found' });

        // If admin is creating, we might need to specify teacherId, but for now assume logged in teacher
        const teacherId = teacher ? teacher.id : ''; // Handle admin case if needed script

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                deadline: new Date(deadline),
                subjectId,
                groupId,
                teacherId,
                allowedFormats: allowedFormats || ['pdf', 'docx', 'doc', 'zip', 'rar', '7z'],
                maxSizeMB: maxSizeMB || 50
            }
        });

        // NOTIFICATION: Send email to all students in the group
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { students: { include: { user: true } } }
        });

        if (group && group.students) {
            for (const student of group.students) {
                // UI Notification
                await prisma.appNotification.create({
                    data: {
                        userId: student.user.id,
                        title: `Nouveau devoir : ${title}`,
                        message: `Un nouveau devoir a été publié dans votre groupe ${group.name}.`,
                        type: 'ASSIGNMENT'
                    }
                });

                await prisma.systemEmail.create({
                    data: {
                        userId: student.user.id,
                        from: "Système AcademiaPro",
                        to: student.user.email,
                        subject: `Nouveau Devoir : ${title}`,
                        body: `Un nouveau devoir a été publié dans votre groupe ${group.name}.\n\nDescription : ${description}\nDate limite : ${new Date(deadline).toLocaleDateString()}`
                    }
                });
            }
        }

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating assignment' });
    }
});

router.put('/assignments/:id', authenticateToken, requireRole(['TEACHER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        const { title, description, deadline, subjectId, groupId, allowedFormats, maxSizeMB } = req.body;
        const user = req.user;

        const assignment = await prisma.assignment.update({
            where: { id },
            data: {
                title,
                description,
                deadline: new Date(deadline),
                subjectId,
                groupId,
                allowedFormats,
                maxSizeMB
            }
        });
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating assignment' });
    }
});

router.delete('/assignments/:id', authenticateToken, requireRole(['TEACHER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.assignment.delete({ where: { id } });
        res.json({ message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting assignment' });
    }
});

// --- Submissions ---
router.get('/submissions', authenticateToken, requireRole(['TEACHER', 'STUDENT', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        let whereClause: any = {};

        if (user.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
            if (!teacher) return res.status(403).send("Not a teacher");
            // First get the assignments for this teacher, then get submissions for those assignments
            const teacherAssignments = await prisma.assignment.findMany({
                where: { teacherId: teacher.id },
                select: { id: true }
            });
            const assignmentIds = teacherAssignments.map((a: any) => a.id);
            whereClause = { assignmentId: { in: assignmentIds } };
        } else if (user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId: user.id } });
            if (!student) return res.status(403).send("Not a student");
            whereClause = { studentId: student.id };
        }

        console.log('Fetching submissions with whereClause:', whereClause);
        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
                assignment: { include: { subject: true } }
            }
        });
        console.log('Found submissions:', submissions.length);
        res.json(submissions);
    } catch (error: any) {
        console.error('Error fetching submissions:', error);
        console.error('Error details:', {
            name: error?.name || error?.constructor?.name,
            message: error?.message || 'Unknown error',
            stack: error?.stack
        });
        res.status(500).json({ 
            message: "Error fetching submissions", 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error?.toString()
        });
    }
});

router.post('/submissions', authenticateToken, requireRole(['STUDENT']), auditLog('SUBMIT_WORK', (req) => `Assignment ID: ${req.body.assignmentId}`), async (req: AuthRequest, res) => {
    try {
        const { assignmentId, fileIds, comment } = req.body;
        const user = req.user;
        const student = await prisma.student.findUnique({ where: { userId: user.id } });

        if (!student) return res.status(400).json({ message: "Student profile not found" });

        // Fetch assignment to check deadline
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        const isLate = new Date() > new Date(assignment.deadline);
        const status = isLate ? 'LATE' : 'SUBMITTED';

        const existing = await prisma.submission.findFirst({
            where: { assignmentId, studentId: student.id }
        });

        let submission;
        // Use fileIds array and include plagiarismScore as per updated schema
        const mockPlagiarismScore = Math.random() < 0.05 ? Math.floor(Math.random() * 80) + 20 : 0;

        if (existing) {
            submission = await prisma.submission.update({
                where: { id: existing.id },
                data: {
                    fileIds: fileIds as string[],
                    comment,
                    submittedAt: new Date(), // Re-submission
                    version: { increment: 1 },
                    status,
                    plagiarismScore: mockPlagiarismScore
                }
            });
        } else {
            submission = await prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: student.id,
                    fileIds: fileIds as string[],
                    comment,
                    status,
                    plagiarismScore: mockPlagiarismScore
                }
            });
        }

        // NOTIFICATION: Notify the teacher of the assignment
        const teacherUser = await prisma.user.findFirst({
            where: { teacher: { id: assignment.teacherId } }
        });

        if (teacherUser) {
            await prisma.appNotification.create({
                data: {
                    userId: teacherUser.id,
                    title: `Nouveau rendu : ${assignment.title}`,
                    message: `${user.firstName} ${user.lastName} a remis son travail${isLate ? ' (en retard)' : ''}.`,
                    type: 'SUBMISSION'
                }
            });
        }

        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error submitting assignment" });
    }
});

// --- Grading ---
router.post('/submissions/:id/grade', authenticateToken, requireRole(['TEACHER']), auditLog('GRADE_SUBMISSION', (req) => `Submission ID: ${req.params.id}, Note: ${req.body.grade}`), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { grade, comment, correctionFileId } = req.body;

        const submission = await prisma.submission.update({
            where: { id },
            data: {
                grade,
                comment,
                correctionFileId,
                status: 'GRADED'
            }
        });

        // NOTIFICATION: Send email to student about grade
        const student = await prisma.student.findUnique({
            where: { id: submission.studentId },
            include: { user: true }
        });

        if (student) {
            // Internal system notification (Bell icon)
            await prisma.appNotification.create({
                data: {
                    userId: student.user.id,
                    title: `Devoir Corrigé : ${grade}/20`,
                    message: `Votre travail a été évalué par l'enseignant.`,
                    type: 'GRADING'
                }
            });

            // System email record
            await prisma.systemEmail.create({
                data: {
                    userId: student.user.id,
                    from: "Système AcademiaPro",
                    to: student.user.email,
                    subject: `Devoir Corrigé : ${grade}/20`,
                    body: `Votre devoir a été corrigé.\n\nNote : ${grade}/20\nCommentaire : ${comment || "Aucun commentaire"}`
                }
            });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: "Error grading submission" });
    }
});

// --- Resources ---
router.get('/resources', authenticateToken, async (req, res) => {
    try {
        const resources = await prisma.courseResource.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(resources);
    } catch (e) { res.status(500).json({ message: "Error fetching resources" }); }
});

router.post('/resources', authenticateToken, requireRole(['TEACHER']), async (req: AuthRequest, res) => {
    try {
        const { title, description, subjectId, fileId, teacherId } = req.body;
        const resource = await prisma.courseResource.create({
            data: {
                title, description, subjectId, fileId, authorId: req.user!.id
            }
        });
        res.json(resource);
    } catch (e) { res.status(500).json({ message: "Error creating resource" }); }
});

router.delete('/resources/:id', authenticateToken, requireRole(['TEACHER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.courseResource.delete({ where: { id } });
        res.json({ message: "Resource deleted" });
    } catch (e) { res.status(500).json({ message: "Error deleting resource" }); }
});

export default router;
