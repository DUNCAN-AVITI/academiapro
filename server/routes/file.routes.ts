import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Simple mock file storage in memory/DB for demo purposes
// In production, use S3 or disk storage
router.post('/files/upload', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { name, size, mimeType, data } = req.body;
        const user = req.user;

        const file = await prisma.file.create({
            data: {
                name,
                size,
                mimeType,
                uploadedBy: user.id,
                url: '', // Not used in this logic yet
                data // Storing base64 content directly for simplicity
            }
        });

        res.json(file);
    } catch (error) {
        res.status(500).json({ message: "Upload failed" });
    }
});

router.get('/files/:id/download', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params as { id: string };
        const file = await prisma.file.findUnique({ where: { id } });

        if (!file || !file.data) return res.status(404).json({ message: "File not found" });

        // Return base64 data or stream
        // For simplicity returning JSON with dataUri
        res.json({
            name: file.name,
            mimeType: file.mimeType,
            data: file.data
        });
    } catch (error) {
        res.status(500).json({ message: "Download failed" });
    }
});

export default router;
