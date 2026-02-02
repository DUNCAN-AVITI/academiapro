
export const PRISMA_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  TEACHER
  STUDENT
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  firstName    String
  lastName     String
  role         Role      @default(STUDENT)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  student      Student?
  teacher      Teacher?
  auditLogs    AuditLog[]
}

model Student {
  id          String       @id @default(cuid())
  user        User         @relation(fields: [userId], references: [id])
  userId      String       @unique
  group       Group        @relation(fields: [groupId], references: [id])
  groupId     String
  submissions Submission[]
}

model Teacher {
  id          String       @id @default(cuid())
  user        User         @relation(fields: [userId], references: [id])
  userId      String       @unique
  subjects    Subject[]
  assignments Assignment[]
}

model Promotion {
  id     String  @id @default(cuid())
  name   String
  year   Int
  groups Group[]
}

model Group {
  id          String       @id @default(cuid())
  name        String
  promotion   Promotion    @relation(fields: [promotionId], references: [id])
  promotionId String
  students    Student[]
  assignments Assignment[]
}

model Subject {
  id          String       @id @default(cuid())
  name        String
  code        String       @unique
  teachers    Teacher[]
  assignments Assignment[]
}

model Assignment {
  id              String       @id @default(cuid())
  title           String
  description     String
  deadline        DateTime
  allowedFormats  String[]
  maxSizeMB       Int          @default(10)
  
  subject         Subject      @relation(fields: [subjectId], references: [id])
  subjectId       String
  teacher         Teacher      @relation(fields: [teacherId], references: [id])
  teacherId       String
  group           Group        @relation(fields: [groupId], references: [id])
  groupId         String
  
  statementFileId String?
  submissions     Submission[]
  createdAt       DateTime     @default(now())
}

model Submission {
  id               String   @id @default(cuid())
  assignment       Assignment @relation(fields: [assignmentId], references: [id])
  assignmentId     String
  student          Student  @relation(fields: [studentId], references: [id])
  studentId        String
  
  fileId           String
  correctionFileId String?
  submittedAt      DateTime @default(now())
  grade            Float?
  comment          String?
  status           String   @default("SUBMITTED")
}

model File {
  id          String   @id @default(cuid())
  name        String
  mimeType    String
  size        Int
  url         String
  uploadedBy  String
  createdAt   DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  action    String
  details   String
  ipAddress String?
}
`;
