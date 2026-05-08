import db from '../config/database.js';
import * as orderItemModel from '../models/orderItemModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'OrderItemController' });

export const getAllOrderItems = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try{
        const orderItems = await orderItemModel.getAllOrderItems(conn);
        logger.debug('Fetching all order items');
        res.status(200).json(orderItems);
    } catch (error) {
        logger.error(`Error fetching all order items: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getOrderItemById = async (req, res) => {
    const itemId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const orderItem = await orderItemModel.getOrderItemById(conn, itemId);
        if (!orderItem) {
            logger.warn(`Order item not found with ID: ${itemId}`);
            return res.status(404).json({ error: 'Order Item Not Found' });
        }
        logger.debug(`Order item fetched with ID: ${itemId}`);
        res.status(200).json(orderItem);
    } catch (error) {
        logger.error(`Error fetching order item by ID ${itemId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createOrderItem = async (req, res) => {
    const itemData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const itemId = await orderItemModel.createOrderItem(conn, itemData);
        await conn.commit();
        logger.debug(`Order item created with ID: ${itemId}`);
        res.status(201).json({ id: itemId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating order item: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateOrderItem = async (req, res) => {
    const itemId = req.params.id;
    const itemData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const updated = await orderItemModel.updateOrderItem(conn, itemId, itemData);
        if (!updated) {
            logger.warn(`Order item not found for update with ID: ${itemId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Item Not Found' });
        }
        await conn.commit();
        logger.debug(`Order item updated with ID: ${itemId}`);
        res.status(200).json({ message: 'Order Item Updated Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating order item with ID ${itemId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteOrderItem = async (req, res) => {
    const itemId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await orderItemModel.deleteOrderItem(conn, itemId);
        if (!deleted) {
            logger.warn(`Order item not found for deletion with ID: ${itemId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Item Not Found' });
        }
        await conn.commit();
        logger.debug(`Order item deleted with ID: ${itemId}`);
        res.status(200).json({ message: 'Order Item Deleted Successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting order item with ID ${itemId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};