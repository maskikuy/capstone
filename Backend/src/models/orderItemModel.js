import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'OrderItemModel' });

export const getAllOrderItems = async (conn) => {
    logger.debug('Fetching all order items from the database');
    const sql = 'SELECT * FROM order_items';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} order items`);
    return result;
}

export const getOrderItemById = async (conn, id) => {
    logger.debug(`Fetching order item with ID: ${id}`);
    const sql = 'SELECT * FROM order_items WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.length === 0) {
        logger.warn(`No order item found with ID: ${id}`);
        return null;
    }
    logger.info(`Fetched order item with ID: ${id}`);
    return result[0];
}

export const createOrderItem = async (conn, orderItem) => {
    logger.debug(`Creating a new order item with data: ${JSON.stringify(orderItem)}`);
    const sql = 'INSERT INTO order_items (order_id, product_id, quantity, price_at_order, notes) VALUES (?, ?, ?, ?, ?)';
    const [result] = await conn.execute(sql, [orderItem.order_id, orderItem.product_id, orderItem.quantity, orderItem.price_at_order, orderItem.notes]);
    logger.info(`Created new order item with ID: ${result.insertId}`);
    return { id: result.insertId, ...orderItem };
}

export const updateOrderItem = async (conn, id, orderItem) => {
    logger.debug(`Updating order item with ID: ${id} with data: ${JSON.stringify(orderItem)}`);
    const sql = 'UPDATE order_items SET order_id = ?, product_id = ?, quantity = ?, price_at_order = ?, notes = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [orderItem.order_id, orderItem.product_id, orderItem.quantity, orderItem.price_at_order, orderItem.notes, id]);
    if (result.affectedRows === 0) {
        logger.warn(`No order item found to update with ID: ${id}`);
        return null;
    }
    logger.info(`Updated order item with ID: ${id}`);
    return { id, ...orderItem };
}

export const deleteOrderItem = async (conn, id) => {
    logger.debug(`Deleting order item with ID: ${id}`);
    const sql = 'DELETE FROM order_items WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) {
        logger.warn(`No order item found to delete with ID: ${id}`);
        return false;
    }
    logger.info(`Deleted order item with ID: ${id}`);
    return true;
}