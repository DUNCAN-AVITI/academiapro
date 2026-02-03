import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

// Validate environment variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missingEnv.join(', '));
    process.exit(1);
}

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});