import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'ProductRecipeModel' });

export const getRecipesByProductId = async (conn, productId) => {
    logger.debug(`Fetching recipes for product ID: ${productId}`);
    const sql = `
        SELECT pr.*, i.name as inventory_name, i.stock_unit, i.stock_available, i.is_available as inventory_is_available
        FROM product_recipes pr
        JOIN inventories i ON pr.inventory_id = i.id
        WHERE pr.product_id = ?
    `;
    const [rows] = await conn.execute(sql, [productId]);
    logger.info(`Fetched ${rows.length} recipe items for product ID: ${productId}`);
    return rows;
};

export const saveProductRecipes = async (conn, productId, recipes) => {
    logger.debug(`Updating recipes for product ID: ${productId}`);
    // Delete existing recipes for this product
    await conn.execute('DELETE FROM product_recipes WHERE product_id = ?', [productId]);

    if (recipes && recipes.length > 0) {
        for (const r of recipes) {
            if (r.inventory_id && Number(r.quantity_required) > 0) {
                const sql = 'INSERT INTO product_recipes (product_id, inventory_id, quantity_required) VALUES (?, ?, ?)';
                await conn.execute(sql, [productId, r.inventory_id, r.quantity_required]);
            }
        }
    }
    logger.info(`Saved recipes for product ID: ${productId}`);
    return true;
};

export const deductInventoryStockForProduct = async (conn, productId, orderQuantity) => {
    logger.debug(`Deducting inventory stock for product ID: ${productId}, order quantity: ${orderQuantity}`);
    const sql = 'SELECT * FROM product_recipes WHERE product_id = ?';
    const [recipes] = await conn.execute(sql, [productId]);

    for (const recipe of recipes) {
        const totalAmountNeeded = Number(recipe.quantity_required) * Number(orderQuantity);
        logger.info(`Deducting ${totalAmountNeeded} from inventory ID: ${recipe.inventory_id} for product ID: ${productId}`);

        // Deduct stock_available and real_stock
        const updateSql = `
            UPDATE inventories 
            SET stock_available = GREATEST(0, stock_available - ?),
                real_stock = GREATEST(0, real_stock - ?),
                is_available = IF((stock_available - ?) <= 0, 0, is_available)
            WHERE id = ?
        `;
        await conn.execute(updateSql, [totalAmountNeeded, totalAmountNeeded, totalAmountNeeded, recipe.inventory_id]);
    }
    return true;
};

export default {
    getRecipesByProductId,
    saveProductRecipes,
    deductInventoryStockForProduct
};
