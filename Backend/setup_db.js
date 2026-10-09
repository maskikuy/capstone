import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createUser } from './src/models/userModel.js';

dotenv.config();

const setupDatabase = async () => {
    try {
        console.log('Connecting to MySQL server...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        const dbName = process.env.DB_NAME || 'wow_db';
        console.log(`Creating database ${dbName} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        console.log('Reading wow_db.sql file...');
        const sqlPath = path.resolve('wow_db.sql');
        if (fs.existsSync(sqlPath)) {
            let sql = fs.readFileSync(sqlPath, 'utf8');
            sql = sql.replace(/CREATE DATABASE `?wow_db`?;/gi, 'CREATE DATABASE IF NOT EXISTS `wow_db`;');
            sql = sql.replace(/CREATE DATABASE wow_db;/gi, 'CREATE DATABASE IF NOT EXISTS `wow_db`;');
            sql = sql.replace(/CREATE TABLE /gi, 'CREATE TABLE IF NOT EXISTS ');
            console.log('Executing wow_db.sql schema and seed data...');
            await connection.query(sql);
            console.log('Database schema & initial data created successfully.');
        } else {
            console.warn('wow_db.sql file not found.');
        }

        // Seed admin user if not exists
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['Super Admin']);
        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash('123', 10);
            await createUser(connection, {
                username: 'Super Admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin user ("Super Admin" / "123") created successfully.');
        } else {
            console.log('Admin user "Super Admin" already exists.');
        }

        await connection.end();
        console.log('Database setup finished successfully!');
    } catch (error) {
        console.error('Error during database setup:', error);
        process.exit(1);
    }
};

setupDatabase();
