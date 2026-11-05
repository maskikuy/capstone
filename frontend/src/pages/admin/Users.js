import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction, showAlert } from '../../utils/notify';
import { UserPlus, SquarePen, Trash2, Shield, User } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  
  // State untuk Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('kitchen'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Ambil user yang sedang login sekarang
  const currentLoggedInUser = localStorage.getItem('username');
  const currentLoggedInUserId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user');
      setUsers(res.data);
    } catch (err) {
      console.error("Gagal ambil data user", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (username === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
        return showAlert('Akses Ditolak', 'Anda tidak bisa mengubah user menjadi Super Admin', 'error');
      }

      if (!username.trim()) {
        return notifyError('Username wajib diisi');
      }
      if (!role || role.trim() === '') {
        return notifyError('Role wajib dipilih');
      }

      if (isEditing) {
        const payload = { username, role };
        if (password) payload.password = password; 

        await api.put(`/user/${editId}`, payload);
        notifySuccess('User berhasil diupdate');
      } else {
        if (!password) return notifyError('Password wajib diisi untuk user baru');
        await api.post('/user', { username, password, role });
        notifySuccess('User baru berhasil ditambahkan');
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      notifyError(err.response?.data?.error || 'Gagal menyimpan user');
    }
  };

  const handleEdit = (user) => {
    if (user.username === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
      return showAlert('Akses Ditolak', 'Hanya Super Admin yang berhak mengedit akun ini!', 'error');
    }

    setUsername(user.username);
    const userRole = user.role === 'admin' ? 'admin' : 'kitchen';
    setRole(userRole);
    setPassword(''); 
    setIsEditing(true);
    setEditId(user.id);
  };

  const handleDelete = async (user) => {
    if (user.username === 'Super Admin') {
      return showAlert('Akun Super Admin TIDAK BOLEH dihapus demi keamanan sistem!', '', 'error');
    }
    if (user.id === currentLoggedInUserId) {
      return showAlert('Anda tidak bisa menghapus akun Anda sendiri.', '', 'error');
    }

    const isConfirmed = await confirmAction(
      'Hapus User?', 
      `Yakin ingin menghapus user "${user.username}"? Data tidak bisa dikembalikan.`
    );

    if (isConfirmed) {
      try {
        await api.delete(`/user/${user.id}`);
        notifySuccess('User berhasil dihapus');
        fetchUsers();
      } catch (err) {
        notifyError('Gagal menghapus user');
      }
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('kitchen');
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '100vh', padding: '24px 28px 60px' }}>
      
      {/* Title */}
      <div className="mb-4">
        <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: '0 0 6px' }}>
          Kelola Pengguna
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          Atur hak akses admin dan akun staf kasir restoran
        </p>
      </div>

      {/* --- FORM CARD --- */}
      <div 
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        <div className="d-flex align-items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid #23253a' }}>
          <UserPlus size={18} color="#c9973b" />
          <h5 style={{ margin: 0, fontSize: '14.5px', fontWeight: '600', color: '#f1f5f9' }}>
            {isEditing ? `Edit User: ${username}` : 'Tambah Staf Kasir / User Baru'}
          </h5>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Username */}
            <div className="col-md-4">
              <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text"
                  placeholder="Masukkan username..."
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  disabled={isEditing && username === 'Super Admin'}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div className="col-md-4">
              <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                Password {isEditing && <span style={{ color: '#64748b', fontWeight: '400' }}>(Kosongkan jika tetap)</span>}
              </label>
              <input 
                type="password"
                placeholder={isEditing ? "••••••••" : "Buat password..."}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={inputStyle}
              />
            </div>

            {/* Role */}
            <div className="col-md-4">
              <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
                Role
              </label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                disabled={true}
                style={{ ...inputStyle, cursor: 'not-allowed', color: '#94a3b8' }}
              >
                <option value="kitchen">Kasir (Staf Operasional)</option>
                <option value="admin">Admin (Super Admin)</option>
              </select>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {isEditing && username === 'Super Admin' 
                  ? 'Role Super Admin tidak dapat diubah.' 
                  : 'Staf baru otomatis berwenang sebagai Kasir.'}
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2 mt-4 pt-1">
            <button 
              type="submit" 
              style={{
                backgroundColor: isEditing ? '#c9973b' : '#c9973b',
                color: '#101116',
                fontWeight: '600',
                fontSize: '13px',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
            >
              {isEditing ? '✓ Simpan Perubahan' : '+ Tambah Pengguna'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={resetForm}
                style={{
                  backgroundColor: '#1f212d',
                  border: '1px solid #2d303f',
                  color: '#94a3b8',
                  fontWeight: '500',
                  fontSize: '13px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- TABLE LIST --- */}
      <div 
        style={{
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}
      >
        <div className="table-responsive" style={{ margin: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #23253a' }}>
                <th style={thStyle({ width: '60px', textAlign: 'center' })}>No</th>
                <th style={thStyle({})}>Username</th>
                <th style={thStyle({ width: '180px' })}>Role</th>
                <th style={thStyle({ width: '180px', textAlign: 'center' })}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const isAdmin = user.role === 'admin';
                const isSuperAdmin = user.username === 'Super Admin';

                return (
                  <tr 
                    key={user.id}
                    style={{ borderBottom: '1px solid #1e2030' }}
                    onMouseEnter={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#1b1d2b'); }}
                    onMouseLeave={(e) => { [...e.currentTarget.cells].forEach(c => c.style.backgroundColor = '#161720'); }}
                  >
                    {/* No */}
                    <td style={tdStyle({ textAlign: 'center', color: '#94a3b8' })}>
                      {index + 1}
                    </td>

                    {/* Username */}
                    <td style={tdStyle({ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' })}>
                      <div className="d-flex align-items-center gap-2">
                        {isSuperAdmin ? <Shield size={16} color="#c9973b" /> : <User size={16} color="#818cf8" />}
                        <span>{user.username}</span>
                        {isSuperAdmin && (
                          <span 
                            style={{
                              backgroundColor: 'rgba(201, 151, 59, 0.15)',
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
                        {user.id === currentLoggedInUserId && (
                          <span 
                            style={{
                              backgroundColor: '#1f2235',
                              border: '1px solid #2e3566',
                              color: '#93c5fd',
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '9999px'
                            }}
                          >
                            Anda
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td style={tdStyle({})}>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: isAdmin ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                          color: isAdmin ? '#f87171' : '#38bdf8',
                          border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                        }}
                      >
                        {isAdmin ? 'ADMINISTRATOR' : 'KASIR'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td style={tdStyle({ textAlign: 'center' })}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#c9973b',
                            border: '1.5px solid #c9973b',
                            borderRadius: '7px',
                            padding: '5px 14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#c9973b'; }}
                        >
                          <SquarePen size={12} />
                          <span>Edit</span>
                        </button>

                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDelete(user)} 
                            disabled={user.id === currentLoggedInUserId}
                            style={{
                              backgroundColor: '#7f1d1d',
                              color: '#fca5a5',
                              border: 'none',
                              borderRadius: '7px',
                              padding: '5px 14px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: user.id === currentLoggedInUserId ? 'not-allowed' : 'pointer',
                              opacity: user.id === currentLoggedInUserId ? 0.5 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { if (user.id !== currentLoggedInUserId) e.currentTarget.style.backgroundColor = '#991b1b'; }}
                            onMouseLeave={(e) => { if (user.id !== currentLoggedInUserId) e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
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
  transition: 'border-color 0.15s ease'
};

const thStyle = (extra = {}) => ({
  backgroundColor: '#161720',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: '600',
  padding: '16px 20px',
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
  padding: '16px 20px',
  verticalAlign: 'middle',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  transition: 'background-color 0.15s',
  ...extra
});

export default Users;
