
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction, showAlert } from '../../utils/notify';
import {
  UserPlus,
  SquarePen,
  Trash2,
  Shield,
  User,
  Plus,
  Save,
  X,
  Search
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentLoggedInUser = localStorage.getItem('username');
  const currentLoggedInUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Gagal ambil data user:', err);
      notifyError('Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();

    if (cleanUsername === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
      return showAlert(
        'Akses Ditolak',
        'Anda tidak bisa mengubah user menjadi Super Admin',
        'error'
      );
    }

    if (!cleanUsername) {
      return notifyError('Username wajib diisi');
    }

    if (isEditing && !editingRole) {
      return notifyError('Data role pengguna tidak ditemukan. Muat ulang halaman terlebih dahulu.');
    }

    if (!isEditing && !password.trim()) {
      return notifyError('Password wajib diisi untuk pengguna baru');
    }

    setSaving(true);

    try {
      if (isEditing) {
        const payload = {
          username: cleanUsername,
          role: editingRole
        };

        if (password.trim()) {
          payload.password = password;
        }

        await api.put(`/user/${editId}`, payload);
        notifySuccess('Data pengguna berhasil diperbarui');
      } else {
        await api.post('/user', {
          username: cleanUsername,
          password,
          role: 'kitchen'
        });

        notifySuccess('Staf kasir berhasil ditambahkan');
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      console.error('Gagal menyimpan pengguna:', err);
      notifyError(err.response?.data?.error || 'Gagal menyimpan pengguna');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    if (user.username === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
      return showAlert(
        'Akses Ditolak',
        'Hanya Super Admin yang berhak mengedit akun ini!',
        'error'
      );
    }

    setUsername(user.username);
    setPassword('');
    setEditingRole(user.role || '');
    setIsEditing(true);
    setEditId(user.id);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (user) => {
    if (user.username === 'Super Admin' || user.role === 'admin') {
      return showAlert(
        'Akses Ditolak',
        'Akun administrator tidak boleh dihapus demi keamanan sistem!',
        'error'
      );
    }

    if (user.id === currentLoggedInUserId) {
      return showAlert(
        'Akses Ditolak',
        'Anda tidak bisa menghapus akun Anda sendiri.',
        'error'
      );
    }

    const isConfirmed = await confirmAction(
      'Hapus Pengguna?',
      `Yakin ingin menghapus pengguna "${user.username}"? Data tidak bisa dikembalikan.`
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/user/${user.id}`);
      notifySuccess('Pengguna berhasil dihapus');
      await fetchUsers();
    } catch (err) {
      console.error('Gagal menghapus pengguna:', err);
      notifyError(err.response?.data?.error || 'Gagal menghapus pengguna');
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEditingRole('');
    setIsEditing(false);
    setEditId(null);
  };

  const filteredUsers = users.filter(user =>
    String(user.username || '')
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

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
      <div className="mb-4">
        <h3
          style={{
            color: '#f1f5f9',
            fontWeight: '700',
            fontSize: '1.45rem',
            margin: '0 0 6px'
          }}
        >
          Kelola Pengguna
        </h3>
      </div>

      {/* Form Card */}
      <div
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
        }}
      >

        {/* Form Heading */}
        <div
          className="d-flex align-items-center gap-2 mb-4 pb-3"
          style={{
            borderBottom: '1px solid #23253a'
          }}
        >
          {isEditing ? (
            <SquarePen size={18} color="#d8a744" />
          ) : (
            <UserPlus size={18} color="#d8a744" />
          )}

          <h5
            style={{
              margin: 0,
              fontSize: '14.5px',
              fontWeight: '600',
              color: '#f1f5f9'
            }}
          >
            {isEditing ? 'Edit Pengguna' : 'Tambah Staf Kasir Baru'}
          </h5>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">

            {/* Username */}
            <div className="col-12 col-md-5">
              <label style={labelStyle}>
                Username
              </label>

              <input
                type="text"
                placeholder="Masukkan username..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={saving || (isEditing && username === 'Super Admin')}
                autoComplete="off"
                style={{
                  ...inputStyle,
                  opacity: isEditing && username === 'Super Admin' ? 0.6 : 1
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#d8a744';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2a2d45';
                }}
              />
            </div>

            {/* Password */}
            <div className="col-12 col-md-5">
              <label style={labelStyle}>
                Password
                {isEditing && (
                  <span
                    style={{
                      color: '#64748b',
                      fontWeight: '400',
                      marginLeft: '6px'
                    }}
                  >
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </label>

              <input
                type="password"
                placeholder={isEditing ? 'Password baru...' : 'Buat password...'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={saving}
                required={!isEditing}
                autoComplete="new-password"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#d8a744';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2a2d45';
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="col-12 col-md-2">
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !username.trim() || (!isEditing && !password.trim())}
                  style={{
                    ...submitButtonStyle,
                    flex: 1,
                    opacity: saving || !username.trim() || (!isEditing && !password.trim())
                      ? 0.65
                      : 1,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#d8a744';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#c9973b';
                  }}
                >
                  {isEditing ? (
                    <Save size={15} />
                  ) : (
                    <Plus size={16} strokeWidth={2.5} />
                  )}

                  <span>
                    {saving
                      ? 'Menyimpan...'
                      : isEditing
                        ? 'Simpan'
                        : 'Tambah'}
                  </span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    title="Batal edit"
                    aria-label="Batal edit"
                    style={{
                      backgroundColor: '#222433',
                      border: '1px solid #303348',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      width: '39px',
                      minWidth: '39px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* User List Action Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

        <div
          style={searchContainerStyle}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = '#d8a744';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = '#282a36';
          }}
        >
          <Search size={16} color="#64748b" />

          <input
            type="text"
            placeholder="Cari username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
                display: 'flex'
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
          Menampilkan {filteredUsers.length} dari {users.length} pengguna
        </span>
      </div>

      {/* User Table */}
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
              minWidth: '650px',
              borderCollapse: 'collapse',
              backgroundColor: '#161720',
              color: '#cbd5e1'
            }}
          >

            <thead>
              <tr style={{ borderBottom: '1px solid #23253a' }}>
                <th style={thStyle({ width: '75px', textAlign: 'center' })}>
                  No
                </th>

                <th style={thStyle({})}>
                  Username
                </th>

                <th style={thStyle({ width: '200px', textAlign: 'center' })}>
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" style={emptyStyle}>
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      style={{ color: '#d8a744' }}
                      role="status"
                    />
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const isAdmin = user.role === 'admin';
                  const isSuperAdmin = user.username === 'Super Admin';
                  const isCurrentUser = user.id === currentLoggedInUserId;

                  return (
                    <tr
                      key={user.id}
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

                      {/* Number */}
                      <td
                        style={tdStyle({
                          textAlign: 'center',
                          color: '#94a3b8'
                        })}
                      >
                        {index + 1}
                      </td>

                      {/* Username */}
                      <td
                        style={tdStyle({
                          color: '#f1f5f9',
                          fontWeight: '600',
                          fontSize: '14px'
                        })}
                      >
                        <div className="d-flex align-items-center gap-2 flex-wrap">

                          {isAdmin ? (
                            <Shield
                              size={16}
                              color="#d8a744"
                            />
                          ) : (
                            <User
                              size={16}
                              color="#818cf8"
                            />
                          )}

                          <span>{user.username}</span>

                          {isSuperAdmin && (
                            <span
                              style={{
                                backgroundColor: 'rgba(201,151,59,0.15)',
                                border: '1px solid #c9973b',
                                color: '#d8a744',
                                fontSize: '10.5px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                letterSpacing: '0.5px'
                              }}
                            >
                              UTAMA
                            </span>
                          )}

                          {isCurrentUser && (
                            <span
                              style={{
                                backgroundColor: '#1f2235',
                                border: '1px solid #2e3566',
                                color: '#93c5fd',
                                fontSize: '10.5px',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: '9999px'
                              }}
                            >
                              Anda
                            </span>
                          )}

                        </div>
                      </td>

                      {/* Actions */}
                      <td style={tdStyle({ textAlign: 'center' })}>
                        <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">

                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
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

                          {!isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              disabled={isCurrentUser}
                              style={{
                                ...deleteButtonStyle,
                                opacity: isCurrentUser ? 0.5 : 1,
                                cursor: isCurrentUser ? 'not-allowed' : 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                if (!isCurrentUser) {
                                  e.currentTarget.style.backgroundColor = '#991b1b';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isCurrentUser) {
                                  e.currentTarget.style.backgroundColor = '#7f1d1d';
                                }
                              }}
                            >
                              <Trash2 size={13} />
                              Hapus
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" style={emptyStyle}>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <User
                        size={28}
                        color="#475569"
                        strokeWidth={1.5}
                      />

                      <span>
                        {searchQuery
                          ? `Pengguna "${searchQuery}" tidak ditemukan.`
                          : 'Belum ada data pengguna.'
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

    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '12.5px',
  color: '#94a3b8',
  fontWeight: '600',
  marginBottom: '7px'
};

const inputStyle = {
  backgroundColor: '#0d0e17',
  border: '1px solid #2a2d45',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '13px',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box'
};

const submitButtonStyle = {
  backgroundColor: '#c9973b',
  color: '#101116',
  fontWeight: '600',
  fontSize: '12.5px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease'
};

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

const editButtonStyle = {
  backgroundColor: 'transparent',
  color: '#c9973b',
  border: '1.5px solid #c9973b',
  borderRadius: '7px',
  padding: '5px 12px',
  fontSize: '12.5px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  cursor: 'pointer',
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

export default Users;
