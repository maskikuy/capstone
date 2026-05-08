import baseLogger from '../utils/logger.js';

const Logger = baseLogger.child({ context: 'ProductVariantModel' });

export const getAllProductVariants = async (conn) => {
    Logger.debug('Fetching all product variants from the database');
    const sql = 'SELECT * FROM product_variants';
    const [result] = await conn.execute(sql);
    Logger.info(`Fetched ${result.length} product variants`);
    return result;
}

export const getProductVariantById = async (conn, variantId) => {
    Logger.debug(`Fetching product variant with ID: ${variantId}`);
    const sql = 'SELECT * FROM product_variants WHERE id = ?';
    const [result] = await conn.execute(sql, [variantId]);
    if (result.length === 0) {
        Logger.warn(`No product variant found with ID: ${variantId}`);
        return null;
    }
    Logger.info(`Product variant found: ${JSON.stringify(result[0])}`);
    return result[0];
}

export const createProductVariant = async (conn, variantData) => {
    Logger.debug(`Creating new product variant with data: ${JSON.stringify(variantData)}`);
    const sql = 'INSERT INTO product_variants (product_id, name, extra_price) VALUES (?, ?, ?)';
    const [result] = await conn.execute(sql, [variantData.product_id, variantData.name, variantData.extra_price]);
    Logger.info(`Product variant created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateProductVariant = async (conn, variantId, variantData) => {
    Logger.debug(`Updating product variant with ID: ${variantId} with data: ${JSON.stringify(variantData)}`);
    const sql = 'UPDATE product_variants SET product_id = ?, name = ?, extra_price = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [variantData.product_id, variantData.name, variantData.extra_price, variantId]);
    if (result.affectedRows === 0) {
        Logger.warn(`No product variant found to update with ID: ${variantId}`);
        return false;
    }
    Logger.info(`Product variant with ID: ${variantId} updated successfully`);
    return true;
}

export const deleteProductVariant = async (conn, variantId) => {
    Logger.debug(`Deleting product variant with ID: ${variantId}`);
    const sql = 'DELETE FROM product_variants WHERE id = ?';
    const [result] = await conn.execute(sql, [variantId]);
    if (result.affectedRows === 0) {
        Logger.warn(`No product variant found to delete with ID: ${variantId}`);
        return false;
    }
    Logger.info(`Product variant with ID: ${variantId} deleted successfully`);
    return true;
}