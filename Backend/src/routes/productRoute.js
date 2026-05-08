import express from 'express';
import * as productController from '../controllers/productController.js';
import baseLogger from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const logger = baseLogger.child({ module: 'ProductRoute' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    logger.debug(`Creating upload directory at ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix);
        logger.info(`Saved file with name ${'product-' + uniqueSuffix}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
        logger.warn(`Failed to upload file: File type not allowed - ${file.originalname}`);
    }
});

router.get('/product', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.post('/product', verifyToken, upload.single('image'), productController.createProduct);
router.put('/product/:id', verifyToken, upload.single('image'), productController.updateProduct);
router.delete('/product/:id', verifyToken, productController.deleteProduct);
router.put('/product/:id/availability', verifyToken, productController.updateProductAvailability);

export default router;