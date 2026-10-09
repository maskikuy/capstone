import express from 'express';
import { getRecipesByProductId, saveProductRecipes } from '../controllers/productRecipeController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/product-recipe/:productId', getRecipesByProductId);
router.post('/product-recipe/:productId', verifyToken, saveProductRecipes);
router.put('/product-recipe/:productId', verifyToken, saveProductRecipes);

export default router;
