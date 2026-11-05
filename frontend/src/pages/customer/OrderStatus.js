import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import html2canvas from 'html2canvas';
import { CustomerReceipt } from '../../components/CustomerReceipt';

const OrderStatus = () => {
  const location = useLocation();
  const { orderId, customerName, tableNumber } = location.state || {};

  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  
  // State untuk Nota
  const [fullOrder, setFullOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const receiptRef = useRef(null);

  // Google Review States
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setGoogleReviewUrl(res.data.google_review_url || '');
      } catch (err) {
        console.error("Gagal memuat pengaturan Google Review", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchFullDetails = async () => {
      try {
        const res = await api.get(`/order/${orderId}`);
        const orderData = Array.isArray(res.data) ? res.data[0] : res.data; 
        if (!orderData) return;

        setFullOrder(orderData);
        setStatus(orderData.order_status);

        if (orderData.order_status === 'completed') {
          const hasShownReview = sessionStorage.getItem(`review_prompt_shown_${orderId}`);
          if (!hasShownReview) {
            setShowReviewModal(true);
          }
        }
      } catch (err) {
        console.error("Gagal ambil detail lengkap order", err);
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/order/${orderId}/getStatus`);
        const newStatus = res.data.order_status;
        setStatus(newStatus);

        if (newStatus === 'completed') {
          const hasShownReview = sessionStorage.getItem(`review_prompt_shown_${orderId}`);
          if (!hasShownReview) {
            setShowReviewModal(true);
          }
        }

        setFullOrder(prevOrder => {
          if (!prevOrder) return prevOrder;
          return {
            ...prevOrder,
            order_status: newStatus,
            payment_status: res.data.payment_status || prevOrder.payment_status
          };
        });
      } catch (err) {
        console.error("Gagal cek status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullDetails().then(() => {
      setLoading(false);
    });

    const interval = setInterval(fetchStatus, 5000); 
    return () => clearInterval(interval);
  }, [orderId]);

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      try {
        const element = receiptRef.current;
        const clone = element.cloneNode(true);

        Object.assign(clone.style, {
          position: 'absolute',
          top: '-10000px',
          left: '-10000px',
          width: '380px',
          height: 'auto',
          overflow: 'visible',
          background: 'white',
          zIndex: '-1'
        });

        document.body.appendChild(clone);
        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        document.body.removeChild(clone);

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `Nota-WOW-${orderId}.png`;
        link.click();
      } catch (err) {
        console.error("Gagal download nota", err);
        alert("Gagal menyimpan gambar.");
      }
    }
  };

  if (!orderId) {
    return (
      <div style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9' }} className="d-flex flex-column align-items-center justify-content-center pt-5">
        <h4 className="fw-bold mb-3">Data pesanan tidak ditemukan.</h4>
        <Link 
          to="/customer/menu" 
          className="btn py-2 px-4 fw-bold"
          style={{ backgroundColor: '#d8a744', color: '#101116', borderRadius: '10px' }}
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9' }} className="d-flex flex-column justify-content-center align-items-center">
        <div className="spinner-border" style={{ width: '3rem', height: '3rem', color: '#d8a744' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3" style={{ color: '#94a3b8' }}>Mengambil status pesanan...</p>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Pesanan Diterima',
          desc: 'Mohon tunggu, pesananmu sedang dalam antrean.',
          bgColor: '#1e202e',
          accentColor: '#94a3b8'
        };
      case 'processing':
        return {
          icon: '👨‍🍳',
          title: 'Sedang Dimasak',
          desc: 'Koki kami sedang menyiapkan hidangan spesial untukmu!',
          bgColor: '#26231a',
          accentColor: '#d8a744'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'Siap Disajikan',
          desc: 'Pesananmu sudah siap! Silakan nikmati.',
          bgColor: '#16281e',
          accentColor: '#22c55e'
        };
      case 'cancelled':
        return {
          icon: '❌',
          title: 'Pesanan Dibatalkan',
          desc: 'Maaf, pesanan ini telah dibatalkan.',
          bgColor: '#2b1a1c',
          accentColor: '#ef4444'
        };
      default:
        return { 
          icon: '?', 
          title: 'Status Tidak Diketahui', 
          desc: '', 
          bgColor: '#1e202e',
          accentColor: '#94a3b8'
        };
    }
  };

  const info = getStatusDisplay();

  return (
    <div 
      style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9', padding: '40px 16px' }}
      className="d-flex flex-column align-items-center justify-content-center"
    >
      <div className="text-center mb-4">
        <h1 className="fw-bold mb-1" style={{ color: '#f1f5f9', fontSize: '1.8rem' }}>
          Meja {tableNumber}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
          A.n. {customerName}
        </p>
      </div>

      <div 
        className="card border-0 text-center p-4 w-100 shadow-lg" 
        style={{
          maxWidth: '420px',
          borderRadius: '24px',
          backgroundColor: info.bgColor,
          border: `1.5px solid ${info.accentColor}40`
        }}
      >
        <div style={{ fontSize: '3.8rem', marginBottom: '12px' }}>{info.icon}</div>
        <h3 className="fw-bold mb-2" style={{ color: info.accentColor, fontSize: '1.4rem' }}>
          {info.title}
        </h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '0' }}>
          {info.desc}
        </p>
        
        {status !== 'completed' && status !== 'cancelled' && (
          <div className="mt-4 d-flex align-items-center justify-content-center gap-2">
            <div className="spinner-border spinner-border-sm" style={{ color: info.accentColor }} role="status"></div>
            <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Mengupdate status real-time...</small>
          </div>
        )}
      </div>

      {/* Tombol Download Nota & Pesan Lagi */}
      <div className="mt-4 d-flex flex-column gap-2 w-100" style={{ maxWidth: '420px' }}>
        {fullOrder && (
          <button 
            onClick={() => setShowReceiptModal(true)}
            className="w-100 py-3 fw-bold border-0 transition-all shadow-sm"
            style={{
              backgroundColor: '#222433',
              border: '1px solid #2c2f40',
              color: '#f1f5f9',
              borderRadius: '14px',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            <i className="bi bi-receipt me-2"></i> Lihat & Simpan Nota
          </button>
        )}

        <Link 
          to={`/customer/menu?table=${tableNumber}`} 
          className="w-100 py-3 fw-bold text-center text-decoration-none border-0 transition-all shadow-sm"
          style={{
            backgroundColor: '#d8a744',
            color: '#101116',
            borderRadius: '14px',
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          📖 Pesan Menu Lain
        </Link>
      </div>

      {/* Modal Preview Nota */}
      {showReceiptModal && fullOrder && (
        <div 
          className="modal show d-block" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1055,
            overflowY: 'auto',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div className="modal-dialog modal-dialog-centered"> 
            <div className="modal-content" style={{ backgroundColor: 'transparent', border: 'none' }}>
              <div className="modal-header border-0 p-0 mb-2">
                <button 
                  className="btn-close btn-close-white ms-auto" 
                  onClick={() => setShowReceiptModal(false)}
                />
              </div>
              
              <div className="modal-body p-0 d-flex justify-content-center">
                <CustomerReceipt order={fullOrder} receiptRef={receiptRef} />
              </div>

              <div className="modal-footer border-0 justify-content-center mt-3 p-0">
                <button 
                  className="w-100 py-3 fw-bold border-0 shadow"
                  onClick={handleDownloadReceipt}
                  style={{
                    maxWidth: '350px',
                    borderRadius: '50px',
                    backgroundColor: '#d8a744',
                    color: '#101116',
                    cursor: 'pointer'
                  }}
                >
                  <i className="bi bi-download me-2"></i> Simpan ke Galeri (PNG)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rating Google */}
      {showReviewModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0 shadow-lg text-center" 
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                maxWidth: '400px',
                margin: '0 auto',
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                color: '#f1f5f9'
              }}
            >
              <div 
                className="modal-header border-0 py-3 text-center"
                style={{ backgroundColor: '#d8a744', color: '#101116' }}
              >
                <h5 className="modal-title fw-bold mx-auto" style={{ color: '#101116', fontSize: '1.1rem' }}>
                  Billion Coffee
                </h5>
              </div>

              <div className="modal-body p-4">
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>☕🥰</div>
                <h4 className="fw-bold mb-2" style={{ color: '#f1f5f9' }}>Lanjut rating kita yuk :)</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>
                  Ulasan Anda sangat berharga untuk membantu Billion Coffee tumbuh lebih baik!
                </p>
                
                <div className="d-grid gap-2">
                  <a 
                    href={googleReviewUrl || "https://google.com"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-100 py-3 fw-bold border-0 shadow-sm text-decoration-none"
                    style={{
                      fontSize: '1rem',
                      backgroundColor: '#d8a744',
                      color: '#101116',
                      borderRadius: '50px',
                      display: 'block'
                    }}
                    onClick={() => {
                      sessionStorage.setItem(`review_prompt_shown_${orderId}`, 'true');
                      setShowReviewModal(false);
                    }}
                  >
                    Beri Ulasan di Google ⭐
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderStatus;
