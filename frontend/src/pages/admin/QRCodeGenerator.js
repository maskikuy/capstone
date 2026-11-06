import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../../utils/api';
import { notifySuccess, notifyError } from '../../utils/notify';
import {
  Printer,
  Smartphone,
  BookOpen,
  Wallet,
  HandPlatter,
  Coffee,
  X
} from 'lucide-react';

const QRCodeGenerator = () => {
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(10);
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem('qr_base_url') || ''
  );
  const [detectedIp, setDetectedIp] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printStartNum, setPrintStartNum] = useState('1');
  const [printEndNum, setPrintEndNum] = useState('10');
  const [printTables, setPrintTables] = useState([]);
  const [isPrintPending, setIsPrintPending] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [settingsRes, infoRes] = await Promise.allSettled([
          api.get('/settings'),
          api.get('/server-info')
        ]);

        let serverIp = '';

        if (
          infoRes.status === 'fulfilled' &&
          infoRes.value.data?.primaryIp
        ) {
          serverIp = infoRes.value.data.primaryIp;
          setDetectedIp(serverIp);
        }

        const localSaved = localStorage.getItem('qr_base_url');

        const dbSaved =
          settingsRes.status === 'fulfilled'
            ? settingsRes.value.data?.table_qr_base_url
            : null;

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

  const handleBaseUrlChange = (value) => {
    setBaseUrl(value);
    localStorage.setItem('qr_base_url', value);
  };

  const handleUseDetectedIp = () => {
    if (!detectedIp) return;

    const url = `http://${detectedIp}:3000`;

    setBaseUrl(url);
    localStorage.setItem('qr_base_url', url);
    saveToDatabase(url);
  };

  const saveToDatabase = async (urlToSave = baseUrl) => {
    if (!urlToSave.trim()) {
      notifyError('Base URL tidak boleh kosong!');
      return;
    }

    setIsSaving(true);

    try {
      localStorage.setItem('qr_base_url', urlToSave);

      await api.put('/settings', {
        table_qr_base_url: urlToSave
      });

      notifySuccess('Base URL berhasil disimpan!');
    } catch (err) {
      notifyError(
        'Gagal menyimpan: ' +
        (err.response?.data?.error || err.message)
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    setPrintStartNum(String(startNum));
    setPrintEndNum(String(endNum));
    setShowPrintModal(true);
  };

  const start = parseInt(startNum) || 1;
  const end = parseInt(endNum) || start;

  const tables = [];

  if (start <= end && start >= 1) {
    for (let i = start; i <= end; i++) {
      tables.push(i);
    }
  }

  const printStart = Number(printStartNum);
  const printEnd = Number(printEndNum);
  const validPrintRange =
    printStartNum.trim() !== '' &&
    printEndNum.trim() !== '' &&
    Number.isInteger(printStart) &&
    Number.isInteger(printEnd) &&
    printStart >= 1 &&
    printEnd >= printStart;

  const selectedPrintTables = validPrintRange
    ? Array.from(
        { length: printEnd - printStart + 1 },
        (_, index) => printStart + index
      )
    : [];

  const printSheets = [];
  for (let i = 0; i < printTables.length; i += 2) {
    printSheets.push(printTables.slice(i, i + 2));
  }

  const handleConfirmPrint = () => {
    if (!validPrintRange) {
      notifyError('Rentang nomor meja tidak valid!');
      return;
    }

    if (!baseUrl.trim()) {
      notifyError('Base URL tidak boleh kosong!');
      return;
    }

    setPrintTables(selectedPrintTables);
    setShowPrintModal(false);
    setIsPrintPending(true);
  };

  useEffect(() => {
    if (!isPrintPending) return undefined;

    const handleAfterPrint = () => {
      setIsPrintPending(false);
      setPrintTables([]);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    const printTimer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(printTimer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isPrintPending]);

  useEffect(() => {
    if (!showPrintModal) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowPrintModal(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPrintModal]);

  const renderPoster = (num) => {

          const qrValue = `${(baseUrl || '').replace(
            /\/+$/,
            ''
          )}/customer/menu?table=${num}`;

          return (
            <div
              key={num}
              className="qr-poster"
            >

              {/* OUTER GOLD GRADIENT BORDER */}
              <div className="poster-frame">

                {/* INNER WHITE BORDER */}
                <div className="poster-inner">

                  {/* Background Decorations */}
                  <svg
                    className="poster-waves"
                    viewBox="0 0 800 700"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M-80 110 C100 0 220 190 410 90 S680 10 880 125" />
                    <path d="M-80 135 C100 25 220 215 410 115 S680 35 880 150" />
                    <path d="M-80 515 C100 405 220 595 410 495 S680 415 880 530" />
                    <path d="M-80 540 C100 430 220 620 410 520 S680 440 880 555" />
                  </svg>

                  <div className="poster-beans poster-beans-left">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} />
                    ))}
                  </div>

                  <div className="poster-beans poster-beans-right">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} />
                    ))}
                  </div>

                  <div className="poster-content">

                    {/* BRAND HEADER */}
                    <div className="poster-header">

                      <div className="poster-logo">
                        B
                      </div>

                      <div className="poster-brand-row">

                        <Coffee className="poster-brand-cup" />

                        <h2 className="poster-brand">
                          BILLION CAFE
                        </h2>

                        <Coffee className="poster-brand-cup" />

                      </div>

                      <div className="poster-brand-divider" />
                    </div>

                    {/* TAGLINE */}
                    <div className="poster-tagline">
                      <span>PESAN DI SINI</span>

                      <strong>
                        TANPA ANTRI
                      </strong>
                    </div>

                    {/* MAIN POSTER */}
                    <div className="poster-main">

                      {/* LEFT: QR CODE */}
                      <div className="poster-qr-section">

                        <div className="poster-qr-box">
                          <QRCode
                            value={qrValue}
                            size={330}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'block'
                            }}
                          />
                        </div>

                      </div>

                      {/* RIGHT: ORDER INSTRUCTIONS */}
                      <div className="poster-instructions">

                        <div className="instruction-item">

                          <div className="instruction-number">
                            1
                          </div>

                          <div className="instruction-icon">
                            <Smartphone />
                          </div>

                          <div className="instruction-text">
                            <strong>SCAN QR Code</strong>
                          </div>

                        </div>

                        <div className="instruction-item">

                          <div className="instruction-number">
                            2
                          </div>

                          <div className="instruction-icon">
                            <BookOpen />
                          </div>

                          <div className="instruction-text">
                            <strong>PILIH &amp; PESAN</strong>
                          </div>

                        </div>

                        <div className="instruction-item">

                          <div className="instruction-number">
                            3
                          </div>

                          <div className="instruction-icon">
                            <Wallet />
                          </div>

                          <div className="instruction-text">
                            <strong>BAYAR</strong>
                          </div>

                        </div>

                        <div className="instruction-item">

                          <div className="instruction-number">
                            4
                          </div>

                          <div className="instruction-icon">
                            <HandPlatter />
                          </div>

                          <div className="instruction-text">
                            <strong>AMBIL / <br></br>DIANTAR</strong>
                          </div>

                        </div>

                        {/* DELIVERY NOTE: INSIDE MAIN, NOT FOOTER */}
                        <div className="instruction-note">
                          Pesanan akan diantar
                          <br />
                          ke meja Anda
                        </div>

                      </div>
                    </div>

                    {/* FOOTER: SEPARATE FROM DELIVERY NOTE */}
                    <div className="poster-footer">

                      <div className="poster-table-number">
                        <span>MEJA</span>
                        <strong>{num}</strong>
                      </div>

                      <div className="poster-footer-hint">
                        Scan untuk pesan menu
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
  };

  return (
    <div className="qr-page">

      {/* Page Heading */}
      <h3 className="qr-page-heading d-print-none">
        Kelola QR Code Meja
      </h3>

      {/* Configuration Card */}
      <div className="qr-config-card d-print-none">

        <div className="qr-info-box">
          <div>
            <strong>Penting:</strong> Pastikan Base URL menggunakan{' '}
            <span className="gold-text">IP Address</span> komputer Anda,
            bukan localhost, agar QR dapat discan oleh HP pelanggan
            yang terhubung di WiFi yang sama.
          </div>

          {detectedIp && (
            <div className="detected-ip">
              IP terdeteksi:{' '}
              <button
                type="button"
                onClick={handleUseDetectedIp}
              >
                {detectedIp}
              </button>
            </div>
          )}
        </div>

        <div className="qr-config-row">

          {/* Base URL */}
          <div className="config-field base-url-field">
            <label>Base URL (Frontend)</label>

            <input
              type="text"
              placeholder="http://192.168.10.97:3000"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
            />
          </div>

          {/* Start Table */}
          <div className="config-field number-field">
            <label>Mulai Meja No.</label>

            <input
              type="number"
              min="1"
              value={startNum}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                let value = e.target.value;

                if (
                  value.length > 1 &&
                  value.startsWith('0')
                ) {
                  value = value.replace(/^0+/, '');
                }

                setStartNum(value);
              }}
            />
          </div>

          {/* End Table */}
          <div className="config-field number-field">
            <label>Sampai Meja No.</label>

            <input
              type="number"
              min="1"
              value={endNum}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                let value = e.target.value;

                if (
                  value.length > 1 &&
                  value.startsWith('0')
                ) {
                  value = value.replace(/^0+/, '');
                }

                setEndNum(value);
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="qr-config-actions">

            <button
              type="button"
              className="save-btn"
              onClick={() => saveToDatabase(baseUrl)}
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>

            <button
              type="button"
              className="print-btn"
              onClick={handlePrint}
            >
              <Printer size={15} />
              Cetak QR Codes
            </button>

          </div>
        </div>
      </div>

      {/* QR Poster Grid */}
      <div
        ref={printRef}
        id="printable-area"
        className="qr-grid"
      >
        {tables.map(renderPoster)}
      </div>

      {/* PRINT-ONLY AREA: hanya poster yang dipilih dari popup */}
      <div id="qr-selected-print-area" className="qr-print-only">
        {printSheets.map((sheet, index) => (
          <div
            key={index}
            className={`qr-print-sheet ${sheet.length === 1 ? 'single' : ''}`}
          >
            {sheet.map(renderPoster)}
          </div>
        ))}
      </div>

      {/* POPUP PILIH RENTANG MEJA */}
      {showPrintModal && (
        <div
          className="qr-print-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPrintModal(false);
            }
          }}
        >
          <div
            className="qr-print-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qrPrintModalTitle"
          >
            <div className="qr-print-modal-header">
              <div className="qr-print-modal-heading">
                <div className="qr-print-modal-icon">
                  <Printer size={19} />
                </div>
                <div>
                  <h4 id="qrPrintModalTitle">Cetak QR Code Meja</h4>
                  <p>Pilih rentang meja yang ingin dicetak.</p>
                </div>
              </div>

              <button
                type="button"
                className="qr-print-modal-close"
                onClick={() => setShowPrintModal(false)}
                aria-label="Tutup popup"
              >
                <X size={19} />
              </button>
            </div>

            <div className="qr-print-modal-body">
              <div className="qr-print-modal-fields">
                <div className="qr-print-modal-field">
                  <label htmlFor="qr-print-start">Dari Meja No.</label>
                  <input
                    id="qr-print-start"
                    type="number"
                    min="1"
                    value={printStartNum}
                    onChange={(event) => setPrintStartNum(event.target.value)}
                    onFocus={(event) => event.target.select()}
                    autoFocus
                  />
                </div>

                <span className="qr-print-modal-separator">sampai</span>

                <div className="qr-print-modal-field">
                  <label htmlFor="qr-print-end">Sampai Meja No.</label>
                  <input
                    id="qr-print-end"
                    type="number"
                    min="1"
                    value={printEndNum}
                    onChange={(event) => setPrintEndNum(event.target.value)}
                    onFocus={(event) => event.target.select()}
                  />
                </div>
              </div>

              {!validPrintRange && (
                <p className="qr-print-modal-error">
                  Nomor meja harus minimal 1 dan nomor akhir tidak boleh lebih kecil dari nomor awal.
                </p>
              )}

              <div className="qr-print-modal-summary">
                <div>
                  <span>Total QR dipilih</span>
                  <strong>{selectedPrintTables.length} Meja</strong>
                </div>
                <div>
                  <span>Estimasi lembar A4</span>
                  <strong>{Math.ceil(selectedPrintTables.length / 2)} Halaman</strong>
                </div>
              </div>

              <p className="qr-print-modal-note">
                Maksimal 2 poster dalam satu lembar A4 landscape. Hanya nomor meja yang dipilih yang akan dicetak.
              </p>
            </div>

            <div className="qr-print-modal-actions">
              <button
                type="button"
                className="qr-print-cancel"
                onClick={() => setShowPrintModal(false)}
              >
                Batal
              </button>

              <button
                type="button"
                className="qr-print-confirm"
                onClick={handleConfirmPrint}
                disabled={!validPrintRange || !baseUrl.trim()}
              >
                <Printer size={15} />
                Cetak QR Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`

        /* =========================
           ADMIN PAGE
        ========================= */

        .qr-page {
          min-height: 100vh;
          padding: 28px 32px 60px;
          background: #101116;
          color: #f8fafc;
        }

        .qr-page-heading {
          color: #f1f5f9;
          font-size: 1.45rem;
          font-weight: 700;
          margin: 0 0 20px;
        }

        .qr-config-card {
          padding: 20px 24px;
          margin-bottom: 30px;
          border: 1px solid #292c3e;
          border-radius: 14px;
          background: #161720;
        }

        .qr-info-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 12px 16px;
          margin-bottom: 20px;
          border: 1px solid #303867;
          border-radius: 8px;
          background: #1a1f35;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
        }

        .qr-info-box strong {
          color: #f1f5f9;
        }

        .gold-text {
          color: #d8a744;
          font-weight: 600;
        }

        .detected-ip {
          white-space: nowrap;
        }

        .detected-ip button {
          background: transparent;
          border: none;
          padding: 0;
          color: #4ade80;
          font-size: 13px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        .qr-config-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .config-field {
          min-width: 0;
        }

        .base-url-field {
          flex: 1 1 300px;
        }

        .number-field {
          flex: 0 0 140px;
        }

        .config-field label {
          display: block;
          margin-bottom: 7px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
        }

        .config-field input {
          width: 100%;
          height: 40px;
          padding: 0 13px;
          border: 1px solid #2a2d45;
          border-radius: 8px;
          outline: none;
          background: #0d0e17;
          color: #f1f5f9;
          font-size: 13px;
          box-sizing: border-box;
        }

        .config-field input:focus {
          border-color: #d8a744;
        }

        .qr-config-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .save-btn,
        .print-btn {
          height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: all 0.2s ease;
        }

        .save-btn {
          border: 1px solid #166534;
          background: #1e3a2f;
          color: #4ade80;
        }

        .save-btn:hover {
          background: #166534;
          color: #fff;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .print-btn {
          border: none;
          background: #c9973b;
          color: #fff;
        }

        .print-btn:hover {
          background: #d8a744;
        }


        /* =========================
           POSTER GRID
        ========================= */

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
          align-items: start;
        }

        .qr-poster {
          position: relative;
          width: 100%;
          min-width: 0;
          aspect-ratio: 1.14 / 1;
          container-type: inline-size;
        }


        /* =========================
           TWO BORDER LINES ONLY
           1. GOLD GRADIENT OUTER
           2. WHITE INNER
        ========================= */

        .poster-frame {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 4px;
          overflow: hidden;
          border-radius: 27px;

          background: linear-gradient(
            135deg,
            #8c601d 0%,
            #c9973b 13%,
            #f8df96 27%,
            #d8a744 43%,
            #fff0b5 55%,
            #bd872e 70%,
            #f5d781 84%,
            #93651f 100%
          );

          box-shadow: 0 5px 16px rgba(0,0,0,0.32);
        }

        .poster-inner {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border: 2px solid #f3f0e6;
          border-radius: 22px;
          background: #080c0b;
        }

        /* No additional ::before / ::after border */


        /* =========================
           BACKGROUND DECORATION
        ========================= */

        .poster-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          fill: none;
          stroke: #c99a43;
          stroke-width: 1.3;
          opacity: 0.17;
          pointer-events: none;
        }

        .poster-waves path {
          vector-effect: non-scaling-stroke;
        }

        .poster-beans {
          position: absolute;
          top: 7%;
          display: flex;
          flex-direction: column;
          gap: 15px;
          opacity: 0.15;
          pointer-events: none;
        }

        .poster-beans-left {
          left: 1.5%;
          transform: rotate(-20deg);
        }

        .poster-beans-right {
          right: 1.5%;
          transform: rotate(20deg);
        }

        .poster-beans span {
          display: block;
          width: 25px;
          height: 45px;
          border: 2px solid #d1a34c;
          border-radius: 55% 45% 55% 45%;
          transform: rotate(35deg);
        }

        .poster-beans span:nth-child(even) {
          transform: rotate(-25deg);
        }


        /* =========================
           POSTER CONTENT
        ========================= */

        .poster-content {
          position: relative;
          z-index: 2;
          width: 100%;
          height: 100%;
          padding: 2.1cqw 3.1cqw 1.9cqw;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          box-sizing: border-box;
        }


        /* =========================
           BRAND HEADER
        ========================= */

        .poster-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .poster-logo {
          width: 100%;
          height: 5.5cqw;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;

          background: linear-gradient(
            135deg,
            #95691f,
            #f7dc91,
            #c28b31,
            #fff0b2,
            #9b6c20
          );

          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          font-family: Georgia, 'Times New Roman', serif;
          font-size: 5.7cqw;
          font-weight: 900;
          font-style: italic;
          line-height: 1;
        }

        .poster-brand-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.2cqw;
        }

        .poster-brand-cup {
          flex-shrink: 0;
          width: 4.1cqw;
          height: 4.1cqw;
          color: #d8a744;
          stroke-width: 1.6;
        }

        .poster-brand {
          margin: 0;
          text-align: center;
          white-space: nowrap;

          color: transparent;
          background: linear-gradient(
            105deg,
            #94651f 0%,
            #eac66d 22%,
            #fff0b2 38%,
            #bc862e 57%,
            #f9df99 77%,
            #9b6921 100%
          );

          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(27px, 6.3cqw, 72px);
          font-weight: 900;
          letter-spacing: 0.025em;
          line-height: 1;
          text-shadow: none;
        }

        .poster-brand-divider {
          width: 70%;
          height: 1px;
          margin-top: 1.5cqw;
          background: linear-gradient(
            to right,
            transparent,
            #bd8b37,
            #f4da91,
            #bd8b37,
            transparent
          );
          opacity: 0.75;
        }


        /* =========================
           TAGLINE
        ========================= */

        .poster-tagline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.1cqw;
          margin: 2.8cqw 0 2.5cqw;

          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(15px, 3.5cqw, 40px);
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
        }

        .poster-tagline strong {
          padding: 0.85cqw 1.25cqw;
          border-radius: 5px;
          background: linear-gradient(
            110deg,
            #9a6c22,
            #e6bd60,
            #f9e4a1,
            #c38c32
          );
          color: #101010;
          font-weight: 900;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }


        /* =========================
           MAIN CONTENT
        ========================= */

        .poster-main {
          display: grid;
          grid-template-columns: 48% 52%;
          align-items: stretch;
          gap: 2cqw;
          min-height: 0;
          margin-top: 0;
        }

        .poster-qr-section {
          min-width: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poster-qr-box {
          width: 94%;
          max-width: 100%;
          aspect-ratio: 1 / 1;
          padding: 1.25cqw;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #fff;
          border: 0.65cqw solid transparent;
          border-radius: 1.9cqw;

          background-image:
            linear-gradient(#fff, #fff),
            linear-gradient(
              135deg,
              #a47224,
              #f7d982,
              #c28a2d,
              #ffe9a5
            );

          background-origin: border-box;
          background-clip: padding-box, border-box;

          box-shadow: 0 3px 9px rgba(0,0,0,0.35);
          box-sizing: border-box;
        }

        .poster-qr-box svg {
          display: block;
          width: 100%;
          height: 100%;
        }


        /* =========================
           INSTRUCTIONS
        ========================= */

        .poster-instructions {
          height: 100%;
          min-width: 0;
          display: grid;
          grid-template-rows:
            repeat(4, minmax(0, 1fr))
            auto;
          row-gap: 0.8cqw;
          align-items: center;
          align-content: stretch;
          padding: 1cqw 0 0;
          box-sizing: border-box;
        }

        .instruction-item {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: 4.7cqw 7.5cqw minmax(0, 1fr);
          align-items: center;
          column-gap: 0.8cqw;
        }

        .instruction-number {
          width: 4.7cqw;
          height: 4.7cqw;
          min-width: 0;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: linear-gradient(
            135deg,
            #95661d,
            #f9df94,
            #c48d32,
            #ffe9a5
          );

          color: #111;
          font-family: Arial, sans-serif;
          font-size: 2.7cqw;
          font-weight: 900;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }

        .instruction-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d9ad4e;
        }

        .instruction-icon svg {
          width: 6.4cqw;
          height: 6.4cqw;
          max-width: 100%;
          max-height: 100%;
          stroke-width: 1.5;
        }

        .instruction-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;

          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(15px, 3.7cqw, 43px);
          font-weight: 500;
          line-height: 1.02;
          white-space: nowrap;
          text-shadow: 0 2px 3px rgba(0,0,0,0.5);
        }

        .instruction-text strong {
          font-weight: 900;
        }

        .instruction-text span {
          font-weight: 400;
        }

        /* DELIVERY NOTE HAS ITS OWN ROW */
        .instruction-note {
          grid-row: 5;
          min-width: 0;

          margin-left: calc(4.7cqw + 7.5cqw + 1.6cqw);
          padding: 0.4cqw 0 1.1cqw;

          color: #e2b75d;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(9px, 1.85cqw, 21px);
          font-weight: 500;
          line-height: 1.22;
          white-space: nowrap;
        }


        /* =========================
           FOOTER
           SEPARATE FROM NOTE
        ========================= */

        .poster-footer {
          min-height: 11.8cqw;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: end;
          column-gap: 1cqw;
          padding-top: 1.2cqw;
        }

        .poster-table-number {
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          gap: 1.1cqw;
          min-width: 0;
          white-space: nowrap;
          transform: translateY(-20px);
        }

        .poster-table-number span {
          color: transparent;
          background: linear-gradient(
            110deg,
            #9a6c22,
            #f2d47f,
            #c38b31,
            #f7df9b
          );
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          font-family: Arial, sans-serif;
          font-size: clamp(24px, 6cqw, 70px);
          font-weight: 900;
          line-height: 0.95;
        }

        .poster-table-number strong {
          color: #fff;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(60px, 13cqw, 135px);
          font-weight: 900;
          line-height: 0.72;
          text-shadow:
            2px 2px 0 #a5792b,
            3px 4px 7px rgba(0,0,0,0.55);
        }

        .poster-footer-hint {
          align-self: end;
          justify-self: end;
          max-width: 100%;
          padding-bottom: 0.8cqw;

          color: transparent;
          background: linear-gradient(
            100deg,
            #9b6c23,
            #e5bb60,
            #ffe29a,
            #bd852e
          );
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          font-family: Arial, sans-serif;
          font-size: clamp(12px, 3cqw, 34px);
          font-weight: 500;
          line-height: 1.1;
          white-space: nowrap;
          text-align: right;
        }


        /* =========================
           RESPONSIVE
        ========================= */

        @media screen and (max-width: 1100px) {
          .qr-grid {
            grid-template-columns: 1fr;
          }

          .qr-poster {
            max-width: 900px;
            margin: 0 auto;
          }
        }

        @media screen and (max-width: 700px) {
          .qr-page {
            padding: 20px 14px 45px;
          }

          .qr-info-box {
            flex-direction: column;
            align-items: flex-start;
          }

          .qr-config-row {
            align-items: stretch;
          }

          .base-url-field {
            flex: 1 1 100%;
          }

          .number-field {
            flex: 1 1 calc(50% - 8px);
          }

          .qr-config-actions {
            width: 100%;
          }

          .qr-config-actions button {
            flex: 1;
          }
        }

        @media screen and (max-width: 480px) {
          .qr-poster {
            aspect-ratio: 1.14 / 1;
          }

          .poster-frame {
            padding: 3px;
            border-radius: 17px;
          }

          .poster-inner {
            border-radius: 13px;
          }

          .poster-content {
            padding: 2cqw 2.6cqw 1.8cqw;
          }

          .poster-logo {
            font-size: 5.5cqw;
            height: 5.4cqw;
          }

          .poster-brand-cup {
            width: 3.8cqw;
            height: 3.8cqw;
          }

          .poster-tagline {
            gap: 0.8cqw;
          }

          .poster-main {
            grid-template-columns: 47% 53%;
            gap: 1.3cqw;
          }

          .poster-qr-box {
            width: 97%;
            padding: 0.8cqw;
            border-radius: 1.6cqw;
          }

          .instruction-item {
            grid-template-columns: 4.5cqw 7cqw minmax(0, 1fr);
            column-gap: 0.7cqw;
          }

          .instruction-number {
            width: 4.5cqw;
            height: 4.5cqw;
          }

          .instruction-icon svg {
            width: 6cqw;
            height: 6cqw;
          }

          .instruction-text {
            font-size: 3.55cqw;
          }

          .instruction-note {
            margin-left: calc(4.5cqw + 7cqw + 1.4cqw);
            font-size: 1.7cqw;
          }

          .poster-footer {
            min-height: 11cqw;
          }

          .poster-table-number strong {
            font-size: 12.5cqw;
          }

          .poster-footer-hint {
            font-size: 2.8cqw;
          }
        }


        /* =========================
           PRINT RANGE POPUP
        ========================= */

        .qr-print-only {
          display: none;
        }

        .qr-print-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.76);
          backdrop-filter: blur(5px);
        }

        .qr-print-modal {
          width: 100%;
          max-width: 470px;
          overflow: hidden;
          border: 1px solid #303348;
          border-radius: 16px;
          background: #161720;
          box-shadow: 0 20px 65px rgba(0,0,0,0.55);
          animation: qrModalAppear 0.18s ease-out;
        }

        @keyframes qrModalAppear {
          from { opacity: 0; transform: translateY(8px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .qr-print-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 22px;
          border-bottom: 1px solid #282a3b;
        }

        .qr-print-modal-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qr-print-modal-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d8a744;
          background: rgba(216,167,68,0.12);
          border: 1px solid rgba(216,167,68,0.25);
          border-radius: 10px;
        }

        .qr-print-modal-heading h4 {
          margin: 0 0 5px;
          color: #f1f5f9;
          font-size: 15px;
          font-weight: 700;
        }

        .qr-print-modal-heading p {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .qr-print-modal-close {
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #303348;
          border-radius: 8px;
          background: #222433;
          color: #94a3b8;
          cursor: pointer;
        }

        .qr-print-modal-close:hover {
          background: #303348;
          color: #fff;
        }

        .qr-print-modal-body {
          padding: 22px;
        }

        .qr-print-modal-fields {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: end;
          gap: 12px;
        }

        .qr-print-modal-field {
          min-width: 0;
        }

        .qr-print-modal-field label {
          display: block;
          margin-bottom: 8px;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
        }

        .qr-print-modal-field input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          box-sizing: border-box;
          border: 1px solid #303348;
          border-radius: 8px;
          outline: none;
          background: #0d0e17;
          color: #f1f5f9;
          font-size: 14px;
        }

        .qr-print-modal-field input:focus {
          border-color: #d8a744;
        }

        .qr-print-modal-separator {
          padding-bottom: 14px;
          color: #64748b;
          font-size: 12px;
        }

        .qr-print-modal-error {
          margin: 12px 0 0;
          padding: 9px 11px;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 7px;
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .qr-print-modal-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #292c3e;
          border-radius: 9px;
          background: #11131e;
        }

        .qr-print-modal-summary div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .qr-print-modal-summary span {
          color: #94a3b8;
          font-size: 11px;
        }

        .qr-print-modal-summary strong {
          color: #e4bd68;
          font-size: 16px;
          font-weight: 700;
        }

        .qr-print-modal-note {
          margin: 13px 0 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
        }

        .qr-print-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 15px 22px 20px;
          border-top: 1px solid #282a3b;
        }

        .qr-print-cancel,
        .qr-print-confirm {
          min-height: 39px;
          padding: 0 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .qr-print-cancel {
          border: 1px solid #303348;
          background: #222433;
          color: #cbd5e1;
        }

        .qr-print-cancel:hover {
          background: #303348;
        }

        .qr-print-confirm {
          border: none;
          background: linear-gradient(110deg, #b17b29, #e5bd65, #c18b31);
          color: #111;
        }

        .qr-print-confirm:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        .qr-print-confirm:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media screen and (max-width: 480px) {
          .qr-print-modal-overlay {
            padding: 14px;
          }

          .qr-print-modal-header,
          .qr-print-modal-body {
            padding-left: 17px;
            padding-right: 17px;
          }

          .qr-print-modal-actions {
            padding-left: 17px;
            padding-right: 17px;
          }
        }


        /* =========================
           PRINT
        ========================= */

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Sembunyikan seluruh halaman, termasuk Navbar dan preview utama. */
          body * {
            visibility: hidden !important;
          }

          /* Tampilkan hanya poster yang dipilih melalui popup. */
          #qr-selected-print-area,
          #qr-selected-print-area * {
            visibility: visible !important;
          }

          #qr-selected-print-area {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 281mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .qr-print-sheet {
            width: 281mm !important;
            height: 194mm !important;
            padding: 0 !important;
            margin: 0 !important;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            align-items: center !important;
            justify-items: stretch !important;
            gap: 7mm !important;
            overflow: hidden !important;
            background: #fff !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .qr-print-sheet.single {
            grid-template-columns: 1fr !important;
            justify-items: center !important;
          }

          .qr-print-sheet.single .qr-poster {
            width: 62% !important;
          }

          .qr-print-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .qr-poster {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            aspect-ratio: 1.14 / 1 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .poster-frame,
          .poster-inner,
          .poster-qr-box,
          .poster-waves,
          .poster-beans {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .poster-frame {
            box-shadow: none !important;
          }

          .poster-content {
            padding: 2.1cqw 3.1cqw 1.9cqw !important;
          }

          .poster-logo {
            font-size: 5.7cqw !important;
            height: 5.5cqw !important;
          }

          .poster-brand {
            font-size: 6.3cqw !important;
          }

          .poster-tagline {
            font-size: 3.5cqw !important;
          }

          .instruction-text {
            font-size: 3.7cqw !important;
          }

          .instruction-note {
            font-size: 1.85cqw !important;
          }

          .poster-table-number span {
            font-size: 6cqw !important;
          }

          .poster-table-number strong {
            font-size: 13cqw !important;
          }

          .poster-footer-hint {
            font-size: 3cqw !important;
          }
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
  outline: 'none'
};

export default QRCodeGenerator;
