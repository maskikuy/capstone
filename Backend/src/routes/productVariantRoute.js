import express from 'express';
import * as productVariantController from '../controllers/productVariantController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'ProductVariantRoute' });

router.get('/product-variant', productVariantController.getAllProductVariants);
router.get('/product-variant/:id', productVariantController.getProductVariantById);
router.post('/product-variant', verifyToken, productVariantController.createProductVariant);
router.put('/product-variant/:id', verifyToken, productVariantController.updateProductVariant);
router.delete('/product-variant/:id', verifyToken, productVariantController.deleteProductVariant);

export default router;