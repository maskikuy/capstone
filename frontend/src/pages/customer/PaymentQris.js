import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { showAlert } from '../../utils/notify';

const PaymentQris = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ambil data dari halaman checkout
  const { orderId, totalAmount, qris_image, customerName, tableNumber } = location.state || {};

  // Timer hitung mundur (15 menit) - Biar terlihat keren/urgen
  const [timeLeft, setTimeLeft] = useState(900); 

  useEffect(() => {
    // Validasi: Jika akses langsung tanpa checkout, kembalikan ke menu
    if (!orderId) {
        navigate('/customer/menu');
        return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId, navigate]);

  // Format waktu menit:detik
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Fungsi saat tombol diklik
  const handleConfirmPayment = () => {
    // Opsional: Bisa panggil API untuk ubah status jadi 'waiting_verification'
    // Tapi untuk simpelnya, langsung arahkan ke status saja.
    
    showAlert("Terima kasih! Mohon tunggu konfirmasi dari kasir kami.");
    
    navigate('/customer/status', { 
        state: { orderId: orderId,
            customerName: customerName,
            tableNumber: tableNumber
        } 
    });
  };

  // Helper Copy Nominal
  const copyToClipboard = () => {
    navigator.clipboard.writeText(totalAmount);
    alert("Nominal berhasil disalin!");
  };

  return (
    <div className="container py-5 d-flex flex-column align-items-center" style={{ minHeight: '100vh' }}>
      
      {/* 1. HEADER TIMER */}
      <div className="card shadow-sm border-0 mb-4 w-100 bg-warning bg-opacity-10" style={{ maxWidth: '400px' }}>
        <div className="card-body text-center py-2">
            <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>Sisa Waktu Pembayaran</small>
            <div className="fw-bold text-dark fs-4">{formatTime(timeLeft)}</div>
        </div>
      </div>

      {/* 2. AREA QRIS */}
      <div className="card shadow border-0 w-100 mb-4" style={{ maxWidth: '400px', borderRadius: '20px' }}>
        <div className="card-body text-center p-4">
            <h5 className="fw-bold mb-1">Scan QRIS</h5>
            <p className="text-muted small mb-4">Menerima GoPay, OVO, Dana, ShopeePay, BCA</p>
            
            {/* Tampilan QR Code */}
            <div className="bg-white p-2 d-inline-block rounded border mb-4 shadow-sm">
                {qris_image ? (
                    <img src={qris_image} alt="QRIS Code" className="img-fluid" style={{ width: '220px', height: '220px' }} />
                ) : (
                    <div className="d-flex align-items-center justify-content-center bg-light" style={{width:'220px', height:'220px'}}>
                        <span className="spinner-border text-secondary"></span>
                    </div>
                )}
            </div>

            {/* Total Pembayaran */}
            <div className="bg-light rounded p-3 mb-3">
                <p className="text-muted small mb-1">Total yang harus dibayar:</p>
                <div className="d-flex justify-content-center align-items-center gap-2">
                    <h2 className="fw-bold text-primary mb-0">
                        Rp {parseInt(totalAmount || 0).toLocaleString('id-ID')}
                    </h2>
                    <button className="btn btn-sm btn-outline-secondary border-0" onClick={copyToClipboard}>
                        <i className="bi bi-files fs-5"></i>
                    </button>
                </div>
                <small className="text-danger fst-italic" style={{fontSize: '0.7rem'}}>
                    *Pastikan nominal transfer sesuai hingga digit terakhir
                </small>
            </div>
        </div>
      </div>

      {/* 3. TOMBOL AKSI */}
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <button 
            className="btn btn-success w-100 py-3 fw-bold shadow-sm mb-3" 
            style={{borderRadius: '12px', fontSize: '1.1rem'}}
            onClick={handleConfirmPayment}
        >
            <i className="bi bi-check-circle-fill me-2"></i>
            Saya Sudah Bayar
        </button>

        <button 
            className="btn btn-outline-secondary w-100 py-2 border-0"
            onClick={() => navigate('/customer/status', { state: { orderId } })}
        >
            Cek Status Nanti Saja
        </button>
      </div>

    </div>
  );
};

export default PaymentQris;