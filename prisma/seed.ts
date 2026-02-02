import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'degasaform@gmail.com' },
        update: {},
        create: {
            email: 'degasaform@gmail.com',
            passwordHash,
            firstName: 'Admin',
            lastName: 'Directeur',
            role: Role.ADMIN,
        },
    });

    console.log({ admin });

    // Promotion
    const p2025 = await prisma.promotion.create({
        data: {
            name: 'Master Cybersécurité',
            year: 2025,
            groups: {
                create: {
                    name: 'Groupe A',
                },
            },
        },
        include: { groups: true }
    });

    const groupA = p2025.groups[0];

    // Subjects
    const sec = await prisma.subject.upsert({
        where: { code: 'SEC-01' },
        update: {},
        create: { name: 'Sécurité Réseaux', code: 'SEC-01', coefficient: 3 }
    });

    const dev = await prisma.subject.upsert({
        where: { code: 'DEV-02' },
        update: {},
        create: { name: 'Développement Sécurisé', code: 'DEV-02', coefficient: 2 }
    });

    // Teacher
    const teacherUser = await prisma.user.upsert({
        where: { email: 'teacher@academia.edu' },
        update: {},
        create: {
            email: 'teacher@academia.edu',
            passwordHash,
            firstName: 'Sophie',
            lastName: 'Martin',
            role: Role.TEACHER,
        }
    });

    // Check if teacher profile already exists
    let teacherProfile = await prisma.teacher.findUnique({
        where: { userId: teacherUser.id }
    });
    
    if (!teacherProfile) {
        teacherProfile = await prisma.teacher.create({
            data: {
                userId: teacherUser.id,
                subjects: { connect: [{ id: sec.id }, { id: dev.id }] }
            }
        });
    }

    // Student
    const studentUser = await prisma.user.upsert({
        where: { email: 'student@academia.edu' },
        update: {},
        create: {
            email: 'student@academia.edu',
            passwordHash,
            firstName: 'Léo',
            lastName: 'Dubois',
            role: Role.STUDENT,
        }
    });

    // Check if student profile already exists
    let studentProfile = await prisma.student.findUnique({
        where: { userId: studentUser.id }
    });
    
    if (!studentProfile) {
        studentProfile = await prisma.student.create({
            data: {
                userId: studentUser.id,
                groupId: groupA.id
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
