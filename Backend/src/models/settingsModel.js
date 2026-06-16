import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'SettingsModel' });

export const getSettings = async (conn) => {
    logger.debug('Fetching settings from the database');
    const sql = 'SELECT * FROM settings';
    const [rows] = await conn.execute(sql);
    
    // Convert array of rows to a single object
    const settingsObj = {};
    rows.forEach(row => {
        settingsObj[row.setting_key] = row.setting_value;
    });
    
    logger.info(`Fetched settings: ${JSON.stringify(settingsObj)}`);
    return settingsObj;
}

export const updateSetting = async (conn, key, value) => {
    logger.debug(`Updating setting: ${key} = ${value}`);
    const sql = 'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?';
    const [result] = await conn.execute(sql, [key, value, value]);
    logger.info(`Setting updated: ${key}`);
    return result.affectedRows > 0;
}
