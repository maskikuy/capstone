import {login} from '../controllers/authController.js';
import express from 'express';
import baseLogger from '../utils/logger.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'AuthRoute' });

router.post('/login', login);

export default router;