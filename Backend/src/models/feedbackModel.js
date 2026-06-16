import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'FeedbackModel' });

export const createFeedback = async (conn, feedbackData) => {
    logger.debug(`Saving feedback: ${JSON.stringify(feedbackData)}`);
    const sql = 'INSERT INTO feedbacks (order_id, rating, comments) VALUES (?, ?, ?)';
    const [result] = await conn.execute(sql, [feedbackData.order_id, feedbackData.rating, feedbackData.comments]);
    logger.info(`Feedback saved with ID: ${result.insertId}`);
    return result.insertId;
}

export const getAllFeedbacks = async (conn) => {
    logger.debug('Fetching all feedbacks');
    const sql = 'SELECT * FROM feedbacks ORDER BY created_at DESC';
    const [rows] = await conn.execute(sql);
    logger.info(`Fetched ${rows.length} feedbacks`);
    return rows;
}
