import express from 'express';
import * as discountController from '../controllers/discountController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/discounts', discountController.getAllDiscounts);
router.get('/discounts/:id', discountController.getDiscountById);
router.post('/discounts', verifyToken, discountController.createDiscount);
router.put('/discounts/:id', verifyToken, discountController.updateDiscount);
router.patch('/discounts/:id/toggle', verifyToken, discountController.toggleDiscountActive);
router.delete('/discounts/:id', verifyToken, discountController.deleteDiscount);

export default router;

