import express from 'express';
import * as orderController from '../controllers/orderController.js';
import baseLogger from '../utils/logger.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'OrderRoute' });

router.get('/order', orderController.getAllOrders);
router.get('/order/:id', orderController.getOrderById);
router.post('/order', orderController.createOrder);
router.put('/order/:id', verifyToken, orderController.updateOrder);
router.delete('/order/:id', verifyToken, orderController.deleteOrder);
router.put('/order/:id/status', verifyToken, orderController.updateOrderStatus);
router.put('/order/:id/updatePayment', verifyToken, orderController.updatePaymentStatus);
router.get('/order/:id/getStatus', orderController.getOrderStatus);

export default router;