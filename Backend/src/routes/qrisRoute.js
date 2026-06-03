import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/authMiddleware.js';
import baseLogger from '../utils/logger.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'QrisRoute' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    logger.debug(`Creating upload directory at ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for QRIS
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Save as qris_statis.png
        cb(null, 'qris_statis.png');
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
});

// GET static QRIS info
router.get('/qris-static', (req, res) => {
    try {
        const filePath = path.join(uploadDir, 'qris_statis.png');
        if (fs.existsSync(filePath)) {
            // Return with a cache-buster query string to prevent browser caching issues
            const imageUrl = `uploads/qris_statis.png?t=${Date.now()}`;
            return res.status(200).json({ exists: true, qris_image: imageUrl });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (error) {
        logger.error(`Error checking static QRIS: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST upload static QRIS
router.post('/qris-static', verifyToken, (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            logger.error(`Multer error uploading QRIS: ${err.message}`);
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image file' });
        }
        
        logger.info('Static QRIS uploaded successfully');
        res.status(200).json({ 
            message: 'Static QRIS uploaded successfully',
            qris_image: `uploads/qris_statis.png?t=${Date.now()}`
        });
    });
});

// DELETE static QRIS
router.delete('/qris-static', verifyToken, (req, res) => {
    try {
        const filePath = path.join(uploadDir, 'qris_statis.png');
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info('Static QRIS deleted successfully');
            return res.status(200).json({ message: 'Static QRIS deleted successfully' });
        } else {
            return res.status(404).json({ error: 'Static QRIS not found' });
        }
    } catch (error) {
        logger.error(`Error deleting static QRIS: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
