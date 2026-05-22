import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import InventoryForm from './InventoryForm';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (err) {
      console.error(err);
      notifyError('Gagal mengambil data inventori');
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Gagal ambil kategori', err);
      }
    };
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirmAction('Hapus Inventori?', 'Yakin ingin menghapus item ini?');
    if (!ok) return;
    try {
      await api.delete(`/inventory/${id}`);
      notifySuccess('Item inventori dihapus');
      fetchItems();
    } catch (err) {
      console.error(err);
      notifyError('Gagal menghapus item');
    }
  };

  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchItems();
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Kelola Inventori</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleCreate}>+ Tambah Inventori</button>
        )}
      </div>

      {showForm && <InventoryForm item={editing} onSaved={onSaved} onCancel={() => {setShowForm(false); setEditing(null);}} />}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="table-dark">
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Harga Jual</th>
                  <th>Tipe Harga</th>
                  <th>Harga Grosir</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx+1}</td>
                    <td>{it.name}</td>
                      <td>{(categories.find(c => c.id === it.category_id)?.name) || (it.category_id ? it.category_id : '-')}</td>
                    <td>Rp {parseFloat(it.selling_price || 0).toLocaleString('id-ID')}</td>
                    <td>{it.price_type === 'grosir' ? 'Grosir' : 'Retail'}</td>
                    <td>
                      {it.price_type === 'grosir'
                        ? `Rp ${parseFloat(it.grosir_price_per_unit || 0).toLocaleString('id-ID')} (min ${it.grosir_min_qty || 5} pcs)`
                        : '-'}
                    </td>
                    <td>
                      {it.stock_unit === 'gram'
                        ? `${Math.round(Number(it.stock_available || 0))} gram`
                        : `${parseInt(Number(it.stock_available || 0), 10)} pcs`}
                      {Number(it.low_stock_threshold) >= 0 && Number(it.stock_available) <= Number(it.low_stock_threshold) && (
                        <span className="badge bg-warning text-dark ms-2">Stok Rendah</span>
                      )}
                    </td>
                    <td>{it.is_available ? 'Tersedia' : 'Habis'}</td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(it)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(it.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
