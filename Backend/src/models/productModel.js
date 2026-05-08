import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'ProductModel' });

export const getAllProducts = async (conn) => {
    logger.debug('Fetching all products from the database');
    const sql = 'SELECT * FROM products ORDER BY name ASC';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} products`);
    return result;
}

export const getProductById = async (conn, productId) => {
    logger.debug(`Fetching product with ID: ${productId}`);
    const sql = 'SELECT * FROM products WHERE id = ?';
    const [result] = await conn.execute(sql, [productId]);
    if (result.length === 0) {
        logger.warn(`No product found with ID: ${productId}`);
        return null;
    }
    logger.info(`Product found: ${JSON.stringify(result[0])}`);
    return result[0];
}

export const createProduct = async (conn, productData) => {
    logger.debug(`Creating new product with data: ${JSON.stringify(productData)}`);
    const sql = 'INSERT INTO products (category_id, name, description, base_price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await conn.execute(sql, [productData.category_id, productData.name, productData.description, productData.base_price, productData.image_url, productData.is_available]);
    logger.info(`Product created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateProduct = async (conn, productId, productData) => {
    logger.debug(`Updating product with ID: ${productId} with data: ${JSON.stringify(productData)}`);
    const sql = 'UPDATE products SET category_id = ?, name = ?, description = ?, base_price = ?, image_url = ?, is_available = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [productData.category_id, productData.name, productData.description, productData.base_price, productData.image_url, productData.is_available, productId]);
    if (result.affectedRows === 0) {
        logger.warn(`No product found to update with ID: ${productId}`);
        return false;
    }
    logger.info(`Product with ID: ${productId} updated successfully`);
    return true;
}

export const deleteProduct = async (conn, productId) => {
    logger.debug(`Deleting product with ID: ${productId}`);
    const sql = 'DELETE FROM products WHERE id = ?';
    const [result] = await conn.execute(sql, [productId]);
    if (result.affectedRows === 0) {
        logger.warn(`No product found to delete with ID: ${productId}`);
        return false;
    }
    logger.info(`Product with ID: ${productId} deleted successfully`);
    return true;
}

export const updateProductAvailability = async (conn, productId, isAvailable) => {
    logger.debug(`Updating availability of product with ID: ${productId} to ${isAvailable}`);
    const sql = 'UPDATE products SET is_available = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [isAvailable, productId]);
    if (result.affectedRows === 0) {
        logger.warn(`No product found to update availability with ID: ${productId}`);
        return false;
    }
    logger.info(`Product with ID: ${productId} availability updated to ${isAvailable}`);
    return true;
}