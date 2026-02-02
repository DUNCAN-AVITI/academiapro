import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname and __filename for CommonJS compatibility
const currentUrl = import.meta.url;
const __filename = fileURLToPath(currentUrl);
const __dirname = path.dirname(__filename);

import { prisma } from './prisma.js';
import authRoutes from './routes/auth.routes.js';
import coreRoutes from './routes/core.routes.js';
import academicRoutes from './routes/academic.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';
import fileRoutes from './routes/file.routes.js';
import messagingRoutes from './routes/messaging.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import emailRoutes from './routes/email.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Validate environment variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missingEnv.join(', '));
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../../dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', coreRoutes);
app.use('/api', academicRoutes);
app.use('/api', notificationRoutes);
app.use('/api', auditRoutes);
app.use('/api', fileRoutes);
app.use('/api', messagingRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', emailRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`✅ Production server running at http://localhost:${port}`);
});

export default app;
export { prisma };