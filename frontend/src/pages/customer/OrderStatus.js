import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Hourglass, ChefHat, Check, X, HelpCircle, Star } from 'lucide-react';
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
      <div
        style={{
          background: 'radial-gradient(ellipse at top, rgba(216, 167, 68, 0.12), transparent 55%), #0c0d12',
          minHeight: '100vh',
          color: '#f1f5f9'
        }}
        className="d-flex flex-column align-items-center justify-content-center px-3 text-center"
      >
        <h4 className="fw-bold mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: '#e3bd69' }}>
          Data pesanan tidak ditemukan.
        </h4>
        <Link
          to="/customer/menu"
          className="btn py-2 px-4 fw-bold"
          style={{
            background: 'linear-gradient(90deg, #b88728 0%, #e5c165 50%, #c49335 100%)',
            color: '#141414',
            borderRadius: '999px',
            border: 'none'
          }}
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          background: 'radial-gradient(ellipse at top, rgba(216, 167, 68, 0.12), transparent 55%), #0c0d12',
          minHeight: '100vh',
          color: '#f1f5f9'
        }}
        className="d-flex flex-column justify-content-center align-items-center"
      >
        <div className="spinner-border" style={{ width: '3rem', height: '3rem', color: '#d8a744' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mengambil status pesanan...</p>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Hourglass size={44} strokeWidth={1.5} />,
          title: 'Pesanan Diterima',
          desc: 'Mohon tunggu, pesananmu sedang dalam antrean.',
          accentColor: '#e3bd69'
        };
      case 'processing':
        return {
          icon: <ChefHat size={46} strokeWidth={1.5} />,
          title: 'Sedang Dimasak',
          desc: 'Koki kami sedang menyiapkan hidangan spesial untukmu!',
          accentColor: '#e3bd69'
        };
      case 'completed':
        return {
          icon: <Check size={46} strokeWidth={1.8} />,
          title: 'Siap Disajikan',
          desc: 'Pesananmu sudah siap, Selamat Menikmati!',
          accentColor: '#e3bd69'
        };
      case 'cancelled':
        return {
          icon: <X size={46} strokeWidth={1.8} />,
          title: 'Pesanan Dibatalkan',
          desc: 'Maaf, pesanan ini telah dibatalkan.',
          accentColor: '#ef4444'
        };
      default:
        return {
          icon: <HelpCircle size={44} strokeWidth={1.5} />,
          title: 'Status Tidak Diketahui',
          desc: '',
          accentColor: '#94a3b8'
        };
    }
  };

  const info = getStatusDisplay();

  return (
    <div className="billion-status-page">
      {/* Ornamen Garis Emas Atas */}
      <div className="status-top-divider">
        <span />
        <span className="status-divider-dot" />
        <span />
      </div>

      <div className="status-main-wrapper">
        {/* Header Meja & Nama Pelanggan */}
        <div className="text-center mb-4">
          <h1 className="status-table-title">
            Meja {tableNumber}
          </h1>
          <p className="status-customer-subtitle">
            A.n. {customerName}
          </p>
        </div>

        {/* Kartu Status Pesanan */}
        <div className="status-luxury-card">
          <div
            className="status-icon-ring"
            style={{
              borderColor: status === 'cancelled' ? 'rgba(239, 68, 68, 0.6)' : '#c9973b',
              color: info.accentColor
            }}
          >
            {info.icon}
          </div>

          <h3 className="status-card-title" style={{ color: info.accentColor }}>
            {info.title}
          </h3>

          <p className="status-card-desc">
            {info.desc}
          </p>

          {status !== 'completed' && status !== 'cancelled' && (
            <div className="status-realtime-wrap">
              <span className="gold-realtime-spinner" />
              <small className="status-realtime-text">Mengupdate status real-time...</small>
            </div>
          )}
        </div>

        {/* Tombol Lihat Nota & Pesan Menu Lain */}
        <div className="status-actions-group">
          {fullOrder && (
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="btn-billion-outline"
            >
              Lihat & Simpan Nota
            </button>
          )}

          <Link
            to={`/customer/menu?table=${tableNumber}`}
            className="btn-billion-gold text-decoration-none"
          >
            Pesan Menu Lain
          </Link>
        </div>
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
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={() => setShowReceiptModal(false)}
                />
              </div>

              <div className="modal-body p-0 d-flex justify-content-center">
                <CustomerReceipt order={fullOrder} receiptRef={receiptRef} />
              </div>

              <div className="modal-footer border-0 justify-content-center mt-3 p-0">
                <button
                  type="button"
                  className="btn-billion-gold shadow"
                  onClick={handleDownloadReceipt}
                  style={{ maxWidth: '350px' }}
                >
                  Simpan ke Galeri (PNG)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rating Google (Desain Layar ke-3) */}
      {showReviewModal && (
        <div
          className="modal show d-block"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(216, 167, 68, 0.15), transparent 55%), rgba(10, 11, 16, 0.96)',
            backdropFilter: 'blur(10px)',
            zIndex: 1060,
            overflowY: 'auto'
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '410px', margin: '0 auto', padding: '20px 16px' }}>
            <div className="modal-content border-0 bg-transparent text-center w-100">
              {/* Garis Emas Atas di Modal */}
              <div className="status-top-divider mb-4">
                <span />
                <span className="status-divider-dot" />
                <span />
              </div>

              {/* Header Billion Coffee dengan Ornamen Emas */}
              <div className="rating-brand-header">
                <svg className="brand-ornament-svg" viewBox="0 0 220 22" fill="none">
                  <path d="M15 16 H85 C93 16 96 6 110 6 C124 6 127 16 135 16 H205" stroke="#c9973b" strokeWidth="1.2" />
                  <circle cx="110" cy="12" r="2.5" fill="#e5bd65" />
                </svg>

                <h2 className="rating-brand-title">Billion Coffee</h2>

                <svg className="brand-ornament-svg" viewBox="0 0 220 22" fill="none">
                  <path d="M15 6 H85 C93 6 96 16 110 16 C124 16 127 6 135 6 H205" stroke="#c9973b" strokeWidth="1.2" />
                  <circle cx="110" cy="10" r="2.5" fill="#e5bd65" />
                </svg>
              </div>

              {/* Card Isi Rating */}
              <div className="status-luxury-card rating-luxury-card">
                {/* Ikon Cangkir Kopi Emas (Tanpa Emoji) */}
                <div className="rating-coffee-icon">
                  <svg width="76" height="76" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Uap Kopi */}
                    <path d="M27 10C25 14 29 16 27 20" stroke="#e3bd69" strokeWidth="2" strokeLinecap="round" />
                    <path d="M35 8C33 13 37 15 35 20" stroke="#e3bd69" strokeWidth="2" strokeLinecap="round" />
                    {/* Bibir & Badan Cangkir */}
                    <ellipse cx="30" cy="26" rx="14" ry="4" stroke="#e3bd69" strokeWidth="2" fill="rgba(216, 167, 68, 0.12)" />
                    <path d="M16 26C16 37 21 44 30 44C39 44 44 37 44 26" stroke="#e3bd69" strokeWidth="2" strokeLinecap="round" />
                    {/* Gagang Cangkir */}
                    <path d="M44 29H47C50.3137 29 53 31.6863 53 35C53 38.3137 50.3137 41 47 41H41.5" stroke="#e3bd69" strokeWidth="2" strokeLinecap="round" />
                    {/* Tatakan / Saucer */}
                    <path d="M12 46C12 49.5 20 52 30 52C40 52 48 49.5 48 46" stroke="#e3bd69" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <h4 className="rating-card-heading">Lanjut rating kita yuk!</h4>

                <p className="status-card-desc mb-4">
                  Ulasan Anda sangat berharga untuk membantu Billion Coffee tumbuh lebih baik!
                </p>

                <a
                  href={googleReviewUrl || "https://google.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-billion-gold text-decoration-none"
                  onClick={() => {
                    sessionStorage.setItem(`review_prompt_shown_${orderId}`, 'true');
                    setShowReviewModal(false);
                  }}
                >
                  <span>Beri Ulasan di Google</span>
                  <Star size={16} fill="#141414" stroke="#141414" style={{ marginLeft: '7px', marginTop: '-2px' }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .billion-status-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.14), transparent 55%), #0c0d12;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 18px 40px;
        }

        .status-top-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 340px;
          margin: 4px auto 28px;
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

        .status-main-wrapper {
          width: 100%;
          max-width: 390px;
          margin: auto 0;
        }

        .status-table-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: 0.3px;
        }

        .status-customer-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }

        .status-luxury-card {
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.08), transparent 55%), #171821;
          border: 1px solid rgba(216, 167, 68, 0.48);
          border-radius: 22px;
          padding: 36px 24px 30px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 25px rgba(216, 167, 68, 0.06);
        }

        .status-icon-ring {
          width: 104px;
          height: 104px;
          margin: 0 auto 22px;
          border-radius: 50%;
          border: 2.5px solid #c9973b;
          box-shadow: inset 0 0 18px rgba(216, 167, 68, 0.14), 0 0 20px rgba(216, 167, 68, 0.1);
          background: radial-gradient(circle, rgba(216, 167, 68, 0.12), rgba(22, 23, 32, 0.92));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 23px;
          font-weight: 600;
          margin: 0 0 12px;
        }

        .status-card-desc {
          color: #e2e8f0;
          font-size: 13.5px;
          line-height: 1.55;
          max-width: 280px;
          margin: 0 auto;
        }

        .status-realtime-wrap {
          margin-top: 26px;
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

        .status-actions-group {
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 13px;
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

        /* Styling Modal Rating Google */
        .rating-brand-header {
          margin-bottom: 24px;
        }

        .brand-ornament-svg {
          width: 195px;
          height: 20px;
          display: block;
          margin: 0 auto;
        }

        .rating-brand-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 700;
          color: #e3bd69;
          margin: 4px 0;
          letter-spacing: 0.4px;
        }

        .rating-luxury-card {
          padding: 38px 24px 32px;
        }

        .rating-coffee-icon {
          margin: 0 auto 18px;
          display: flex;
          justify-content: center;
          filter: drop-shadow(0 0 12px rgba(216, 167, 68, 0.18));
        }

        .rating-card-heading {
          color: #ffffff;
          font-size: 21px;
          font-weight: 700;
          margin: 0 0 12px;
        }
      `}</style>
    </div>
  );
};

export default OrderStatus;