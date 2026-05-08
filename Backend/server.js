import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import baseLogger from './src/utils/logger.js';
import productRoute from './src/routes/productRoute.js';
import userRoute from './src/routes/userRoute.js';
import orderRoute from './src/routes/orderRoute.js';
import categoriesRoute from './src/routes/categoriesRoute.js';
import productVariantRoute from './src/routes/productVariantRoute.js';
import httpLogger from './src/middleware/httplogger.js';
import authRoute from './src/routes/authRoute.js';
import * as limiter from './src/middleware/rateLimiter.js';
import {Server} from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const logger = baseLogger.child({ module: 'Server' });

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(httpLogger);
app.use('/api', orderRoute);
app.use('/api/auth', authRoute, limiter.authLimiter);
app.use('/uploads', express.static('./src/uploads'));
app.use('/api', productRoute);
app.use('/api', userRoute);
app.use('/api', categoriesRoute);
app.use('/api', productVariantRoute);
app.use((req, res) => {
    logger.warn(`404 Not Found - ${req.originalUrl}`);
    res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});
