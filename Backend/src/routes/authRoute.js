import {login} from '../controllers/authController.js';
import express from 'express';
import baseLogger from '../utils/logger.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'AuthRoute' });

router.post('/login', async (req, res) => {
    try {
        const result = await login(req, res);
        logger.info(`User logged in: ${req.body.username}`);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`Login Error: ${error.message}`);
        res.status(401).json({ error: error.message });
    }
});

export default router;