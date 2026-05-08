import db from '../config/database.js';
import * as categoriesModel from '../models/categoriesModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'CategoriesController' });

export const getAllCategories = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try{
        const categories = await categoriesModel.getAllCategories(conn);
        logger.debug('Fetching all categories');
        res.status(200).json(categories);
    } catch (error) {
        logger.error(`Error fetching all categories: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getCategoryById = async (req, res) => {
    const categoryId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const category = await categoriesModel.getCategoryById(conn, categoryId);
        if (!category) {
            logger.warn(`Category not found with ID: ${categoryId}`);
            return res.status(404).json({ error: 'Category Not Found' });
        }
        logger.debug(`Category fetched with ID: ${categoryId}`);
        res.status(200).json(category);
    } catch (error) {
        logger.error(`Error fetching category by ID ${categoryId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createCategory = async (req, res) => {
    const categoryData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const categoryId = await categoriesModel.createCategory(conn, categoryData);
        await conn.commit();
        logger.debug(`Category created with ID: ${categoryId}`);
        res.status(201).json({ id: categoryId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating category: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateCategory = async (req, res) => {
    const categoryId = req.params.id;
    const categoryData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const updated = await categoriesModel.updateCategory(conn, categoryId, categoryData);
        if (!updated) {
            logger.warn(`Category not found for update with ID: ${categoryId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Category Not Found' });
        }
        await conn.commit();
        logger.debug(`Category updated with ID: ${categoryId}`);
        res.status(200).json({ message: 'Category updated successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating category with ID ${categoryId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const deleted = await categoriesModel.deleteCategory(conn, categoryId);
        if (!deleted) {
            logger.warn(`Category not found for deletion with ID: ${categoryId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'Category Not Found' });
        }
        await conn.commit();
        logger.debug(`Category deleted with ID: ${categoryId}`);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting category with ID ${categoryId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};