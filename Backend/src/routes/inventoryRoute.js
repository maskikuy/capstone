import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/inventory', inventoryController.getAllInventories);
router.get('/inventory/low-stock', inventoryController.getLowStock);
router.get('/inventory/:id', inventoryController.getInventoryById);
router.post('/inventory', verifyToken, inventoryController.createInventory);
router.put('/inventory/:id', verifyToken, inventoryController.updateInventory);
router.delete('/inventory/:id', verifyToken, inventoryController.deleteInventory);

export default router;
