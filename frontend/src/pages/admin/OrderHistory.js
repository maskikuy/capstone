import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';
import { printReceipt } from '../../utils/printHelper';

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

  // Filter berjalan setiap kali orders atau filterStatus berubah
  useEffect(() => {
    let result = orders;

    if (filterStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.order_status === filterStatus));
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      
      result = result.filter(order => {
        // Ambil nama (aman dari null)
        const name = (order.customer_name || '').toLowerCase();
        // Ambil ID string
        const id = order.id.toString();

        // Cek apakah nama ATAU ID mengandung kata kunci pencarian
        return name.includes(lowerQuery) || id.includes(lowerQuery);
      });
    }

    setFilteredOrders(result);
  }, [orders, filterStatus, searchQuery]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/order');
      // Urutkan dari yang terbaru (ID besar ke kecil atau created_at)
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
    // Toggle status: Jika 'pending' jadi 'paid', jika 'paid' jadi 'pending'
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
    
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
  }

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
      fetchOrders(); // Refresh tabel agar data terbaru muncul
    } catch (err) {
      console.error(err);
      notifyError("Gagal mengupdate pesanan.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Riwayat Pesanan</h2>

      {<div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            
            {/* Bagian Search Bar (Kiri) */}
            <div className="col-md-6 col-12">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Cari nama pelanggan atau ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Bagian Filter Status (Kanan) */}
            <div className="col-md-6 col-12 d-flex align-items-center justify-content-md-end gap-2">
              <label className="fw-bold text-nowrap">Filter Status:</label>
              <select 
                className="form-select w-auto" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
                <option value="pending">Pending</option>
                <option value="processing">Sedang Dimasak</option>
              </select>
            </div>

          </div>
          
          {/* Info Total Data */}
          <div className="mt-3 text-muted small">
            Menampilkan <strong>{filteredOrders.length}</strong> dari <strong>{orders.length}</strong> transaksi
          </div>
        </div>
      </div>}

      {/* --- Tabel Riwayat (Tidak Berubah) --- */}
      <div className="table-responsive card shadow-sm">
        <table className="table table-hover mb-0 align-middle">
          {/* ... (isi tabel sama seperti sebelumnya) ... */}
           <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Waktu</th>
              <th>Meja</th>
              <th>Pelanggan</th>
              <th>Total Harga</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{new Date(order.created_at).toLocaleString('id-ID')}</td>
                  <td>{order.table_number}</td>
                  <td>
                    {order.customer_name} <br/>
                    <span className="badge bg-light text-dark border">{order.location}</span>
                  </td>
                  <td className="fw-bold">Rp {parseInt(order.total_amount).toLocaleString('id-ID')}</td>
                  <td>
                      <div className="d-flex flex-column align-items-start gap-1">
                        <button 
                          className={`btn btn-sm badge ${order.payment_status === 'paid' ? 'btn-success' : 'btn-danger'} border-0`}
                          onClick={() => updatePaymentStatus(order.id, order.payment_status)}
                        >
                          {order.payment_status === 'paid' ? 'LUNAS (Paid)' : 'BELUM (Pending)'} 
                          <i className="bi bi-pencil-square ms-2"></i>
                        </button>
                        <span className="text-muted small text-uppercase">via {order.payment_method}</span>
                      </div>
                    </td>
                  <td>
                    <span className={`badge ${
                      order.order_status === 'completed' ? 'bg-success' : 
                      order.order_status === 'cancelled' ? 'bg-danger' : 
                      'bg-warning text-dark'
                    }`}>
                      {order.order_status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-info text-white" onClick={() => handleShowDetail(order)}>
                      Detail
                    </button>
                    <button className="btn btn-sm btn-warning text-white ms-2" onClick={() => handleEditClick(order)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger ms-2" onClick={() => handleDelete(order.id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center py-4">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modal Detail --- */}
      {showModal && selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Pesanan #{selectedOrder.id}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {/* ... (Isi Body Modal Sama) ... */}
                <div className="d-flex justify-content-between mb-3">
                  <span><strong>Nama:</strong> {selectedOrder.customer_name}</span>
                  <span><strong>Meja:</strong> {selectedOrder.table_number}</span>
                </div>
                <ul className="list-group mb-3">
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                      
                      // --- PERBAIKAN LOGIKA HARGA DI SINI ---
                      const basePrice = parseFloat(item.price_at_order || 0);
                      
                      const variantsTotal = (item.variants && Array.isArray(item.variants))
                        ? item.variants.reduce((sum, v) => sum + parseFloat(v.variant_price || 0), 0)
                        : 0;

                      const subtotal = (basePrice + variantsTotal) * item.quantity;
                      // ---------------------------------------

                      return (
                        <li key={idx} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <span>{item.quantity}x {item.product_name}</span>
                            
                            {/* Tampilkan Subtotal yang sudah dikoreksi */}
                            <span className="fw-bold">Rp {parseInt(subtotal).toLocaleString('id-ID')}</span>
                          </div>
                          
                          {/* Varian */}
                          {item.variants && item.variants.map((v, vIdx) => (
                            <small key={vIdx} className="text-muted d-block ms-3">
                              + {v.variant_name} (Rp {parseInt(v.variant_price).toLocaleString('id-ID')})
                            </small>
                          ))}
                          
                          {/* Notes */}
                          {item.notes && <small className="text-danger d-block ms-3">Note: {item.notes}</small>}
                        </li>
                      );
                    })}
                </ul>
                <h5 className="text-end">Total: Rp {parseInt(selectedOrder.total_amount).toLocaleString('id-ID')}</h5>
              </div>

              <div className="modal-footer bg-light">
                <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={() => handleManualPrint('kitchen')}
                >
                    <i className="bi bi-printer-fill me-2"></i>Tiket Dapur
                </button>

                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => handleManualPrint('customer')}
                >
                    <i className="bi bi-receipt me-2"></i>Struk Kasir
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleCloseModal()}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Pesanan #{editFormData.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  {/* Nama Pelanggan */}
                  <div className="mb-3">
                    <label className="form-label">Nama Pelanggan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="customer_name"
                      value={editFormData.customer_name}
                      onChange={handleEditChange}
                    />
                  </div>

                  {/* Nomor Meja */}
                  <div className="mb-3">
                    <label className="form-label">Nomor Meja</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      name="table_number"
                      value={editFormData.table_number}
                      onChange={handleEditChange}
                    />
                  </div>

                  {/* Status Pesanan */}
                  <div className="mb-3">
                    <label className="form-label">Status Pesanan</label>
                    <select 
                      className="form-select" 
                      name="order_status"
                      value={editFormData.order_status}
                      onChange={handleEditChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Sedang Dimasak (Processing)</option>
                      <option value="completed">Selesai (Completed)</option>
                      <option value="cancelled">Dibatalkan (Cancelled)</option>
                    </select>
                  </div>

                  {/* Status Pembayaran */}
                  <div className="mb-3">
                    <label className="form-label">Status Pembayaran</label>
                    <select 
                      className="form-select" 
                      name="payment_status"
                      value={editFormData.payment_status}
                      onChange={handleEditChange}
                    >
                      <option value="pending">Belum Bayar (Pending)</option>
                      <option value="paid">Lunas (Paid)</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Simpan Perubahan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;