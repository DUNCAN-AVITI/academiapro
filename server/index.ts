import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
    if (process.env.NODE_ENV === 'production') {
        console.error('The server may not function correctly without these variables.');
    }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files from dist folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for dist folder
const distPaths = [
    path.join(__dirname, '../dist'), // Standard build path
    path.join(process.cwd(), 'dist'), // Railway deployment path
    path.join(__dirname, '../../dist'), // Alternative path
    path.resolve('dist') // Absolute path from root
];

let distPath = '';
for (const testPath of distPaths) {
    if (fs.existsSync(testPath)) {
        distPath = testPath;
        console.log(`✅ Found dist folder at: ${testPath}`);
        break;
    }
}

if (distPath) {
    app.use(express.static(distPath));
    console.log(`📁 Serving static files from: ${distPath}`);
} else {
    console.warn('⚠️  Dist folder not found in any expected location');
    console.warn('Expected locations:', distPaths);
}

// Serve index.html for any non-API routes
app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    } else {
        next();
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', coreRoutes);
app.use('/api', academicRoutes);
app.use('/api', notificationRoutes);
app.use('/api', auditRoutes);
app.use('/api', fileRoutes);
app.use('/api', messagingRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', emailRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Export app for serverless deployment
export default app;

// Start server only if not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`✅ Server running at http://localhost:${port}`);
    });
}

export { prisma };
