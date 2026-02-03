import app from './index.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const port = process.env.PORT || 3000;

// Validate environment variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missingEnv.join(', '));
    process.exit(1);
}

// Check if dist folder exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
    console.log('⚠️ Warning: dist folder not found. Frontend may not be built.');
    console.log('Expected location:', distPath);
}

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Dist folder exists: ${fs.existsSync(distPath)}`);
});