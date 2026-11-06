import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ChefHat, CheckCircle2, Banknote } from 'lucide-react';
import { notifySuccess, notifyError } from '../../utils/notify';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);

  // Setup Polling setiap 4 detik
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/order');
      // Filter: Pesanan hanya masuk jika transaksi sudah diselesaikan oleh customer!
      // Jika pembayaran QRIS belum diselesaikan (belum paid), pesanan JANGAN masuk ke dashboard kasir
      const activeOrders = res.data.filter(o => {
        const isActive = o.order_status === 'pending' || o.order_status === 'processing';
        if (!isActive) return false;

        // QRIS: sebelum customer menyelesaikan transaksi/pembayaran, sembunyikan dari kasir
        if (o.payment_method === 'qris' && o.payment_status !== 'paid') {
          return false;
        }

        return true;
      });

      activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setOrders(activeOrders);
    } catch (err) {
      console.error("Error polling orders:", err);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await api.put(`/order/${id}/status`, { order_status: newStatus });
      fetchOrders();
    } catch (err) {
      notifyError("Gagal update status pesanan.");
    }
  };

  const handleConfirmPayment = async (id) => {
    try {
      await api.post(`/order/${id}/complete-transaction`);
      notifySuccess(`Pembayaran pesanan #${id} berhasil dikonfirmasi!`);
      fetchOrders();
    } catch (err) {
      console.error('Error konfirmasi kasir:', err);
      notifyError("Gagal konfirmasi pembayaran kasir.");
    }
  };

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '100vh', padding: '24px 28px 60px' }}>
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Dashboard Kasir & Dapur</span>
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
            Antrean pesanan aktif yang siap disiapkan dan disajikan
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span 
            style={{
              backgroundColor: '#161720',
              border: '1px solid #23253a',
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Live Sync: 4s
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="row g-4">
        {orders.length === 0 && (
          <div className="col-12 text-center py-5">
            <div 
              style={{
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                borderRadius: '16px',
                padding: '60px 24px',
                maxWidth: '460px',
                margin: '0 auto'
              }}
            >
              <ChefHat size={48} color="#64748b" style={{ marginBottom: '16px', opacity: 0.6 }} />
              <h5 style={{ color: '#f1f5f9', fontWeight: '700', marginBottom: '8px' }}>
                Semua Pesanan Selesai
              </h5>
              <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: 0 }}>
                Belum ada pesanan aktif saat ini. Menunggu pesanan dari customer ☕
              </p>
            </div>
          </div>
        )}

        {orders.map(order => {
          const isProcessing = order.order_status === 'processing';
          const isPaid = order.payment_status === 'paid';

          return (
            <div key={order.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
              <div 
                style={{
                  backgroundColor: '#161720',
                  border: isProcessing ? '2px solid #c9973b' : '1px solid #23253a',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxShadow: isProcessing ? '0 6px 20px rgba(201, 151, 59, 0.15)' : '0 4px 14px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header Card */}
                <div 
                  style={{
                    backgroundColor: isProcessing ? '#231e13' : '#1a1c28',
                    borderBottom: isProcessing ? '1px solid #785a28' : '1px solid #23253a',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span 
                      style={{
                        backgroundColor: '#c9973b',
                        color: '#101116',
                        fontWeight: '800',
                        fontSize: '13px',
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      MEJA {order.table_number}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      #{order.id}
                    </span>
                  </div>

                  <span 
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      backgroundColor: isPaid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isPaid ? '#4ade80' : '#f87171',
                      border: `1px solid ${isPaid ? '#166534' : '#7f1d1d'}`
                    }}
                  >
                    {isPaid ? 'LUNAS' : 'PENDING'}
                  </span>
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '13.5px' }}>
                      {order.customer_name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#0d0e17', padding: '2px 8px', borderRadius: '4px' }}>
                      {order.location || 'Dine-In'} • {order.payment_method === 'qris' ? 'QRIS' : 'Tunai'}
                    </span>
                  </div>

                  {/* List item pesanan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {order.items && order.items.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{
                          backgroundColor: '#0d0e17',
                          border: '1px solid #1f2233',
                          borderRadius: '8px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '13.5px' }}>
                          <span style={{ color: '#c9973b' }}>{item.quantity}x</span> {item.product_name}
                        </div>

                        {/* Variants */}
                        {item.variants && item.variants.map((v, vIdx) => (
                          <div key={vIdx} style={{ fontSize: '11.5px', color: '#818cf8', marginTop: '3px', marginLeft: '12px' }}>
                            • {v.variant_name}
                          </div>
                        ))}

                        {/* Notes */}
                        {item.notes && (
                          <div 
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#fca5a5',
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginTop: '6px'
                            }}
                          >
                            📝 Note: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!order.items || order.items.length === 0) && (
                      <div style={{ fontSize: '12px', color: '#ef4444', fontStyle: 'italic', padding: '8px 0' }}>
                        Detail item tidak tersedia.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #23253a', backgroundColor: '#13141d' }}>
                  {order.order_status === 'pending' && (
                    <>
                      {isPaid ? (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          style={{
                            backgroundColor: '#c9973b',
                            color: '#101116',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            width: '100%',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
                        >
                          <ChefHat size={16} />
                          <span>Mulai Masak</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleConfirmPayment(order.id)}
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px',
                            width: '100%',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0369a1'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0284c7'; }}
                        >
                          <Banknote size={16} />
                          <span>Terima Tunai & Siap Masak</span>
                        </button>
                      )}
                    </>
                  )}

                  {order.order_status === 'processing' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      style={{
                        backgroundColor: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        width: '100%',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#166534'; }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Selesai Sajikan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KitchenDashboard;
