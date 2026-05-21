import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';

const QRCodeGenerator = () => {
  const [startNum, setStartNum] = useState(1);
  const [endNum, setEndNum] = useState(10);
  
  // Deteksi URL saat ini, tapi biarkan bisa diedit admin (penting untuk IP Address)
  // Default: http://10.88.21.98:3000
  const [baseUrl, setBaseUrl] = useState('http://10.88.21.98:3000');

  const componentRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  // Generate array nomor meja
  const tables = [];
  for (let i = parseInt(startNum); i <= parseInt(endNum); i++) {
    tables.push(i);
  }

  return (
    <div className="container mt-4">
      {/* Bagian ini akan disembunyikan saat diprint */}
      <div className="d-print-none">
        <h2 className="mb-4">Kelola QR Code Meja</h2>
        
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="alert alert-info">
              <strong>Penting:</strong> Pastikan "Base URL" menggunakan <b>IP Address</b> komputer Anda (contoh: <code>192.168.1.5</code>) bukan <code>localhost</code>, agar bisa discan oleh HP pelanggan yang terhubung di WiFi yang sama.
            </div>

            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Base URL (Frontend)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)} 
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Mulai Meja No.</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={startNum} 
                  onChange={(e) => setStartNum(e.target.value)} 
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Sampai Meja No.</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={endNum} 
                  onChange={(e) => setEndNum(e.target.value)} 
                />
              </div>
              <div className="col-md-4">
                <button className="btn btn-primary w-100" onClick={handlePrint}>
                  🖨️ Cetak QR Codes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Area Preview & Cetak */}
      <div ref={componentRef} className="row g-4 justify-content-center" id="printable-area">
        {tables.map((num) => {
          // Link tujuan: /customer/menu?table=NOMOR
          const qrValue = `${baseUrl}/customer/menu?table=${num}`;
          
          return (
            <div key={num} className="col-auto text-center page-break">
              <div className="card border-dark mb-3" style={{width: '220px'}}>
                <div className="card-header bg-warning text-dark fw-bold text-uppercase text-center">
                  Billion Cafe - MEJA {num}
                </div>
                <div className="card-body p-3 d-flex justify-content-center bg-white">
                  <QRCode
                    size={150}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={qrValue}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                <div className="card-footer bg-light text-center" style={{fontSize: '0.7rem'}}>
                  Scan untuk pesan menu
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Khusus Print (Inline Style untuk kemudahan) */}
      <style>{`
        @media print {
          /* Sembunyikan elemen non-penting */
          .d-print-none, .navbar, .btn {
            display: none !important;
          }
          /* Atur layout grid cetak */
          #printable-area {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
          }
          /* Pastikan card ada border saat diprint */
          .card {
            border: 2px solid #000 !important;
            break-inside: avoid; /* Jangan potong card di halaman beda */
          }
          /* Paksa background color tercetak (Chrome) */
          body {
            -webkit-print-color-adjust: exact; 
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeGenerator;