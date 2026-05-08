import db from '../config/database.js';
import * as productsModel from '../models/productModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'ProductController' });

export const getAllProducts = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const products = await productsModel.getAllProducts(conn);
        logger.debug('Fetching all products');
        res.status(200).json(products);
    } catch (error) {
        logger.error(`Error fetching all products: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getProductById = async (req, res) => {
    const productId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const product = await productsModel.getProductById(conn, productId);
        if (!product) {
            logger.warn(`Product not found with ID: ${productId}`);
            return res.status(404).json({ error: 'Product Not Found' });
        }
        logger.debug(`Product fetched with ID: ${productId}`);
        res.status(200).json(product);
    } catch (error) {
        logger.error(`Error fetching product by ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createProduct = async (req, res) => {
    const productData = req.body;
    console.log(JSON.stringify(productData));
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        if (req.file) {
            productData.image_url = req.file.filename;
            logger.debug('Product image file processed');
        }
        const productId = await productsModel.createProduct(conn, productData);
        await conn.commit();
        logger.debug(`Product created with ID: ${productId}`);
        res.status(201).json({ id: productId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating product: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const productData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        if (req.file) {
            productData.image_url = req.file.filename;
            logger.debug('Product image file processed for update');
        }
        const updated = await productsModel.updateProduct(conn, productId, productData);
        if (!updated) {
            logger.warn(`Product not found for update with ID: ${productId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Product Not Found' });
        }
        await conn.commit();
        logger.debug(`Product updated with ID: ${productId}`);
        res.status(200).json({ message: 'Product Updated Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating product with ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteProduct = async (req, res) => {
    const productId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await productsModel.deleteProduct(conn, productId);
        if (!deleted) {
            logger.warn(`Product not found for deletion with ID: ${productId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Product Not Found' });
        }
        await conn.commit();
        logger.debug(`Product deleted with ID: ${productId}`);
        res.status(200).json({ message: 'Product Deleted Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting product with ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateProductAvailability = async (req, res) => {
    const productId = req.params.id;
    const { is_available } = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const updated = await productsModel.updateProductAvailability(conn, productId, is_available);
        if (!updated) {
            logger.warn(`Product not found for availability update with ID: ${productId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Product Not Found' });
        }
        await conn.commit();
        logger.debug(`Product availability updated with ID: ${productId}`);
        res.status(200).json({ message: 'Product Availability Updated Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating product availability with ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};