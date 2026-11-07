import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { showAlert } from '../../utils/notify';

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
    <div className="billion-qris-page">
      {/* Ornamen Garis Emas Atas */}
      <div className="status-top-divider">
        <span />
        <span className="status-divider-dot" />
        <span />
      </div>

      <div className="qris-main-wrapper">
        {/* Header Meja & Pemesan */}
        <div className="text-center mb-3">
          <h1 className="status-table-title" style={{ fontSize: '28px' }}>
            Meja {tableNumber || 1}
          </h1>
          {customerName && (
            <p className="status-customer-subtitle">
              A.n. {customerName}
            </p>
          )}
        </div>

        {/* 1. TIMER BADGE */}
        <div className="qris-timer-card mb-3">
          <small className="qris-timer-label">
            Sisa Waktu Pembayaran
          </small>
          <div className="qris-timer-clock">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* 2. AREA QRIS LUXURY CARD */}
        <div className="status-luxury-card mb-3">
          <h2 className="status-card-title" style={{ color: '#e5bd65', fontSize: '24px' }}>
            Scan QRIS
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '18px' }}>
            Menerima GoPay, OVO, DANA, ShopeePay, BCA & Semua Bank
          </p>

          {/* Tampilan QR Code */}
          <div className="qris-image-container mb-3">
            {qris_image ? (
              <img src={qris_image} alt="QRIS Code" className="img-fluid" style={{ width: '220px', height: '220px', display: 'block' }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center" style={{ width: '220px', height: '220px', background: '#f8fafc' }}>
                <span className="spinner-border text-secondary"></span>
              </div>
            )}
          </div>

          {/* Status polling indicator */}
          <div className="status-realtime-wrap mb-3" style={{ marginTop: '0' }}>
            <span className="gold-realtime-spinner" />
            <small className="status-realtime-text">
              Menunggu Anda menyelesaikan pembayaran QRIS...
            </small>
          </div>

          {/* Total Pembayaran Box */}
          <div className="qris-amount-box mb-3">
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>
              Total yang harus dibayar:
            </p>
            <div className="d-flex justify-content-center align-items-center gap-2">
              <h3 className="qris-amount-number mb-0">
                Rp {parseInt(totalAmount || 0, 10).toLocaleString('id-ID')}
              </h3>
              <button
                type="button"
                className="btn-qris-copy"
                onClick={copyToClipboard}
                title="Salin Nominal"
              >
                <i className="bi bi-files"></i>
              </button>
            </div>
            <small style={{ color: '#ef4444', fontSize: '0.72rem', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
              *Pastikan nominal transfer sesuai persis
            </small>
          </div>

          {/* Petunjuk Pengguna Mobile */}
          <div className="qris-guide-box text-start">
            <small className="d-block fw-bold mb-1" style={{ color: '#e5bd65', fontSize: '0.8rem' }}>
              💡 Petunjuk Pembayaran:
            </small>
            <small style={{ color: '#cbd5e1', fontSize: '0.75rem', lineHeight: '1.5', display: 'block' }}>
              1. Buka aplikasi e-wallet / mobile banking Anda (GoPay, DANA, OVO, BCA, dll).<br />
              2. Scan kode QRIS di atas.<br />
              3. Setelah berhasil membayar, klik tombol <strong>Selesaikan Transaksi</strong> di bawah agar pesanan langsung masuk ke kasir & dapur!
            </small>
          </div>
        </div>

        {/* 3. TOMBOL AKSI */}
        <div className="status-actions-group">
          {payment_link_url && (
            <a
              href={payment_link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-billion-outline text-decoration-none text-center d-flex align-items-center justify-content-center"
              style={{ borderColor: '#3b82f6', color: '#60a5fa' }}
            >
              <i className="bi bi-box-arrow-up-right me-2"></i>
              Buka Halaman Pembayaran SumoPod
            </a>
          )}

          {qris_image && (
            <button
              type="button"
              className="btn-billion-outline d-flex align-items-center justify-content-center"
              onClick={downloadQR}
            >
              <i className="bi bi-download me-2"></i>
              Simpan QR ke Galeri
            </button>
          )}

          {/* Tombol Selesaikan Transaksi */}
          <button
            type="button"
            className="btn-billion-gold"
            disabled={isCompleting}
            onClick={handleConfirmPayment}
            style={{ opacity: isCompleting ? 0.7 : 1, cursor: isCompleting ? 'not-allowed' : 'pointer' }}
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            {isCompleting ? 'Memproses Transaksi...' : 'Selesaikan Transaksi'}
          </button>

          <button
            type="button"
            className="btn-qris-status-link"
            onClick={() => navigate('/customer/status', { state: { orderId, customerName, tableNumber } })}
          >
            Lihat Status Pesanan
          </button>
        </div>
      </div>

      <style>{`
        .billion-qris-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.14), transparent 55%), #0c0d12;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 18px 40px;
        }

        .qris-main-wrapper {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
        }

        .status-top-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 340px;
          margin: 4px auto 24px;
        }

        .status-top-divider > span:not(.status-divider-dot) {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201, 151, 59, 0.75));
        }

        .status-top-divider > span:last-child {
          background: linear-gradient(90deg, rgba(201, 151, 59, 0.75), transparent);
        }

        .status-divider-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e5bd65;
          box-shadow: 0 0 10px rgba(229, 189, 101, 0.65);
        }

        .status-table-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }

        .status-customer-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }

        .qris-timer-card {
          background: #171821;
          border: 1px solid rgba(216, 167, 68, 0.35);
          border-radius: 16px;
          padding: 12px 18px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .qris-timer-label {
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.6px;
          display: block;
        }

        .qris-timer-clock {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          color: #e5bd65;
          font-size: 1.85rem;
          letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .status-luxury-card {
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.08), transparent 55%), #171821;
          border: 1px solid rgba(216, 167, 68, 0.48);
          border-radius: 22px;
          padding: 28px 22px 24px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 25px rgba(216, 167, 68, 0.06);
        }

        .status-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .qris-image-container {
          padding: 12px;
          display: inline-block;
          border-radius: 18px;
          background: #ffffff;
          border: 2px solid rgba(216, 167, 68, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(216, 167, 68, 0.15);
        }

        .status-realtime-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .gold-realtime-spinner {
          width: 16px;
          height: 16px;
          border: 2.2px solid rgba(216, 167, 68, 0.25);
          border-top-color: #d8a744;
          border-radius: 50%;
          animation: billion-spin 1s linear infinite;
        }

        .status-realtime-text {
          color: #8b95a5;
          font-size: 12.5px;
        }

        @keyframes billion-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .qris-amount-box {
          background: #12131a;
          border: 1px solid rgba(216, 167, 68, 0.35);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .qris-amount-number {
          font-family: Georgia, 'Times New Roman', serif;
          color: #e5bd65;
          font-size: 1.75rem;
          font-weight: 700;
        }

        .btn-qris-copy {
          width: 32px;
          height: 32px;
          background: #171821;
          border: 1px solid rgba(216, 167, 68, 0.4);
          color: #e5bd65;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-qris-copy:hover {
          background: rgba(216, 167, 68, 0.15);
          border-color: #e5bd65;
        }

        .qris-guide-box {
          background: rgba(216, 167, 68, 0.08);
          border: 1px solid rgba(216, 167, 68, 0.25);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .status-actions-group {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .btn-billion-outline {
          width: 100%;
          padding: 14px 20px;
          border-radius: 999px;
          background: #171821;
          border: 1px solid rgba(216, 167, 68, 0.55);
          color: #f8fafc;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-billion-outline:hover {
          border-color: #e5bd65;
          background: rgba(216, 167, 68, 0.1);
          color: #ffffff;
        }

        .btn-billion-gold {
          width: 100%;
          padding: 14px 20px;
          border-radius: 999px;
          background: linear-gradient(90deg, #b88728 0%, #e5c165 50%, #c49335 100%);
          border: none;
          color: #141414;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(216, 167, 68, 0.25);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-billion-gold:hover {
          filter: brightness(1.06);
          color: #141414;
        }

        .btn-qris-status-link {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 13.5px;
          padding: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
          text-align: center;
        }

        .btn-qris-status-link:hover {
          color: #e5bd65;
        }
      `}</style>
    </div>
  );
};

export default PaymentQris;
