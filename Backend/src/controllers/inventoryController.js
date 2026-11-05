import db from '../config/database.js';
import * as inventoryModel from '../models/inventoryModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'InventoryController' });

export const syncInventoryToProduct = async (conn, inventoryId, data, imageFilename) => {
    // Cari apakah sudah ada produk yang terhubung dengan inventory_id ini
    const [existing] = await conn.execute(
        'SELECT id, image_url, category_id FROM products WHERE inventory_id = ?',
        [inventoryId]
    );

    const isAvailable = (data.is_available && Number(data.stock_available) > 0) ? 1 : 0;
    const basePrice = Number(data.selling_price) || 0;
    const grosirPrice = data.price_type === 'grosir' ? (Number(data.grosir_price_per_unit) || 0) : 0;
    const grosirQty = data.price_type === 'grosir' ? (Number(data.grosir_min_qty) || 0) : 0;
    const imageUrl = imageFilename || (data.image_url ? data.image_url : '');

    // Tentukan category: gunakan category yg sudah ada di products jika sudah punya menu category
    // Inventory category biasanya type='inventory', bukan 'menu', jadi jangan overwrite
    let resolvedCategoryId = data.category_id ? Number(data.category_id) : null;

    let productId;
    if (existing.length > 0) {
        productId = existing[0].id;
        const currentImage = existing[0].image_url;
        const finalImage = imageUrl || currentImage || '';

        // Pertahankan category_id yang sudah ada di product jika sudah ada,
        // karena inventory category bisa beda type dengan menu category
        const existingCatId = existing[0].category_id;
        if (existingCatId) {
            const [catCheck] = await conn.execute(
                "SELECT id FROM categories WHERE id = ? AND type = 'menu'",
                [existingCatId]
            );
            if (catCheck.length > 0) {
                resolvedCategoryId = existingCatId; // Pakai yang sudah ada (menu type)
            }
        }

        const updateSql = `
            UPDATE products 
            SET name = ?, category_id = ?, base_price = ?, is_available = ?, price_type = ?, 
                grosir_price_per_unit = ?, grosir_min_qty = ?, image_url = ?
            WHERE id = ?
        `;
        await conn.execute(updateSql, [
            data.name,
            resolvedCategoryId,
            basePrice,
            isAvailable,
            data.price_type,
            grosirPrice,
            grosirQty,
            finalImage,
            productId
        ]);
        logger.info(`Synced product ID: ${productId} from inventory ID: ${inventoryId}`);
    } else {
        // Untuk produk baru: cek apakah category inventory ada di menu, kalau tidak pakai null
        const [catCheck] = await conn.execute(
            "SELECT id FROM categories WHERE id = ? AND type = 'menu'",
            [resolvedCategoryId]
        );
        const finalCatId = catCheck.length > 0 ? resolvedCategoryId : null;

        const insertSql = `
            INSERT INTO products 
            (category_id, name, description, base_price, image_url, is_available, price_type, grosir_price_per_unit, grosir_min_qty, inventory_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [res] = await conn.execute(insertSql, [
            finalCatId,
            data.name,
            data.description || `Produk ${data.name}`,
            basePrice,
            imageUrl,
            isAvailable,
            data.price_type,
            grosirPrice,
            grosirQty,
            inventoryId
        ]);
        productId = res.insertId;
        logger.info(`Created new product ID: ${productId} from inventory ID: ${inventoryId}`);
    }

    // Pastikan resep otomatis 1-to-1 dibuat di product_recipes
    // sehingga saat menu ini dibeli, stok inventori otomatis berkurang
    const [recipes] = await conn.execute(
        'SELECT id FROM product_recipes WHERE product_id = ? AND inventory_id = ?',
        [productId, inventoryId]
    );
    if (recipes.length === 0) {
        await conn.execute(
            'INSERT INTO product_recipes (product_id, inventory_id, quantity_required) VALUES (?, ?, 1.000)',
            [productId, inventoryId]
        );
        logger.info(`Created automatic 1:1 recipe for product ID: ${productId} & inventory ID: ${inventoryId}`);
    }
};

const cleanInventoryItem = (item) => {
    if (!item) return item;
    const toNum = (val) => {
        if (val === null || val === undefined) return 0;
        const n = Number(val);
        return isNaN(n) ? 0 : n;
    };
    return {
        ...item,
        selling_price: toNum(item.selling_price),
        initial_cost: toNum(item.initial_cost),
        retail_price_per_unit: toNum(item.retail_price_per_unit),
        grosir_price_per_unit: toNum(item.grosir_price_per_unit),
        grosir_min_qty: toNum(item.grosir_min_qty),
        stock_available: toNum(item.stock_available),
        warehouse_stock: toNum(item.warehouse_stock),
        low_stock_threshold: toNum(item.low_stock_threshold),
        real_stock: toNum(item.real_stock)
    };
};

export const getAllInventories = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const items = await inventoryModel.getAllInventories(conn);
        res.status(200).json(items.map(cleanInventoryItem));
    } catch (error) {
        logger.error(`Error fetching inventories: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getInventoryById = async (req, res) => {
    const id = req.params.id;
    const conn = await db.getConnection();
    try {
        const item = await inventoryModel.getInventoryById(conn, id);
        if (!item) return res.status(404).json({ error: 'Inventory Not Found' });
        res.status(200).json(cleanInventoryItem(item));
    } catch (error) {
        logger.error(`Error fetching inventory ${id}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const createInventory = async (req, res) => {
    const data = req.body;
    data.real_stock = Number(data.stock_available) || 0;
    const isAvail = (data.is_available === 'true' || data.is_available === true || data.is_available === 1 || data.is_available === '1' || data.is_available === 'on');
    data.is_available = (isAvail && data.real_stock > 0) ? 1 : 0;

    if (data.price_type === 'grosir') {
        data.grosir_min_qty = Math.max(5, Number(data.grosir_min_qty) || 5);
        if (!data.grosir_price_per_unit || Number(data.grosir_price_per_unit) <= 0) {
            data.grosir_price_per_unit = Math.max(0, Number(data.selling_price || 0) - 2000);
        }
    } else if (data.price_type === 'bahan_baku') {
        data.selling_price = 0;
        data.grosir_price_per_unit = 0;
        data.grosir_min_qty = 0;
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const id = await inventoryModel.createInventory(conn, data);

        // Jika retail atau grosir, otomatis muncul di penjualan (tabel products)
        if (data.price_type === 'retail' || data.price_type === 'grosir') {
            await syncInventoryToProduct(conn, id, data, req.file ? req.file.filename : null);
        }

        await conn.commit();
        res.status(201).json({ id });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating inventory: ${error.message}`);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateInventory = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    data.real_stock = Number(data.stock_available) || 0;
    const isAvail = (data.is_available === 'true' || data.is_available === true || data.is_available === 1 || data.is_available === '1' || data.is_available === 'on');
    data.is_available = (isAvail && data.real_stock > 0) ? 1 : 0;

    if (data.price_type === 'grosir') {
        data.grosir_min_qty = Math.max(5, Number(data.grosir_min_qty) || 5);
        if (!data.grosir_price_per_unit || Number(data.grosir_price_per_unit) <= 0) {
            data.grosir_price_per_unit = Math.max(0, Number(data.selling_price || 0) - 2000);
        }
    } else if (data.price_type === 'bahan_baku') {
        data.selling_price = 0;
        data.grosir_price_per_unit = 0;
        data.grosir_min_qty = 0;
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const updated = await inventoryModel.updateInventory(conn, id, data);
        if (!updated) {
            await conn.rollback();
            return res.status(404).json({ error: 'Inventory Not Found' });
        }

        if (data.price_type === 'retail' || data.price_type === 'grosir') {
            await syncInventoryToProduct(conn, id, data, req.file ? req.file.filename : null);
        } else if (data.price_type === 'bahan_baku') {
            // Jika diubah menjadi bahan baku, hapus dari tabel products (penjualan)
            await conn.execute('DELETE FROM products WHERE inventory_id = ?', [id]);
            logger.info(`Removed product from sales for inventory ID: ${id} because it was changed to bahan_baku`);
        }

        await conn.commit();
        res.status(200).json({ message: 'Inventory Updated' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating inventory ${id}: ${error.message}`);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const deleteInventory = async (req, res) => {
    const id = req.params.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // Hapus produk penjualan yang terhubung dengan inventori ini
        await conn.execute('DELETE FROM products WHERE inventory_id = ?', [id]);

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
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getLowStock = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const items = await inventoryModel.getLowStock(conn);
        res.status(200).json(items);
    } catch (error) {
        logger.error(`Error fetching low stock: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};
