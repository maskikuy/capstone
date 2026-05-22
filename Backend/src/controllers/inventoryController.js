import db from '../config/database.js';
import * as inventoryModel from '../models/inventoryModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'InventoryController' });

export const getAllInventories = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const items = await inventoryModel.getAllInventories(conn);
        res.status(200).json(items);
    } catch (error) {
        logger.error(`Error fetching inventories: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export const getInventoryById = async (req, res) => {
    const id = req.params.id;
    const conn = await db.getConnection();
    try {
        const item = await inventoryModel.getInventoryById(conn, id);
        if (!item) return res.status(404).json({ error: 'Inventory Not Found' });
        res.status(200).json(item);
    } catch (error) {
        logger.error(`Error fetching inventory ${id}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export const createInventory = async (req, res) => {
    const data = req.body;
    data.real_stock = Number(data.stock_available) || 0;
    if (data.price_type === 'grosir') {
        data.grosir_min_qty = Math.max(5, Number(data.grosir_min_qty) || 5);
        if (!data.grosir_price_per_unit || Number(data.grosir_price_per_unit) <= 0) {
            data.grosir_price_per_unit = Math.max(0, Number(data.selling_price || 0) - 2000);
        }
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const id = await inventoryModel.createInventory(conn, data);
        await conn.commit();
        res.status(201).json({ id });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating inventory: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export const updateInventory = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    data.real_stock = Number(data.stock_available) || 0;
    if (data.price_type === 'grosir') {
        data.grosir_min_qty = Math.max(5, Number(data.grosir_min_qty) || 5);
        if (!data.grosir_price_per_unit || Number(data.grosir_price_per_unit) <= 0) {
            data.grosir_price_per_unit = Math.max(0, Number(data.selling_price || 0) - 2000);
        }
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const updated = await inventoryModel.updateInventory(conn, id, data);
        if (!updated) {
            await conn.rollback();
            return res.status(404).json({ error: 'Inventory Not Found' });
        }
        await conn.commit();
        res.status(200).json({ message: 'Inventory Updated' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating inventory ${id}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export const deleteInventory = async (req, res) => {
    const id = req.params.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const deleted = await inventoryModel.deleteInventory(conn, id);
        if (!deleted) {
            await conn.rollback();
            return res.status(404).json({ error: 'Inventory Not Found' });
        }
        await conn.commit();
        res.status(200).json({ message: 'Inventory Deleted' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting inventory ${id}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export const getLowStock = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const rows = await inventoryModel.markLowStockFlags(conn);
        res.status(200).json(rows);
    } catch (error) {
        logger.error(`Error checking low stock: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}

export default {
    getAllInventories,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getLowStock
}
