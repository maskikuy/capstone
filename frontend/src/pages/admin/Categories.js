import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      await api.post('/categories', { name: newCategory });
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
      
      <div className="card mb-4 p-3 shadow-sm">
        <form onSubmit={handleAdd} className="d-flex gap-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nama Kategori Baru (misal: Minuman Dingin)" 
            value={newCategory} 
            onChange={(e) => setNewCategory(e.target.value)} 
          />
          <button type="submit" className="btn btn-success">Tambah</button>
        </form>
      </div>

      <ul className="list-group shadow-sm">
        {categories.map(cat => (
          <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center">
            {cat.name}
            <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-outline-danger">Hapus</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;