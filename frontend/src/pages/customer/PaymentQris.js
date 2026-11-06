import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { showAlert, notifyError } from '../../utils/notify';

const PaymentQris = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ambil data dari halaman checkout
  const { orderId, totalAmount, qris_image, payment_link_url, customerName, tableNumber } = location.state || {};

  // Timer hitung mundur (15 menit)
  const [timeLeft, setTimeLeft] = useState(900);
  const [isCompleting, setIsCompleting] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    // Validasi: Jika akses langsung tanpa checkout, kembalikan ke menu
    if (!orderId) {
        navigate('/customer/menu');
        return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Auto-polling setiap 3 detik untuk cek status pembayaran otomatis
    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/order/${orderId}/payment-status`);
        if (response.data && response.data.payment_status === 'paid') {
          clearInterval(pollingRef.current);
          showAlert('Pembayaran berhasil! Pesanan Anda telah diteruskan ke kasir & dapur.');
          navigate('/customer/status', {
            state: { orderId, customerName, tableNumber }
          });
        }
      } catch (err) {
        // Abaikan error jaringan sementara saat polling
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollingRef.current);
    };
  }, [orderId, navigate, customerName, tableNumber]);

  // Format waktu menit:detik
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Fungsi saat tombol "Selesaikan Transaksi" diklik oleh customer
  const handleConfirmPayment = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      if (pollingRef.current) clearInterval(pollingRef.current);
      
      // Selesaikan transaksi di server agar pesanan resmi masuk ke kasir & dapur
      await api.post(`/order/${orderId}/complete-transaction`);
      
      showAlert("Transaksi Selesai! Pesanan Anda telah masuk ke sistem kasir dan siap disiapkan.");
      navigate('/customer/status', { 
          state: { orderId, customerName, tableNumber } 
      });
    } catch (err) {
      console.error('Gagal menyelesaikan transaksi:', err);
      // Fallback tetap arahkan ke status
      showAlert("Transaksi dikonfirmasi. Mohon tunggu pesanan Anda.");
      navigate('/customer/status', { 
          state: { orderId, customerName, tableNumber } 
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Helper Copy Nominal
  const copyToClipboard = () => {
    navigator.clipboard.writeText(totalAmount);
    showAlert("Nominal berhasil disalin!");
  };

  // Helper Download QR Code
  const downloadQR = () => {
    if (!qris_image) return;
    const link = document.createElement('a');
    link.href = qris_image;
    link.download = `qris-order-${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9', padding: '32px 16px' }} className="d-flex flex-column align-items-center">
      
      {/* 1. HEADER TIMER */}
      <div 
        className="card border-0 mb-3 w-100" 
        style={{
          maxWidth: '420px',
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '16px'
        }}
      >
        <div className="card-body text-center py-3">
          <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
            Sisa Waktu Pembayaran
          </small>
          <div className="fw-bold mt-1" style={{ color: '#d8a744', fontSize: '1.8rem', letterSpacing: '1px' }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* 2. AREA QRIS */}
      <div 
        className="card border-0 w-100 mb-3" 
        style={{
          maxWidth: '420px',
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '20px'
        }}
      >
        <div className="card-body text-center p-4">
          <h5 className="fw-bold mb-1" style={{ color: '#f1f5f9', fontSize: '1.2rem' }}>
            Scan QRIS
          </h5>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '20px' }}>
            Menerima GoPay, OVO, DANA, ShopeePay, BCA & Semua Bank
          </p>
          
          {/* Tampilan QR Code */}
          <div 
            className="p-3 d-inline-block rounded-3 mb-3 shadow"
            style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}
          >
            {qris_image ? (
              <img src={qris_image} alt="QRIS Code" className="img-fluid" style={{ width: '220px', height: '220px' }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-light" style={{ width: '220px', height: '220px' }}>
                <span className="spinner-border text-secondary"></span>
              </div>
            )}
          </div>

          {/* Status polling indicator */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              Menunggu Anda menyelesaikan pembayaran QRIS...
            </small>
          </div>

          {/* Total Pembayaran */}
          <div 
            className="rounded p-3 mb-3"
            style={{
              backgroundColor: '#1c1d27',
              border: '1px solid #282a36',
              borderRadius: '12px'
            }}
          >
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '4px' }}>
              Total yang harus dibayar:
            </p>
            <div className="d-flex justify-content-center align-items-center gap-2">
              <h2 className="fw-bold mb-0" style={{ color: '#d8a744', fontSize: '1.6rem' }}>
                Rp {parseInt(totalAmount || 0, 10).toLocaleString('id-ID')}
              </h2>
              <button 
                className="btn btn-sm p-0 d-flex align-items-center justify-content-center"
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#222433',
                  border: '1px solid #2c2f40',
                  color: '#cbd5e1',
                  borderRadius: '6px'
                }}
                onClick={copyToClipboard}
                title="Salin Nominal"
              >
                <i className="bi bi-files" style={{ fontSize: '0.85rem' }}></i>
              </button>
            </div>
            <small style={{ color: '#ef4444', fontSize: '0.7rem', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
              *Pastikan nominal transfer sesuai persis
            </small>
          </div>

          {/* Petunjuk Pengguna Mobile */}
          <div 
            className="p-3 text-start"
            style={{
              backgroundColor: 'rgba(216, 167, 68, 0.08)',
              border: '1px solid rgba(216, 167, 68, 0.25)',
              borderRadius: '12px'
            }}
          >
            <small className="d-block fw-bold mb-1" style={{ color: '#d8a744', fontSize: '0.78rem' }}>
              💡 Petunjuk Pembayaran:
            </small>
            <small style={{ color: '#cbd5e1', fontSize: '0.72rem', lineHeight: '1.4', display: 'block' }}>
              1. Buka aplikasi e-wallet / mobile banking Anda (GoPay, DANA, OVO, BCA, dll).<br />
              2. Scan kode QRIS di atas.<br />
              3. Setelah berhasil membayar, klik tombol <strong>Selesaikan Transaksi</strong> di bawah agar pesanan langsung masuk ke kasir & dapur!
            </small>
          </div>
        </div>
      </div>

      {/* 3. TOMBOL AKSI */}
      <div className="w-100 d-flex flex-column gap-2" style={{ maxWidth: '420px' }}>
        {payment_link_url && (
          <a 
            href={payment_link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-100 py-3 fw-bold text-decoration-none text-center d-flex align-items-center justify-content-center shadow-sm"
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '14px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            <i className="bi bi-box-arrow-up-right me-2"></i>
            Buka Halaman Pembayaran SumoPod
          </a>
        )}

        {qris_image && (
          <button 
            className="w-100 py-3 fw-bold border-0 transition-all shadow-sm"
            style={{
              backgroundColor: '#222433',
              border: '1px solid #2c2f40',
              color: '#f1f5f9',
              borderRadius: '14px',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
            onClick={downloadQR}
          >
            <i className="bi bi-download me-2"></i>
            Simpan QR ke Galeri
          </button>
        )}

        {/* Tombol Selesaikan Transaksi */}
        <button 
          className="w-100 py-3 fw-bold border-0 transition-all shadow-sm"
          style={{
            backgroundColor: '#d8a744',
            color: '#101116',
            borderRadius: '14px',
            fontSize: '1.05rem',
            cursor: isCompleting ? 'not-allowed' : 'pointer',
            opacity: isCompleting ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(216, 167, 68, 0.4)'
          }}
          disabled={isCompleting}
          onClick={handleConfirmPayment}
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {isCompleting ? 'Memproses Transaksi...' : 'Selesaikan Transaksi'}
        </button>

        <button 
          className="w-100 py-2 border-0 bg-transparent text-center"
          style={{ color: '#94a3b8', fontSize: '0.88rem', cursor: 'pointer' }}
          onClick={() => navigate('/customer/status', { state: { orderId } })}
        >
          Lihat Status Pesanan
        </button>
      </div>

    </div>
  );
};

export default PaymentQris;
