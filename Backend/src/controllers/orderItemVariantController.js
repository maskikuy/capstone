import db from '../config/database.js';
import * as orderItemVariantModel from '../models/orderItemVariantModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'OrderItemVariantController' });

export const getAllOrderItemVariants = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try{
        const orderItemVariants = await orderItemVariantModel.getAllOrderItemVariants(conn);
        logger.debug('Fetching all order item variants');
        res.status(200).json(orderItemVariants);
    } catch (error) {
        logger.error(`Error fetching all order item variants: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getOrderItemVariantById = async (req, res) => {
    const variantId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const orderItemVariant = await orderItemVariantModel.getOrderItemVariantById(conn, variantId);
        if (!orderItemVariant) {
            logger.warn(`Order item variant not found with ID: ${variantId}`);
            return res.status(404).json({ error: 'Order Item Variant Not Found' });
        }
        logger.debug(`Order item variant fetched with ID: ${variantId}`);
        res.status(200).json(orderItemVariant);
    } catch (error) {
        logger.error(`Error fetching order item variant by ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createOrderItemVariant = async (req, res) => {
    const variantData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const variantId = await orderItemVariantModel.createOrderItemVariant(conn, variantData);
        await conn.commit();
        logger.debug(`Order item variant created with ID: ${variantId}`);
        res.status(201).json({ id: variantId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating order item variant: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateOrderItemVariant = async (req, res) => {
    const variantId = req.params.id;
    const variantData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const updatedVariant = await orderItemVariantModel.updateOrderItemVariant(conn, variantId, variantData);
        if (!updatedVariant) {
            logger.warn(`Order item variant not found to update with ID: ${variantId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Item Variant Not Found' });
        }
        await conn.commit();
        logger.debug(`Order item variant updated with ID: ${variantId}`);
        res.status(200).json(updatedVariant);
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating order item variant with ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteOrderItemVariant = async (req, res) => {
    const variantId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await orderItemVariantModel.deleteOrderItemVariant(conn, variantId);
        if (!deleted) {
            logger.warn(`Order item variant not found to delete with ID: ${variantId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Item Variant Not Found' });
        }
        await conn.commit();
        logger.debug(`Order item variant deleted with ID: ${variantId}`);
        res.status(200).json({ message: 'Order Item Variant Deleted Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting order item variant with ID ${variantId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};