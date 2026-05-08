import jwt from 'jsonwebtoken';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ module: 'authMiddleware' });

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn(`Access denied. No token provided. IP: ${req.ip}`);
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        logger.info(`Token verified for user ID: ${decoded.id}`);
        next();
    } catch (error) {
        logger.warn(`Invalid or expired token. IP: ${req.ip}`);
        return res.status(403).json({ error: 'Token tidak valid atau kadaluarsa.' });
    }
};