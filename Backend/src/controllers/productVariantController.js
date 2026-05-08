import db from '../config/database.js';
import * as productVariantModel from '../models/productVariantModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'ProductVariantController' });

export const getAllProductVariants = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try{
        const productVariants = await productVariantModel.getAllProductVariants(conn);
        logger.debug('Fetching all product variants');
        res.status(200).json(productVariants);
    } catch (error) {
        logger.error(`Error fetching all product variants: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getProductVariantById = async (req, res) => {
    const variantId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const productVariant = await productVariantModel.getProductVariantById(conn, variantId);
        if (!productVariant) {
            logger.warn(`Product variant not found with ID: ${variantId}`);
            return res.status(404).json({ error: 'Product Variant Not Found' });
        }
        logger.debug(`Product variant fetched with ID: ${variantId}`);
        res.status(200).json(productVariant);
    } catch (error) {
        logger.error(`Error fetching product variant by ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createProductVariant = async (req, res) => {
    const variantData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const variantId = await productVariantModel.createProductVariant(conn, variantData);
        await conn.commit();
        logger.debug(`Product variant created with ID: ${variantId}`);
        res.status(201).json({ id: variantId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating product variant: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateProductVariant = async (req, res) => {
    const variantId = req.params.id;
    const variantData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const updated = await productVariantModel.updateProductVariant(conn, variantId, variantData);
        if (!updated) {
            logger.warn(`Product variant not found for update with ID: ${variantId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Product Variant Not Found' });
        }
        await conn.commit();
        logger.debug(`Product variant updated with ID: ${variantId}`);
        res.status(200).json({ message: 'Product Variant Updated Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating product variant with ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteProductVariant = async (req, res) => {
    const variantId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await productVariantModel.deleteProductVariant(conn, variantId);
        if (!deleted) {
            logger.warn(`Product variant not found for deletion with ID: ${variantId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Product Variant Not Found' });
        }
        await conn.commit();
        logger.debug(`Product variant deleted with ID: ${variantId}`);
        res.status(200).json({ message: 'Product Variant Deleted Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting product variant with ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};