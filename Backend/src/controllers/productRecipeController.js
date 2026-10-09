import db from '../config/database.js';
import * as productRecipeModel from '../models/productRecipeModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'ProductRecipeController' });

export const getRecipesByProductId = async (req, res) => {
    const productId = req.params.productId;
    const conn = await db.getConnection();
    try {
        const recipes = await productRecipeModel.getRecipesByProductId(conn, productId);
        res.status(200).json(recipes);
    } catch (error) {
        logger.error(`Error fetching recipes for product ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const saveProductRecipes = async (req, res) => {
    const productId = req.params.productId;
    const { recipes } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await productRecipeModel.saveProductRecipes(conn, productId, recipes);
        await conn.commit();
        res.status(200).json({ message: 'Resep produk berhasil disimpan' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error saving recipes for product ID ${productId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};
