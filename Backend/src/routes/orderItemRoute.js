import express from 'express';
import * as orderItemController from '../controllers/orderItemController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'OrderItemRoute' });

router.get('/order-item', orderItemController.getAllOrderItems);
router.get('/order-item/:id', orderItemController.getOrderItemById);
router.post('/order-item', verifyToken, orderItemController.createOrderItem);
router.put('/order-item/:id', verifyToken, orderItemController.updateOrderItem);
router.delete('/order-item/:id', verifyToken, orderItemController.deleteOrderItem);

export default router;