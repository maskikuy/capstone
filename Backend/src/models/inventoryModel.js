import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'InventoryModel' });

export const getAllInventories = async (conn) => {
    logger.debug('Fetching all inventories');
    const sql = 'SELECT * FROM inventories ORDER BY name ASC';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} inventory items`);
    return result;
}

export const getInventoryById = async (conn, id) => {
    logger.debug(`Fetching inventory with ID: ${id}`);
    const sql = 'SELECT * FROM inventories WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.length === 0) return null;
    return result[0];
}

export const createInventory = async (conn, data) => {
    logger.debug(`Creating inventory: ${JSON.stringify(data)}`);
    const sql = `INSERT INTO inventories
        (name, category_id, selling_price, initial_cost, price_type, retail_price_per_unit, grosir_price_per_unit, grosir_min_qty, stock_available, stock_unit, low_stock_threshold, warehouse_stock, real_stock, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [data.name, data.category_id || null, data.selling_price || 0, data.initial_cost || 0, data.price_type || 'retail', data.retail_price_per_unit || 0, data.grosir_price_per_unit || 0, data.grosir_min_qty || 0, data.stock_available || 0, data.stock_unit || 'pcs', data.low_stock_threshold || 0, data.warehouse_stock || 0, data.real_stock || 0, data.is_available == null ? true : data.is_available];
    const [result] = await conn.execute(sql, params);
    logger.info(`Inventory created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateInventory = async (conn, id, data) => {
    logger.debug(`Updating inventory ${id}: ${JSON.stringify(data)}`);
    const sql = `UPDATE inventories SET name = ?, category_id = ?, selling_price = ?, initial_cost = ?, price_type = ?, retail_price_per_unit = ?, grosir_price_per_unit = ?, grosir_min_qty = ?, stock_available = ?, stock_unit = ?, low_stock_threshold = ?, warehouse_stock = ?, real_stock = ?, is_available = ? WHERE id = ?`;
    const params = [data.name, data.category_id || null, data.selling_price || 0, data.initial_cost || 0, data.price_type || 'retail', data.retail_price_per_unit || 0, data.grosir_price_per_unit || 0, data.grosir_min_qty || 0, data.stock_available || 0, data.stock_unit || 'pcs', data.low_stock_threshold || 0, data.warehouse_stock || 0, data.real_stock || 0, data.is_available == null ? true : data.is_available, id];
    const [result] = await conn.execute(sql, params);
    if (result.affectedRows === 0) return false;
    logger.info(`Inventory ${id} updated`);
    return true;
}

export const deleteInventory = async (conn, id) => {
    logger.debug(`Deleting inventory with ID: ${id}`);
    const sql = 'DELETE FROM inventories WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) return false;
    logger.info(`Inventory ${id} deleted`);
    return true;
}

export const markLowStockFlags = async (conn) => {
    // Example helper: return rows that are low
    logger.debug('Checking low stock items');
    const sql = 'SELECT id, name, stock_available, low_stock_threshold FROM inventories WHERE stock_available <= low_stock_threshold';
    const [result] = await conn.execute(sql);
    return result;
}

export default {
    getAllInventories,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    markLowStockFlags
}
