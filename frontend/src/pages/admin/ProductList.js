import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';

const ProductList = () => {
  const [products, setProducts] = useState([]);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/product');
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err) {
      console.error("Gagal ambil produk", err);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction(
      'Hapus Menu?', 
      'Yakin ingin menghapus menu ini? Data tidak bisa dikembalikan.'
    );

    if (isConfirmed) {
      try {
        await api.delete(`/product/${id}`);
        notifySuccess('Menu berhasil dihapus');
        fetchProducts();
      } catch (err) {
        notifyError('Gagal menghapus menu');
      }
    }
  };

  // --- FITUR BARU: Toggle Status ---
  const handleToggleStatus = async (product) => {
    const newStatus = !product.is_available; 

    // Siapkan FormData
    const payload = { 
      is_available: newStatus ? 1 : 0 
    };

    // Optimistic Update
    const originalProducts = [...products];
    const updatedProducts = products.map(p => 
      p.id === product.id ? { ...p, is_available: newStatus } : p
    );
    setProducts(updatedProducts);

    try {
      // PERBAIKAN DI SINI:
      // Hapus object { headers: ... }
      // Biarkan Axios mengatur header otomatis karena kita mengirim instance FormData
      await api.put(`/product/${product.id}/availability`, payload);
      
      notifySuccess(`Status menu "${product.name}" diperbarui!`);
    } catch (err) {
      setProducts(originalProducts);
      notifyError('Gagal update status. Silakan coba lagi.');
      console.error(err);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      // Jika search kosong, tampilkan semua produk
      setFilteredProducts(products);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      
      const results = products.filter(item => {
        // Ambil nama (aman dari null)
        const name = (item.product_name || item.name || '').toLowerCase();
        
        // Ambil kategori (opsional, jika ingin cari berdasarkan kategori juga)
        const category = (item.category || '').toLowerCase();
        
        // Cek kecocokan
        return name.includes(lowerQuery) || category.includes(lowerQuery);
      });

      setFilteredProducts(results);
    }
  }, [searchQuery, products]);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Daftar Menu</h2>
        <Link to="/admin/product/new" className="btn btn-primary">+ Tambah Menu</Link>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Cari nama menu (contoh: Nasi Goreng)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Tombol Clear Search (Opsional) */}
            {searchQuery && (
               <button 
                 className="btn btn-outline-secondary border-start-0 border-top-1 border-bottom-1"
                 onClick={() => setSearchQuery('')}
               >
                 <i className="bi bi-x-lg"></i>
               </button>
            )}
          </div>
          
          <div className="mt-2 small text-muted">
            Menampilkan <strong>{filteredProducts.length}</strong> menu
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>No</th>
              <th>Foto</th>
              <th>Nama</th>
              <th>Harga Dasar</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {/* --- PERUBAHAN DI SINI: Gunakan filteredProducts --- */}
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>
                    {product.image_url ? (
                      <img 
                        src={`${process.env.REACT_APP_API_IMAGE_URL}/${product.image_url}`} 
                        alt={product.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                      />
                    ) : (
                      <span className="text-muted small">No Image</span>
                    )}
                  </td>
                  
                  {/* Highlight nama jika sedang dicari (Opsional, tapi bagus UX-nya) */}
                  <td className="fw-bold">{product.name}</td>
                  
                  <td>Rp {parseInt(product.base_price).toLocaleString('id-ID')}</td>
                  <td>
                      {/* ... (Kode Toggle Switch Anda Tetap Sama) ... */}
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          role="switch" 
                          id={`switch-${product.id}`}
                          checked={!!product.is_available} 
                          onChange={() => handleToggleStatus(product)}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                        <label 
                          className={`form-check-label small ms-2 fw-bold ${product.is_available ? 'text-success' : 'text-danger'}`} 
                          htmlFor={`switch-${product.id}`}
                          style={{cursor: 'pointer'}}
                        >
                          {product.is_available ? 'Tersedia' : 'Habis'}
                        </label>
                      </div>
                  </td>
                  <td>
                    <Link to={`/admin/product/edit/${product.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                    <button onClick={() => handleDelete(product.id)} className="btn btn-sm btn-danger">Hapus</button>
                  </td>
                </tr>
              ))
            ) : (
              // --- TAMPILAN JIKA TIDAK ADA HASIL ---
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  <i className="bi bi-search fs-3 d-block mb-2"></i>
                  Menu "{searchQuery}" tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;