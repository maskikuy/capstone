import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import InventoryForm from './InventoryForm';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';
import { Plus, Search } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'bahan_baku', 'retail', 'grosir'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (err) {
      console.error(err);
      notifyError('Gagal mengambil data inventori');
    } finally {
      setLoading(false);
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
    const ok = await confirmAction('Hapus Inventori?', 'Yakin ingin menghapus item ini? Jika item ini adalah Retail/Grosir, menu penjualannya juga akan dihapus.');
    if (!ok) return;
    try {
      await api.delete(`/inventory/${id}`);
      notifySuccess('Item inventori berhasil dihapus');
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

  const thStyle = (extra = {}) => ({
    padding: '13px 16px',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    borderBottom: '1px solid #23253a',
    backgroundColor: '#161720',
    whiteSpace: 'nowrap',
    ...extra
  });

  const tdStyle = (extra = {}) => ({
    padding: '13px 16px',
    fontSize: '13.5px',
    verticalAlign: 'middle',
    ...extra
  });

  // Filter items berdasarkan tab & pencarian
  const filteredItems = items.filter(it => {
    const itemType = it.price_type || 'bahan_baku';
    const matchTab = activeTab === 'all' || itemType === activeTab;
    const matchSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '88vh', paddingBottom: '40px' }}>
      <div style={{ width: '100%', padding: '0 8px' }}>

        {/* Title & + Tambah Inventori Button */}
        <div className="d-flex justify-content-between align-items-center pt-3 pb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: 0 }}>
              Kelola Inventori
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
              Kelola stok bahan baku serta produk siap jual (retail & grosir).
            </p>
          </div>
          {!showForm && (
            <button
              onClick={handleCreate}
              style={{
                backgroundColor: '#c9973b',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ Tambah Inventori</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <InventoryForm
              item={editing}
              onSaved={onSaved}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </div>
        )}

        {/* Filter Tabs & Search */}
        {!showForm && (
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            {/* Tabs */}
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  backgroundColor: activeTab === 'all' ? '#282a36' : 'transparent',
                  color: activeTab === 'all' ? '#f1f5f9' : '#94a3b8',
                  border: '1px solid',
                  borderColor: activeTab === 'all' ? '#d8a744' : '#282a36',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Semua ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bahan_baku')}
                style={{
                  backgroundColor: activeTab === 'bahan_baku' ? '#282a36' : 'transparent',
                  color: activeTab === 'bahan_baku' ? '#cbd5e1' : '#94a3b8',
                  border: '1px solid',
                  borderColor: activeTab === 'bahan_baku' ? '#64748b' : '#282a36',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Bahan Baku ({items.filter(i => (i.price_type || 'bahan_baku') === 'bahan_baku').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('retail')}
                style={{
                  backgroundColor: activeTab === 'retail' ? '#282a36' : 'transparent',
                  color: activeTab === 'retail' ? '#93c5fd' : '#94a3b8',
                  border: '1px solid',
                  borderColor: activeTab === 'retail' ? '#3b82f6' : '#282a36',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Retail ({items.filter(i => i.price_type === 'retail').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('grosir')}
                style={{
                  backgroundColor: activeTab === 'grosir' ? '#282a36' : 'transparent',
                  color: activeTab === 'grosir' ? '#fde047' : '#94a3b8',
                  border: '1px solid',
                  borderColor: activeTab === 'grosir' ? '#eab308' : '#282a36',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Grosir ({items.filter(i => i.price_type === 'grosir').length})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Cari item inventori..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: '#161720',
                  border: '1px solid #23253a',
                  borderRadius: '8px',
                  padding: '7px 12px 7px 34px',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none'
                }}
              />
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>
        )}

        {/* Table Container Card */}
        <div style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          overflow: 'hidden'
        }}>
          <div className="table-responsive" style={{ margin: 0 }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#161720',
              color: '#cbd5e1'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #23253a' }}>
                  <th style={thStyle({ width: '48px', textAlign: 'center' })}>No</th>
                  <th style={thStyle({})}>Nama</th>
                  <th style={thStyle({ width: '130px' })}>Kategori</th>
                  <th style={thStyle({ width: '130px' })}>Harga Jual</th>
                  <th style={thStyle({ width: '120px' })}>Tipe Item</th>
                  <th style={thStyle({ width: '190px' })}>Harga Grosir</th>
                  <th style={thStyle({ width: '110px' })}>Stok</th>
                  <th style={thStyle({ width: '110px', textAlign: 'center' })}>Status</th>
                  <th style={thStyle({ width: '160px', textAlign: 'center' })}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', backgroundColor: '#161720' }}>
                      <div className="spinner-border spinner-border-sm me-2" style={{ color: '#d8a744' }} role="status" />
                      Memuat data inventori...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((it, idx) => {
                    const isAvailable = (it.is_available && Number(it.stock_available) > 0);
                    const categoryName = (categories.find(c => c.id === it.category_id)?.name) || (it.category_id ? it.category_id : '-');
                    const itemType = it.price_type || 'bahan_baku';

                    return (
                      <tr key={it.id} style={{ borderBottom: '1px solid #1e2030' }}
                        onMouseEnter={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#1b1d2b'); }}
                        onMouseLeave={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#161720'); }}>

                        {/* No */}
                        <td style={tdStyle({ textAlign: 'center', color: '#94a3b8' })}>{idx + 1}</td>

                        {/* Nama */}
                        <td style={tdStyle({ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' })}>
                          <div className="d-flex align-items-center gap-2">
                            <span>{it.name}</span>
                            {(itemType === 'retail' || itemType === 'grosir') && (
                              <span 
                                title="Otomatis terdaftar di Menu Penjualan" 
                                style={{ 
                                  fontSize: '10.5px', 
                                  backgroundColor: 'rgba(216, 167, 68, 0.15)', 
                                  color: '#e5a83b', 
                                  border: '1px solid rgba(216, 167, 68, 0.3)',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontWeight: '600'
                                }}
                              >
                                Di Penjualan
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td style={tdStyle({ color: '#94a3b8', fontSize: '13px' })}>
                          {categoryName}
                        </td>

                        {/* Harga Jual */}
                        <td style={tdStyle({ color: '#cbd5e1' })}>
                          {itemType === 'bahan_baku' 
                            ? <span style={{ color: '#64748b' }}>-</span> 
                            : `Rp ${parseFloat(it.selling_price || 0).toLocaleString('id-ID')}`
                          }
                        </td>

                        {/* Tipe Item */}
                        <td style={tdStyle({ color: '#cbd5e1' })}>
                          {itemType === 'grosir' ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(234, 179, 8, 0.15)',
                              color: '#facc15',
                              border: '1px solid rgba(234, 179, 8, 0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              Grosir
                            </span>
                          ) : itemType === 'retail' ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              Retail
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              backgroundColor: 'rgba(100, 116, 139, 0.18)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              Bahan Baku
                            </span>
                          )}
                        </td>

                        {/* Harga Grosir */}
                        <td style={tdStyle({ color: '#94a3b8', fontSize: '13px' })}>
                          {itemType === 'grosir'
                            ? `Rp ${parseFloat(it.grosir_price_per_unit || 0).toLocaleString('id-ID')} (min ${it.grosir_min_qty || 5} ${it.stock_unit})`
                            : <span style={{ color: '#64748b' }}>-</span>}
                        </td>

                        {/* Stok */}
                        <td style={tdStyle({ color: '#cbd5e1' })}>
                          {it.stock_unit === 'gram'
                            ? `${Math.round(Number(it.stock_available || 0))} gram`
                            : `${parseInt(Number(it.stock_available || 0), 10)} pcs`}
                        </td>

                        {/* Status */}
                        <td style={tdStyle({ textAlign: 'center' })}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: isAvailable ? '#4ade80' : '#f87171',
                            border: `1px solid ${isAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                          }}>
                            {isAvailable ? 'Tersedia' : 'Habis'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td style={tdStyle({ textAlign: 'center' })}>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(it)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1.5px solid #c9973b',
                                color: '#c9973b',
                                borderRadius: '7px',
                                padding: '5px 14px',
                                fontSize: '12.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#c9973b';
                                e.currentTarget.style.color = '#fff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#c9973b';
                              }}
                            >
                              Edit
                            </button>

                            {/* Hapus */}
                            <button
                              onClick={() => handleDelete(it.id)}
                              style={{
                                backgroundColor: '#7f1d1d',
                                border: 'none',
                                color: '#fca5a5',
                                borderRadius: '7px',
                                padding: '5px 14px',
                                fontSize: '12.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#991b1b'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Tidak ada data inventori {activeTab !== 'all' ? `tipe ${activeTab}` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Inventory;
