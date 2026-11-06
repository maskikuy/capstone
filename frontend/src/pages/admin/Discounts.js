import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction } from '../../utils/notify';
import { 
  Search, Plus, SquarePen, Trash2, Tag, Percent, 
  Coins, X, CheckCircle2, AlertCircle, Save 
} from 'lucide-react';

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [loading, setLoading] = useState(true);

  // Modal State (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State dalam Card Modal
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage', // 'percentage' | 'fixed'
    value: '',
    is_active: true
  });

  // Ambil daftar diskon
  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/discounts');
      setDiscounts(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar diskon:', err);
      notifyError('Gagal memuat daftar diskon');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      is_active: true
    });
    setEditingDiscount(null);
  };

  // Buka Modal Tambah Baru
  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: parseFloat(discount.value).toString(),
      is_active: Boolean(discount.is_active)
    });
    setIsModalOpen(true);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Simpan Form (Tambah Baru / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    if (!name) {
      notifyError('Nama diskon wajib diisi');
      return;
    }

    const numValue = parseFloat(formData.value);
    if (isNaN(numValue) || numValue <= 0) {
      notifyError('Nilai diskon harus lebih besar dari 0');
      return;
    }

    if (formData.type === 'percentage' && numValue > 100) {
      notifyError('Persentase diskon tidak boleh melebihi 100%');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        type: formData.type,
        value: numValue,
        min_order: 0,
        max_discount: 0,
        is_active: formData.is_active ? 1 : 0
      };

      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
        notifySuccess('Diskon berhasil diperbarui');
      } else {
        await api.post('/discounts', payload);
        notifySuccess('Diskon baru berhasil ditambahkan');
      }

      handleCloseModal();
      await fetchDiscounts();
    } catch (err) {
      console.error('Gagal menyimpan diskon:', err);
      notifyError(err.response?.data?.error || 'Gagal menyimpan diskon');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Aktif / Non-Aktif
  const handleToggleActive = async (discount) => {
    try {
      await api.patch(`/discounts/${discount.id}/toggle`);
      setDiscounts(prev =>
        prev.map(d => d.id === discount.id ? { ...d, is_active: !d.is_active } : d)
      );
      notifySuccess(`Diskon "${discount.name}" ${discount.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
    } catch (err) {
      console.error('Gagal mengubah status diskon:', err);
      notifyError('Gagal mengubah status aktif diskon');
    }
  };

  // Hapus Diskon
  const handleDelete = async (discount) => {
    const isConfirmed = await confirmAction(
      'Hapus Diskon?',
      `Apakah Anda yakin ingin menghapus diskon "${discount.name}"?`
    );

    if (isConfirmed) {
      try {
        await api.delete(`/discounts/${discount.id}`);
        notifySuccess('Diskon berhasil dihapus');
        await fetchDiscounts();
      } catch (err) {
        console.error('Gagal menghapus diskon:', err);
        notifyError('Gagal menghapus diskon');
      }
    }
  };

  // Filter diskon berdasarkan query & tab status
  const filteredDiscounts = discounts.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? Boolean(d.is_active) :
      !Boolean(d.is_active);
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', paddingBottom: '40px' }}>
      
      {/* Page Title */}
      <div className="pt-3 pb-3 mb-2">
        <h3 style={{
          color: '#f1f5f9',
          fontWeight: '700',
          fontSize: '1.45rem',
          margin: 0
        }}>
          Manajemen Diskon & Promo
        </h3>
        <small style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
          Atur promo persentase (%) atau potongan nominal (Rp) yang dapat dipilih kasir di aplikasi POS
        </small>
      </div>

      {/* Filter Tabs & Tombol Tambah Diskon Card */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        {/* Tab Status Filter */}
        <div style={{
          backgroundColor: '#161720',
          border: '1px solid #282a36',
          borderRadius: '8px',
          padding: '4px',
          display: 'inline-flex',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: statusFilter === 'all' ? '700' : '500',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'all' ? '#d8a744' : 'transparent',
              color: statusFilter === 'all' ? '#0f172a' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Semua Diskon
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: statusFilter === 'active' ? '700' : '500',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'active' ? '#d8a744' : 'transparent',
              color: statusFilter === 'active' ? '#0f172a' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: statusFilter === 'inactive' ? '700' : '500',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'inactive' ? '#d8a744' : 'transparent',
              color: statusFilter === 'inactive' ? '#0f172a' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Non-Aktif
          </button>
        </div>

        {/* Tombol Tambah Diskon Baru (Membuka Card Modal) */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={{
            backgroundColor: '#c9973b',
            color: '#fff',
            fontWeight: '600',
            fontSize: '13px',
            padding: '9px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Diskon Baru
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="mb-4">
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
            placeholder="Cari promo diskon..."
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
      </div>

      {/* Tabel Diskon (Tema Gelap Rapi, Tanpa Bootstrap Table) */}
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
                <th style={thStyle({ width: '65px', textAlign: 'center' })}>No</th>
                <th style={thStyle({})}>Nama Diskon</th>
                <th style={thStyle({ width: '180px' })}>Besar Potongan</th>
                <th style={thStyle({ width: '140px', textAlign: 'center' })}>Status</th>
                <th style={thStyle({ width: '180px', textAlign: 'center' })}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <div className="spinner-border spinner-border-sm me-2" style={{ color: '#d8a744' }} role="status" />
                    Memuat daftar diskon...
                  </td>
                </tr>
              ) : filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount, index) => {
                  const isPercent = discount.type === 'percentage';
                  const isActive = Boolean(discount.is_active);

                  return (
                    <tr
                      key={discount.id}
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
                      {/* Nomor */}
                      <td style={tdStyle({ textAlign: 'center', color: '#94a3b8' })}>
                        {index + 1}
                      </td>

                      {/* Nama Diskon */}
                      <td style={tdStyle({ color: '#f1f5f9', fontWeight: '600', fontSize: '13.5px' })}>
                        <div className="d-flex align-items-center gap-2">
                          <Tag size={15} color="#d8a744" />
                          <span>{discount.name}</span>
                        </div>
                      </td>

                      {/* Besar Potongan (Badge) */}
                      <td style={tdStyle({})}>
                        {isPercent ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            fontSize: '12.5px',
                            fontWeight: '700'
                          }}>
                            <Percent size={13} />
                            {parseFloat(discount.value)}%
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(216, 167, 68, 0.12)',
                            color: '#d8a744',
                            border: '1px solid rgba(216, 167, 68, 0.25)',
                            fontSize: '12.5px',
                            fontWeight: '700'
                          }}>
                            <Coins size={13} />
                            Rp {parseFloat(discount.value).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Button */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(discount)}
                          style={{
                            border: isActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.08)',
                            color: isActive ? '#22c55e' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            transition: 'all 0.15s ease'
                          }}
                          title="Klik untuk ubah status aktif/non-aktif di POS"
                        >
                          {isActive ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {isActive ? 'Aktif' : 'Non-Aktif'}
                        </button>
                      </td>

                      {/* Aksi (Edit & Hapus) */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(discount)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#c9973b',
                              border: '1.5px solid #c9973b',
                              borderRadius: '7px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(201, 151, 59, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <SquarePen size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(discount)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              border: '1.5px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '7px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
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
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <Tag size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                    <span style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                      {searchQuery ? 'Tidak ada diskon yang cocok dengan pencarian.' : 'Belum ada promo diskon yang terdaftar.'}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD MODAL (TAMBAH & EDIT DISKON)                         */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 6, 10, 0.78)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          {/* Card Dialog */}
          <div style={{
            backgroundColor: '#161722',
            border: '1px solid #282a3c',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
            overflow: 'hidden'
          }}>
            {/* Header Card */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #232535',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#181926'
            }}>
              <h5 style={{ margin: 0, color: '#f1f5f9', fontWeight: '700', fontSize: '1.05rem' }}>
                {editingDiscount ? 'Edit Diskon / Promo' : 'Tambah Diskon Baru'}
              </h5>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: '#202230',
                  border: 'none',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form Card */}
            <form onSubmit={handleFormSubmit}>
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Nama Diskon */}
                <div>
                  <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Nama Diskon / Promo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Diskon Pelajar 10%, Promo Gajian"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1c1d27',
                      border: '1px solid #282a36',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      padding: '9px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 2. Tipe Diskon (Selector Card) */}
                <div>
                  <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    Tipe Diskon
                  </label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'percentage' })}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: formData.type === 'percentage' ? '1.5px solid #d8a744' : '1px solid #282a36',
                        backgroundColor: formData.type === 'percentage' ? 'rgba(216, 167, 68, 0.15)' : '#1c1d27',
                        color: formData.type === 'percentage' ? '#d8a744' : '#94a3b8',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Percent size={14} /> % Persentase (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'fixed' })}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: formData.type === 'fixed' ? '1.5px solid #d8a744' : '1px solid #282a36',
                        backgroundColor: formData.type === 'fixed' ? 'rgba(216, 167, 68, 0.15)' : '#1c1d27',
                        color: formData.type === 'fixed' ? '#d8a744' : '#94a3b8',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Coins size={14} /> Nominal Tetap (Rp)
                    </button>
                  </div>
                </div>

                {/* 3. Nilai Diskon */}
                <div>
                  <label style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                    {formData.type === 'percentage' ? 'Besar Persentase (%)' : 'Besar Potongan (Rp)'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={formData.type === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#1c1d27',
                      border: '1px solid #282a36',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      padding: '9px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  {formData.type === 'percentage' && (
                    <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Masukkan angka 1 - 100
                    </small>
                  )}
                </div>

                {/* 4. Checkbox Status Aktif */}
                <div className="d-flex align-items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#d8a744' }}
                  />
                  <label htmlFor="isActiveCheckbox" style={{ color: '#f1f5f9', fontSize: '13px', cursor: 'pointer', margin: 0 }}>
                    Aktifkan diskon ini untuk transaksi kasir
                  </label>
                </div>
              </div>

              {/* Footer Card */}
              <div style={{
                padding: '14px 22px',
                borderTop: '1px solid #232535',
                backgroundColor: '#181926',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #282a36',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: '#c9973b',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {saving ? 'Menyimpan...' : editingDiscount ? 'Simpan Perubahan' : 'Tambah Diskon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Styling helper tabel gelap konsisten
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
  padding: '16px 18px',
  verticalAlign: 'middle',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  transition: 'background-color 0.15s',
  ...extra
});

export default Discounts;
