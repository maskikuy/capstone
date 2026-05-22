import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'CategoriesModel' });

export const getAllCategories = async (conn, type) => {
    logger.debug(`Fetching categories from the database (type: ${type || 'all'})`);
    let sql = 'SELECT * FROM categories';
    let params = [];
    if (type) {
        sql += ' WHERE type = ?';
        params.push(type);
    }
    const [result] = await conn.execute(sql, params);
    logger.info(`Fetched ${result.length} categories`);
    return result;
}

export const getCategoryById = async (conn, categoryId) => {
    logger.debug(`Fetching category with ID: ${categoryId}`);
    const sql = 'SELECT * FROM categories WHERE id = ?';
    const [result] = await conn.execute(sql, [categoryId]);
    if (result.length === 0) {
        logger.warn(`No category found with ID: ${categoryId}`);
        return null;
    }
    logger.info(`Category found: ${JSON.stringify(result[0])}`);
    return result[0];
}

export const createCategory = async (conn, categoryData) => {
    logger.debug(`Creating new category with data: ${JSON.stringify(categoryData)}`);
    const sql = 'INSERT INTO categories (name, type) VALUES (?, ?)';
    const [result] = await conn.execute(sql, [categoryData.name, categoryData.type || 'menu']);
    logger.info(`Category created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateCategory = async (conn, categoryId, categoryData) => {
    logger.debug(`Updating category with ID: ${categoryId} with data: ${JSON.stringify(categoryData)}`);
    const sql = 'UPDATE categories SET name = ?, type = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [categoryData.name, categoryData.type || 'menu', categoryId]);
    if (result.affectedRows === 0) {
        logger.warn(`No category found to update with ID: ${categoryId}`);
        return false;
    }
    logger.info(`Category with ID: ${categoryId} updated successfully`);
    return true;
}

export const deleteCategory = async (conn, categoryId) => {
    logger.debug(`Deleting category with ID: ${categoryId}`);
    const sql = 'DELETE FROM categories WHERE id = ?';
    const [result] = await conn.execute(sql, [categoryId]);
    if (result.affectedRows === 0) {
        logger.warn(`No category found to delete with ID: ${categoryId}`);
        return false;
    }
    logger.info(`Category with ID: ${categoryId} deleted successfully`);
    return true;
}