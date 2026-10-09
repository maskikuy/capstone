import db from './src/config/database.js';
import bcrypt from 'bcryptjs';
import {createUser} from './src/models/userModel.js';

const seedDatabase = async () => {
    let conn;
    try {
        conn = await db.getConnection();
        console.log('Database connected successfully.');

        // Contoh: Menambahkan user admin
        const hashedPassword = await bcrypt.hash('123', 10);
        await createUser(conn, {
            username: 'Super Admin',
            password: hashedPassword,
            role: 'admin'
        });
        console.log('Admin user created successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        if (conn) conn.release();
        console.log('Database connection closed.');
    }
};

seedDatabase();