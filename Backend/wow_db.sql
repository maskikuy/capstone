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
    type ENUM('menu', 'inventory') NOT NULL DEFAULT 'menu',
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

-- 8. Tabel Inventories (BARU)
CREATE TABLE inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT DEFAULT NULL,
    selling_price DECIMAL(10,2) DEFAULT 0,
    initial_cost DECIMAL(10,2) DEFAULT 0,
    price_type ENUM('retail','grosir') DEFAULT 'retail',
    retail_price_per_unit DECIMAL(10,2) DEFAULT 0,
    grosir_price_per_unit DECIMAL(10,2) DEFAULT 0,
    grosir_min_qty INT DEFAULT 0,
    stock_available DECIMAL(12,3) DEFAULT 0,
    stock_unit ENUM('gram','pcs') DEFAULT 'pcs',
    low_stock_threshold DECIMAL(12,3) DEFAULT 0,
    warehouse_stock DECIMAL(12,3) DEFAULT 0,
    real_stock DECIMAL(12,3) DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Seed contoh data untuk tabel inventories
INSERT INTO inventories (name, category_id, selling_price, initial_cost, price_type, retail_price_per_unit, grosir_price_per_unit, grosir_min_qty, stock_available, stock_unit, low_stock_threshold, warehouse_stock, real_stock, is_available)
VALUES
('Beras Premium 5kg', NULL, 50000.00, 35000.00, 'retail', 50000.00, 45000.00, 0, 20.000, 'pcs', 2.000, 30.000, 20.000, 1),
('Gula Pasir 1kg', NULL, 12000.00, 8000.00, 'retail', 12000.00, 10000.00, 0, 50.000, 'pcs', 5.000, 50.000, 50.000, 1),
('Minyak Goreng 2L', NULL, 30000.00, 20000.00, 'retail', 30000.00, 28000.00, 0, 15.000, 'pcs', 3.000, 20.000, 15.000, 1),
('Cabe Merah (per 100g)', NULL, 8000.00, 5000.00, 'retail', 8000.00, 7000.00, 0, 200.000, 'gram', 50.000, 250.000, 200.000, 1),
('Telur Ayam (per lusin)', NULL, 30000.00, 20000.00, 'grosir', 30000.00, 25000.00, 10, 40.000, 'pcs', 5.000, 60.000, 40.000, 1),
('Tepung Terigu 1kg', NULL, 15000.00, 10000.00, 'retail', 15000.00, 14000.00, 0, 35.000, 'pcs', 4.000, 40.000, 35.000, 1);
