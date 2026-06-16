import db from '../config/database.js';
import * as settingsModel from '../models/settingsModel.js';
import * as feedbackModel from '../models/feedbackModel.js';
import baseLogger from '../utils/logger.js';

const logger = baseLogger.child({ context: 'SettingsController' });

export const getSettings = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established for fetching settings');
    try {
        const settings = await settingsModel.getSettings(conn);
        res.status(200).json(settings);
    } catch (error) {
        logger.error(`Error fetching settings: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const updateSettings = async (req, res) => {
    const settingsData = req.body; // e.g. { google_review_url: "...", review_threshold: "4" }
    const conn = await db.getConnection();
    logger.debug('Database connection established for updating settings');
    try {
        await conn.beginTransaction();
        
        for (const [key, value] of Object.entries(settingsData)) {
            await settingsModel.updateSetting(conn, key, String(value));
        }
        
        await conn.commit();
        logger.info('Settings updated successfully');
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
        await conn.rollback();
        logger.error(`Error updating settings: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const createFeedback = async (req, res) => {
    const { order_id, rating, comments } = req.body;
    const conn = await db.getConnection();
    logger.debug('Database connection established for creating feedback');
    try {
        if (!rating) {
            return res.status(400).json({ error: 'Rating is required' });
        }
        
        const feedbackId = await feedbackModel.createFeedback(conn, {
            order_id: order_id || null,
            rating,
            comments: comments || ''
        });
        
        res.status(201).json({ message: 'Feedback submitted successfully', feedback_id: feedbackId });
    } catch (error) {
        logger.error(`Error creating feedback: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};

export const getAllFeedbacks = async (req, res) => {
    const conn = await db.getConnection();
    logger.debug('Database connection established for fetching feedbacks');
    try {
        const feedbacks = await feedbackModel.getAllFeedbacks(conn);
        res.status(200).json(feedbacks);
    } catch (error) {
        logger.error(`Error fetching feedbacks: ${error.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
};
