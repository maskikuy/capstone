import React, { useState, useEffect } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { notifyError, notifySuccess } from '../../utils/notify';
import { Upload, X } from 'lucide-react';

const cleanNumericValue = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return '';
  return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(4)));
};

const InventoryForm = ({ item, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    selling_price: '',
    initial_cost: '',
    price_type: 'bahan_baku',
    retail_price_per_unit: '',
    grosir_price_per_unit: '',
    grosir_min_qty: '',
    stock_available: '',
    stock_unit: 'pcs',
    low_stock_threshold: '',
    warehouse_stock: '',
    is_available: true
  });
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm(prev => ({
        ...prev,
        ...item,
        price_type: item.price_type || 'bahan_baku',
        selling_price: cleanNumericValue(item.selling_price),
        initial_cost: cleanNumericValue(item.initial_cost),
        retail_price_per_unit: cleanNumericValue(item.retail_price_per_unit),
        grosir_price_per_unit: cleanNumericValue(item.grosir_price_per_unit),
        grosir_min_qty: cleanNumericValue(item.grosir_min_qty),
        stock_available: cleanNumericValue(item.stock_available),
        low_stock_threshold: cleanNumericValue(item.low_stock_threshold),
        warehouse_stock: cleanNumericValue(item.warehouse_stock),
      }));
      if (item.image_url) {
        setImagePreview(`${API_IMAGE_URL}/${item.image_url}`);
      }
    }
  }, [item]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = value;
    if (type === 'number') {
      if (typeof value === 'string' && value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        v = value.replace(/^0+/, '');
      }
    }
    if (type === 'checkbox') v = checked;
    
    setForm(prev => {
      const nextForm = { ...prev, [name]: v };
      if (name === 'stock_available') {
        const stockVal = Number(v) || 0;
        if (stockVal <= 0) {
          nextForm.is_available = false;
        } else if (Number(prev.stock_available || 0) <= 0 && stockVal > 0) {
          nextForm.is_available = true;
        }
      }
      return nextForm;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleNumberFocus = (e) => {
    if (e.target.value === '0' || e.target.value === 0) {
      const name = e.target.name;
      setForm(prev => ({ ...prev, [name]: '' }));
    } else {
      e.target.select();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const grosirUnit = form.stock_unit === 'gram' ? 'gram' : 'pcs';
    const minGrosirQty = 5;

    if (!form.name || form.name.trim() === '') return notifyError('Nama wajib diisi');
    if (Number(form.stock_available || 0) < 0) return notifyError('Stok tidak boleh negatif');

    if (form.price_type === 'bahan_baku') {
      // Bahan baku tidak wajib harga jual
    } else {
      // Retail dan Grosir wajib harga jual
      if (!form.selling_price || Number(form.selling_price) <= 0) {
        return notifyError('Harga jual wajib diisi dan lebih dari 0 untuk menu retail / grosir');
      }
      if (form.price_type === 'grosir') {
        if (Number(form.grosir_min_qty || 0) < minGrosirQty) {
          return notifyError(`Minimal pembelian grosir harus minimal ${minGrosirQty} ${grosirUnit}`);
        }
        if (Number(form.grosir_price_per_unit || 0) <= 0) {
          return notifyError('Harga grosir per unit tidak valid');
        }
      }
    }

    const payload = {
      ...form,
      selling_price: form.price_type === 'bahan_baku' ? 0 : (Number(form.selling_price) || 0),
      initial_cost: Number(form.initial_cost) || 0,
      retail_price_per_unit: Number(form.retail_price_per_unit) || 0,
      grosir_price_per_unit: form.price_type === 'grosir' ? (Number(form.grosir_price_per_unit) || 0) : 0,
      grosir_min_qty: form.price_type === 'grosir' ? (Number(form.grosir_min_qty) || 0) : 0,
      stock_available: Number(form.stock_available) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      warehouse_stock: Number(form.warehouse_stock) || 0,
      category_id: form.category_id ? (Number(form.category_id) || null) : null,
      is_available: !!form.is_available
    };

    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (item) {
        await api.put(`/inventory/${item.id}`, formData);
        notifySuccess('Inventori berhasil diperbarui');
      } else {
        await api.post('/inventory', formData);
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

  const inputStyle = {
    backgroundColor: '#1c1d27',
    border: '1px solid #282a36',
    color: '#f1f5f9',
    borderRadius: '8px',
    padding: '9px 14px',
    fontSize: '13.5px'
  };

  const addonStyle = {
    backgroundColor: '#282a36',
    border: '1px solid #282a36',
    color: '#cbd5e1',
    fontSize: '13px'
  };

  const isSellable = form.price_type === 'retail' || form.price_type === 'grosir';

  // Pisahkan kategori menu dan inventori
  const menuCategories = categories.filter(c => c.type === 'menu');
  const inventoryCategories = categories.filter(c => !c.type || c.type === 'inventory');

  return (
    <div style={{ backgroundColor: '#161720', border: '1px solid #232530', borderRadius: '12px', padding: '24px', color: '#f1f5f9' }}>
      <h5 style={{ color: '#f1f5f9', fontWeight: '700', marginBottom: '20px' }}>
        {item ? 'Edit Inventori' : 'Tambah Inventori'}
      </h5>
      <form onSubmit={handleSubmit}>
        {/* Pilihan Tipe Item */}
        <div className="mb-3">
          <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
            Tipe Item <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select 
            name="price_type" 
            value={form.price_type} 
            onChange={handleChange} 
            className="form-select" 
            style={{ ...inputStyle, border: isSellable ? '1px solid #e5a83b' : '1px solid #282a36', fontWeight: '600' }}
          >
            <option value="bahan_baku" style={{ backgroundColor: '#1c1d27' }}>Bahan Baku</option>
            <option value="retail" style={{ backgroundColor: '#1c1d27' }}>Retail</option>
            <option value="grosir" style={{ backgroundColor: '#1c1d27' }}>Grosir</option>
          </select>
        </div>

        {/* Informasi Status Kategori */}
        {form.price_type === 'bahan_baku' && (
          <div style={{ backgroundColor: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: '#94a3b8', marginBottom: '16px' }}>
            ℹ️ <strong>Bahan Baku:</strong> Item ini hanya dicatat di sistem inventori/gudang untuk kebutuhan resep & dapur. <u>Tidak akan muncul</u> pada daftar menu penjualan.
          </div>
        )}

        {isSellable && (
          <div style={{ backgroundColor: form.price_type === 'grosir' ? 'rgba(216, 167, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)', border: form.price_type === 'grosir' ? '1px solid rgba(216, 167, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px', color: form.price_type === 'grosir' ? '#facc15' : '#60a5fa', marginBottom: '16px' }}>
            ✨ <strong>Siap Jual:</strong> Item tipe <strong>{form.price_type === 'grosir' ? 'Grosir' : 'Retail'}</strong> otomatis akan terdaftar di <strong>Menu Penjualan</strong> sama seperti Tambah Menu, dan stoknya akan otomatis berkurang saat ada transaksi.
          </div>
        )}

        {/* Nama Item */}
        <div className="mb-3">
          <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            Nama Item <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="form-control" 
            style={inputStyle} 
            placeholder={form.price_type === 'bahan_baku' ? 'Contoh: Biji Kopi Arabika, Daging Ayam' : 'Contoh: Kopi Botol 250ml, Sirup Coklat'} 
            required 
          />
        </div>

        {/* Kategori Klasifikasi */}
        <div className="mb-3">
          <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
            Kategori Inventori
          </label>
          <select name="category_id" value={form.category_id || ''} onChange={handleChange} className="form-select" style={inputStyle}>
            <option value="">-- Pilih Kategori --</option>
            {inventoryCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Baris Harga Jual (Hanya untuk Retail & Grosir) & Stok */}
        <div className="row g-3 mb-3">
          {isSellable && (
            <div className="col-md-4">
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                Harga Jual (Rp) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                name="selling_price" 
                type="number" 
                value={form.selling_price} 
                onChange={handleChange} 
                onFocus={handleNumberFocus}
                placeholder="0"
                className="form-control" 
                style={inputStyle} 
                min="0" 
                step="0.01" 
                required
              />
            </div>
          )}
          <div className={isSellable ? "col-md-4" : "col-md-6"}>
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
              Stok Tersedia
            </label>
            <div className="input-group">
              <input 
                name="stock_available" 
                type="number" 
                value={form.stock_available} 
                onChange={handleChange} 
                onFocus={handleNumberFocus}
                placeholder="0"
                className="form-control" 
                style={inputStyle} 
                min="0" 
                step="1" 
              />
              <span className="input-group-text" style={addonStyle}>{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
            </div>
          </div>
          <div className={isSellable ? "col-md-4" : "col-md-6"}>
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
              Satuan / Unit
            </label>
            <select name="stock_unit" value={form.stock_unit} onChange={handleChange} className="form-select" style={inputStyle}>
              <option value="pcs">pcs</option>
              <option value="gram">gram</option>
            </select>
          </div>
        </div>

        {/* Opsi Khusus Grosir */}
        {form.price_type === 'grosir' && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                Minimal Grosir ({form.stock_unit === 'gram' ? 'gram' : 'pcs'}) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="input-group">
                <input 
                  name="grosir_min_qty" 
                  type="number" 
                  value={form.grosir_min_qty} 
                  onChange={handleChange} 
                  onFocus={handleNumberFocus}
                  placeholder="5"
                  className="form-control" 
                  style={inputStyle} 
                  min="1" 
                  step="1" 
                  required
                />
                <span className="input-group-text" style={addonStyle}>{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
              </div>
            </div>
            <div className="col-md-4">
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                Harga Grosir per Unit (Rp) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                name="grosir_price_per_unit" 
                type="number" 
                value={form.grosir_price_per_unit} 
                onChange={handleChange} 
                onFocus={handleNumberFocus}
                placeholder="0"
                className="form-control" 
                style={inputStyle} 
                min="0" 
                step="0.01" 
                required
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#60a5fa', width: '100%' }}>
                Grosir aktif mulai {form.grosir_min_qty || 5} {form.stock_unit === 'gram' ? 'gram' : 'pcs'}.
              </div>
            </div>
          </div>
        )}

        {/* Stok Gudang & Ambang Batas */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Stok Gudang</label>
            <div className="input-group">
              <input 
                name="warehouse_stock" 
                type="number" 
                value={form.warehouse_stock} 
                onChange={handleChange} 
                onFocus={handleNumberFocus}
                placeholder="0"
                className="form-control" 
                style={inputStyle} 
                min="0" 
                step="1" 
              />
              <span className="input-group-text" style={addonStyle}>{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
            </div>
          </div>
          <div className="col-md-6">
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Ambang Stok Rendah</label>
            <div className="input-group">
              <input 
                name="low_stock_threshold" 
                type="number" 
                value={form.low_stock_threshold} 
                onChange={handleChange} 
                onFocus={handleNumberFocus}
                placeholder="0"
                className="form-control" 
                style={inputStyle} 
                min="0" 
                step="1" 
              />
              <span className="input-group-text" style={addonStyle}>{form.stock_unit === 'gram' ? 'gram' : 'pcs'}</span>
            </div>
          </div>
        </div>

        {/* Upload Foto (Opsional, terutama untuk menu penjualan) */}
        {isSellable && (
          <div className="mb-3">
            <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
              Foto Menu Penjualan (Opsional)
            </label>
            <div className="d-flex align-items-center gap-3">
              {imagePreview ? (
                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={removeImage}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label 
                  style={{ 
                    border: '1px dashed #334155', 
                    borderRadius: '8px', 
                    padding: '12px 18px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: '#94a3b8', 
                    fontSize: '13px' 
                  }}
                >
                  <Upload size={16} />
                  <span>Pilih Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
              <span style={{ fontSize: '12px', color: '#64748b' }}>Format: JPG, PNG, WEBP</span>
            </div>
          </div>
        )}

        {/* Toggle Ketersediaan Operasional */}
        <div className="mb-4 form-check form-switch">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="is_available" 
            name="is_available" 
            checked={Number(form.stock_available || 0) <= 0 ? false : !!form.is_available} 
            onChange={handleChange}
            disabled={Number(form.stock_available || 0) <= 0}
            style={{ cursor: 'pointer' }}
          />
          <label className="form-check-label" htmlFor="is_available" style={{ color: '#cbd5e1', fontSize: '13px' }}>
            Tersedia untuk Operasional
          </label>
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="d-flex gap-2">
          <button 
            type="submit" 
            disabled={saving}
            style={{
              backgroundColor: '#d8a744',
              color: '#101116',
              fontWeight: '600',
              fontSize: '13px',
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {saving ? 'Menyimpan...' : (item ? 'Perbarui Inventori' : 'Simpan Inventori')}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            style={{
              backgroundColor: '#282a36',
              color: '#cbd5e1',
              fontWeight: '500',
              fontSize: '13px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;
