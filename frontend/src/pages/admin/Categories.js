import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' atau 'inventory'
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/categories?type=${activeTab}`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/categories', { name: newCategory.trim(), type: activeTab });
      setNewCategory('');
      fetchCategories();
      notifySuccess('Kategori berhasil ditambahkan');
    } catch (err) {
      notifyError('Gagal menambah kategori');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction(
      'Hapus Kategori?', 
      'Yakin ingin menghapus kategori ini?'
    );

    if (isConfirmed) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
        notifySuccess('Kategori berhasil dihapus');
      } catch (err) {
        notifyError('Gagal hapus kategori');
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '88vh', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%', padding: '0 12px' }}>
        
        {/* Title */}
        <div className="pt-3 pb-3">
          <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: 0 }}>
            Manajemen Kategori
          </h3>
        </div>

        {/* Tab Selector (Underline style) */}
        <div className="d-flex align-items-center gap-4 mb-4" style={{ borderBottom: '1px solid #282a36' }}>
          <button 
            type="button"
            onClick={() => setActiveTab('menu')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'menu' ? '2px solid #e5a83b' : '2px solid transparent',
              color: activeTab === 'menu' ? '#ffffff' : '#9ca3af',
              fontWeight: activeTab === 'menu' ? '600' : '400',
              fontSize: '13.5px',
              padding: '10px 4px',
              cursor: 'pointer',
              borderRadius: 0,
              transition: 'all 0.15s ease'
            }}
          >
            Kategori Menu (QR)
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('inventory')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inventory' ? '2px solid #e5a83b' : '2px solid transparent',
              color: activeTab === 'inventory' ? '#ffffff' : '#9ca3af',
              fontWeight: activeTab === 'inventory' ? '600' : '400',
              fontSize: '13.5px',
              padding: '10px 4px',
              cursor: 'pointer',
              borderRadius: 0,
              transition: 'all 0.15s ease'
            }}
          >
            Kategori Inventori
          </button>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAdd} className="d-flex align-items-center gap-3 mb-4">
          <input 
            type="text" 
            placeholder={activeTab === 'menu' ? "Nama Kategori Menu Baru (misal: Nasi Goreng)" : "Nama Kategori Inventori Baru (misal: Bahan Baku)"}
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)} 
            required
            style={{
              flex: 1,
              backgroundColor: '#1c1d27',
              border: '1px solid #282a36',
              borderRadius: '8px',
              color: '#f1f5f9',
              padding: '11px 18px',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#e5a83b'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#282a36'; }}
          />
          <button 
            type="submit" 
            style={{
              backgroundColor: '#d8a744',
              color: '#181920',
              fontWeight: '600',
              fontSize: '13.5px',
              padding: '11px 36px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5b34e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
          >
            Tambah
          </button>
        </form>

        {/* Categories List Cards */}
        <div className="d-flex flex-column gap-2">
          {loading ? (
            <div 
              style={{
                backgroundColor: '#1c1d27',
                border: '1px solid #282a36',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13.5px'
              }}
            >
              <div className="spinner-border spinner-border-sm me-2" style={{ color: '#d8a744' }} role="status" />
              Memuat kategori...
            </div>
          ) : categories.length === 0 ? (
            <div 
              style={{
                backgroundColor: '#1c1d27',
                border: '1px solid #282a36',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13.5px'
              }}
            >
              Belum ada kategori untuk tipe ini
            </div>
          ) : (
            categories.map(cat => (
              <div 
                key={cat.id} 
                style={{
                  backgroundColor: '#1c1d27',
                  border: '1px solid #282a36',
                  borderRadius: '8px',
                  padding: '16px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21222e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1c1d27'; }}
              >
                <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '400' }}>
                  {cat.name}
                </span>
                <button 
                  type="button"
                  onClick={() => handleDelete(cat.id)} 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Categories;