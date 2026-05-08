import db from '../config/database.js';
import * as userModel from '../models/userModel.js';
import baseLogger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const logger = baseLogger.child({ context: 'UserController' });

export const getAllUsers = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        const users = await userModel.getAllUsers(conn);
        logger.debug('Fetching all users');
        res.status(200).json(users);
    } catch (error) {
        logger.error(`Error fetching all users: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const getUserById = async (req, res) => {
    const userId = req.params.id;
    const conn = await db.getConnection();
    logger.debug(`Database connection established`);
    try {
        const user = await userModel.getUserById(conn, userId);
        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            return res.status(404).json({ error: 'User Not Found' });
        }
        logger.debug(`User fetched with ID: ${userId}`);
        res.status(200).json(user);
    } catch (error) {
        logger.error(`Error fetching user by ID ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const createUser = async (req, res) => {
    const userData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        userData.password = await bcrypt.hash(userData.password, 10);
        logger.debug('User password hashed');
        const userId = await userModel.createUser(conn, userData);
        await conn.commit();
        logger.debug(`User created with ID: ${userId}`);
        res.status(201).json({ id: userId });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error creating user: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const updateUser = async (req, res) => {
    const userId = req.params.id;
    const userData = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    await conn.beginTransaction();
    try {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
            logger.debug('User password hashed for update');
        }
        const success = await userModel.updateUser(conn, userId, userData);
        if (!success) {
            logger.warn(`User not found to update with ID: ${userId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'User Not Found' });
        }
        await conn.commit();
        logger.debug(`User updated with ID: ${userId}`);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating user with ID ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};

export const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const conn = await db.getConnection();
    logger.debug('Database connection established');
    try {
        await conn.beginTransaction();
        const success = await userModel.deleteUser(conn, userId);
        if (!success) {
            logger.warn(`User not found to delete with ID: ${userId}`);
            await conn.rollback();
            return res.status(404).json({ error: 'User Not Found' });
        }
        await conn.commit();
        logger.debug(`User deleted with ID: ${userId}`);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error deleting user with ID ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
        logger.debug('Database connection released');
    }
};