
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  failedLoginAttempts: number;
  isLocked: boolean;
  lastLoginAt?: string;
  createdAt: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

export interface SignedUrl {
  token: string;
  fileId: string;
  userId: string;
  expiresAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  year: number;
  isArchived: boolean;
}

export interface Group {
  id: string;
  name: string;
  promotionId: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  maxFileSizeMB: number;
}

export interface Teacher {
  id: string;
  userId: string;
  subjectIds: string[];
  delegatedToId?: string;
  delegationExpiresAt?: string;
}

export interface Student {
  id: string;
  userId: string;
  groupId: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
  hash: string;
  data?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  groupId: string;
  deadline: string;
  version: number;
  allowedFormats: string[];
  maxSizeMB: number;
  statementFileId?: string;
  createdAt: string;
}

export enum SubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  GRADED = 'GRADED'
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileIds: string[];
  submittedAt: string;
  status: SubmissionStatus;
  version: number;
  plagiarismScore?: number;
  correctionFileId?: string;
  grade?: number;
  comment?: string;
  correctionHistory: { grade: number; comment: string; timestamp: string }[];
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  comment?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ipAddress?: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface LoginLog {
  id: string;
  userId: string;
  timestamp: string;
  success: boolean;
  ipAddress: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SUBMISSION' | 'GRADING' | 'SYSTEM' | 'MESSAGE' | 'REMINDER';
  isRead: boolean;
  createdAt: string;
}

export interface SystemEmail {
  id: string;
  userId: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  metadata?: any;
}

export interface CourseResource {
  id: string;
  title: string;
  subjectId: string;
  teacherId: string;
  fileId: string;
  description: string;
  createdAt: string;
}

export interface InternalMessage {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AcademicContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  // db: any; // REMOVED
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshState: () => void;
}
