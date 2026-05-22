import db from '../config/database.js';
import baseLogger from './logger.js';

const logger = baseLogger.child({ module: 'InitDB' });

export const ensureInventoryTable = async () => {
    const createSql = `CREATE TABLE IF NOT EXISTS inventories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category_id INT DEFAULT NULL,
        selling_price DECIMAL(10,2) DEFAULT 0,
        initial_cost DECIMAL(10,2) DEFAULT 0,
        price_type ENUM('retail','grosir') DEFAULT 'retail',
        retail_price_per_unit DECIMAL(10,2) DEFAULT 0,
        grosir_price_per_unit DECIMAL(10,2) DEFAULT 0,
        grosir_min_qty INT DEFAULT 0,
        stock_available DECIMAL(12,3) DEFAULT 0,
        stock_unit ENUM('gram','pcs') DEFAULT 'pcs',
        low_stock_threshold DECIMAL(12,3) DEFAULT 0,
        warehouse_stock DECIMAL(12,3) DEFAULT 0,
        real_stock DECIMAL(12,3) DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );`;

    const conn = await db.getConnection();
    try {
        await conn.query(createSql);
        logger.info('Ensured inventories table exists');

        // Insert seed data only if table is empty
        const [rows] = await conn.query('SELECT COUNT(*) as c FROM inventories');
        if (rows && rows[0] && Number(rows[0].c) === 0) {
            const insertSql = `INSERT INTO inventories (name, category_id, selling_price, initial_cost, price_type, retail_price_per_unit, grosir_price_per_unit, grosir_min_qty, stock_available, stock_unit, low_stock_threshold, warehouse_stock, real_stock, is_available) VALUES ?`;
            const values = [
                ['Beras Premium 5kg', null, 50000.00, 35000.00, 'retail', 50000.00, 45000.00, 0, 20.000, 'pcs', 2.000, 30.000, 20.000, 1],
                ['Gula Pasir 1kg', null, 12000.00, 8000.00, 'retail', 12000.00, 10000.00, 0, 50.000, 'pcs', 5.000, 50.000, 50.000, 1],
                ['Minyak Goreng 2L', null, 30000.00, 20000.00, 'retail', 30000.00, 28000.00, 0, 15.000, 'pcs', 3.000, 20.000, 15.000, 1],
                ['Cabe Merah (per 100g)', null, 8000.00, 5000.00, 'retail', 8000.00, 7000.00, 0, 200.000, 'gram', 50.000, 250.000, 200.000, 1],
                ['Telur Ayam (per lusin)', null, 30000.00, 20000.00, 'grosir', 30000.00, 25000.00, 10, 40.000, 'pcs', 5.000, 60.000, 40.000, 1],
                ['Tepung Terigu 1kg', null, 15000.00, 10000.00, 'retail', 15000.00, 14000.00, 0, 35.000, 'pcs', 4.000, 40.000, 35.000, 1]
            ];
            await conn.query(insertSql, [values]);
            logger.info('Inserted seed inventories');
        }
        // Sinkronisasi data lama: jika ada item dengan stock_available <= 0 namun is_available masih true, ubah menjadi false
        const syncResult = await conn.query('UPDATE inventories SET is_available = 0 WHERE stock_available <= 0 AND is_available = 1');
        logger.info(`Synced existing inventory stock statuses: updated ${syncResult[0]?.affectedRows || 0} rows`);
    } catch (err) {
        logger.error(`Failed ensuring inventories table: ${err.message}`);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

export default { ensureInventoryTable };
