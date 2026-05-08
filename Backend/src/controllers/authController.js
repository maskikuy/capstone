import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ module: 'authController' });

export const login = async (req, res) => {
    const { username, password } = req.body;
    const conn = await db.getConnection();
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const cleanIP = userIP.replace('::ffff:', '');
    logger.info(`Attempting login for user: ${username} with ip: ${cleanIP}`);

    try {
        const [users] = await conn.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            logger.warn(`Login failed for user: ${username} - User not found`);
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Login failed for user: ${username} - Incorrect password`);
            return res.status(401).json({ error: 'Username atau password salah' });
        }
        logger.info(`Login successful for user: ${username}`);

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );
        logger.info(`JWT token generated for user: ${username}`);

        res.json({
            message: 'Login berhasil',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        logger.error(`Login error for user: ${username} - ${error.message}`);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
        logger.info(`Connection released for user: ${username}`);
    }
};