import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { AuthRequest } from '../types/express.js';

const router = Router();

// Get attendance records
router.get('/attendance', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { subjectId, studentId, date } = req.query;

        const where: any = {};
        if (subjectId) where.subjectId = subjectId as string;
        if (studentId) where.studentId = studentId as string;
        if (date) where.date = date as string;

        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                },
                subject: { select: { name: true, code: true } }
            },
            orderBy: { date: 'desc' }
        });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
});

// Mark attendance (bulk)
router.post('/attendance', authenticateToken, requireRole(['TEACHER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const { subjectId, date, records } = req.body;
        // records: [{ studentId, status }]

        const attendanceRecords = [];
        for (const record of records) {
            // First try to find existing attendance
            let att = await prisma.attendance.findFirst({
                where: {
                    studentId: record.studentId,
                    subjectId,
                    date
                }
            });
            
            if (att) {
                // Update existing attendance
                att = await prisma.attendance.update({
                    where: { id: att.id },
                    data: { status: record.status }
                });
            } else {
                // Create new attendance
                att = await prisma.attendance.create({
                    data: {
                        studentId: record.studentId,
                        subjectId,
                        date,
                        status: record.status
                    }
                });
            }
            
            // Fetch the full attendance record with relations for notification
            const fullAttendance = await prisma.attendance.findUnique({
                where: { id: att.id },
                include: { student: { include: { user: true } }, subject: true }
            });
            
            if (fullAttendance) {
                attendanceRecords.push(fullAttendance);

                // Notify student if status is significant (ABSENT, LATE)
                if (record.status === 'ABSENT' || record.status === 'LATE') {
                    await prisma.appNotification.create({
                        data: {
                            userId: fullAttendance.student.userId,
                            title: `Note de présence : ${record.status}`,
                            message: `Vous avez été marqué comme ${record.status} le ${date} pour le cours de ${fullAttendance.subject.name}.`,
                            type: 'REMINDER'
                        }
                    });
                }
            } else {
                attendanceRecords.push(att);
            }
        }

        res.json(attendanceRecords);
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ message: 'Error marking attendance' });
    }
});

export default router;
