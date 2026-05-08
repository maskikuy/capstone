import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'OrderItemVariantModel' });

export const getAllOrderItemVariants = async (conn) => {
    logger.debug('Fetching all order item variants from the database');
    const sql = 'SELECT * FROM order_item_variants';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} order item variants`);
    return result;
}

export const getOrderItemVariantById = async (conn, id) => {
    logger.debug(`Fetching order item variant with ID: ${id}`);
    const sql = 'SELECT * FROM order_item_variants WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.length === 0) {
        logger.warn(`No order item variant found with ID: ${id}`);
        return null;
    }
    logger.info(`Fetched order item variant with ID: ${id}`);
    return result[0];
}

export const createOrderItemVariant = async (conn, orderItemVariant) => {
    logger.debug(`Creating a new order item variant with data: ${JSON.stringify(orderItemVariant)}`);
    const sql = 'INSERT INTO order_item_variants (order_item_id, variant_name, variant_price) VALUES (?, ?, ?)';
    const [result] = await conn.execute(sql, [orderItemVariant.order_item_id, orderItemVariant.variant_name, orderItemVariant.variant_price]);
    logger.info(`Created new order item variant with ID: ${result.insertId}`);
    return { id: result.insertId, ...orderItemVariant };
}

export const updateOrderItemVariant = async (conn, id, orderItemVariant) => {
    logger.debug(`Updating order item variant with ID: ${id} with data: ${JSON.stringify(orderItemVariant)}`);
    const sql = 'UPDATE order_item_variants SET order_item_id = ?, variant_name = ?, variant_price = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [orderItemVariant.order_item_id, orderItemVariant.variant_name, orderItemVariant.variant_price, id]);
    if (result.affectedRows === 0) {
        logger.warn(`No order item variant found to update with ID: ${id}`);
        return null;
    }
    logger.info(`Updated order item variant with ID: ${id}`);
    return { id, ...orderItemVariant };
}

export const deleteOrderItemVariant = async (conn, id) => {
    logger.debug(`Deleting order item variant with ID: ${id}`);
    const sql = 'DELETE FROM order_item_variants WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) {
        logger.warn(`No order item variant found to delete with ID: ${id}`);
        return false;
    }
    logger.info(`Deleted order item variant with ID: ${id}`);
    return true;
}