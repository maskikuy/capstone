import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'InventoryModel' });

export const getAllInventories = async (conn) => {
    logger.debug('Fetching all inventories');
    const sql = 'SELECT * FROM inventories ORDER BY name ASC';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} inventory items`);
    return result;
};

export const getInventoryById = async (conn, id) => {
    logger.debug(`Fetching inventory with ID: ${id}`);
    const sql = 'SELECT * FROM inventories WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.length === 0) return null;
    return result[0];
};

export const createInventory = async (conn, data) => {
    logger.debug(`Creating inventory: ${JSON.stringify(data)}`);
    const isAvailable = (data.is_available === 1 || data.is_available === true || data.is_available === 'true' || data.is_available === '1') ? 1 : 0;
    const sql = `INSERT INTO inventories
        (name, category_id, selling_price, initial_cost, price_type, retail_price_per_unit, grosir_price_per_unit, grosir_min_qty, stock_available, stock_unit, low_stock_threshold, warehouse_stock, real_stock, is_available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        data.name,
        data.category_id ? Number(data.category_id) : null,
        Number(data.selling_price) || 0,
        Number(data.initial_cost) || 0,
        data.price_type || 'bahan_baku',
        Number(data.retail_price_per_unit) || 0,
        Number(data.grosir_price_per_unit) || 0,
        Number(data.grosir_min_qty) || 0,
        Number(data.stock_available) || 0,
        data.stock_unit || 'pcs',
        Number(data.low_stock_threshold) || 0,
        Number(data.warehouse_stock) || 0,
        Number(data.real_stock) || 0,
        isAvailable
    ];
    const [result] = await conn.execute(sql, params);
    logger.info(`Inventory created with ID: ${result.insertId}`);
    return result.insertId;
};

export const updateInventory = async (conn, id, data) => {
    logger.debug(`Updating inventory ${id}: ${JSON.stringify(data)}`);
    const isAvailable = (data.is_available === 1 || data.is_available === true || data.is_available === 'true' || data.is_available === '1') ? 1 : 0;
    const sql = `UPDATE inventories SET name = ?, category_id = ?, selling_price = ?, initial_cost = ?, price_type = ?, retail_price_per_unit = ?, grosir_price_per_unit = ?, grosir_min_qty = ?, stock_available = ?, stock_unit = ?, low_stock_threshold = ?, warehouse_stock = ?, real_stock = ?, is_available = ? WHERE id = ?`;
    const params = [
        data.name,
        data.category_id ? Number(data.category_id) : null,
        Number(data.selling_price) || 0,
        Number(data.initial_cost) || 0,
        data.price_type || 'bahan_baku',
        Number(data.retail_price_per_unit) || 0,
        Number(data.grosir_price_per_unit) || 0,
        Number(data.grosir_min_qty) || 0,
        Number(data.stock_available) || 0,
        data.stock_unit || 'pcs',
        Number(data.low_stock_threshold) || 0,
        Number(data.warehouse_stock) || 0,
        Number(data.real_stock) || 0,
        isAvailable,
        id
    ];
    const [result] = await conn.execute(sql, params);
    if (result.affectedRows === 0) return false;
    logger.info(`Inventory ${id} updated`);
    return true;
};

export const deleteInventory = async (conn, id) => {
    logger.debug(`Deleting inventory with ID: ${id}`);
    const sql = 'DELETE FROM inventories WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) return false;
    logger.info(`Inventory ${id} deleted`);
    return true;
};

export const getLowStock = async (conn) => {
    logger.debug('Fetching low stock inventories');
    const sql = 'SELECT id, name, stock_available, low_stock_threshold FROM inventories WHERE stock_available <= low_stock_threshold';
    const [result] = await conn.execute(sql);
    logger.info(`Found ${result.length} low stock inventory items`);
    return result;
};
