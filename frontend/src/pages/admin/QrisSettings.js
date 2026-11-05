import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';
import { QrCode, Star, Upload, Trash2, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '100vh', padding: '24px 28px 60px' }}>
      
      {/* Title */}
      <div className="mb-4">
        <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 6px' }}>
          Pengaturan Aplikasi
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          Kelola pembayaran QRIS statis dan integrasi Google Review kafe
        </p>
      </div>

      {/* Tabs */}
      <div className="d-flex align-items-center gap-3 mb-4" style={{ borderBottom: '1px solid #23253a', paddingBottom: '2px' }}>
        <button 
          type="button"
          onClick={() => setActiveTab('qris')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: activeTab === 'qris' ? '#d8a744' : '#94a3b8',
            fontWeight: activeTab === 'qris' ? '700' : '500',
            fontSize: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'qris' ? '2.5px solid #d8a744' : '2.5px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <QrCode size={16} />
          <span>QRIS Pembayaran</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('google')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: activeTab === 'google' ? '#d8a744' : '#94a3b8',
            fontWeight: activeTab === 'google' ? '700' : '500',
            fontSize: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'google' ? '2.5px solid #d8a744' : '2.5px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Star size={16} />
          <span>Google Review & Filter Rating</span>
        </button>
      </div>

      {loading && !previewUrl && !savingSettings && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border" style={{ color: '#d8a744' }} role="status"></div>
        </div>
      )}

      {/* Tab 1: QRIS */}
      {!loading && activeTab === 'qris' && (
        <>
          {/* Status banner */}
          <div 
            style={{
              backgroundColor: '#161720',
              border: '1px solid #23253a',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <h5 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>
                Status QRIS Aktif
              </h5>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                {qrisExists 
                  ? 'Sistem saat ini menampilkan gambar QRIS statis yang diunggah oleh kasir/admin.' 
                  : 'Belum ada gambar QRIS statis. Sistem otomatis fallback ke QRIS Dinamis.'}
              </p>
            </div>
            <div>
              {qrisExists ? (
                <span 
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid #166534',
                    color: '#4ade80',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={14} />
                  QRIS Statis (Aktif)
                </span>
              ) : (
                <span 
                  style={{
                    backgroundColor: 'rgba(216, 167, 68, 0.12)',
                    border: '1px solid #785a28',
                    color: '#d8a744',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertCircle size={14} />
                  QRIS Dinamis (Fallback)
                </span>
              )}
            </div>
          </div>

          <div className="row g-4">
            {/* Upload Area */}
            <div className="col-md-6">
              <div 
                style={{
                  backgroundColor: '#161720',
                  border: '1px solid #23253a',
                  borderRadius: '14px',
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h6 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '16px' }}>
                    Upload Gambar QRIS Baru
                  </h6>

                  <form onSubmit={handleUpload}>
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: isDragActive ? '2px dashed #d8a744' : '2px dashed #2d3045',
                        backgroundColor: isDragActive ? 'rgba(216, 167, 68, 0.05)' : '#0d0e17',
                        borderRadius: '12px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        transition: 'all 0.2s ease',
                        minHeight: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <input 
                        type="file" 
                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', top: 0, left: 0 }}
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      <Upload size={32} color="#c9973b" style={{ marginBottom: '10px' }} />
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>
                        Pilih gambar atau seret file ke sini
                      </p>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                        Mendukung format PNG, JPG, JPEG
                      </p>
                    </div>

                    {previewUrl && (
                      <div className="mb-3 text-center">
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Preview Gambar Baru:</p>
                        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '10px', display: 'inline-block' }}>
                          <img 
                            src={previewUrl} 
                            alt="Preview Upload" 
                            style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px' }} 
                          />
                        </div>
                      </div>
                    )}

                    {selectedFile && (
                      <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                          backgroundColor: '#c9973b',
                          color: '#101116',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          width: '100%',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
                      >
                        {loading ? 'Mengunggah...' : '✓ Simpan QRIS Statis'}
                      </button>
                    )}
                  </form>
                </div>

                {selectedFile && (
                  <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                    disabled={loading}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #2d3045',
                      color: '#94a3b8',
                      borderRadius: '8px',
                      padding: '9px',
                      fontSize: '12.5px',
                      width: '100%',
                      marginTop: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>

            {/* Current QRIS Preview */}
            <div className="col-md-6">
              <div 
                style={{
                  backgroundColor: '#161720',
                  border: '1px solid #23253a',
                  borderRadius: '14px',
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '100%' }}>
                  <h6 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '16px' }}>
                    Tampilan QRIS Saat Ini
                  </h6>
                </div>

                <div className="my-auto text-center py-3">
                  {qrisExists && qrisImageUrl ? (
                    <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
                      <img 
                        src={qrisImageUrl} 
                        alt="Current QRIS" 
                        style={{ maxWidth: '190px', maxHeight: '190px', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div 
                      style={{
                        width: '190px',
                        height: '190px',
                        border: '2px dashed #2d3045',
                        backgroundColor: '#0d0e17',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                      }}
                    >
                      <QrCode size={38} color="#3b4252" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px', textAlign: 'center', padding: '0 12px' }}>
                        Menggunakan QRIS Dinamis Otomatis
                      </span>
                    </div>
                  )}
                </div>

                {qrisExists && (
                  <button 
                    onClick={handleDelete}
                    disabled={loading}
                    style={{
                      backgroundColor: '#7f1d1d',
                      border: 'none',
                      color: '#fca5a5',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      width: '100%',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '16px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#991b1b'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                  >
                    <Trash2 size={14} />
                    <span>Hapus Gambar QRIS Statis</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Google Review */}
      {!loading && activeTab === 'google' && (
        <div 
          style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '14px',
            padding: '28px',
            maxWidth: '800px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
          }}
        >
          <div className="mb-4">
            <h5 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '16px', margin: '0 0 8px' }}>
              Pengaturan Google Review & Filter Rating Bintang
            </h5>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              Konfigurasikan tautan Google Review kafe Anda. Sistem filter cerdas akan mengarahkan kepuasan pelanggan (bintang tinggi) langsung ke profil Google Maps bisnis Anda, sedangkan keluhan (bintang rendah) ditampung secara internal untuk perbaikan tim.
            </p>
          </div>

          <form onSubmit={handleSaveGoogleSettings}>
            {/* Google Review URL */}
            <div className="mb-4">
              <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>
                Link Profil Google Review Restoran
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <LinkIcon size={16} />
                </span>
                <input 
                  type="url" 
                  placeholder="https://search.google.com/local/writereview?placeid=..." 
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingLeft: '40px' }}
                />
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                Masukkan URL langsung menu &quot;Write a review&quot; dari Google Business Profile.
              </div>
            </div>

            {/* Review Threshold */}
            <div className="mb-4">
              <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>
                Ambang Batas Filter Bintang
              </label>
              <select 
                value={reviewThreshold}
                onChange={(e) => setReviewThreshold(e.target.value)}
                style={inputStyle}
              >
                <option value="5">⭐⭐⭐⭐⭐ — Bintang 5 Saja (Paling Ketat)</option>
                <option value="4">⭐⭐⭐⭐ — Bintang 4 & 5 (Rekomendasi Standar)</option>
                <option value="3">⭐⭐⭐ — Bintang 3 ke atas</option>
              </select>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                Rating sama atau di atas ambang batas diarahkan ke Google Review. Rating di bawahnya akan ditampung di kotak kritik internal.
              </div>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={savingSettings}
              style={{
                backgroundColor: '#c9973b',
                color: '#101116',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
            >
              {savingSettings ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  backgroundColor: '#0d0e17',
  border: '1px solid #2a2d45',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '13px',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};

export default QrisSettings;
