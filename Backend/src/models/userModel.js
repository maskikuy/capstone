import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'UserModel' });

export const getAllUsers = async (conn) => {
    logger.debug('Fetching all users from the database');
    const sql = 'SELECT * FROM users';
    const [result] = await conn.execute(sql);
    logger.info(`Fetched ${result.length} users`);
    return result;
}

export const getUserById = async (conn, userId) => {
    logger.debug(`Fetching user with ID: ${userId}`);
    const sql = 'SELECT * FROM users WHERE id = ?';
    const [result] = await conn.execute(sql, [userId]);
    if (result.length === 0) {
        logger.warn(`No user found with ID: ${userId}`);
        return null;
    }
    logger.info(`User found: ${JSON.stringify(result[0])}`);
    return result[0];
}

export const createUser = async (conn, userData) => {
    logger.debug(`Creating new user with data: ${JSON.stringify(userData)}`);
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const [result] = await conn.execute(sql, [userData.username, userData.password, userData.role]);
    logger.info(`User created with ID: ${result.insertId}`);
    return result.insertId;
}

export const updateUser = async (conn, userId, userData) => {
    logger.debug(`Updating user with ID: ${userId} with data: ${JSON.stringify(userData)}`);
    const sql = 'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?';
    const [result] = await conn.execute(sql, [userData.username, userData.password, userData.role, userId]);
    if (result.affectedRows === 0) {
        logger.warn(`No user found to update with ID: ${userId}`);
        return false;
    }
    logger.info(`User with ID: ${userId} updated successfully`);
    return true;
}

export const deleteUser = async (conn, userId) => {
    logger.debug(`Deleting user with ID: ${userId}`);
    const sql = 'DELETE FROM users WHERE id = ?';
    const [result] = await conn.execute(sql, [userId]);
    if (result.affectedRows === 0) {
        logger.warn(`No user found to delete with ID: ${userId}`);
        return false;
    }
    logger.info(`User with ID: ${userId} deleted successfully`);
    return true;
}