import express from 'express';
import * as categoriesController from '../controllers/categoriesController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'CategoriesRoute' });

router.get('/categories', categoriesController.getAllCategories);
router.get('/categories/:id', categoriesController.getCategoryById);
router.post('/categories', verifyToken, categoriesController.createCategory);
router.put('/categories/:id', verifyToken, categoriesController.updateCategory);
router.delete('/categories/:id', verifyToken, categoriesController.deleteCategory);

export default router;