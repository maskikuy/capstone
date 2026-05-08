import db from './src/config/database.js';
import bcrypt from 'bcryptjs';
import {createUser} from './src/models/userModel.js';

const seedDatabase = async () => {
    try {
        const conn = await db.getConnection();
        console.log('Database synced successfully.');
        // Tambahkan data seeding di sini jika diperlukan

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
        await conn.close();
        console.log('Database connection closed.');
    }
};

seedDatabase();