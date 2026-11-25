import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0e0f14',
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(216, 167, 68, 0.08) 0%, rgba(14, 15, 20, 0) 70%)',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px',
      }}
    >
      <div
        className="text-center"
        style={{
          maxWidth: '520px',
          width: '100%',
        }}
      >
        {/* Glow & Coffee Icon Container */}
        <div className="position-relative d-inline-block mb-4">
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(216, 167, 68, 0.25) 0%, rgba(216, 167, 68, 0) 70%)',
              filter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '28px',
              backgroundColor: '#161822',
              border: '1px solid rgba(216, 167, 68, 0.3)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Coffee size={52} color="#e5c165" strokeWidth={1.8} className="coffee-float" />
          </div>
        </div>

        {/* Error Code Tag */}
        <div className="mb-2">
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#e5c165',
              backgroundColor: 'rgba(216, 167, 68, 0.12)',
              border: '1px solid rgba(216, 167, 68, 0.25)',
            }}
          >
            Error 404
          </span>
        </div>

        {/* Main Heading */}
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            marginBottom: '12px',
          }}
        >
          Cangkir Kopinya Kosong!
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#94a3b8',
            maxWidth: '440px',
            margin: '0 auto 28px',
          }}
        >
          Waduh, halaman yang Anda cari sepertinya belum diseduh barista kami, sudah dipindahkan, atau alamat URL salah.
        </p>

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="btn d-inline-flex align-items-center justify-content-center"
            style={{
              padding: '12px 22px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#e2e8f0',
              backgroundColor: '#1a1d29',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#232738';
              e.currentTarget.style.borderColor = 'rgba(216, 167, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1d29';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ArrowLeft size={16} className="me-2" />
            Kembali
          </button>

          <button
            onClick={() => navigate('/')}
            type="button"
            className="btn d-inline-flex align-items-center justify-content-center text-dark"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e5c165 0%, #d8a744 50%, #b88728 100%)',
              border: 'none',
              boxShadow: '0 4px 18px rgba(216, 167, 68, 0.25)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(216, 167, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(216, 167, 68, 0.25)';
            }}
          >
            <Home size={16} className="me-2 text-dark" />
            Menu Utama
          </button>
        </div>

        {/* Footer Branding */}
        <div
          className="mt-5 pt-3"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#64748b',
            fontSize: '13px',
          }}
        >
          <span>Powered by </span>
          <span style={{ color: '#e5c165', fontWeight: 600 }}>Billion Coffee System</span>
        </div>
      </div>

      {/* Floating animation */}
      <style>
        {`
          @keyframes coffeeFloat {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-8px) rotate(-3deg);
            }
          }
          .coffee-float {
            animation: coffeeFloat 3.5s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default NotFound;
