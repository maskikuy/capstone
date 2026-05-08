import db from '../config/database.js';
import * as orderModel from '../models/orderModel.js';
import * as orderItemModel from '../models/orderItemModel.js';
import * as orderItemVariantModel from '../models/orderItemVariantModel.js';
import baseLogger from '../utils/logger.js';
import { generateDynamicQRIS } from '../utils/qrisHelper.js';

const logger = baseLogger.child({ context: 'OrderController' });
const qrisStatic = process.env.MY_STATIC_QRIS || '';

export const getAllOrders = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try{
        const orders = await orderModel.getAllOrders(conn);
        logger.debug('Fetching all orders');
        res.status(200).json(orders);
    } catch (error) {
        logger.error(`Error fetching all orders: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const order = await orderModel.getOrderById(conn, orderId);
        if (!order) {
            logger.warn(`Order not found with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        logger.debug(`Order fetched with ID: ${orderId}`);
        res.status(200).json(order);
    } catch (error) {
        logger.error(`Error fetching order by ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createOrder = async (req, res) => {
    const orderData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const {items, ...orderInfo} = orderData;
        await conn.beginTransaction();
        const orderId = await orderModel.createOrder(conn, orderInfo);
        const orderItems = items || [];
        for (const item of orderItems) {
            const itemData = {
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_order: item.price_at_order,
                notes: item.notes
            };
            const orderItemId = await orderItemModel.createOrderItem(conn, itemData);
            logger.debug(`Order item created for order ID: ${orderId}`);
            const orderItemVariants = item.itemVariants || [];
            for (const variant of orderItemVariants) {
                const variantData = {
                    order_item_id: orderItemId.id,
                    variant_name: variant.variant_name,
                    variant_price: variant.variant_price
                };
                await orderItemVariantModel.createOrderItemVariant(conn, variantData);
                logger.debug(`Order item variant created for order item ID: ${orderItemId}`);
            }
        }
        await conn.commit();
        const totalBayar = orderInfo.total_amount;
        const qrisData = await generateDynamicQRIS(qrisStatic, totalBayar);
        logger.debug(`Order created with ID: ${orderId}`);
        res.status(201).json({ id: orderId, qris_image: qrisData.qr_image });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating order: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateOrder = async (req, res) => {
    const orderId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const { items, ...orderInfo } = req.body;
        await conn.beginTransaction();
        const updated = await orderModel.updateOrder(conn, orderId, orderInfo);
        if (!updated) {
            logger.warn(`Order not found for update with ID: ${orderId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Not Found' });
        }
        await orderItemModel.deleteOrderItem(conn, orderId);
        const orderItems = items || [];
        for (const item of orderItems) {
            const itemData = {
                order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_order: item.price_at_order,
                notes: item.notes
            };
            const newItemId = await orderItemModel.createOrderItem(conn, itemData);
            logger.debug(`Order item updated for order ID: ${orderId}`);
            const orderItemVariants = item.itemVariants || [];
            for (const variant of orderItemVariants) {
                const variantData = {
                    order_item_id: newItemId.id,
                    variant_name: variant.variant_name,
                    variant_price: variant.variant_price
                };
                await orderItemVariantModel.createOrderItemVariant(conn, variantData);
            }
        }
        await conn.commit();
        logger.debug(`Order updated with ID: ${orderId}`);
        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating order with ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteOrder = async (req, res) => {
    const orderId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await orderModel.deleteOrder(conn, orderId);
        if (!deleted) {
            await conn.rollback();
            logger.warn(`Order not found for deletion with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        await conn.commit();
        logger.debug(`Order deleted with ID: ${orderId}`);
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting order with ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { order_status } = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const updated = await orderModel.updateOrderStatus(conn, orderId, order_status);
        if (!updated) {
            logger.warn(`Order not found for status update with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        logger.debug(`Order status updated for ID: ${orderId}`);
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        logger.error(`Error updating order status for ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updatePaymentStatus = async (req, res) => {
    const orderId = req.params.id;
    const { payment_status } = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const updated = await orderModel.updatePaymentStatus(conn, orderId, payment_status);
        if (!updated) {
            logger.warn(`Order not found for payment status update with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        logger.debug(`Payment status updated for ID: ${orderId}`);
        res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (error) {
        logger.error(`Error updating payment status for ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const status = await orderModel.getOrderStatus(conn, orderId);
        if (status === null) {
            logger.warn(`Order not found for status fetch with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        logger.debug(`Order status fetched for ID: ${orderId}`);
        res.status(200).json({ order_status: status });
    } catch (error) {
        logger.error(`Error fetching order status for ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};