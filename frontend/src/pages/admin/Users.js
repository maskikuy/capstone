import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { notifySuccess, notifyError, confirmAction, showAlert } from '../../utils/notify';

const Users = () => {
  const [users, setUsers] = useState([]);
  
  // State untuk Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('kitchen'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Ambil username yang sedang login sekarang
  const currentLoggedInUser = localStorage.getItem('username');

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
      // Validasi Tambahan: Jangan biarkan username diubah menjadi 'Super Admin' oleh user lain
      if (username === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
        return showAlert('Akses Ditolak', 'Anda tidak bisa mengubah user menjadi Super Admin', 'error');
      }

      if (isEditing) {
        // Mode Edit
        const payload = { username, role };
        if (password) payload.password = password; 

        await api.put(`/user/${editId}`, payload);
        notifySuccess('User berhasil diupdate');
      } else {
        // Mode Tambah
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
    // PROTEKSI EDIT:
    // Jika target user adalah "Super Admin", tapi yang login BUKAN "Super Admin", tolak.
    if (user.username === 'Super Admin' && currentLoggedInUser !== 'Super Admin') {
      return showAlert('Akses Ditolak', 'Hanya Super Admin yang berhak mengedit akun ini!', 'error');
    }

    setUsername(user.username);
    setRole(user.role);
    setPassword(''); 
    setIsEditing(true);
    setEditId(user.id);
  };

  const handleDelete = async (user) => {
    // PROTEKSI DELETE:
    // Jika target user adalah "Super Admin", tolak mutlak (siapapun yang login).
    if (user.username === 'Super Admin') {
      return showAlert('Akun Super Admin TIDAK BOLEH dihapus demi keamanan sistem!', '', 'error');
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
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 className="mb-4">Kelola Pengguna</h2>

      {/* --- FORM CARD --- */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">{isEditing ? 'Edit User' : 'Tambah User Baru'}</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Username</label>
                <input 
                  type="text" className="form-control" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  // Disable edit username jika sedang mengedit Super Admin (agar tidak tidak sengaja terganti)
                  disabled={isEditing && username === 'Super Admin'}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Password</label>
                <input 
                  type="password" className="form-control" 
                  placeholder={isEditing ? "(Kosongkan jika tetap)" : "Password"}
                  value={password} onChange={e => setPassword(e.target.value)} 
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Role</label>
                <select 
                  className="form-select" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  // Disable ganti role jika targetnya Super Admin (harus tetap admin)
                  disabled={isEditing && username === 'Super Admin'}
                >
                  <option value="kitchen">Kitchen (Dapur)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <button type="submit" className={`btn ${isEditing ? 'btn-warning' : 'btn-success'}`}>
                {isEditing ? 'Update User' : 'Simpan User'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Batal</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* --- TABLE LIST --- */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={user.username === 'Super Admin' ? 'table-warning' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    {user.username} 
                    {user.username === 'Super Admin' && <span className="ms-2 badge bg-dark">UTAMA</span>}
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-info text-dark'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="btn btn-sm btn-outline-primary me-2">
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    {/* Tombol Hapus didisable visualnya juga jika Super Admin */}
                    <button 
                      onClick={() => handleDelete(user)} 
                      className="btn btn-sm btn-outline-danger"
                      disabled={user.username === 'Super Admin'}
                    >
                      <i className="bi bi-trash"></i> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;