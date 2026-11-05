import db from '../config/database.js';
import * as orderModel from '../models/orderModel.js';
import * as orderItemModel from '../models/orderItemModel.js';
import * as orderItemVariantModel from '../models/orderItemVariantModel.js';
import baseLogger from '../utils/logger.js';
import { createQrisCharge, checkMidtransStatus, verifyMidtransSignature } from '../utils/midtransHelper.js';
import { createSumopodPayment, verifySumopodWebhook } from '../utils/sumopodHelper.js';
import * as productRecipeModel from '../models/productRecipeModel.js';

const logger = baseLogger.child({ context: 'OrderController' });

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

            // Otomatis kurangi stok inventori berdasarkan resep produk
            await productRecipeModel.deductInventoryStockForProduct(conn, item.product_id, item.quantity);

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

        let qrisImage = '';
        let paymentLinkUrl = '';
        if (orderInfo.payment_method === 'qris') {
            const sumopodOrderId = `order-${orderId}-${Date.now()}`;
            logger.info(`Calling SumoPod QRIS for order ID: ${orderId}`);
            try {
                const sumopodData = await createSumopodPayment({
                    orderId: sumopodOrderId,
                    amount: orderInfo.total_amount,
                    paymentMethod: 'QRIS',
                    customerName: orderInfo.customer_name || 'Customer'
                });
                qrisImage = sumopodData.qr_image;
                paymentLinkUrl = sumopodData.payment_link_url;
                await orderModel.saveSumopodInfo(
                    conn, 
                    orderId, 
                    sumopodData.payment_id || sumopodOrderId, 
                    qrisImage, 
                    paymentLinkUrl
                );
                logger.info(`SumoPod QRIS generated for order ID: ${orderId}`);
            } catch (spErr) {
                logger.error(`SumoPod payment error: ${spErr.message}. Fallback to Midtrans.`);
                try {
                    const midtransOrderId = `order-${orderId}`;
                    const qrisData = await createQrisCharge({
                        orderId: midtransOrderId,
                        grossAmount: orderInfo.total_amount,
                        customerName: orderInfo.customer_name || 'Customer'
                    });
                    qrisImage = qrisData.qr_image;
                    await orderModel.saveMidtransInfo(conn, orderId, midtransOrderId, qrisData.transaction_id, qrisImage);
                } catch (mtErr) {
                    logger.error(`Fallback to Midtrans also failed: ${mtErr.message}`);
                }
            }
        }

        logger.debug(`Order created with ID: ${orderId}`);
        res.status(201).json({ id: orderId, qris_image: qrisImage, payment_link_url: paymentLinkUrl });
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
        if (orderInfo.order_status === 'completed') {
            orderInfo.payment_status = 'paid';
        }
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
        await conn.beginTransaction();
        const updated = await orderModel.updateOrderStatus(conn, orderId, order_status);
        if (!updated) {
            logger.warn(`Order not found for status update with ID: ${orderId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Order Not Found' });
        }
        
        if (order_status === 'completed') {
            await orderModel.updatePaymentStatus(conn, orderId, 'paid');
            logger.debug(`Payment status automatically updated to paid for completed order ID: ${orderId}`);
        }
        
        await conn.commit();
        logger.debug(`Order status updated for ID: ${orderId}`);
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        await conn.rollback();
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
        const statusInfo = await orderModel.getOrderStatus(conn, orderId);
        if (statusInfo === null) {
            logger.warn(`Order not found for status fetch with ID: ${orderId}`);
            return res.status(404).json({ error: 'Order Not Found' });
        }
        logger.debug(`Order status fetched for ID: ${orderId}`);
        res.status(200).json({ 
            order_status: statusInfo.order_status,
            payment_status: statusInfo.payment_status
        });
    } catch (error) {
        logger.error(`Error fetching order status for ID ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

// Polling endpoint: cek status pembayaran (SumoPod / Midtrans)
export const checkPaymentStatus = async (req, res) => {
    const orderId = req.params.id;
    const conn = await db.getConnection();
    try {
        const [rows] = await conn.execute(
            'SELECT midtrans_order_id, sumopod_payment_id, payment_status FROM orders WHERE id = ?',
            [orderId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Order Not Found' });

        const { midtrans_order_id, sumopod_payment_id, payment_status } = rows[0];

        // Kalau sudah paid di DB, langsung return
        if (payment_status === 'paid') return res.json({ payment_status: 'paid' });

        // Kalau order QRIS lama menggunakan Midtrans murni tanpa sumopod
        if (midtrans_order_id && !sumopod_payment_id && !midtrans_order_id.includes('-17')) {
            try {
                const mtStatus = await checkMidtransStatus(midtrans_order_id);
                logger.info(`Midtrans status for ${midtrans_order_id}: ${mtStatus.transaction_status}`);

                if (mtStatus.transaction_status === 'settlement' || mtStatus.transaction_status === 'capture') {
                    await orderModel.updatePaymentStatus(conn, orderId, 'paid');
                    return res.json({ payment_status: 'paid' });
                }
            } catch (err) {
                logger.warn(`Could not check Midtrans status: ${err.message}`);
            }
        }

        res.json({ payment_status: payment_status || 'pending' });
    } catch (error) {
        logger.error(`Error checking payment status for order ${orderId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

// Alias untuk backward compatibility dengan frontend
export const checkMidtransPaymentStatus = checkPaymentStatus;

// Webhook: SumoPod notification handler
export const handleSumopodWebhook = async (req, res) => {
    try {
        const headers = req.headers;
        const body = req.body;
        logger.info(`SumoPod webhook received: ${JSON.stringify(body)}`);

        const isValid = verifySumopodWebhook(headers, body);
        if (!isValid) {
            logger.warn('Invalid SumoPod webhook verification');
            return res.status(403).json({ error: 'Invalid webhook token / signature' });
        }

        // SumoPod payload could be { event: 'payment.completed', data: { order_id, status } }
        // or direct fields { order_id, status, event }
        const payloadData = body.data || body;
        const eventType = body.event || payloadData.event || '';
        const orderIdRaw = payloadData.order_id || body.order_id || '';
        const status = (payloadData.status || body.status || '').toUpperCase();

        logger.info(`SumoPod webhook event: ${eventType}, order: ${orderIdRaw}, status: ${status}`);

        const isSuccess = 
            eventType === 'payment.completed' ||
            status === 'COMPLETED' ||
            status === 'PAID' ||
            status === 'SETTLED' ||
            status === 'SUCCESS';

        if (isSuccess && orderIdRaw) {
            // Extract dbOrderId from order-123 or order-123-173000...
            const match = orderIdRaw.match(/order-(\d+)/);
            const dbOrderId = match ? match[1] : orderIdRaw;

            const conn = await db.getConnection();
            try {
                await orderModel.updatePaymentStatus(conn, dbOrderId, 'paid');
                logger.info(`Payment confirmed via SumoPod webhook for order ID: ${dbOrderId}`);
            } finally {
                conn.release();
            }
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        logger.error(`Error handling SumoPod webhook: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Webhook: Midtrans notification handler
export const handleMidtransNotification = async (req, res) => {
    const { order_id, transaction_status, fraud_status, gross_amount, status_code, signature_key } = req.body;
    logger.info(`Midtrans notification received: order=${order_id} status=${transaction_status}`);

    const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
    if (!isValid) {
        logger.warn(`Invalid Midtrans signature for order: ${order_id}`);
        return res.status(403).json({ error: 'Invalid signature' });
    }

    const dbOrderId = order_id.replace('order-', '');
    const conn = await db.getConnection();
    try {
        if (
            (transaction_status === 'settlement' || transaction_status === 'capture') &&
            fraud_status !== 'deny'
        ) {
            await orderModel.updatePaymentStatus(conn, dbOrderId, 'paid');
            logger.info(`Payment confirmed via webhook for order ID: ${dbOrderId}`);
        }
        res.json({ status: 'ok' });
    } catch (error) {
        logger.error(`Error handling Midtrans notification: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};
