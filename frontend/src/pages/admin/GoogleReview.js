import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError } from '../../utils/notify';

const GoogleReview = () => {
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
                Tautan ini otomatis dibuka oleh pelanggan saat memberikan ulasan pada halaman ulasan.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGoogleSettings}>
              <div
                style={{
                  marginBottom: '26px'
                }}
              >
                <label
                  htmlFor="googleReviewUrl"
                  style={{
                    display: 'block',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    marginBottom: '10px'
                  }}
                >
                  Link Google Maps / Review
                </label>

                <div
                  className="input-group"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  <span
                    className="input-group-text"
                    style={{
                      backgroundColor: '#1e212f',
                      borderColor: '#2f3448',
                      color: '#d8a744',
                      padding: '12px 14px'
                    }}
                  >
                    <i className="bi bi-google" />
                  </span>

                  <input
                    type="url"
                    id="googleReviewUrl"
                    className="form-control"
                    placeholder="https://g.page/r/.../review"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    required
                    style={{
                      backgroundColor: '#13141d',
                      borderColor: '#2f3448',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      padding: '12px 14px'
                    }}
                  />
                </div>

                <small
                  style={{
                    display: 'block',
                    color: '#64748b',
                    fontSize: '11px',
                    marginTop: '8px'
                  }}
                >
                  Contoh: https://g.page/r/billion-cafe/review
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn d-inline-flex align-items-center gap-2"
                  style={{
                    backgroundColor: '#d8a744',
                    borderColor: '#d8a744',
                    color: '#101116',
                    fontSize: '13px',
                    fontWeight: '700',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 20px rgba(216, 167, 68, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {savingSettings ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleReview;
