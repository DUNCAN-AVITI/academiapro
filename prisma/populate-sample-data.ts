import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function populateSampleData() {
    try {
        console.log('Populating sample data...');
        
        // Get existing users
        const adminUser = await prisma.user.findUnique({
            where: { email: 'degasaform@gmail.com' }
        });
        
        const teacherUser = await prisma.user.findUnique({
            where: { email: 'teacher@academia.edu' }
        });
        
        const studentUser = await prisma.user.findUnique({
            where: { email: 'student@academia.edu' }
        });
        
        if (!adminUser || !teacherUser || !studentUser) {
            console.log('Required users not found. Please run the seed first.');
            return;
        }
        
        // Get teacher and student profiles
        const teacher = await prisma.teacher.findUnique({
            where: { userId: teacherUser.id }
        });
        
        const student = await prisma.student.findUnique({
            where: { userId: studentUser.id }
        });
        
        if (!teacher || !student) {
            console.log('Teacher or student profile not found.');
            return;
        }
        
        // Get subjects
        const subjects = await prisma.subject.findMany();
        if (subjects.length === 0) {
            console.log('No subjects found.');
            return;
        }
        
        // Get group
        const group = await prisma.group.findFirst();
        if (!group) {
            console.log('No group found.');
            return;
        }
        
        // Create sample assignments
        let assignment1 = await prisma.assignment.findFirst({
            where: { title: 'Projet Sécurité Réseaux' }
        });
        
        if (!assignment1) {
            assignment1 = await prisma.assignment.create({
                data: {
                    title: 'Projet Sécurité Réseaux',
                    description: 'Concevez une architecture réseau sécurisée',
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    subjectId: subjects[0].id,
                    teacherId: teacher.id,
                    groupId: group.id,
                    allowedFormats: ['pdf', 'docx', 'zip'],
                    maxSizeMB: 10
                }
            });
        }
        
        let assignment2 = await prisma.assignment.findFirst({
            where: { title: 'Analyse de Vulnérabilités' }
        });
        
        if (!assignment2) {
            assignment2 = await prisma.assignment.create({
                data: {
                    title: 'Analyse de Vulnérabilités',
                    description: 'Analysez un système pour identifier les vulnérabilités',
                    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                    subjectId: subjects[1].id,
                    teacherId: teacher.id,
                    groupId: group.id,
                    allowedFormats: ['pdf', 'docx', 'zip'],
                    maxSizeMB: 15
                }
            });
        }
        
        // Create sample submission
        let submission = await prisma.submission.findFirst({
            where: {
                studentId: student.id,
                assignmentId: assignment1.id
            }
        });
        
        if (!submission) {
            submission = await prisma.submission.create({
                data: {
                    assignmentId: assignment1.id,
                    studentId: student.id,
                    fileIds: ['file123', 'file456'],
                    comment: 'Soumission du projet de sécurité réseau',
                    status: 'SUBMITTED',
                    plagiarismScore: 5.5
                }
            });
        }
        
        // Create sample audit logs
        await prisma.auditLog.createMany({
            data: [
                {
                    userId: adminUser.id,
                    action: 'ADMIN_LOGIN',
                    details: 'Connexion administrateur',
                    severity: 'INFO'
                },
                {
                    userId: teacherUser.id,
                    action: 'CREATE_ASSIGNMENT',
                    details: `Création de l'assignement: ${assignment1.title}`,
                    severity: 'INFO'
                },
                {
                    userId: studentUser.id,
                    action: 'SUBMIT_ASSIGNMENT',
                    details: `Soumission pour: ${assignment1.title}`,
                    severity: 'INFO'
                }
            ]
        });
        
        // Create sample notifications
        await prisma.appNotification.createMany({
            data: [
                {
                    userId: adminUser.id,
                    title: 'Nouvelle inscription',
                    message: 'Un nouvel utilisateur s\'est inscrit',
                    type: 'USER'
                },
                {
                    userId: teacherUser.id,
                    title: 'Nouveau rendu',
                    message: 'Un étudiant a soumis un travail',
                    type: 'SUBMISSION'
                },
                {
                    userId: studentUser.id,
                    title: 'Devoir disponible',
                    message: 'Un nouveau devoir a été publié',
                    type: 'ASSIGNMENT'
                }
            ]
        });
        
        // Create sample internal messages
        await prisma.internalMessage.createMany({
            data: [
                {
                    senderId: teacherUser.id,
                    receiverId: studentUser.id,
                    subject: 'Feedback sur le projet',
                    content: 'Votre projet est très bien fait, continuez comme ça !'
                },
                {
                    senderId: studentUser.id,
                    receiverId: teacherUser.id,
                    subject: 'Question sur le devoir',
                    content: 'Je voulais vous poser quelques questions sur le dernier devoir.'
                }
            ]
        });
        
        // Create sample system emails
        await prisma.systemEmail.createMany({
            data: [
                {
                    userId: adminUser.id,
                    to: 'degasaform@gmail.com',
                    from: 'Système AcademiaPro',
                    subject: 'Connexion réussie',
                    body: 'Vous vous êtes connecté à votre compte AcademiaPro avec succès.'
                },
                {
                    userId: studentUser.id,
                    to: 'student@academia.edu',
                    from: 'Système AcademiaPro',
                    subject: 'Nouveau devoir assigné',
                    body: 'Un nouveau devoir a été assigné dans votre groupe.'
                }
            ]
        });
        
        console.log('Sample data populated successfully!');
    } catch (error) {
        console.error('Error populating sample data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

populateSampleData();