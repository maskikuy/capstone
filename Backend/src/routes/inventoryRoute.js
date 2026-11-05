import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as inventoryController from '../controllers/inventoryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, 'inventory-' + uniqueSuffix);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

router.get('/inventory', inventoryController.getAllInventories);
router.get('/inventory/low-stock', inventoryController.getLowStock);
router.get('/inventory/:id', inventoryController.getInventoryById);
router.post('/inventory', verifyToken, upload.single('image'), inventoryController.createInventory);
router.put('/inventory/:id', verifyToken, upload.single('image'), inventoryController.updateInventory);
router.delete('/inventory/:id', verifyToken, inventoryController.deleteInventory);

export default router;
