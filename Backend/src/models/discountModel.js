import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'DiscountModel' });

export const ensureDiscountsTable = async (conn) => {
    await conn.query(`CREATE TABLE IF NOT EXISTS discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        min_order DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        max_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`);
};

export const getAllDiscounts = async (conn, activeOnly = false) => {
    logger.debug(`Fetching discounts from database (activeOnly: ${activeOnly})`);
    try {
        let sql = 'SELECT * FROM discounts';
        if (activeOnly) {
            sql += ' WHERE is_active = 1';
        }
        sql += ' ORDER BY created_at DESC';

        const [rows] = await conn.query(sql);
        logger.info(`Fetched ${rows.length} discounts`);
        return rows;
    } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
            logger.warn('Discounts table does not exist, creating it now...');
            await ensureDiscountsTable(conn);
            let sql = 'SELECT * FROM discounts';
            if (activeOnly) {
                sql += ' WHERE is_active = 1';
            }
            sql += ' ORDER BY created_at DESC';
            const [rows] = await conn.query(sql);
            return rows;
        }
        throw err;
    }
};

export const getDiscountById = async (conn, id) => {
    logger.debug(`Fetching discount with ID: ${id}`);
    const sql = 'SELECT * FROM discounts WHERE id = ?';
    const [rows] = await conn.execute(sql, [id]);
    if (rows.length === 0) {
        logger.warn(`No discount found with ID: ${id}`);
        return null;
    }
    return rows[0];
};

export const createDiscount = async (conn, data) => {
    logger.debug(`Creating discount with data: ${JSON.stringify(data)}`);
    await ensureDiscountsTable(conn);
    const sql = `
        INSERT INTO discounts (name, type, value, min_order, max_discount, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(sql, [
        data.name,
        data.type || 'percentage',
        parseFloat(data.value) || 0,
        parseFloat(data.min_order) || 0,
        parseFloat(data.max_discount) || 0,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ]);
    logger.info(`Discount created with ID: ${result.insertId}`);
    return result.insertId;
};

export const updateDiscount = async (conn, id, data) => {
    logger.debug(`Updating discount with ID: ${id} with data: ${JSON.stringify(data)}`);
    const sql = `
        UPDATE discounts 
        SET name = ?, type = ?, value = ?, min_order = ?, max_discount = ?, is_active = ?
        WHERE id = ?
    `;
    const [result] = await conn.execute(sql, [
        data.name,
        data.type || 'percentage',
        parseFloat(data.value) || 0,
        parseFloat(data.min_order) || 0,
        parseFloat(data.max_discount) || 0,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
        id
    ]);
    if (result.affectedRows === 0) {
        logger.warn(`No discount found to update with ID: ${id}`);
        return false;
    }
    logger.info(`Discount with ID: ${id} updated successfully`);
    return true;
};

export const toggleDiscountActive = async (conn, id) => {
    logger.debug(`Toggling active status for discount ID: ${id}`);
    const sql = 'UPDATE discounts SET is_active = NOT is_active WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) {
        logger.warn(`No discount found to toggle with ID: ${id}`);
        return false;
    }
    logger.info(`Discount with ID: ${id} active status toggled`);
    return true;
};

export const deleteDiscount = async (conn, id) => {
    logger.debug(`Deleting discount with ID: ${id}`);
    const sql = 'DELETE FROM discounts WHERE id = ?';
    const [result] = await conn.execute(sql, [id]);
    if (result.affectedRows === 0) {
        logger.warn(`No discount found to delete with ID: ${id}`);
        return false;
    }
    logger.info(`Discount with ID: ${id} deleted successfully`);
    return true;
};

