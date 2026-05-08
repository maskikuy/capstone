import rateLimit from 'express-rate-limit';

// 1. Limiter Umum (Pasang di level aplikasi global)
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Menit
    max: 100, // Maksimal 100 request per IP dalam 15 menit
    standardHeaders: true, // Mengirim info limit di header response (RateLimit-Limit)
    legacyHeaders: false, // Nonaktifkan header X-RateLimit-* yang lama
    message: {
        status: 429,
        error: "Terlalu banyak request, silakan coba lagi dalam 15 menit."
    }
});

// 2. Limiter Khusus Order (Pasang di route POST /orders)
// Mencegah spam klik tombol "Pesan" atau bot order
export const createOrderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 Jam
    max: 10, // Maksimal 10 kali buat order per jam per IP
    message: {
        status: 429,
        error: "Anda membuat pesanan terlalu cepat. Silakan tunggu beberapa saat."
    }
});

// 3. Limiter Login (Pasang di route POST /auth/login)
// Mencegah Brute Force Password
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // Maksimal 5 kali salah password sebelum diblokir sementara
    message: {
        status: 429,
        error: "Terlalu banyak percobaan login. Silakan coba 15 menit lagi."
    }
});