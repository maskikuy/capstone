import express from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import baseLogger from '../utils/logger.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'SettingsRoute' });

router.get('/settings', settingsController.getSettings);
router.put('/settings', verifyToken, settingsController.updateSettings);
router.post('/feedback', settingsController.createFeedback);
router.get('/feedback', verifyToken, settingsController.getAllFeedbacks);

export default router;
