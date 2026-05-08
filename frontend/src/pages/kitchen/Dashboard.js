import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);

  // Setup Polling
  useEffect(() => {
    fetchOrders(); // Load pertama
    const interval = setInterval(fetchOrders, 30000); // Ulangi tiap 5 detik
    return () => clearInterval(interval); // Bersihkan saat unmount
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/order');
      // Filter: Hanya tampilkan pesanan yang belum selesai
      const activeOrders = res.data.filter(o => 
        o.order_status === 'pending' || o.order_status === 'processing'
      );
      // Sortir: Yang paling lama (pending) di atas
      activeOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setOrders(activeOrders);
    } catch (err) {
      console.error("Error polling orders:", err);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      await api.put(`/order/${id}/status`, { order_status: newStatus });
      fetchOrders(); // Refresh tampilan segera
    } catch (err) {
      alert("Gagal update status pesanan.");
    }
  };

  return (
    <div className="container-fluid p-4 bg-dark min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 text-white">
        <h2>🔥 Kitchen Display System</h2>
        <span className="badge bg-secondary">Auto-refresh: 30s</span>
      </div>

      <div className="row">
        {orders.length === 0 && (
          <div className="col-12 text-center text-secondary mt-5">
            <h4>Belum ada pesanan aktif... santai dulu ☕</h4>
          </div>
        )}

        {orders.map(order => (
          <div key={order.id} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-4">
            {/* Warna border berubah jika status processing */}
            <div className={`card h-100 shadow ${order.order_status === 'processing' ? 'border-warning border-4' : 'border-light'}`}>
              
              <div className={`card-header d-flex justify-content-between align-items-center ${order.order_status === 'processing' ? 'bg-warning text-dark' : 'bg-light'}`}>
                <h5 className="m-0 fw-bold">Meja {order.table_number}</h5>
                {/* Badge Payment Status */}
                <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-danger'}`}>
                  {order.payment_status === 'paid' ? 'LUNAS' : 'PENDING'}
                </span>
              </div>

              <div className="card-body">
                <p className="card-subtitle mb-2 text-muted fw-bold">{order.customer_name} ({order.location})</p>
                <hr />
                
                {/* LIST ITEM PESANAN */}
                <ul className="list-group list-group-flush">
                  {/* PENTING: Jika backend belum support JOIN, bagian ini mungkin kosong */}
                  {order.items && order.items.map((item, idx) => (
                    <li key={idx} className="list-group-item px-0 py-2">
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold" style={{fontSize: '1.1rem'}}>{item.quantity}x {item.product_name}</span>
                      </div>
                      
                      {/* Tampilkan Varian */}
                      {item.variants && item.variants.map((v, vIdx) => (
                         <div key={vIdx} className="text-secondary small ms-3">🔹 {v.variant_name}</div>
                      ))}
                      
                      {/* Tampilkan Catatan */}
                      {item.notes && (
                        <div className="alert alert-warning py-1 px-2 mt-1 mb-0 small">
                          📝 Note: {item.notes}
                        </div>
                      )}
                    </li>
                  ))}
                  
                  {(!order.items || order.items.length === 0) && (
                    <div className="text-danger small fst-italic">
                      Data detail item tidak diterima dari server. (Periksa Backend)
                    </div>
                  )}
                </ul>
              </div>

              <div className="card-footer p-2">
                <div className="d-grid gap-2">
                  {order.order_status === 'pending' && (
                    <button className="btn btn-primary" onClick={() => updateOrderStatus(order.id, 'processing')}>
                      👨‍🍳 Mulai Masak
                    </button>
                  )}
                  {order.order_status === 'processing' && (
                    <button className="btn btn-success" onClick={() => updateOrderStatus(order.id, 'completed')}>
                      ✅ Selesai Sajikan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenDashboard;