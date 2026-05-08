import React from 'react';

export const CustomerReceipt = ({ order, receiptRef }) => {

  // 1. Validasi Awal: Pastikan order ada
  if (!order) return null;

  // Helper: Ubah ke angka dulu, baru format Rupiah
  const formatRp = (val) => {
    const num = parseFloat(val); // Pastikan string "14000.00" jadi angka 14000
    return isNaN(num) ? '0' : num.toLocaleString('id-ID');
  };

  // 2. Ambil tanggal (fallback ke waktu sekarang jika string tanggal invalid)
  let dateDisplay;
  try {
    dateDisplay = new Date(order.created_at).toLocaleString('id-ID');
  } catch (e) {
    dateDisplay = new Date().toLocaleString('id-ID');
  }

  return (
    <div 
      ref={receiptRef} 
      className="bg-white p-4 mx-auto"
      style={{ 
        width: '100%', 
        maxWidth: '350px', 
        color: '#000',
        fontFamily: '"Courier New", Courier, monospace',
        border: '1px solid #ddd',
        height: 'auto',
      }}
    >
      {/* HEADER */}
      <div className="text-center mb-3 pb-2" style={{ borderBottom: '2px dashed #000' }}>
        <h4 className="fw-bold mb-0">W.O.W</h4>
        <small>Warmindo Order Wae</small>
        <div className="mt-2" style={{ fontSize: '12px' }}>
          {dateDisplay}
        </div>
      </div>

      {/* INFO ORDER */}
      <div className="mb-3" style={{ fontSize: '12px' }}>
        <div className="d-flex justify-content-between">
          <span>Order ID:</span>
          <span className="fw-bold">#{order.id}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Pelanggan:</span>
          {/* JSON kamu pakai "customer_name" */}
          <span>{order.customer_name || 'Guest'}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Meja:</span>
          <span className="fw-bold">{order.table_number}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Tipe:</span>
          {/* JSON kamu pakai "location" */}
          <span className="text-uppercase">{order.location}</span>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="mb-3 pb-2" style={{ borderBottom: '2px dashed #000' }}>
        {order.items && order.items.length > 0 ? (
          order.items.map((item, idx) => {
            
            // --- LOGIKA HITUNG HARGA (Sesuai JSON) ---
            
            // 1. Ambil Harga Dasar (Convert String "14000.00" ke Float)
            const basePrice = parseFloat(item.price_at_order || 0);

            // 2. Hitung Total Varian
            let variantsTotal = 0;
            if (item.variants && Array.isArray(item.variants)) {
              variantsTotal = item.variants.reduce((sum, v) => {
                // Convert String "3000.00" ke Float
                return sum + parseFloat(v.variant_price || 0);
              }, 0);
            }

            // 3. Harga Satuan (Produk + Varian)
            const unitPrice = basePrice + variantsTotal;

            // 4. Subtotal (Harga Satuan * Quantity)
            const subtotal = unitPrice * item.quantity;
            // ------------------------------------------

            return (
              <div key={idx} className="mb-2" style={{ fontSize: '12px' }}>
                {/* Nama Produk & Subtotal */}
                <div className="d-flex justify-content-between fw-bold">
                  <span>{item.product_name}</span>
                  <span>Rp {formatRp(subtotal)}</span>
                </div>
                
                {/* Rincian Harga Satuan */}
                <div className="d-flex justify-content-between text-muted" style={{fontSize: '11px'}}>
                  <span>{item.quantity} x Rp {formatRp(unitPrice)}</span>
                </div>

                {/* Rincian Varian */}
                {item.variants && item.variants.length > 0 && (
                   <div className="fst-italic text-secondary" style={{fontSize: '11px', paddingLeft: '10px'}}>
                     + {item.variants.map(v => v.variant_name).join(', ')}
                   </div>
                )}
                
                {/* Notes (jika ada string kosong, jangan render) */}
                {item.notes && item.notes !== "" && (
                    <div className="text-danger" style={{fontSize: '11px', paddingLeft: '10px'}}>
                        Catatan: {item.notes}
                    </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted fst-italic py-2">
            - Tidak ada item -
          </div>
        )}
      </div>

      {/* TOTAL SECTION */}
      <div className="mb-4">
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>TOTAL</span>
          {/* JSON kamu pakai "total_amount" */}
          <span>Rp {formatRp(order.total_amount)}</span>
        </div>
        
        {/* Status Pembayaran */}
        <div className="text-center mt-2">
           <div className="mt-1 small text-muted text-uppercase">
               Metode: {order.payment_method}
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center" style={{ fontSize: '11px', color: '#555' }}>
        <p className="mb-1">Terima Kasih sudah mampir!</p>
        <p className="mb-0">Password Wifi: <strong>miegoreng123</strong></p>
        <p className="mt-2 fst-italic">Simpan gambar ini sebagai bukti transaksi.</p>
        <div className="mt-2 text-muted" style={{fontSize:'10px'}}>Powered by W.O.W App</div>
      </div>
    </div>
  );
};