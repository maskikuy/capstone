import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'OrderModel' });

export const getAllOrders = async (conn) => {
    logger.debug('Fetching all orders from the database');
    const sql = `
        SELECT 
            o.id AS order_id, 
            o.table_number, 
            o.customer_name, 
            o.location, 
            o.subtotal,
            o.discount_id,
            o.discount_name,
            o.discount_amount,
            o.total_amount, 
            o.payment_method, 
            o.payment_status, 
            o.order_status, 
            o.created_at,
            oi.id AS item_id, 
            oi.quantity, 
            oi.price_at_order, 
            oi.notes,
            p.name AS product_name,
            oiv.id AS variant_id,
            oiv.variant_name,
            oiv.variant_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN order_item_variants oiv ON oi.id = oiv.order_item_id
        ORDER BY o.created_at DESC, oi.id ASC
    `;
    const [rows] = await conn.execute(sql);
    const ordersMap = new Map();

    for (const row of rows) {
        if (!ordersMap.has(row.order_id)) {
            ordersMap.set(row.order_id, {
                id: row.order_id,
                table_number: row.table_number,
                customer_name: row.customer_name,
                location: row.location,
                subtotal: row.subtotal || row.total_amount,
                discount_id: row.discount_id,
                discount_name: row.discount_name,
                discount_amount: parseFloat(row.discount_amount) || 0,
                total_amount: row.total_amount,
                payment_method: row.payment_method,
                payment_status: row.payment_status,
                order_status: row.order_status,
                created_at: row.created_at,
                items: [] 
            });
        }

        const order = ordersMap.get(row.order_id);

        if (row.item_id) {
            let item = order.items.find(i => i.id === row.item_id);

            if (!item) {
                item = {
                    id: row.item_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price_at_order: row.price_at_order,
                    notes: row.notes,
                    variants: [] 
                };
                order.items.push(item);
            }

            if (row.variant_id) {
                item.variants.push({
                    id: row.variant_id,
                    variant_name: row.variant_name,
                    variant_price: row.variant_price
                });
            }
        }
    }

    const result = Array.from(ordersMap.values());
    logger.info(`Fetched ${result.length} orders`);
    return result;
}

export const getOrderById = async (conn, orderId) => {
    logger.debug(`Fetching order with ID: ${orderId}`);
    const sql = `
        SELECT 
            o.id AS order_id, 
            o.table_number, 
            o.customer_name, 
            o.location, 
            o.subtotal,
            o.discount_id,
            o.discount_name,
            o.discount_amount,
            o.total_amount, 
            o.payment_method, 
            o.payment_status, 
            o.order_status, 
            o.created_at,
            oi.id AS item_id, 
            oi.quantity, 
            oi.price_at_order, 
            oi.notes,
            p.name AS product_name,
            oiv.id AS variant_id,
            oiv.variant_name,
            oiv.variant_price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN order_item_variants oiv ON oi.id = oiv.order_item_id
        WHERE o.id = ?
    `;
    const [rows] = await conn.execute(sql, [orderId]);
    const ordersMap = new Map();

    for (const row of rows) {
        if (!ordersMap.has(row.order_id)) {
            ordersMap.set(row.order_id, {
                id: row.order_id,
                table_number: row.table_number,
                customer_name: row.customer_name,
                location: row.location,
                subtotal: row.subtotal || row.total_amount,
                discount_id: row.discount_id,
                discount_name: row.discount_name,
                discount_amount: parseFloat(row.discount_amount) || 0,
                total_amount: row.total_amount,
                payment_method: row.payment_method,
                payment_status: row.payment_status,
                order_status: row.order_status,
                created_at: row.created_at,
                items: [] 
            });
        }

        const order = ordersMap.get(row.order_id);

        if (row.item_id) {
            let item = order.items.find(i => i.id === row.item_id);

            if (!item) {
                item = {
                    id: row.item_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price_at_order: row.price_at_order,
                    notes: row.notes,
                    variants: [] 
                };
                order.items.push(item);
            }

            if (row.variant_id) {
                item.variants.push({
                    id: row.variant_id,
                    variant_name: row.variant_name,
                    variant_price: row.variant_price
                });
            }
        }
    }
    const result = Array.from(ordersMap.values());
    logger.info(`Order found: ${JSON.stringify(result[0])}`);
    return result;
}

export const createOrder = async (conn, orderData) => {
    logger.debug(`Creating new order with data: ${JSON.stringify(orderData)}`);
    const sql = `
        INSERT INTO orders (
            table_number, customer_name, location, 
            subtotal, discount_id, discount_name, discount_amount, total_amount, 
            payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const subtotal = orderData.subtotal !== undefined && orderData.subtotal !== null ? orderData.subtotal : orderData.total_amount;
    const discountId = orderData.discount_id || null;
    const discountName = orderData.discount_name || null;
    const discountAmount = parseFloat(orderData.discount_amount) || 0;

    const [result] = await conn.execute(sql, [
        orderData.table_number, 
        orderData.customer_name, 
        orderData.location, 
        subtotal,
        discountId,
        discountName,
        discountAmount,
        orderData.total_amount, 
        orderData.payment_method, 
        orderData.payment_status, 
        orderData.order_status
    ]);
    logger.info(`Order created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateOrder = async (conn, orderId, orderData) => {
    logger.debug(`Updating order with ID: ${orderId} with data: ${JSON.stringify(orderData)}`);
    const sql = 'UPDATE orders SET table_number = ?, customer_name = ?, location = ?, total_amount = ?, payment_method = ?, payment_status = ?, order_status = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [orderData.table_number, orderData.customer_name, orderData.location, orderData.total_amount, orderData.payment_method, orderData.payment_status, orderData.order_status, orderId]);
    if (result.affectedRows === 0) {
        logger.warn(`No order found to update with ID: ${orderId}`);
        return false;
    }
    logger.info(`Order with ID: ${orderId} updated successfully`);
    return true;
}

export const deleteOrder = async (conn, orderId) => {
    logger.debug(`Deleting order with ID: ${orderId}`);
    const sql = 'DELETE FROM orders WHERE id = ?';
    const [result] = await conn.execute(sql, [orderId]);
    if (result.affectedRows === 0) {
        logger.warn(`No order found to delete with ID: ${orderId}`);
        return false;
    }
    logger.info(`Order with ID: ${orderId} deleted successfully`);
    return true;
}

export const updateOrderStatus = async (conn, orderId, status) => {
    logger.debug(`Updating order status for ID: ${orderId} to status: ${status}`);
    const sql = 'UPDATE orders SET order_status = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [status, orderId]);
    if (result.affectedRows === 0) {
        logger.warn(`No order found to update status with ID: ${orderId}`);
        return false;
    }
    logger.info(`Order status for ID: ${orderId} updated to ${status}`);
    return true;
}

export const updatePaymentStatus = async (conn, orderId, status) => {
    logger.debug(`Updating payment status for ID: ${orderId} to status: ${status}`);
    const sql = 'UPDATE orders SET payment_status = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [status, orderId]);
    if (result.affectedRows === 0) {
        logger.warn(`No order found to update payment status with ID: ${orderId}`);
        return false;
    }
    logger.info(`Payment status for ID: ${orderId} updated to ${status}`);
    return true;
}

export const saveMidtransInfo = async (conn, orderId, midtransOrderId, midtransTransactionId, qrisImage) => {
    logger.debug(`Saving Midtrans info for order ID: ${orderId}`);
    const sql = 'UPDATE orders SET midtrans_order_id = ?, midtrans_transaction_id = ?, qris_image = ? WHERE id = ?';
    await conn.execute(sql, [midtransOrderId, midtransTransactionId || null, qrisImage || null, orderId]);
    logger.info(`Midtrans info saved for order ID: ${orderId}`);
};

export const saveSumopodInfo = async (conn, orderId, sumopodPaymentId, qrisImage, paymentLinkUrl) => {
    logger.debug(`Saving SumoPod payment info for order ID: ${orderId}`);
    // Also save sumopodPaymentId into midtrans_order_id as fallback so legacy queries still work
    const sql = 'UPDATE orders SET sumopod_payment_id = ?, midtrans_order_id = ?, qris_image = ?, payment_link_url = ? WHERE id = ?';
    await conn.execute(sql, [sumopodPaymentId || null, sumopodPaymentId || null, qrisImage || null, paymentLinkUrl || null, orderId]);
    logger.info(`SumoPod payment info saved for order ID: ${orderId}`);
};

export const getOrderStatus = async (conn, orderId) => {
    logger.debug(`Fetching order status for ID: ${orderId}`);
    const sql = 'SELECT order_status, payment_status FROM orders WHERE id = ?';
    const [result] = await conn.execute(sql, [orderId]);
    if (result.length === 0) {
        logger.warn(`No order found with ID: ${orderId}`);
        return null;
    }
    logger.info(`Order status for ID: ${orderId} is ${result[0].order_status}, payment status is ${result[0].payment_status}`);
    return result[0];
}