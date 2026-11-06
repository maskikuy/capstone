import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';
import { printReceipt } from '../../utils/printHelper';
import { Search, Printer, Receipt, SquarePen, Trash2, Eye, X } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State untuk Modal Detail
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    customer_name: '',
    table_number: '',
    order_status: '',
    payment_status: '',
    location: '',
    payment_method: '',
    total_amount: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;

    if (filterStatus === 'all') {
      result = orders;
    } else {
      result = orders.filter(o => o.order_status === filterStatus);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(order => {
        const name = (order.customer_name || '').toLowerCase();
        const id = order.id.toString();
        return name.includes(lowerQuery) || id.includes(lowerQuery);
      });
    }

    setFilteredOrders(result);
  }, [orders, filterStatus, searchQuery]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/order');
      const sorted = res.data.sort((a, b) => b.id - a.id);
      setFilteredOrders(sorted);
      setOrders(sorted);
    } catch (err) {
      console.error("Gagal ambil history", err);
    }
  };

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleManualPrint = (type) => {
    if (selectedOrder) {
      printReceipt(selectedOrder, type);
    }
  };

  const updatePaymentStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    
    const isConfirmed = await confirmAction(
      'Ubah Status Pembayaran?', 
      `Ubah status menjadi ${newStatus.toUpperCase()}?`
    );
    
    if (isConfirmed) {
      try {
        await api.put(`/order/${orderId}/updatePayment`, { payment_status: newStatus });
        fetchOrders();
        notifySuccess(`Pembayaran berhasil diubah ke ${newStatus}`);
      } catch (err) {
        notifyError('Gagal update pembayaran');
      }
    }
  };

  const handleDelete = async (orderId) => {
    const isConfirmed = await confirmAction(
      'Hapus Pesanan?', 
      'Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan.'
    );
    if (isConfirmed) {
      try {
        await api.delete(`/order/${orderId}`);
        fetchOrders();
        notifySuccess('Pesanan berhasil dihapus');
      } catch (err) {
        notifyError('Gagal menghapus pesanan');
      }
    }
  };

  const handleEditClick = (order) => {
    setEditFormData({
      id: order.id,
      customer_name: order.customer_name,
      table_number: order.table_number,
      order_status: order.order_status,
      payment_status: order.payment_status,
      location: order.location,
      payment_method: order.payment_method,
      total_amount: order.total_amount
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/order/${editFormData.id}`, editFormData);
      notifySuccess("Data pesanan berhasil diperbarui!");
      setShowEditModal(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      notifyError("Gagal mengupdate pesanan.");
    }
  };

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '100vh', padding: '24px 28px 60px' }}>
      
      {/* Title */}
      <div className="mb-4">
        <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 6px' }}>
          Riwayat Pesanan
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          Daftar seluruh transaksi pemesanan kasir dan scan QR pelanggan
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div 
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        <div className="row g-3 align-items-center">
          {/* Search */}
          <div className="col-md-6 col-12">
            <div 
              style={{
                backgroundColor: '#0d0e17',
                border: '1px solid #2a2d45',
                borderRadius: '8px',
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Cari nama pelanggan atau ID pesanan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Status */}
          <div className="col-md-6 col-12 d-flex align-items-center justify-content-md-end gap-2">
            <label style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Filter Status:
            </label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                backgroundColor: '#0d0e17',
                border: '1px solid #2a2d45',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '13px',
                padding: '8px 12px',
                outline: 'none'
              }}
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="processing">Sedang Dimasak (Processing)</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>
        </div>
        
        {/* Total info */}
        <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
          Menampilkan <strong style={{ color: '#d8a744' }}>{filteredOrders.length}</strong> dari <strong>{orders.length}</strong> total transaksi
        </div>
      </div>

      {/* Table Card */}
      <div 
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        <div className="table-responsive" style={{ margin: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #23253a' }}>
                <th style={thStyle({ width: '70px', textAlign: 'center' })}>ID</th>
                <th style={thStyle({ width: '140px' })}>Waktu</th>
                <th style={thStyle({ width: '75px', textAlign: 'center' })}>Meja</th>
                <th style={thStyle({})}>Pelanggan</th>
                <th style={thStyle({ width: '130px' })}>Total</th>
                <th style={thStyle({ width: '160px' })}>Pembayaran</th>
                <th style={thStyle({ width: '130px', textAlign: 'center' })}>Status Pesanan</th>
                <th style={thStyle({ width: '190px', textAlign: 'center' })}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const isPaid = order.payment_status === 'paid';
                  const isCompleted = order.order_status === 'completed';
                  const isCancelled = order.order_status === 'cancelled';
                  const isProcessing = order.order_status === 'processing';

                  return (
                    <tr 
                      key={order.id}
                      style={{ borderBottom: '1px solid #1e2030' }}
                      onMouseEnter={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#1b1d2b'); }}
                      onMouseLeave={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#161720'); }}
                    >
                      {/* ID */}
                      <td style={tdStyle({ textAlign: 'center', color: '#94a3b8', fontWeight: '600' })}>
                        #{order.id}
                      </td>

                      {/* Waktu */}
                      <td style={tdStyle({ fontSize: '12px', color: '#94a3b8' })}>
                        {new Date(order.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      {/* Meja */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <span 
                          style={{
                            backgroundColor: '#26293d',
                            color: '#f1f5f9',
                            fontWeight: '700',
                            fontSize: '12.5px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #363a54'
                          }}
                        >
                          {order.table_number}
                        </span>
                      </td>

                      {/* Pelanggan */}
                      <td style={tdStyle({})}>
                        <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '13.5px' }}>
                          {order.customer_name}
                        </div>
                        {order.location && (
                          <span 
                            style={{
                              fontSize: '10.5px',
                              color: '#94a3b8',
                              backgroundColor: '#1b1d2b',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid #282a3c',
                              display: 'inline-block',
                              marginTop: '3px'
                            }}
                          >
                            {order.location}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td style={tdStyle({ color: '#f1f5f9', fontWeight: '700', fontSize: '14px' })}>
                        Rp {parseInt(order.total_amount).toLocaleString('id-ID')}
                      </td>

                      {/* Pembayaran */}
                      <td style={tdStyle({})}>
                        <div className="d-flex flex-column align-items-start gap-1">
                          <button 
                            type="button"
                            onClick={() => updatePaymentStatus(order.id, order.payment_status)}
                            title="Klik untuk ubah status pembayaran"
                            style={{
                              backgroundColor: isPaid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              border: `1px solid ${isPaid ? '#166534' : '#7f1d1d'}`,
                              color: isPaid ? '#4ade80' : '#f87171',
                              fontSize: '11px',
                              fontWeight: '600',
                              borderRadius: '9999px',
                              padding: '3px 10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>{isPaid ? '✓ LUNAS' : '○ PENDING'}</span>
                          </button>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                            via {order.payment_method}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <span 
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.12)' : isCancelled ? 'rgba(239, 68, 68, 0.12)' : isProcessing ? 'rgba(216, 167, 68, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                            color: isCompleted ? '#4ade80' : isCancelled ? '#f87171' : isProcessing ? '#d8a744' : '#94a3b8',
                            border: `1px solid ${isCompleted ? '#166534' : isCancelled ? '#7f1d1d' : isProcessing ? '#785a28' : '#334155'}`
                          }}
                        >
                          {order.order_status.toUpperCase()}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          {/* Detail */}
                          <button 
                            onClick={() => handleShowDetail(order)}
                            title="Lihat Detail Pesanan"
                            style={{
                              backgroundColor: '#1f2235',
                              border: '1px solid #2e3566',
                              color: '#93c5fd',
                              borderRadius: '6px',
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={12} className="me-1" />
                            Detail
                          </button>

                          {/* Edit */}
                          <button 
                            onClick={() => handleEditClick(order)}
                            title="Edit Data Pesanan"
                            style={{
                              backgroundColor: 'transparent',
                              border: '1.5px solid #c9973b',
                              color: '#c9973b',
                              borderRadius: '6px',
                              padding: '4px 9px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <SquarePen size={12} className="me-1" />
                            Edit
                          </button>

                          {/* Hapus */}
                          <button 
                            onClick={() => handleDelete(order.id)}
                            title="Hapus Pesanan"
                            style={{
                              backgroundColor: '#7f1d1d',
                              border: 'none',
                              color: '#fca5a5',
                              borderRadius: '6px',
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Tidak ada data riwayat pesanan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Detail --- */}
      {showModal && selectedOrder && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}
        >
          <div 
            style={{
              backgroundColor: '#161720',
              border: '1px solid #23253a',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #23253a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>
                  Detail Pesanan #{selectedOrder.id}
                </h5>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Meja {selectedOrder.table_number} · {selectedOrder.customer_name}
                </span>
              </div>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#0d0e17',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                  color: '#cbd5e1'
                }}
              >
                <div>Lokasi: <strong style={{ color: '#f1f5f9' }}>{selectedOrder.location || 'Dine-In'}</strong></div>
                <div>Metode: <strong style={{ color: '#d8a744' }}>{selectedOrder.payment_method?.toUpperCase()}</strong></div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                  const basePrice = parseFloat(item.price_at_order || 0);
                  const variantsTotal = (item.variants && Array.isArray(item.variants))
                    ? item.variants.reduce((sum, v) => sum + parseFloat(v.variant_price || 0), 0)
                    : 0;
                  const subtotal = (basePrice + variantsTotal) * item.quantity;

                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: '#1b1d2b',
                        border: '1px solid #25283c',
                        borderRadius: '8px'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '13.5px' }}>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span style={{ fontWeight: '700', color: '#d8a744', fontSize: '13.5px' }}>
                          Rp {parseInt(subtotal).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Variants */}
                      {item.variants && item.variants.map((v, vIdx) => (
                        <div key={vIdx} style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', marginLeft: '14px' }}>
                          + {v.variant_name} (Rp {parseInt(v.variant_price).toLocaleString('id-ID')})
                        </div>
                      ))}

                      {/* Notes */}
                      {item.notes && (
                        <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', marginLeft: '14px' }}>
                          📝 Note: {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {parseFloat(selectedOrder.discount_amount || 0) > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                    <span>Subtotal:</span>
                    <span>Rp {parseInt(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>
                    <span>Diskon ({selectedOrder.discount_name || 'Promo'}):</span>
                    <span>- Rp {parseInt(selectedOrder.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #23253a'
                }}
              >
                <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>Total Pembayaran</span>
                <span style={{ fontSize: '18px', color: '#f1f5f9', fontWeight: '800' }}>
                  Rp {parseInt(selectedOrder.total_amount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #23253a',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: '#12131b'
              }}
            >
              <button 
                type="button" 
                onClick={() => handleManualPrint('kitchen')}
                style={{
                  backgroundColor: '#26293d',
                  border: '1px solid #363a54',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} color="#d8a744" />
                Tiket Dapur
              </button>

              <button 
                type="button" 
                onClick={() => handleManualPrint('customer')}
                style={{
                  backgroundColor: '#c9973b',
                  border: 'none',
                  color: '#101116',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Receipt size={14} />
                Struk Kasir
              </button>

              <button 
                type="button" 
                onClick={handleCloseModal}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #2d3045',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Edit --- */}
      {showEditModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}
        >
          <div 
            style={{
              backgroundColor: '#161720',
              border: '1px solid #23253a',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #23253a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>
                Edit Pesanan #{editFormData.id}
              </h5>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  Nama Pelanggan
                </label>
                <input 
                  type="text" 
                  name="customer_name"
                  value={editFormData.customer_name}
                  onChange={handleEditChange}
                  style={inputStyle}
                />
              </div>

              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  Nomor Meja
                </label>
                <input 
                  type="number" 
                  name="table_number"
                  value={editFormData.table_number}
                  onChange={handleEditChange}
                  style={inputStyle}
                />
              </div>

              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  Status Pesanan
                </label>
                <select 
                  name="order_status"
                  value={editFormData.order_status}
                  onChange={handleEditChange}
                  style={inputStyle}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Sedang Dimasak (Processing)</option>
                  <option value="completed">Selesai (Completed)</option>
                  <option value="cancelled">Dibatalkan (Cancelled)</option>
                </select>
              </div>

              <div className="mb-4">
                <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                  Status Pembayaran
                </label>
                <select 
                  name="payment_status"
                  value={editFormData.payment_status}
                  onChange={handleEditChange}
                  style={inputStyle}
                >
                  <option value="pending">Belum Bayar (Pending)</option>
                  <option value="paid">Lunas (Paid)</option>
                </select>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #2d3045',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveEdit}
                  style={{
                    backgroundColor: '#c9973b',
                    color: '#101116',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  transition: 'border-color 0.15s ease'
};

const thStyle = (extra = {}) => ({
  backgroundColor: '#161720',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: '600',
  padding: '16px 18px',
  textAlign: 'left',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  ...extra
});

const tdStyle = (extra = {}) => ({
  backgroundColor: '#161720',
  color: '#cbd5e1',
  fontSize: '13.5px',
  padding: '16px 18px',
  verticalAlign: 'middle',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  transition: 'background-color 0.15s',
  ...extra
});

export default OrderHistory;
