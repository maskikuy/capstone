CREATE DATABASE wow_db;

USE wow_db;
-- 1. Tabel Users (Tetap)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'kitchen') NOT NULL DEFAULT 'kitchen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Categories (Tetap)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Products (Tetap)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL, -- Harga dasar menu
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Tabel Product Variants (BARU: Untuk Opsi Berbayar)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- Contoh: "Level Pedas 5", "Extra Telur"
    extra_price DECIMAL(10, 2) DEFAULT 0, -- Biaya tambahan (bisa 0 jika gratis)
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Tabel Orders (Update: Alur QRIS Statis)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    customer_name VARCHAR(50),
    location ENUM('dine-in', 'takeaway', 'delivery') DEFAULT 'dine-in',
    -- Total Amount nanti dihitung dari: (Harga Menu + Harga Varian) x Jumlah
    total_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method ENUM('cash', 'qris') DEFAULT 'cash',
    -- Status 'paid' diubah MANUAL oleh kasir setelah lihat bukti transfer
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    order_status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Order Items (Update: Menyimpan Base Price & Notes)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_order DECIMAL(10, 2) NOT NULL, -- Menyimpan 'base_price' saat itu
    notes VARCHAR(255), -- "Catatan Khusus" (Teks bebas: "Jangan pakai bawang")
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 7. Tabel Order Item Variants (BARU: Detail Varian yang Dipilih)
CREATE TABLE order_item_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    variant_name VARCHAR(50) NOT NULL, -- Snapshot nama varian
    variant_price DECIMAL(10, 2) NOT NULL, -- Snapshot harga varian saat itu
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);