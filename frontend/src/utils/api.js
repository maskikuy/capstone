import axios from 'axios';


// Ganti URL sesuai port backend Anda
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Interceptor: Otomatis pasang token JWT jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    // Jika sukses (200-299), teruskan data
    return response;
  },
  (error) => {
    // Cek apakah error berasal dari response backend
    if (error.response) {
      const { status } = error.response;

      // Cek status 401 (Unauthorized) atau 403 (Forbidden)
      // Sesuai dengan authMiddleware.js di backend Anda yang mengirim 403 jika token invalid
      if (status === 401 || status === 403) {
        
        // Cek apakah kita sedang tidak di halaman login (untuk mencegah loop redirect)
        if (window.location.pathname !== '/') {
          // 1. Hapus data sesi
          localStorage.clear();

          // 2. Beri info user (Opsional, tapi window.location akan merefresh halaman jadi toast mungkin hanya sekilas)
          // alert("Sesi Anda telah habis. Silakan login kembali."); 

          // 3. Paksa redirect ke halaman login (Menggunakan window.location agar state React bersih total)
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;