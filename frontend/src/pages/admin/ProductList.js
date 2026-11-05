
import React, { useEffect, useState } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';
import {
  Search,
  Plus,
  SquarePen,
  Trash2,
  X,
  Coffee,
  ImageOff,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';

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
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Gagal ambil produk', err);
      notifyError('Gagal memuat daftar menu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction(
      'Hapus Menu?',
      'Yakin ingin menghapus menu ini? Data tidak bisa dikembalikan.'
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/product/${id}`);
      notifySuccess('Menu berhasil dihapus');
      await fetchProducts();
    } catch (err) {
      console.error('Gagal menghapus menu:', err);
      notifyError('Gagal menghapus menu');
    }
  };

  const handleToggleStatus = async (product) => {
    const isAvailable =
      product.is_available === true ||
      Number(product.is_available) === 1;

    const newStatus = !isAvailable;
    const payload = {
      is_available: newStatus ? 1 : 0
    };

    const originalProducts = [...products];

    setProducts(current =>
      current.map(p =>
        p.id === product.id
          ? { ...p, is_available: newStatus }
          : p
      )
    );

    try {
      await api.put(`/product/${product.id}/availability`, payload);
      notifySuccess(`Status menu "${product.name}" diperbarui!`);
    } catch (err) {
      console.error('Gagal mengubah status:', err);
      setProducts(originalProducts);
      notifyError('Gagal update status. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.trim().toLowerCase();

      setFilteredProducts(
        products.filter(item => {
          const name = String(item.product_name || item.name || '').toLowerCase();
          const category = String(
            item.category_name || item.category?.name || item.category || ''
          ).toLowerCase();

          return name.includes(q) || category.includes(q);
        })
      );
    }
  }, [searchQuery, products]);

  return (
    <div
      style={{
        backgroundColor: '#0d0d12',
        color: '#f8fafc',
        minHeight: '100vh',
        padding: '24px 28px 48px'
      }}
    >

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div>
          <h3
            style={{
              color: '#f1f5f9',
              fontWeight: '700',
              fontSize: '1.45rem',
              margin: '0'
            }}
          >
            Daftar Menu Management
          </h3>
        </div>

      </div>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

        <div
          style={searchContainerStyle}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = '#d8a744';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = '#282a36';
          }}
        >
          <Search size={16} color="#64748b" style={{ flexShrink: 0 }} />

          <input
            type="text"
            placeholder="Cari nama menu (contoh: Nasi Goreng)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              style={clearSearchStyle}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <Link
          to="/admin/product/new"
          style={addButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d8a744';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#c9973b';
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Menu
        </Link>

      </div>

      <div
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <div className="table-responsive" style={{ margin: 0 }}>

          <table
            style={{
              width: '100%',
              minWidth: '850px',
              borderCollapse: 'collapse',
              backgroundColor: '#161720',
              color: '#cbd5e1'
            }}
          >

            <thead>
              <tr style={{ borderBottom: '1px solid #23253a' }}>

                <th style={thStyle({ width: '65px', textAlign: 'center' })}>
                  No
                </th>

                <th style={thStyle({ width: '105px' })}>
                  Foto
                </th>

                <th style={thStyle({ minWidth: '200px' })}>
                  Nama
                </th>

                <th style={thStyle({ width: '155px' })}>
                  Harga Dasar
                </th>

                <th style={thStyle({ width: '155px', textAlign: 'center' })}>
                  Status
                </th>

                <th style={thStyle({ width: '190px', textAlign: 'center' })}>
                  Aksi
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={emptyStyle}
                  >
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      style={{ color: '#d8a744' }}
                      role="status"
                    />
                    Memuat daftar menu...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (

                filteredProducts.map((product, index) => {
                  const isAvailable =
                    product.is_available === true ||
                    Number(product.is_available) === 1;

                  return (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: '1px solid #1e2030'
                      }}
                      onMouseEnter={(e) => {
                        [...e.currentTarget.cells].forEach(cell => {
                          cell.style.backgroundColor = '#1b1d2b';
                        });
                      }}
                      onMouseLeave={(e) => {
                        [...e.currentTarget.cells].forEach(cell => {
                          cell.style.backgroundColor = '#161720';
                        });
                      }}
                    >

                      <td
                        style={tdStyle({
                          textAlign: 'center',
                          color: '#94a3b8'
                        })}
                      >
                        {index + 1}
                      </td>

                      <td style={tdStyle({})}>

                        <div
                          style={{
                            width: '62px',
                            height: '62px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            backgroundColor: '#222433',
                            border: '1px solid #2c2f40',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                          }}
                        >
                          {product.image_url ? (
                            <img
                              src={`${API_IMAGE_URL}/${product.image_url}`}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : null}

                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: product.image_url ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ImageOff
                              size={20}
                              color="#64748b"
                              strokeWidth={1.6}
                            />
                          </div>
                        </div>

                      </td>

                      <td
                        style={tdStyle({
                          color: '#f1f5f9',
                          fontWeight: '600',
                          fontSize: '14px'
                        })}
                      >
                        <div className="d-flex align-items-center gap-2">

                          <Coffee
                            size={15}
                            color="#d8a744"
                            style={{ flexShrink: 0 }}
                          />

                          <span>{product.name || product.product_name}</span>

                          {product.inventory_id && (
                            <span
                              title="Produk ini terhubung langsung dengan data Inventori"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10px',
                                backgroundColor: 'rgba(59,130,246,0.15)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59,130,246,0.3)',
                                borderRadius: '5px',
                                padding: '2px 6px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Package size={11} />
                              Inventori
                            </span>
                          )}

                        </div>
                      </td>

                      <td
                        style={tdStyle({
                          color: '#cbd5e1',
                          fontSize: '14px'
                        })}
                      >
                        Rp {parseInt(product.base_price || 0, 10).toLocaleString('id-ID')}
                      </td>

                      <td
                        style={tdStyle({
                          textAlign: 'center'
                        })}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          title="Klik untuk mengubah status ketersediaan"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '7px',
                            backgroundColor: isAvailable
                              ? 'rgba(34,197,94,0.12)'
                              : 'rgba(239,68,68,0.12)',
                            border: `1px solid ${
                              isAvailable
                                ? 'rgba(34,197,94,0.3)'
                                : 'rgba(239,68,68,0.3)'
                            }`,
                            borderRadius: '9999px',
                            padding: '5px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '100px'
                          }}
                        >

                          {isAvailable ? (
                            <CheckCircle2 size={13} color="#4ade80" />
                          ) : (
                            <XCircle size={13} color="#f87171" />
                          )}

                          <span
                            style={{
                              color: isAvailable ? '#4ade80' : '#f87171',
                              fontSize: '11.5px',
                              fontWeight: '600'
                            }}
                          >
                            {isAvailable ? 'Tersedia' : 'Habis'}
                          </span>

                        </button>
                      </td>

                      <td
                        style={tdStyle({
                          textAlign: 'center'
                        })}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">

                          <Link
                            to={`/admin/product/edit/${product.id}`}
                            style={editButtonStyle}
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
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            style={deleteButtonStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#991b1b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#7f1d1d';
                            }}
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td colSpan="6" style={emptyStyle}>

                    <div className="d-flex flex-column align-items-center gap-2">

                      <Package
                        size={28}
                        color="#475569"
                        strokeWidth={1.5}
                      />

                      <span>
                        {searchQuery
                          ? `Menu "${searchQuery}" tidak ditemukan.`
                          : 'Belum ada data menu.'
                        }
                      </span>

                    </div>

                  </td>
                </tr>

              )}

            </tbody>

          </table>
        </div>
      </div>

      {!loading && filteredProducts.length > 0 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">

          <button
            type="button"
            style={pageBtnStyle(false)}
            disabled
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            style={pageBtnStyle(true)}
          >
            1
          </button>

          <button
            type="button"
            style={pageBtnStyle(false)}
            disabled
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={15} />
          </button>

        </div>
      )}

    </div>
  );
};

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
  whiteSpace: 'nowrap',
  ...extra
});

const tdStyle = (extra = {}) => ({
  backgroundColor: '#161720',
  color: '#cbd5e1',
  fontSize: '13.5px',
  padding: '18px',
  verticalAlign: 'middle',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  transition: 'background-color 0.15s',
  ...extra
});

const searchContainerStyle = {
  backgroundColor: '#161720',
  border: '1px solid #282a36',
  borderRadius: '8px',
  padding: '9px 13px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  maxWidth: '340px',
  transition: 'border-color 0.15s ease'
};

const searchInputStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#f1f5f9',
  fontSize: '13px',
  width: '100%',
  minWidth: 0
};

const clearSearchStyle = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  flexShrink: 0
};

const addButtonStyle = {
  backgroundColor: '#c9973b',
  color: '#fff',
  fontWeight: '600',
  fontSize: '13px',
  padding: '9px 18px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  whiteSpace: 'nowrap'
};

const editButtonStyle = {
  backgroundColor: 'transparent',
  color: '#c9973b',
  border: '1.5px solid #c9973b',
  borderRadius: '7px',
  padding: '5px 12px',
  fontSize: '12.5px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap'
};

const deleteButtonStyle = {
  backgroundColor: '#7f1d1d',
  color: '#fca5a5',
  border: 'none',
  borderRadius: '7px',
  padding: '5px 12px',
  fontSize: '12.5px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  whiteSpace: 'nowrap'
};

const emptyStyle = {
  textAlign: 'center',
  padding: '45px 20px',
  color: '#64748b',
  fontSize: '13px',
  backgroundColor: '#161720'
};

const pageBtnStyle = (active) => ({
  backgroundColor: active ? '#c9973b' : '#161720',
  border: active ? 'none' : '1px solid #282a36',
  color: active ? '#fff' : '#64748b',
  fontWeight: active ? '700' : '400',
  borderRadius: '6px',
  padding: '6px 11px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  cursor: active ? 'pointer' : 'default'
});

export default ProductList;
