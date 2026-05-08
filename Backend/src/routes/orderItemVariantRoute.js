import express from 'express';
import * as orderItemVariantController from '../controllers/orderItemVariantController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'OrderItemVariantRoute' });

router.get('/order-item-variant', orderItemVariantController.getAllOrderItemVariants);
router.get('/order-item-variant/:id', orderItemVariantController.getOrderItemVariantById);
router.post('/order-item-variant', verifyToken, orderItemVariantController.createOrderItemVariant);
router.put('/order-item-variant/:id', verifyToken, orderItemVariantController.updateOrderItemVariant);
router.delete('/order-item-variant/:id', verifyToken, orderItemVariantController.deleteOrderItemVariant);

export default router;