
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError } from '../../utils/notify';

const QrisSettings = () => {
  const [loading, setLoading] = useState(true);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchGoogleSettings = useCallback(async () => {
    setLoading(true);

    try {
      const res = await api.get('/settings');
      setGoogleReviewUrl(res.data.google_review_url || '');
    } catch (err) {
      console.error('Gagal mengambil pengaturan Google:', err);
      notifyError('Gagal memuat pengaturan Google Review');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoogleSettings();
  }, [fetchGoogleSettings]);

  const handleSaveGoogleSettings = async (e) => {
    e.preventDefault();

    if (!googleReviewUrl.trim()) {
      notifyError('Link Google Review wajib diisi');
      return;
    }

    setSavingSettings(true);

    try {
      await api.put('/settings', {
        google_review_url: googleReviewUrl.trim()
      });

      notifySuccess('Link Google Review berhasil disimpan!');
    } catch (err) {
      console.error('Gagal menyimpan pengaturan:', err);
      notifyError('Gagal menyimpan Link Google Review');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#101116',
        color: '#f1f5f9',
        minHeight: 'calc(100vh - 70px)',
        padding: '40px 20px 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >

      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto'
        }}
      >

        {/* Page Heading */}
        <div
          className="text-center"
          style={{
            marginBottom: '35px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '3px',
              backgroundColor: '#d8a744',
              borderRadius: '10px',
              margin: '0 auto 18px'
            }}
          />

          <span
            style={{
              display: 'block',
              color: '#d8a744',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '2.5px',
              marginBottom: '12px'
            }}
          >
            BILLION CAFE
          </span>

          <h2
            style={{
              color: '#f1f5f9',
              fontWeight: '750',
              fontSize: 'clamp(25px, 4vw, 32px)',
              letterSpacing: '-0.8px',
              marginBottom: '12px'
            }}
          >
            Google Review
          </h2>

          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              lineHeight: '1.8',
              maxWidth: '450px',
              margin: '0 auto'
            }}
          >
            Kelola tautan ulasan Google untuk memudahkan pelanggan
            memberikan penilaian dan pengalaman mereka terhadap Billion Cafe.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="d-flex justify-content-center align-items-center py-5"
          >
            <div
              className="spinner-border"
              style={{
                color: '#d8a744',
                width: '30px',
                height: '30px'
              }}
              role="status"
            />
          </div>
        )}

        {/* Google Review Card */}
        {!loading && (
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              margin: '0 auto',
              background: 'linear-gradient(145deg, #191a25 0%, #151620 100%)',
              border: '1px solid #2a2d40',
              borderRadius: '20px',
              padding: 'clamp(22px, 5vw, 36px)',
              boxShadow: '0 15px 45px rgba(0,0,0,0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >

            {/* Gold Accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '36px',
                width: '65px',
                height: '3px',
                backgroundColor: '#d8a744',
                borderRadius: '0 0 5px 5px'
              }}
            />

            {/* Card Heading */}
            <div
              style={{
                marginBottom: '30px',
                paddingTop: '8px'
              }}
            >
              <h4
                style={{
                  color: '#f1f5f9',
                  fontSize: '19px',
                  fontWeight: '700',
                  marginBottom: '9px'
                }}
              >
                Pengaturan Link Ulasan
              </h4>

              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '12.5px',
                  lineHeight: '1.7',
                  margin: 0
                }}
              >
                Masukkan tautan Google Review resmi Billion Cafe
                yang akan digunakan oleh pelanggan.
              </p>
            </div>

            <form onSubmit={handleSaveGoogleSettings}>

              {/* URL Input */}
              <div style={{ marginBottom: '24px' }}>

                <label
                  htmlFor="googleReviewUrl"
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    marginBottom: '11px'
                  }}
                >
                  Link Google Review
                </label>

                <input
                  id="googleReviewUrl"
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  required
                  autoComplete="off"
                  style={{
                    width: '100%',
                    height: '49px',
                    backgroundColor: '#0d0e17',
                    border: '1px solid #303348',
                    borderRadius: '10px',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    padding: '0 15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    minWidth: 0
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#d8a744';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#303348';
                  }}
                />

                <p
                  style={{
                    color: '#64748b',
                    fontSize: '11px',
                    lineHeight: '1.7',
                    marginTop: '10px',
                    marginBottom: 0
                  }}
                >
                  Gunakan link yang langsung mengarahkan pelanggan
                  ke halaman pemberian ulasan Billion Cafe di Google.
                </p>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#2a2d40',
                  marginBottom: '22px'
                }}
              />

              {/* Save Button */}
              <button
                type="submit"
                disabled={savingSettings || !googleReviewUrl.trim()}
                style={{
                  width: '100%',
                  height: '47px',
                  backgroundColor: '#d8a744',
                  color: '#15151b',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '0.2px',
                  cursor: savingSettings || !googleReviewUrl.trim()
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: savingSettings || !googleReviewUrl.trim()
                    ? 0.65
                    : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!savingSettings && googleReviewUrl.trim()) {
                    e.currentTarget.style.backgroundColor = '#e6b957';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#d8a744';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>

            </form>

          </div>
        )}

        {/* Footer Note */}
        {!loading && (
          <div
            className="text-center"
            style={{
              marginTop: '24px'
            }}
          >
            <p
              style={{
                color: '#64748b',
                fontSize: '11px',
                lineHeight: '1.7',
                margin: 0
              }}
            >
              BILLION CAFE · APPLICATION SETTINGS
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default QrisSettings;
