import express from 'express';
import * as userController from '../controllers/userController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'UserRoute' });

router.get('/user', verifyToken, userController.getAllUsers);
router.get('/user/:id', verifyToken, userController.getUserById);
router.post('/user', verifyToken, userController.createUser);
router.put('/user/:id', verifyToken, userController.updateUser);
router.delete('/user/:id', verifyToken, userController.deleteUser);
export default router;