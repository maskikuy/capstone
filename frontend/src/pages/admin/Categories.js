import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' atau 'inventory'

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get(`/categories?type=${activeTab}`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/categories', { name: newCategory, type: activeTab });
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
    <div className="container" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Manajemen Kategori</h2>
      
      {/* Tab Selector */}
      <ul className="nav nav-pills mb-4 bg-light p-1" style={{ borderRadius: '0.5rem' }}>
        <li className="nav-item flex-fill">
          <button 
            type="button"
            className={`nav-link w-100 fw-bold py-2 ${activeTab === 'menu' ? 'btn-warning text-dark active' : 'text-secondary'}`}
            style={{ border: 'none', borderRadius: '0.4rem', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Kategori Menu (QR)
          </button>
        </li>
        <li className="nav-item flex-fill">
          <button 
            type="button"
            className={`nav-link w-100 fw-bold py-2 ${activeTab === 'inventory' ? 'btn-warning text-dark active' : 'text-secondary'}`}
            style={{ border: 'none', borderRadius: '0.4rem', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Kategori Inventori
          </button>
        </li>
      </ul>

      {/* Add Form */}
      <div className="card mb-4 p-3 shadow-sm" style={{ borderRadius: '0.5rem' }}>
        <form onSubmit={handleAdd} className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder={activeTab === 'menu' ? "Nama Kategori Menu Baru (misal: Nasi Goreng)" : "Nama Kategori Inventori Baru (misal: Bahan Baku)"}
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)} 
            required
          />
          <button type="submit" className="btn btn-success fw-bold px-4">Tambah</button>
        </form>
      </div>

      {/* List */}
      <ul className="list-group shadow-sm" style={{ borderRadius: '0.5rem' }}>
        {categories.length === 0 ? (
          <li className="list-group-item text-center text-muted py-4">Belum ada kategori untuk tipe ini</li>
        ) : (
          categories.map(cat => (
            <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
              <span className="fw-medium">{cat.name}</span>
              <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-outline-danger px-3">Hapus</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Categories;