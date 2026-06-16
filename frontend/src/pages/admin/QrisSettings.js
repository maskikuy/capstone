import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';

const QrisSettings = () => {
  const [activeTab, setActiveTab] = useState('qris');
  const [loading, setLoading] = useState(true);
  
  // QRIS states
  const [qrisExists, setQrisExists] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Google Review states
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [reviewThreshold, setReviewThreshold] = useState('4');
  const [savingSettings, setSavingSettings] = useState(false);

  const getBaseServerUrl = () => {
    return api.defaults.baseURL.replace('/api', '');
  };

  const fetchQrisStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/qris-static');
      if (res.data.exists) {
        setQrisExists(true);
        const serverUrl = getBaseServerUrl();
        setQrisImageUrl(`${serverUrl}/${res.data.qris_image}`);
      } else {
        setQrisExists(false);
        setQrisImageUrl('');
      }
    } catch (err) {
      console.error('Gagal mengambil status QRIS:', err);
      notifyError('Gagal memuat status QRIS');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGoogleSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setGoogleReviewUrl(res.data.google_review_url || '');
      setReviewThreshold(res.data.review_threshold || '4');
    } catch (err) {
      console.error('Gagal mengambil pengaturan Google:', err);
      notifyError('Gagal memuat pengaturan Google Review');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'qris') {
      fetchQrisStatus();
    } else {
      fetchGoogleSettings();
    }
  }, [activeTab, fetchQrisStatus, fetchGoogleSettings]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.match('image.*')) {
      notifyError('Hanya file gambar yang diperbolehkan!');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      setLoading(true);
      await api.post('/qris-static', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      notifySuccess('Gambar QRIS Statis berhasil diunggah!');
      setSelectedFile(null);
      setPreviewUrl('');
      fetchQrisStatus();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.error || 'Gagal mengunggah QRIS Statis');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirmAction(
      'Hapus QRIS Statis?',
      'Apakah Anda yakin ingin menghapus gambar QRIS statis? Sistem akan kembali ke mode QRIS Dinamis otomatis.'
    );

    if (isConfirmed) {
      try {
        setLoading(true);
        await api.delete('/qris-static');
        notifySuccess('Gambar QRIS Statis berhasil dihapus!');
        fetchQrisStatus();
      } catch (err) {
        console.error(err);
        notifyError(err.response?.data?.error || 'Gagal menghapus QRIS Statis');
        setLoading(false);
      }
    }
  };

  const handleSaveGoogleSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/settings', {
        google_review_url: googleReviewUrl,
        review_threshold: reviewThreshold
      });
      notifySuccess('Pengaturan Google Review berhasil disimpan!');
    } catch (err) {
      console.error(err);
      notifyError('Gagal menyimpan pengaturan Google Review');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pengaturan Aplikasi</h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 bg-light p-1 rounded" style={{ display: 'inline-flex' }}>
        <li className="nav-item">
          <button 
            className={`nav-link rounded px-4 py-2 border-0 fw-bold ${activeTab === 'qris' ? 'active bg-warning text-dark shadow-sm' : 'text-secondary bg-transparent'}`}
            onClick={() => setActiveTab('qris')}
          >
            📱 QRIS Pembayaran
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link rounded px-4 py-2 border-0 fw-bold ${activeTab === 'google' ? 'active bg-warning text-dark shadow-sm' : 'text-secondary bg-transparent'}`}
            onClick={() => setActiveTab('google')}
          >
            ⭐ Google Review & Rating
          </button>
        </li>
      </ul>

      {loading && !previewUrl && !savingSettings && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      )}

      {/* Tab 1: QRIS */}
      {!loading && activeTab === 'qris' && (
        <>
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold mb-1">Status QRIS Aktif</h5>
                <p className="text-muted small mb-0">
                  {qrisExists 
                    ? 'Sistem saat ini menampilkan gambar QRIS statis yang diunggah oleh Anda.' 
                    : 'Belum ada gambar QRIS yang diunggah. Sistem menggunakan QRIS Dinamis (Fallback).'}
                </p>
              </div>
              <div>
                {qrisExists ? (
                  <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">
                    🟢 QRIS Statis (Aktif)
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark px-3 py-2 fs-6 rounded-pill">
                    🟡 QRIS Dinamis (Fallback)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px' }}>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                      Upload Gambar QRIS Baru
                    </h6>
                    
                    <form onSubmit={handleUpload}>
                      <div 
                        className={`border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer mb-3 position-relative ${isDragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{ transition: 'all 0.2s', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <input 
                          type="file" 
                          className="position-absolute w-100 h-100 opacity-0 cursor-pointer"
                          style={{ top: 0, left: 0 }}
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                        <div className="mb-2 fs-2">📤</div>
                        <p className="small mb-1 fw-bold">Pilih gambar atau drop di sini</p>
                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>Mendukung PNG, JPG, JPEG, GIF</p>
                      </div>

                      {previewUrl && (
                        <div className="mb-3 text-center">
                          <p className="small text-muted mb-1">Preview Gambar Baru:</p>
                          <img 
                            src={previewUrl} 
                            alt="Preview Upload" 
                            className="img-thumbnail" 
                            style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '10px' }} 
                          />
                        </div>
                      )}

                      {selectedFile && (
                        <button 
                          type="submit" 
                          className="btn btn-primary w-100 py-2 fw-bold"
                          style={{ borderRadius: '10px' }}
                          disabled={loading}
                        >
                          {loading ? 'Mengunggah...' : 'Simpan Perubahan'}
                        </button>
                      )}
                    </form>
                  </div>

                  {selectedFile && (
                    <button 
                      className="btn btn-outline-secondary w-100 mt-2 py-2"
                      style={{ borderRadius: '10px' }}
                      onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                      disabled={loading}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100 text-center" style={{ borderRadius: '15px' }}>
                <div className="card-body p-4 d-flex flex-column justify-content-between align-items-center">
                  <h6 className="fw-bold text-uppercase text-muted mb-3 w-100 text-start" style={{ fontSize: '0.8rem' }}>
                    Tampilan QRIS Saat Ini
                  </h6>
                  
                  <div className="flex-grow-1 d-flex align-items-center justify-content-center my-3">
                    {qrisExists && qrisImageUrl ? (
                      <div className="p-3 border rounded-3 bg-white shadow-sm">
                        <img 
                          src={qrisImageUrl} 
                          alt="Current QRIS" 
                          className="img-fluid" 
                          style={{ maxWidth: '180px', maxHeight: '180px' }}
                        />
                      </div>
                    ) : (
                      <div className="text-muted p-4 border rounded-3 bg-light" style={{ width: '180px', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="fs-3 mb-2">🔄</div>
                        <span className="small">Menggunakan QRIS Dinamis</span>
                      </div>
                    )}
                  </div>

                  {qrisExists && (
                    <button 
                      className="btn btn-outline-danger w-100 py-2 fw-bold"
                      style={{ borderRadius: '10px' }}
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      🗑️ Hapus QRIS Statis
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Google Review */}
      {!loading && activeTab === 'google' && (
        <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Pengaturan Google Review & Filter Rating</h5>
            <p className="text-muted small mb-4">
              Konfigurasikan tautan Google Review restoran Anda. Sistem filter rating bintang pintar kami membantu menyaring ulasan negatif dengan mengarahkan ulasan positif (bintang tinggi) ke Google Review publik, sementara kritik (bintang rendah) ditampung sebagai saran internal.
            </p>

            <form onSubmit={handleSaveGoogleSettings}>
              {/* Google Review URL */}
              <div className="mb-4">
                <label className="form-label fw-bold">Link Google Review Restoran</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">🔗</span>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://search.google.com/local/writereview?placeid=..." 
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text small text-muted">
                  Masukkan link langsung "Write a Review" dari Google Maps profil bisnis Anda.
                </div>
              </div>

              {/* Review Threshold */}
              <div className="mb-4">
                <label className="form-label fw-bold">Batas Threshold Bintang (Rating Filter)</label>
                <select 
                  className="form-select" 
                  value={reviewThreshold}
                  onChange={(e) => setReviewThreshold(e.target.value)}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Hanya bintang 5 yang ke Google)</option>
                  <option value="4">⭐⭐⭐⭐ (Bintang 4 & 5 ke Google)</option>
                  <option value="3">⭐⭐⭐ (Bintang 3 ke atas ke Google)</option>
                </select>
                <div className="form-text small text-muted">
                  Bintang yang sama atau di atas threshold akan dialihkan langsung ke Google Review untuk meningkatkan popularitas kafe Anda. Bintang di bawah threshold akan mengaktifkan form saran internal restoran.
                </div>
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                className="btn btn-warning px-4 py-2 fw-bold text-dark"
                style={{ borderRadius: '10px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrisSettings;
