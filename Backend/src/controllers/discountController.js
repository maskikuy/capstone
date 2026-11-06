import db from '../config/database.js';
import * as discountModel from '../models/discountModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'DiscountController' });

export const getAllDiscounts = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const activeOnly = String(req.query.active) === 'true';
        const discounts = await discountModel.getAllDiscounts(conn, activeOnly);
        res.status(200).json(discounts);
    } catch (error) {
        logger.error(`Error fetching discounts: ${error.message}`);
        res.status(500).json({ error: `Gagal query diskon: ${error.message}` });
    } finally {
        if (conn) conn.release();
    }
};

export const getDiscountById = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        const discount = await discountModel.getDiscountById(conn, id);
        if (!discount) {
            return res.status(404).json({ error: 'Diskon tidak ditemukan' });
        }
        res.status(200).json(discount);
    } catch (error) {
        logger.error(`Error fetching discount by ID ${id}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const createDiscount = async (req, res) => {
    const { name, type, value, min_order, max_discount, is_active } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama diskon wajib diisi' });
    }

    if (value === undefined || isNaN(value) || Number(value) <= 0) {
        return res.status(400).json({ error: 'Nilai diskon harus lebih besar dari 0' });
    }

    if (type === 'percentage' && Number(value) > 100) {
        return res.status(400).json({ error: 'Persentase diskon tidak boleh melebihi 100%' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const discountId = await discountModel.createDiscount(conn, {
            name: name.trim(),
            type: type === 'fixed' ? 'fixed' : 'percentage',
            value,
            min_order,
            max_discount,
            is_active
        });
        await conn.commit();
        res.status(201).json({ id: discountId, message: 'Diskon berhasil ditambahkan' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating discount: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateDiscount = async (req, res) => {
    const { id } = req.params;
    const { name, type, value, min_order, max_discount, is_active } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama diskon wajib diisi' });
    }

    if (value === undefined || isNaN(value) || Number(value) <= 0) {
        return res.status(400).json({ error: 'Nilai diskon harus lebih besar dari 0' });
    }

    if (type === 'percentage' && Number(value) > 100) {
        return res.status(400).json({ error: 'Persentase diskon tidak boleh melebihi 100%' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const success = await discountModel.updateDiscount(conn, id, {
            name: name.trim(),
            type: type === 'fixed' ? 'fixed' : 'percentage',
            value,
            min_order,
            max_discount,
            is_active
        });
        if (!success) {
            await conn.rollback();
            return res.status(404).json({ error: 'Diskon tidak ditemukan' });
        }
        await conn.commit();
        res.status(200).json({ message: 'Diskon berhasil diperbarui' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating discount: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const toggleDiscountActive = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const success = await discountModel.toggleDiscountActive(conn, id);
        if (!success) {
            await conn.rollback();
            return res.status(404).json({ error: 'Diskon tidak ditemukan' });
        }
        await conn.commit();
        res.status(200).json({ message: 'Status diskon berhasil diubah' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error toggling discount active: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const deleteDiscount = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const success = await discountModel.deleteDiscount(conn, id);
        if (!success) {
            await conn.rollback();
            return res.status(404).json({ error: 'Diskon tidak ditemukan' });
        }
        await conn.commit();
        res.status(200).json({ message: 'Diskon berhasil dihapus' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting discount: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

