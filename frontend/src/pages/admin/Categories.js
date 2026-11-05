
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';
import { Search, Plus, SquarePen, Trash2, Utensils, Package, X, Save, Tag } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/categories?type=${activeTab}`);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil kategori:', err);
      notifyError('Gagal memuat daftar kategori');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();

    const categoryName = newCategory.trim();

    if (!categoryName) {
      notifyError('Nama kategori wajib diisi');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      notifyError('Kategori tersebut sudah tersedia');
      return;
    }

    setSaving(true);

    try {
      await api.post('/categories', {
        name: categoryName,
        type: activeTab
      });

      setNewCategory('');
      await fetchCategories();
      notifySuccess('Kategori berhasil ditambahkan');
    } catch (err) {
      console.error('Gagal menambahkan kategori:', err);
      notifyError('Gagal menambah kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    const categoryName = editCategoryName.trim();

    if (!categoryName) {
      notifyError('Nama kategori wajib diisi');
      return;
    }

    if (
      categories.some(
        cat =>
          cat.id !== editingCategory.id &&
          cat.name.toLowerCase() === categoryName.toLowerCase()
      )
    ) {
      notifyError('Nama kategori tersebut sudah digunakan');
      return;
    }

    setSaving(true);

    try {
      await api.put(`/categories/${editingCategory.id}`, {
        name: categoryName,
        type: activeTab
      });

      setEditingCategory(null);
      setEditCategoryName('');
      await fetchCategories();
      notifySuccess('Kategori berhasil diperbarui');
    } catch (err) {
      console.error('Gagal memperbarui kategori:', err);
      notifyError('Gagal memperbarui kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const isConfirmed = await confirmAction(
      'Hapus Kategori?',
      `Yakin ingin menghapus kategori "${category.name}"? Data tidak bisa dikembalikan.`
    );

    if (isConfirmed) {
      try {
        await api.delete(`/categories/${category.id}`);
        await fetchCategories();
        notifySuccess('Kategori berhasil dihapus');
      } catch (err) {
        console.error('Gagal menghapus kategori:', err);
        notifyError('Gagal menghapus kategori');
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div style={{
      backgroundColor: '#0d0d12',
      color: '#f8fafc',
      minHeight: '100vh',
      padding: '24px 28px 48px'
    }}>

      {/* Title */}
      <h3 style={{
        color: '#f1f5f9',
        fontWeight: '700',
        fontSize: '1.45rem',
        margin: '0 0 20px'
      }}>
        Manajemen Kategori
      </h3>

      {/* Tabs */}
      <div
        className="d-flex align-items-center gap-4 mb-4"
        style={{
          borderBottom: '1px solid #282a36',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('menu');
            setSearchQuery('');
            setNewCategory('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'menu' ? '2px solid #d8a744' : '2px solid transparent',
            color: activeTab === 'menu' ? '#d8a744' : '#94a3b8',
            fontWeight: activeTab === 'menu' ? '700' : '400',
            fontSize: '13px',
            padding: '10px 4px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Utensils size={15} />
          Kategori Menu (QR)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('inventory');
            setSearchQuery('');
            setNewCategory('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid #d8a744' : '2px solid transparent',
            color: activeTab === 'inventory' ? '#d8a744' : '#94a3b8',
            fontWeight: activeTab === 'inventory' ? '700' : '400',
            fontSize: '13px',
            padding: '10px 4px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Package size={15} />
          Kategori Inventori
        </button>
      </div>

      {/* Action Bar */}
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
            placeholder="Cari nama kategori..."
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
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 0,
                display: 'flex'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Add Category */}
        <form
          onSubmit={handleAdd}
          className="d-flex align-items-center gap-2 flex-wrap"
          style={{
            flex: '1',
            justifyContent: 'flex-end',
            minWidth: '280px'
          }}
        >
          <input
            type="text"
            placeholder={
              activeTab === 'menu'
                ? 'Nama kategori menu baru...'
                : 'Nama kategori inventori baru...'
            }
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
            style={{
              backgroundColor: '#161720',
              border: '1px solid #282a36',
              borderRadius: '8px',
              color: '#f1f5f9',
              padding: '9px 14px',
              fontSize: '13px',
              outline: 'none',
              flex: '1',
              minWidth: '150px',
              maxWidth: '300px',
              transition: 'border-color 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#d8a744';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#282a36';
            }}
          />

          <button
            type="submit"
            disabled={saving || !newCategory.trim()}
            style={{
              backgroundColor: '#c9973b',
              color: '#fff',
              fontWeight: '600',
              fontSize: '13px',
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: saving || !newCategory.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !newCategory.trim() ? 0.65 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!saving && newCategory.trim()) {
                e.currentTarget.style.backgroundColor = '#d8a744';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#c9973b';
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {saving ? 'Menyimpan...' : 'Tambah Kategori'}
          </button>
        </form>
      </div>

      {/* Categories Table */}
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
                <th style={thStyle({ width: '75px', textAlign: 'center' })}>
                  No
                </th>

                <th style={thStyle({})}>
                  Nama Kategori
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
                    colSpan="3"
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#94a3b8'
                    }}
                  >
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      style={{ color: '#d8a744' }}
                      role="status"
                    />
                    Memuat kategori...
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => (
                  <tr
                    key={category.id}
                    style={{ borderBottom: '1px solid #1e2030' }}
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
                    {/* Number */}
                    <td style={tdStyle({
                      textAlign: 'center',
                      color: '#94a3b8'
                    })}>
                      {index + 1}
                    </td>

                    {/* Category Name */}
                    <td style={tdStyle({
                      color: '#f1f5f9',
                      fontWeight: '600',
                      fontSize: '14px'
                    })}>
                      <div className="d-flex align-items-center gap-2">
                        <Tag size={15} color="#d8a744" />
                        <span>{category.name}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleEditOpen(category)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#c9973b',
                            border: '1.5px solid #c9973b',
                            borderRadius: '7px',
                            padding: '5px 12px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
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
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          style={{
                            backgroundColor: '#7f1d1d',
                            color: '#fca5a5',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '5px 12px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      textAlign: 'center',
                      padding: '45px',
                      color: '#64748b',
                      fontSize: '13px'
                    }}
                  >
                    {searchQuery
                      ? `Kategori "${searchQuery}" tidak ditemukan.`
                      : 'Belum ada kategori untuk tipe ini.'}
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination Indicator */}
      {!loading && filteredCategories.length > 0 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
          <button
            type="button"
            style={pageBtnStyle(false)}
            disabled
            aria-label="Halaman sebelumnya"
          >
            ‹
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
            ›
          </button>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(5px)',
            zIndex: 1100,
            padding: '20px'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setEditingCategory(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editCategoryTitle"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#161720',
              border: '1px solid #303348',
              borderRadius: '15px',
              padding: '24px',
              boxShadow: '0 15px 50px rgba(0,0,0,0.45)'
            }}
          >

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <SquarePen color="#d8a744" size={19} />

                <h5
                  id="editCategoryTitle"
                  style={{
                    color: '#f1f5f9',
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: 0
                  }}
                >
                  Edit Kategori
                </h5>
              </div>

              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                disabled={saving}
                aria-label="Tutup"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit}>

              <label
                htmlFor="editCategoryName"
                style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  marginBottom: '9px'
                }}
              >
                Nama Kategori
              </label>

              <input
                id="editCategoryName"
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                autoFocus
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0d0d12',
                  border: '1px solid #303348',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  padding: '11px 14px',
                  fontSize: '13px',
                  outline: 'none',
                  marginBottom: '24px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#d8a744';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#303348';
                }}
              />

              <div className="d-flex justify-content-end gap-2">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingCategory(null)}
                  style={{
                    backgroundColor: '#222433',
                    color: '#cbd5e1',
                    border: '1px solid #303348',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving || !editCategoryName.trim()}
                  style={{
                    backgroundColor: '#c9973b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving || !editCategoryName.trim() ? 0.65 : 1
                  }}
                >
                  <Save size={14} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>

              </div>

            </form>
          </div>
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

export default Categories;
