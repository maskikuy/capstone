import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../../utils/api';
import { notifySuccess, notifyError } from '../../utils/notify';
import { Printer } from 'lucide-react';

const QRCodeGenerator = () => {
  const [startNum, setStartNum] = useState(1);
  const [endNum,   setEndNum]   = useState(10);
  const [baseUrl,  setBaseUrl]  = useState(() => localStorage.getItem('qr_base_url') || '');
  const [detectedIp, setDetectedIp] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [settingsRes, infoRes] = await Promise.allSettled([
          api.get('/settings'),
          api.get('/server-info'),
        ]);

        let serverIp = '';
        if (infoRes.status === 'fulfilled' && infoRes.value.data?.primaryIp) {
          serverIp = infoRes.value.data.primaryIp;
          setDetectedIp(serverIp);
        }

        const localSaved = localStorage.getItem('qr_base_url');
        const dbSaved = settingsRes.status === 'fulfilled'
          ? settingsRes.value.data?.table_qr_base_url : null;

        if (dbSaved) {
          setBaseUrl(dbSaved);
          localStorage.setItem('qr_base_url', dbSaved);
        } else if (localSaved) {
          setBaseUrl(localSaved);
        } else if (serverIp && serverIp !== 'localhost') {
          const auto = `http://${serverIp}:3000`;
          setBaseUrl(auto);
          localStorage.setItem('qr_base_url', auto);
        }
      } catch (err) {
        console.error('Error fetching QR config:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleBaseUrlChange = (val) => {
    setBaseUrl(val);
    localStorage.setItem('qr_base_url', val);
  };

  const handleUseDetectedIp = () => {
    if (detectedIp) {
      const url = `http://${detectedIp}:3000`;
      setBaseUrl(url);
      localStorage.setItem('qr_base_url', url);
      saveToDatabase(url);
    }
  };

  const saveToDatabase = async (urlToSave = baseUrl) => {
    if (!urlToSave) { notifyError('Base URL tidak boleh kosong!'); return; }
    setIsSaving(true);
    try {
      localStorage.setItem('qr_base_url', urlToSave);
      await api.put('/settings', { table_qr_base_url: urlToSave });
      notifySuccess('Base URL berhasil disimpan!');
    } catch (err) {
      notifyError('Gagal menyimpan: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => window.print();

  // Build table numbers array
  const tables = [];
  for (let i = parseInt(startNum) || 1; i <= (parseInt(endNum) || 1); i++) {
    tables.push(i);
  }

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '100vh', padding: '28px 32px 60px' }}>

      {/* ── Header ── */}
      <h3 className="d-print-none" style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 20px' }}>
        Kelola QR Code Meja
      </h3>

      {/* ── Config Card ── */}
      <div className="d-print-none" style={{
        backgroundColor: '#161720',
        border: '1px solid #23253a',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '28px'
      }}>
        {/* Info box */}
        <div style={{
          backgroundColor: '#1a1f35',
          border: '1px solid #2e3566',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#94a3b8',
          lineHeight: '1.6'
        }}>
          <span style={{ color: '#f1f5f9', fontWeight: '600' }}>Penting: </span>
          Pastikan &quot;Base URL&quot; menggunakan{' '}
          <span style={{ color: '#d8a744', fontWeight: '600' }}>IP Address</span>{' '}
          komputer Anda (contoh: 192.168.1.5) bukan localhost, agar bisa discan oleh HP pelanggan yang terhubung di WiFi yang sama.
          {detectedIp && (
            <span style={{ marginLeft: '8px' }}>
              — IP terdeteksi:{' '}
              <button
                type="button"
                onClick={handleUseDetectedIp}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: '#4ade80', fontWeight: '700', cursor: 'pointer',
                  fontSize: '13px', textDecoration: 'underline'
                }}
              >
                {detectedIp}
              </button>
            </span>
          )}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Base URL */}
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              Base URL (Frontend)
            </label>
            <input
              type="text"
              placeholder="http://192.168.10.97:3000"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Mulai Meja */}
          <div style={{ flex: '0 0 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              Mulai Meja No.
            </label>
            <input
              type="number"
              value={startNum}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                let v = e.target.value;
                if (v.length > 1 && v.startsWith('0')) v = v.replace(/^0+/, '');
                setStartNum(v);
              }}
              style={inputStyle}
              min="1"
            />
          </div>

          {/* Sampai Meja */}
          <div style={{ flex: '0 0 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              Sampai Meja No.
            </label>
            <input
              type="number"
              value={endNum}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                let v = e.target.value;
                if (v.length > 1 && v.startsWith('0')) v = v.replace(/^0+/, '');
                setEndNum(v);
              }}
              style={inputStyle}
              min="1"
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '1px' }}>
            <button
              onClick={() => saveToDatabase(baseUrl)}
              disabled={isSaving}
              style={{
                backgroundColor: '#1e3a2f',
                border: '1.5px solid #166534',
                color: '#4ade80',
                fontWeight: '600',
                fontSize: '13px',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#166534'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1e3a2f'; e.currentTarget.style.color = '#4ade80'; }}
            >
              {isSaving ? 'Menyimpan...' : '💾 Simpan'}
            </button>

            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#c9973b',
                border: 'none',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13px',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
            >
              <Printer size={15} />
              Cetak QR Codes
            </button>
          </div>
        </div>
      </div>

      {/* ── QR Grid ── */}
      <div
        ref={printRef}
        id="printable-area"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {tables.map((num) => {
          const qrValue = `${(baseUrl || '').replace(/\/+$/, '')}/customer/menu?table=${num}`;
          return (
            <div key={num} className="page-break qr-card">
              <svg
                className="qr-card-waves"
                viewBox="0 0 400 320"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M-30 65 C55 5 110 120 205 62 S345 12 435 72" />
                <path d="M-30 83 C55 23 110 138 205 80 S345 30 435 90" />
                <path d="M-30 245 C55 185 110 300 205 242 S345 192 435 252" />
                <path d="M-30 263 C55 203 110 318 205 260 S345 210 435 270" />
              </svg>
              <div className="qr-card-header">
                <div className="qr-card-brand">
                  <span className="qr-brand-mark" aria-hidden="true">B</span>
                  <span>BILLION CAFE</span>
                </div>
                <div className="qr-card-tagline">
                  <span>PESAN DI SINI</span>
                  <span className="qr-tagline-highlight">TANPA ANTRI</span>
                </div>
              </div>

              <div className="qr-card-content">
                <div className="qr-code-panel">
                  <QRCode
                    size={160}
                    value={qrValue}
                    viewBox="0 0 256 256"
                    style={{ width: '100%', height: 'auto', maxWidth: '160px' }}
                  />
                </div>

                <div className="qr-instructions" aria-label="Cara memesan">
                  <div className="qr-step">
                    <span className="qr-step-number">1</span>
                    <span className="qr-step-label">SCAN<br />QR Code</span>
                  </div>
                  <div className="qr-step">
                    <span className="qr-step-number">2</span>
                    <span className="qr-step-label">PILIH &amp;<br />PESAN</span>
                  </div>
                  <div className="qr-step">
                    <span className="qr-step-number">3</span>
                    <span className="qr-step-label">BAYAR</span>
                  </div>
                  <div className="qr-step">
                    <span className="qr-step-number">4</span>
                    <span className="qr-step-label">AMBIL /<br />DIANTAR</span>
                  </div>
                  <span className="qr-step-note">Pesanan akan diantar ke meja Anda</span>
                </div>
              </div>

              <div className="qr-card-footer">
                <div className="qr-table-title">MEJA <strong>{num}</strong></div>
                <div className="qr-footer-hint">Scan untuk pesan menu</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .d-print-none { display: none !important; }
          #printable-area {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
            background: #fff !important;
          }
          .qr-card { break-inside: avoid; }
        }

        .qr-card {
          position: relative;
          aspect-ratio: 1.13;
          min-width: 0;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          overflow: hidden;
          color: #f8fafc;
          font-family: 'Glacial Indifference', Arial, sans-serif;
          background:
            radial-gradient(ellipse at 10% 45%, rgba(201, 151, 59, 0.1), transparent 38%),
            #090c0b;
          border: 2px solid #c9973b;
          border-radius: 18px;
          box-shadow: inset 0 0 0 3px #090c0b, inset 0 0 0 4px rgba(201, 151, 59, 0.55), 0 4px 12px rgba(0, 0, 0, 0.4);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .qr-card-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          fill: none;
          stroke: #d8aa4e;
          stroke-width: 1.2;
          opacity: 0.18;
          pointer-events: none;
        }
        .qr-card-waves path { vector-effect: non-scaling-stroke; }
        .qr-card > :not(.qr-card-waves) { position: relative; z-index: 1; }
        .qr-card-header { text-align: center; }
        .qr-card-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #d8aa4e;
          font-family: Georgia, serif;
          font-size: clamp(14px, 1.6vw, 22px);
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .qr-brand-mark {
          display: inline-flex;
          width: 23px;
          height: 23px;
          align-items: center;
          justify-content: center;
          border: 1px solid #d8aa4e;
          border-radius: 50%;
          font-size: 15px;
          font-style: italic;
        }
        .qr-card-tagline {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 5px;
          font-size: clamp(10px, 1.1vw, 14px);
          font-weight: 800;
        }
        .qr-tagline-highlight {
          padding: 2px 5px;
          color: #111;
          background: #d8aa4e;
          border-radius: 3px;
        }
        .qr-card-content {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 12px;
          min-height: 0;
        }
        .qr-code-panel {
          display: flex;
          flex: 0 0 45%;
          align-items: center;
          justify-content: center;
          min-width: 0;
          padding: 5px;
          background: #fff;
          border: 4px solid #c9973b;
          border-radius: 12px;
        }
        .qr-code-panel svg { display: block; }
        .qr-instructions {
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          min-width: 0;
        }
        .qr-step {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .qr-step-number {
          display: inline-flex;
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          color: #111;
          background: #d8aa4e;
          border-radius: 50%;
          font-size: 18px;
          font-weight: 800;
        }
        .qr-step-label {
          font-size: clamp(14px, 1.55vw, 19px);
          font-weight: 800;
          line-height: 1.08;
        }
        .qr-step-note {
          color: #d8aa4e;
          font-size: clamp(10px, 1vw, 12px);
          font-weight: 600;
          line-height: 1.2;
        }
        .qr-card-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 6px;
        }
        .qr-table-title {
          color: #d8aa4e;
          font-size: clamp(13px, 1.6vw, 21px);
          font-weight: 800;
          white-space: nowrap;
        }
        .qr-table-title strong {
          color: #fff;
          font-size: 1.45em;
          line-height: 0.8;
        }
        .qr-footer-hint {
          color: #d8aa4e;
          font-size: clamp(8px, 0.9vw, 12px);
          text-align: right;
        }

        @media print {
          .qr-card { aspect-ratio: 1.13; box-shadow: none; }
          .qr-card-brand { font-size: 17px; }
          .qr-card-tagline { font-size: 11px; }
          .qr-step-number { flex-basis: 29px; width: 29px; height: 29px; font-size: 16px; }
          .qr-step-label { font-size: 14px; }
          .qr-step-note { font-size: 10px; }
          .qr-table-title { font-size: 15px; }
          .qr-footer-hint { font-size: 9px; }
        }

        @media screen and (max-width: 1100px) { #printable-area { grid-template-columns: repeat(2, 1fr) !important; } }
        @media screen and (max-width: 800px) {
          #printable-area { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media screen and (max-width: 560px) {
          #printable-area { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
};

export default QRCodeGenerator;
