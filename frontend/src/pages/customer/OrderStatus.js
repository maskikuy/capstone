import React, { useState, useEffect, useRef } from 'react'; // Tambah useRef
import { useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import html2canvas from 'html2canvas'; // 1. Import library
import { CustomerReceipt } from '../../components/CustomerReceipt'; // 2. Import komponen Nota
const OrderStatus = () => {
  const location = useLocation();
  const { orderId, customerName, tableNumber } = location.state || {};

  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  
  // --- BARU: State untuk Nota ---
  const [fullOrder, setFullOrder] = useState(null); // Menyimpan data lengkap (items, harga, dll)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const receiptRef = useRef(null); // Ref untuk elemen nota
  // ------------------------------

  // --- BARU: Google Review States ---
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // --- BARU: Fetch Google Review Settings ---
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

        // --- PERBAIKAN UTAMA DI SINI ---
        // Cek apakah res.data itu Array? Jika ya, ambil elemen pertama [0]
        // Jika bukan array (objek langsung), pakai res.data apa adanya.
        const orderData = Array.isArray(res.data) ? res.data[0] : res.data; 

        // Pastikan orderData tidak kosong sebelum lanjut
        if (!orderData) return;
        // -------------------------------

        // Sekarang kita ambil items dari orderData (objek yang benar)
        let apiItems = orderData.items || orderData.order_items || orderData.products || [];

        // Fallback jika item kosong
        if (!apiItems || apiItems.length === 0) {
            if (location.state && location.state.items) {
                apiItems = location.state.items;
            }
        }

        // Gabungkan data
        const fixedData = {
            ...orderData, // Pakai orderData, BUKAN res.data
            items: apiItems 
        };

        setFullOrder(fixedData);
        
        if (fixedData.order_status) {
            setStatus(fixedData.order_status);
        }

        if (fixedData.payment_status === 'paid') {
            const shown = sessionStorage.getItem(`review_prompt_shown_${orderId}`);
            if (shown !== 'true') {
                setShowReviewModal(true);
            }
        }
        
      } catch (err) {
        console.error("Gagal ambil detail", err);
      }
    };

    // --- 2. Fungsi Update Status (Polling) ---
    const fetchStatus = async () => {
      try {
        const res = await api.get(`/order/${orderId}/getStatus`);
        
        // Update state status saja
        setStatus(res.data.order_status);

        if (res.data.payment_status === 'paid') {
            const shown = sessionStorage.getItem(`review_prompt_shown_${orderId}`);
            if (shown !== 'true') {
                setShowReviewModal(true);
            }
        }
        
        // Update fullOrder tanpa menghapus data lama
        setFullOrder(prevOrder => {
            // PERBAIKAN: Jika prevOrder belum ada, jangan return null (karena akan menghapus state)
            // Return saja prevOrder apa adanya, atau null jika memang belum siap.
            if (!prevOrder) return prevOrder; 

            return {
                ...prevOrder, // Pertahankan items dan data lain
                order_status: res.data.order_status,
                payment_status: res.data.payment_status || prevOrder.payment_status
            };
        });
      } catch (err) {
        console.error("Gagal cek status", err);
      } finally {
        setLoading(false);
      }
    };

    // --- EKSEKUSI ---
    // 1. Ambil data lengkap dulu sekali
    fetchFullDetails().then(() => {
        setLoading(false); // Matikan loading setelah data awal dapat
    });

    // 2. Pasang interval untuk cek status setiap 5 detik (bukan 60 detik agar responsif)
    // Jangan panggil fetchStatus() langsung di sini, biarkan interval yang bekerja
    const interval = setInterval(fetchStatus, 5000); 

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // --- BARU: Fungsi Download Gambar ---
  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      try {
        const element = receiptRef.current;
        
        // 1. Buat Kloningan (Copy) dari elemen nota
        // Teknik ini memindahkan nota keluar dari Modal agar bisa render FULL ke bawah
        const clone = element.cloneNode(true);

        // 2. Atur Style Kloningan
        // Kita letakkan di luar layar (off-screen) agar user tidak melihat kedipan
        Object.assign(clone.style, {
          position: 'absolute',
          top: '-10000px', // Lempar jauh ke atas
          left: '-10000px', // Lempar jauh ke kiri
          width: '380px',   // Paksa lebar fix (sesuai desain nota)
          height: 'auto',   // Biarkan tinggi otomatis memanjang ke bawah
          overflow: 'visible', // Pastikan tidak ada scrollbar
          background: 'white', // Pastikan background putih
          zIndex: '-1'
        });

        // 3. Tempel Kloningan ke Body sementara
        document.body.appendChild(clone);

        // 4. Potret Kloningan tersebut
        // windowHeight dan height diset agar html2canvas tahu ini elemen panjang
        const canvas = await html2canvas(clone, {
          scale: 2, // Resolusi tinggi (supaya teks tajam)
          backgroundColor: '#ffffff',
          windowHeight: clone.scrollHeight,
          height: clone.scrollHeight,
          useCORS: true // Aman jika ada gambar logo eksternal
        });

        // 5. Hapus Kloningan (Bersih-bersih)
        document.body.removeChild(clone);

        // 6. Proses Download
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
  // ------------------------------------

  if (!orderId) {
    return (
      <div className="container text-center pt-5">
        <h3>Data pesanan tidak ditemukan.</h3>
        <Link to="/customer/menu" className="btn btn-primary mt-3">Kembali ke Menu</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="spinner-border text-warning" style={{width: '3rem', height: '3rem'}} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Mengambil status pesanan...</p>
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
          color: 'bg-secondary'
        };
      case 'processing':
        return {
          icon: '👨‍🍳',
          title: 'Sedang Dimasak',
          desc: 'Koki kami sedang menyiapkan hidangan spesial untukmu!',
          color: 'bg-warning text-dark'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'Siap Disajikan',
          desc: 'Pesananmu sudah siap! Silakan nikmati.',
          color: 'bg-success'
        };
      case 'cancelled':
        return {
          icon: '❌',
          title: 'Pesanan Dibatalkan',
          desc: 'Maaf, pesanan ini telah dibatalkan.',
          color: 'bg-danger'
        };
      default:
        return { icon: '?', title: 'Status Tidak Diketahui', desc: '', color: 'bg-secondary' };
    }
  };

  const info = getStatusDisplay();

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100 px-4">
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-0">Meja {tableNumber}</h1>
        <p className="text-muted">A.n. {customerName}</p>
      </div>

      <div className={`card border-0 shadow-lg text-white text-center p-4 w-100 ${info.color}`} style={{maxWidth: '400px', borderRadius: '20px'}}>
        <div style={{fontSize: '4rem', marginBottom: '10px'}}>{info.icon}</div>
        <h2 className="fw-bold">{info.title}</h2>
        <p className="mb-0 opacity-75">{info.desc}</p>
        
        {status !== 'completed' && status !== 'cancelled' && (
          <div className="mt-4">
            <div className="spinner-border spinner-border-sm" role="status"></div>
            <small className="ms-2">Mengupdate status...</small>
          </div>
        )}
      </div>

      {/* --- BARU: Tombol Download Nota & Pesan Lagi --- */}
      <div className="mt-4 d-grid gap-2 w-100" style={{maxWidth: '400px'}}>
        
        {/* Tombol hanya muncul jika data fullOrder sudah ada */}
        {fullOrder && (
            <button 
                onClick={() => setShowReceiptModal(true)}
                className="btn btn-outline-primary rounded-pill py-2"
            >
                <i className="bi bi-receipt me-2"></i> Lihat & Simpan Nota
            </button>
        )}

        <Link to={`/customer/menu?table=${tableNumber}`} className="btn btn-outline-dark rounded-pill py-2">
          📖 Pesan Menu Lain
        </Link>
      </div>
      {/* ----------------------------------------------- */}


      {/* --- BARU: Modal Preview Nota --- */}
      {showReceiptModal && fullOrder && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055, overflowY: 'auto'}}>
          
          {/* PERBAIKAN DI SINI: Hapus 'modal-dialog-scrollable' */}
          <div className="modal-dialog modal-dialog-centered"> 
            
            <div className="modal-content" style={{ backgroundColor: 'transparent', border: 'none' }}>
              
              {/* Header kita sembunyikan atau buat transparan agar fokus ke struk */}
              <div className="modal-header border-0 p-0 mb-2">
                 <button className="btn-close btn-close-white ms-auto" onClick={() => setShowReceiptModal(false)}></button>
              </div>
              
              <div className="modal-body p-0 d-flex justify-content-center">
                {/* Komponen Nota */}
                <CustomerReceipt order={fullOrder} receiptRef={receiptRef} />
              </div>

              <div className="modal-footer border-0 justify-content-center mt-3 p-0">
                <button 
                  className="btn btn-success fw-bold w-100 py-3 shadow" 
                  onClick={handleDownloadReceipt}
                  style={{ maxWidth: '350px', borderRadius: '50px' }}
                >
                  <i className="bi bi-download me-2"></i> Simpan ke Galeri (PNG)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --------------------      {/* --- MODAL RATING GOOGLE --- */}
      {showReviewModal && (
        <div className="modal show d-block animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg text-center" style={{ borderRadius: '20px', overflow: 'hidden', maxWidth: '400px', margin: '0 auto' }}>
              
              {/* Header */}
              <div className="modal-header bg-warning text-dark border-0 py-3 text-center">
                <h5 className="modal-title fw-bold mx-auto">Billion Coffee</h5>
              </div>

              {/* Body */}
              <div className="modal-body p-4">
                <div className="fs-1 mb-2">☕🥰</div>
                <h4 className="fw-bold mb-3">Lanjut rating kita yuk :)</h4>
                <p className="text-muted small mb-4">Ulasan Anda sangat berharga untuk membantu Billion Coffee tumbuh lebih baik!</p>
                
                <div className="d-grid gap-2">
                  <a 
                    href={googleReviewUrl || "https://google.com"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-warning fw-bold text-dark py-3 rounded-pill shadow-sm"
                    style={{ fontSize: '1.1rem' }}
                    onClick={() => {
                      sessionStorage.setItem(`review_prompt_shown_${orderId}`, 'true');
                      setShowReviewModal(false);
                    }}
                  >
                    Lanjuttt
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