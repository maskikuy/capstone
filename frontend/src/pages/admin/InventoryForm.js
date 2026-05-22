import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifyError, notifySuccess } from '../../utils/notify';

const InventoryForm = ({ item, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    selling_price: 0,
    initial_cost: 0,
    price_type: 'retail',
    retail_price_per_unit: 0,
    grosir_price_per_unit: 0,
    grosir_min_qty: 0,
    stock_available: 0,
    stock_unit: 'pcs',
    low_stock_threshold: 0,
    warehouse_stock: 0,
    real_stock: 0,
    is_available: true
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...form, ...item });
    }
    // eslint-disable-next-line
  }, [item]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data || []);
      } catch (err) {
        // non-blocking
        console.error('Gagal ambil kategori', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = value;
    if (type === 'number') {
      v = value === '' ? '' : Number(value);
    }
    if (type === 'checkbox') v = checked;
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.name || form.name.trim() === '') return notifyError('Nama wajib diisi');
    if (Number(form.selling_price) < 0) return notifyError('Harga jual tidak valid');
    if (Number(form.stock_available) < 0) return notifyError('Stok tidak boleh negatif');
    if (form.price_type === 'grosir') {
      if (Number(form.grosir_min_qty) < 5) return notifyError('Minimal pembelian grosir harus minimal 5 pcs');
      if (Number(form.grosir_price_per_unit) <= 0) return notifyError('Harga grosir per unit tidak valid');
    }

    // Prepare payload: ensure numeric types
    const payload = {
      ...form,
      selling_price: Number(form.selling_price) || 0,
      initial_cost: Number(form.initial_cost) || 0,
      retail_price_per_unit: Number(form.retail_price_per_unit) || 0,
      grosir_price_per_unit: Number(form.grosir_price_per_unit) || 0,
      grosir_min_qty: Number(form.grosir_min_qty) || 0,
      stock_available: Number(form.stock_available) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      warehouse_stock: Number(form.warehouse_stock) || 0,
      real_stock: Number(form.real_stock) || 0,
      category_id: form.category_id ? (Number(form.category_id) || null) : null,
      is_available: !!form.is_available
    };

    setSaving(true);
    try {
      if (item) {
        await api.put(`/inventory/${item.id}`, payload);
        notifySuccess('Inventori berhasil diperbarui');
      } else {
        await api.post('/inventory', payload);
        notifySuccess('Inventori berhasil dibuat');
      }
      onSaved();
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.error || 'Gagal menyimpan inventori');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5>{item ? 'Edit Inventori' : 'Tambah Inventori'}</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">Nama</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
          </div>
          <div className="mb-2">
            <label className="form-label">Kategori</label>
            <select name="category_id" value={form.category_id || ''} onChange={handleChange} className="form-select">
              <option value="">-- Pilih Kategori --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Tipe Harga</label>
            <select name="price_type" value={form.price_type} onChange={handleChange} className="form-select">
              <option value="retail">Retail</option>
              <option value="grosir">Grosir</option>
            </select>
          </div>
          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label">Harga Jual</label>
              <input name="selling_price" type="number" value={form.selling_price} onChange={handleChange} className="form-control" min="0" step="0.01" />
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Stok Tersedia</label>
              <div className="input-group">
                <input name="stock_available" type="number" value={form.stock_available} onChange={handleChange} className="form-control" min="0" step={form.stock_unit === 'gram' ? '1' : '1'} />
                <span className="input-group-text">{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">Unit</label>
              <select name="stock_unit" value={form.stock_unit} onChange={handleChange} className="form-select">
                <option value="pcs">pcs</option>
                <option value="gram">gram</option>
              </select>
            </div>
          </div>
          {form.price_type === 'grosir' && (
            <div className="row">
              <div className="col-md-4 mb-2">
                <label className="form-label">Minimal Grosir (pcs)</label>
                <input name="grosir_min_qty" type="number" value={form.grosir_min_qty} onChange={handleChange} className="form-control" min="5" step="1" />
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label">Harga Grosir per Unit</label>
                <input name="grosir_price_per_unit" type="number" value={form.grosir_price_per_unit} onChange={handleChange} className="form-control" min="0" step="0.01" />
              </div>
              <div className="col-md-4 mb-2 d-flex align-items-end">
                <div className="alert alert-info mb-0 py-2">
                  Grosir aktif mulai {form.grosir_min_qty || 5} pcs. Setiap pembelian grosir dapat diskon Rp 2.000 per unit di atas 5 pcs.
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label">Stok Gudang</label>
              <div className="input-group">
                <input name="warehouse_stock" type="number" value={form.warehouse_stock} onChange={handleChange} className="form-control" min="0" step={form.stock_unit === 'gram' ? '1' : '1'} />
                <span className="input-group-text">{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
              </div>
            </div>

            <div className="col-md-4 mb-2">
              <label className="form-label">Stok Real</label>
              <div className="input-group">
                <input name="real_stock" type="number" value={form.real_stock} onChange={handleChange} className="form-control" min="0" step={form.stock_unit === 'gram' ? '1' : '1'} />
                <span className="input-group-text">{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
              </div>
            </div>

            <div className="col-md-4 mb-2">
              <label className="form-label">Ambang Stok Rendah</label>
              <div className="input-group">
                <input name="low_stock_threshold" type="number" value={form.low_stock_threshold} onChange={handleChange} className="form-control" min="0" step={form.stock_unit === 'gram' ? '1' : '1'} />
                <span className="input-group-text">{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
              </div>
            </div>
          </div>

          <div className="mb-2 form-check form-switch">
            <input className="form-check-input" type="checkbox" id="is_available" name="is_available" checked={!!form.is_available} onChange={handleChange} />
            <label className="form-check-label" htmlFor="is_available">Tersedia</label>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
