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
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
        }}
      >
        {tables.map((num) => {
          const qrValue = `${(baseUrl || '').replace(/\/+$/, '')}/customer/menu?table=${num}`;
          return (
            <div
              key={num}
              className="page-break"
              style={{
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              {/* Gold Header */}
              <div style={{
                backgroundColor: '#c9973b',
                padding: '10px 8px',
                textAlign: 'center',
                fontWeight: '800',
                fontSize: '11px',
                letterSpacing: '0.8px',
                color: '#1a1000',
                textTransform: 'uppercase'
              }}>
                BILLION CAFE – MEJA {num}
              </div>

              {/* QR Code area */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <QRCode
                  size={140}
                  value={qrValue}
                  viewBox="0 0 256 256"
                  style={{ width: '100%', height: 'auto', maxWidth: '140px' }}
                />
              </div>

              {/* Footer */}
              <div style={{
                backgroundColor: '#1e2030',
                padding: '8px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: '500',
                letterSpacing: '0.3px'
              }}>
                Scan untuk pesan menu
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact; }
          .d-print-none { display: none !important; }
          #printable-area {
            display: grid !important;
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 12px !important;
            background: #fff !important;
          }
          .page-break { break-inside: avoid; border: 2px solid #000 !important; border-radius: 8px !important; }
        }

        @media (max-width: 1400px) {
          #printable-area { grid-template-columns: repeat(5, 1fr) !important; }
        }
        @media (max-width: 1100px) {
          #printable-area { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 800px) {
          #printable-area { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 560px) {
          #printable-area { grid-template-columns: repeat(2, 1fr) !important; }
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
