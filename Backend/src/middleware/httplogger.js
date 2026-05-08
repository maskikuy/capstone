import logger from '../utils/logger.js';

const httpLogger = (req, res, next) => {
    const start = Date.now();
    const httpLog = logger.child({ context: 'HTTP' });

    res.on('finish', () => {
        const duration = Date.now() - start;

        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

        const metaData = { 
            duration: `${duration} ms`,
            ip: req.ip,
            method: req.method,
            url: req.originalUrl
        };

        if (res.statusCode >= 500) {
            httpLog.error(message, metaData);
        } else if (res.statusCode >= 400) {
            httpLog.warn(message, metaData);
        } else {
            httpLog.http(message, metaData);
        }
    });

    next();
};

export default httpLogger;