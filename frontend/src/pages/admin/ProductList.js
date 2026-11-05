import React, { useEffect, useState } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';
import { Search, Plus, SquarePen, Trash2 } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/product');
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err) {
      console.error('Gagal ambil produk', err);
    } finally {
      setLoading(false);
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

  const handleToggleStatus = async (product) => {
    const newStatus = !product.is_available;
    const payload = { is_available: newStatus ? 1 : 0 };
    const originalProducts = [...products];
    setProducts(products.map(p => p.id === product.id ? { ...p, is_available: newStatus } : p));
    try {
      await api.put(`/product/${product.id}/availability`, payload);
      notifySuccess(`Status menu "${product.name}" diperbarui!`);
    } catch (err) {
      setProducts(originalProducts);
      notifyError('Gagal update status. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(products.filter(item => {
        const name = (item.product_name || item.name || '').toLowerCase();
        const cat  = (item.category || '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      }));
    }
  }, [searchQuery, products]);

  return (
    <div style={{ backgroundColor: '#0d0d12', color: '#f8fafc', minHeight: '100vh', padding: '24px 28px 48px' }}>

      {/* ── Title ── */}
      <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 20px' }}>
        Daftar Menu Management Dark Mode
      </h3>

      {/* ── Action Bar ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        {/* Search */}
        <div style={{
          backgroundColor: '#161720',
          border: '1px solid #282a36',
          borderRadius: '8px',
          padding: '9px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: '340px'
        }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cari nama menu (contoh: Nasi Goreng)..."
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
            <button type="button" onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>

        {/* + Tambah Menu */}
        <Link
          to="/admin/product/new"
          style={{
            backgroundColor: '#c9973b',
            color: '#fff',
            fontWeight: '600',
            fontSize: '13px',
            padding: '9px 22px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>+ Tambah Menu</span>
        </Link>
      </div>

      {/* ── Table Card ── */}
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
            {/* ── HEAD ── */}
            <thead>
              <tr style={{ borderBottom: '1px solid #23253a' }}>
                <th style={thStyle({ width: '54px', textAlign: 'center' })}>No</th>
                <th style={thStyle({ width: '88px' })}>Foto</th>
                <th style={thStyle({})}>Nama</th>
                <th style={thStyle({ width: '150px' })}>Harga Dasar</th>
                <th style={thStyle({ width: '150px', textAlign: 'center' })}>Status</th>
                <th style={thStyle({ width: '175px', textAlign: 'center' })}>Aksi</th>
              </tr>
            </thead>

            {/* ── BODY ── */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div className="spinner-border spinner-border-sm me-2" style={{ color: '#d8a744' }} role="status" />
                    Memuat daftar menu...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #1e2030' }}
                    onMouseEnter={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#1b1d2b'); }}
                    onMouseLeave={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#161720'); }}>

                    {/* No */}
                    <td style={tdStyle({ textAlign: 'center', color: '#94a3b8' })}>{index + 1}</td>

                    {/* Foto */}
                    <td style={tdStyle({})}>
                      <div style={{
                        width: '62px', height: '62px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundColor: '#262835',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)'
                      }}>
                        {product.image_url
                          ? <img src={`${API_IMAGE_URL}/${product.image_url}`} alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '10px', color: '#64748b' }}>No Img</span>
                        }
                      </div>
                    </td>

                    {/* Nama */}
                    <td style={tdStyle({ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' })}>
                      <div className="d-flex align-items-center gap-2">
                        <span>{product.name}</span>
                        {product.inventory_id && (
                          <span 
                            title="Produk ini terhubung langsung dengan data Inventori" 
                            style={{ 
                              fontSize: '10.5px', 
                              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                              color: '#60a5fa', 
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontWeight: '600'
                            }}
                          >
                            Inventori
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Harga Dasar */}
                    <td style={tdStyle({ color: '#cbd5e1', fontSize: '14px' })}>
                      Rp {parseInt(product.base_price).toLocaleString('id-ID')}
                    </td>

                    {/* Status */}
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        title="Klik untuk ubah status"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          backgroundColor: product.is_available ? '#0e3a27' : '#3b1414',
                          border: `1px solid ${product.is_available ? '#166534' : '#7f1d1d'}`,
                          borderRadius: '9999px',
                          padding: '4px 10px 4px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: '96px',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{
                          color: product.is_available ? '#4ade80' : '#f87171',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          letterSpacing: '0.2px'
                        }}>
                          {product.is_available ? 'Tersedia' : 'Habis'}
                        </span>
                        {/* toggle dot */}
                        <span style={{
                          width: '16px', height: '16px',
                          borderRadius: '50%',
                          backgroundColor: product.is_available ? '#22c55e' : '#ef4444',
                          display: 'inline-block',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                          flexShrink: 0
                        }} />
                      </button>
                    </td>

                    {/* Aksi */}
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {/* Edit — outlined amber */}
                        <Link
                          to={`/admin/product/edit/${product.id}`}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#c9973b',
                            border: '1.5px solid #c9973b',
                            borderRadius: '7px',
                            padding: '5px 14px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
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
                          <SquarePen size={13} />
                          <span>Edit</span>
                        </Link>

                        {/* Hapus — filled dark-red */}
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          style={{
                            backgroundColor: '#7f1d1d',
                            color: '#fca5a5',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '5px 14px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#991b1b'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Menu "{searchQuery}" tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {filteredProducts.length > 0 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
          <button type="button" style={pageBtnStyle(false)} disabled>❮</button>
          <button type="button" style={pageBtnStyle(true)}>1</button>
          <button type="button" style={pageBtnStyle(false)} disabled>❯</button>
        </div>
      )}
    </div>
  );
};

/* ── helper style fns ── */
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
  padding: '18px 18px',
  verticalAlign: 'middle',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  transition: 'background-color 0.15s',
  ...extra
});

const pageBtnStyle = (active) => ({
  backgroundColor: active ? '#c9973b' : '#161720',
  border: active ? 'none' : '1px solid #282a36',
  color: active ? '#fff' : '#64748b',
  fontWeight: active ? '700' : '400',
  borderRadius: '6px',
  padding: '5px 12px',
  fontSize: '12px',
  cursor: active ? 'pointer' : 'default'
});

export default ProductList;