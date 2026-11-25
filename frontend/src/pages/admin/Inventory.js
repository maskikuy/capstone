
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import InventoryForm from './InventoryForm';
import { notifyError, notifySuccess, confirmAction } from '../../utils/notify';
import {
  Plus,
  Search,
  X,
  SquarePen,
  Trash2,
  LayoutGrid,
  FlaskConical,
  ShoppingBag,
  Boxes,
  Tag,
  Package,
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle
} from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setItems(res.data || []);
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
    const ok = await confirmAction(
      'Hapus Inventori?',
      'Yakin ingin menghapus item ini? Jika item ini adalah Retail/Grosir, menu penjualannya juga akan dihapus.'
    );

    if (!ok) return;

    try {
      await api.delete(`/inventory/${id}`);
      notifySuccess('Item inventori berhasil dihapus');
      await fetchItems();
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

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  const lowStockItems = items.filter(it => {
    const stock = Number(it.stock_available || 0);
    const threshold = Number(it.low_stock_threshold || 0);
    return stock <= threshold;
  });

  const tabs = [
    {
      id: 'all',
      label: 'Semua',
      count: items.length,
      icon: LayoutGrid,
      color: '#d8a744'
    },
    {
      id: 'low_stock',
      label: 'Stok Menipis',
      count: lowStockItems.length,
      icon: AlertTriangle,
      color: '#f87171'
    },
    {
      id: 'bahan_baku',
      label: 'Bahan Baku',
      count: items.filter(i => (i.price_type || 'bahan_baku') === 'bahan_baku').length,
      icon: FlaskConical,
      color: '#94a3b8'
    },
    {
      id: 'retail',
      label: 'Retail',
      count: items.filter(i => i.price_type === 'retail').length,
      icon: ShoppingBag,
      color: '#60a5fa'
    },
    {
      id: 'grosir',
      label: 'Grosir',
      count: items.filter(i => i.price_type === 'grosir').length,
      icon: Boxes,
      color: '#eab308'
    }
  ];

  const filteredItems = items.filter(it => {
    const itemType = it.price_type || 'bahan_baku';
    const isLow = Number(it.stock_available || 0) <= Number(it.low_stock_threshold || 0);

    let matchTab = true;
    if (activeTab === 'low_stock') {
      matchTab = isLow;
    } else if (activeTab !== 'all') {
      matchTab = itemType === activeTab;
    }

    const matchSearch = String(it.name || '')
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return matchTab && matchSearch;
  });

  return (
    <div
      style={{
        backgroundColor: '#0d0d12',
        color: '#f8fafc',
        minHeight: '100vh',
        padding: '24px 28px 48px'
      }}
    >

      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"
      >
        <div>
          <h3
            style={{
              color: '#f1f5f9',
              fontWeight: '700',
              fontSize: '1.45rem',
              margin: '0 0 6px'
            }}
          >
            Kelola Inventori
          </h3>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleCreate}
            style={addButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d8a744';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#c9973b';
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Tambah Inventori
          </button>
        )}
      </div>

      {/* Inventory Form */}
      {showForm && (
        <div className="mb-4">
          <InventoryForm
            item={editing}
            onSaved={onSaved}
            onCancel={handleCancel}
          />
        </div>
      )}

      {!showForm && (
        <>
          {/* Warning Banner Stok Rendah */}
          {lowStockItems.length > 0 && (
            <div
              className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                color: '#fca5a5'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={20} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#fecaca', marginBottom: '2px' }}>
                    Peringatan Stok Rendah ({lowStockItems.length} Item Membutuhkan Perhatian)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#f87171' }}>
                    Stok item berikut berada pada atau di bawah ambang batas minimum:{' '}
                    <strong style={{ color: '#fff' }}>
                      {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
                      {lowStockItems.length > 3 ? `, dan ${lowStockItems.length - 3} item lainnya` : ''}
                    </strong>. Harap segera lakukan restock!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('low_stock')}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
              >
                Lihat Item Menipis
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div
            className="d-flex align-items-center gap-3 mb-4"
            style={{
              borderBottom: '1px solid #282a36',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive
                      ? '2px solid #d8a744'
                      : '2px solid transparent',
                    color: isActive ? '#d8a744' : '#94a3b8',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13px',
                    padding: '11px 5px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={2}
                  />

                  {tab.label}

                  <span
                    style={{
                      fontSize: '11px',
                      color: isActive ? '#d8a744' : '#64748b',
                      fontWeight: '600'
                    }}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

            <div
              style={{
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
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#d8a744';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#282a36';
              }}
            >
              <Search
                size={16}
                color="#64748b"
                style={{ flexShrink: 0 }}
              />

              <input
                type="text"
                placeholder="Cari nama inventori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  width: '100%',
                  minWidth: 0
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
                    display: 'flex',
                    flexShrink: 0
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <span
              style={{
                color: '#64748b',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Menampilkan {filteredItems.length} dari {items.length} item
            </span>
          </div>

          {/* Inventory Table */}
          <div
            style={{
              backgroundColor: '#161720',
              border: '1px solid #23253a',
              borderRadius: '14px',
              overflow: 'hidden'
            }}
          >
            <div
              className="table-responsive"
              style={{ margin: 0 }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#161720',
                  color: '#cbd5e1',
                  minWidth: '1050px'
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid #23253a'
                    }}
                  >
                    <th style={thStyle({ width: '60px', textAlign: 'center' })}>
                      No
                    </th>

                    <th style={thStyle({ minWidth: '180px' })}>
                      Nama
                    </th>

                    <th style={thStyle({ width: '140px' })}>
                      Kategori
                    </th>

                    <th style={thStyle({ width: '140px' })}>
                      Harga Jual
                    </th>

                    <th style={thStyle({ width: '125px' })}>
                      Tipe Item
                    </th>

                    <th style={thStyle({ width: '190px' })}>
                      Harga Grosir
                    </th>

                    <th style={thStyle({ minWidth: '150px' })}>
                      Stok & Ambang
                    </th>

                    <th style={thStyle({ width: '110px', textAlign: 'center' })}>
                      Status
                    </th>

                    <th style={thStyle({ width: '175px', textAlign: 'center' })}>
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={emptyStyle}
                      >
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: '#d8a744' }}
                          role="status"
                        />
                        Memuat data inventori...
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((it, idx) => {
                      const itemType = it.price_type || 'bahan_baku';
                      const stock = Number(it.stock_available || 0);
                      const threshold = Number(it.low_stock_threshold || 0);
                      const isLowStock = stock <= threshold;
                      const isOutOfStock = stock <= 0 || !Boolean(it.is_available);

                      const categoryName =
                        categories.find(c => String(c.id) === String(it.category_id))?.name ||
                        (it.category_id ? it.category_id : '-');

                      const typeConfig = {
                        bahan_baku: {
                          label: 'Bahan Baku',
                          icon: FlaskConical,
                          color: '#cbd5e1',
                          background: 'rgba(100,116,139,0.15)',
                          border: 'rgba(100,116,139,0.3)'
                        },
                        retail: {
                          label: 'Retail',
                          icon: ShoppingBag,
                          color: '#60a5fa',
                          background: 'rgba(59,130,246,0.15)',
                          border: 'rgba(59,130,246,0.3)'
                        },
                        grosir: {
                          label: 'Grosir',
                          icon: Boxes,
                          color: '#facc15',
                          background: 'rgba(234,179,8,0.15)',
                          border: 'rgba(234,179,8,0.3)'
                        }
                      };

                      const type = typeConfig[itemType] || typeConfig.bahan_baku;
                      const TypeIcon = type.icon;

                      return (
                        <tr
                          key={it.id}
                          style={{
                            borderBottom: '1px solid #1e2030',
                            borderLeft: isOutOfStock
                              ? '3px solid #ef4444'
                              : isLowStock
                              ? '3px solid #f59e0b'
                              : '3px solid transparent'
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
                          {/* Number */}
                          <td
                            style={tdStyle({
                              textAlign: 'center',
                              color: '#94a3b8'
                            })}
                          >
                            {idx + 1}
                          </td>

                          {/* Name */}
                          <td
                            style={tdStyle({
                              color: '#f1f5f9',
                              fontWeight: '600',
                              fontSize: '14px',
                              maxWidth: '240px',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              whiteSpace: 'normal'
                            })}
                          >
                            <div className="d-flex align-items-center gap-2" style={{ flexWrap: 'wrap' }}>
                              <Package
                                size={15}
                                color="#d8a744"
                                style={{ flexShrink: 0 }}
                              />

                              <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{it.name}</span>

                              {(itemType === 'retail' || itemType === 'grosir') && (
                                <span
                                  title="Otomatis terdaftar di Menu Penjualan"
                                  style={{
                                    fontSize: '10px',
                                    backgroundColor: 'rgba(216,167,68,0.15)',
                                    color: '#e5a83b',
                                    border: '1px solid rgba(216,167,68,0.3)',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Di Penjualan
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td
                            style={tdStyle({
                              color: '#94a3b8',
                              fontSize: '13px'
                            })}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Tag
                                size={13}
                                color="#64748b"
                                style={{ flexShrink: 0 }}
                              />
                              {categoryName}
                            </div>
                          </td>

                          {/* Selling Price */}
                          <td style={tdStyle({ color: '#cbd5e1' })}>
                            {itemType === 'bahan_baku'
                              ? <span style={{ color: '#64748b' }}>-</span>
                              : `Rp ${parseFloat(it.selling_price || 0).toLocaleString('id-ID')}`
                            }
                          </td>

                          {/* Item Type */}
                          <td style={tdStyle()}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                backgroundColor: type.background,
                                color: type.color,
                                border: `1px solid ${type.border}`,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <TypeIcon size={12} />
                              {type.label}
                            </span>
                          </td>

                          {/* Wholesale Price */}
                          <td
                            style={tdStyle({
                              color: '#94a3b8',
                              fontSize: '13px'
                            })}
                          >
                            {itemType === 'grosir'
                              ? `Rp ${parseFloat(it.grosir_price_per_unit || 0).toLocaleString('id-ID')} (min ${it.grosir_min_qty || 5} ${it.stock_unit})`
                              : <span style={{ color: '#64748b' }}>-</span>
                            }
                          </td>

                          {/* Stock */}
                          <td
                            style={tdStyle({
                              color: '#cbd5e1'
                            })}
                          >
                            <div className="d-flex flex-column gap-1">
                              <div className="d-flex align-items-center gap-2">
                                <Layers
                                  size={14}
                                  color={isLowStock ? (isOutOfStock ? '#ef4444' : '#f59e0b') : '#64748b'}
                                  style={{ flexShrink: 0 }}
                                />
                                <span
                                  style={{
                                    fontWeight: isLowStock ? '700' : '500',
                                    color: isOutOfStock ? '#f87171' : isLowStock ? '#fbbf24' : '#f1f5f9'
                                  }}
                                >
                                  {it.stock_unit === 'gram'
                                    ? `${Math.round(stock)} gram`
                                    : `${parseInt(stock, 10)} pcs`
                                  }
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px' }}>
                                Ambang: {it.stock_unit === 'gram' ? `${Math.round(threshold)} gram` : `${parseInt(threshold, 10)} pcs`}
                              </div>
                              {isLowStock && (
                                <div style={{ paddingLeft: '22px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '10.5px',
                                      fontWeight: '600',
                                      color: isOutOfStock ? '#f87171' : '#fbbf24',
                                      backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                      border: `1px solid ${isOutOfStock ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`,
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <AlertTriangle size={10} />
                                    {isOutOfStock ? 'Stok Habis!' : 'Stok Rendah!'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td
                            style={tdStyle({
                              textAlign: 'center'
                            })}
                          >
                            {isOutOfStock ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: 'rgba(239,68,68,0.12)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239,68,68,0.3)'
                                }}
                              >
                                <XCircle size={12} />
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: 'rgba(245,158,11,0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245,158,11,0.35)'
                                }}
                              >
                                <AlertTriangle size={12} />
                                Menipis
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: 'rgba(34,197,94,0.12)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(34,197,94,0.3)'
                                }}
                              >
                                <CheckCircle2 size={12} />
                                Tersedia
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            style={tdStyle({
                              textAlign: 'center'
                            })}
                          >
                            <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">

                              <button
                                type="button"
                                onClick={() => handleEdit(it)}
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
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(it.id)}
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
                      <td
                        colSpan="9"
                        style={emptyStyle}
                      >
                        <div className="d-flex flex-column align-items-center gap-2">
                          <Package
                            size={28}
                            color="#475569"
                            strokeWidth={1.5}
                          />

                          <span>
                            {searchQuery
                              ? `Item "${searchQuery}" tidak ditemukan.`
                              : `Belum ada data inventori ${activeTab !== 'all' ? `tipe ${activeTab.replace('_', ' ')}` : ''}.`
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
        </>
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

const addButtonStyle = {
  backgroundColor: '#c9973b',
  color: '#fff',
  fontWeight: '600',
  fontSize: '13px',
  padding: '9px 18px',
  borderRadius: '8px',
  border: 'none',
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
  border: '1.5px solid #c9973b',
  color: '#c9973b',
  borderRadius: '7px',
  padding: '5px 12px',
  fontSize: '12.5px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  transition: 'all 0.15s ease'
};

const deleteButtonStyle = {
  backgroundColor: '#7f1d1d',
  border: 'none',
  color: '#fca5a5',
  borderRadius: '7px',
  padding: '5px 12px',
  fontSize: '12.5px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  transition: 'background-color 0.15s ease'
};

const emptyStyle = {
  textAlign: 'center',
  padding: '45px 20px',
  color: '#64748b',
  fontSize: '13px',
  backgroundColor: '#161720'
};

export default Inventory;
