import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../utils/notify';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Sesuai route authController.js
      const res = await api.post('/auth/login', { username, password });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      const normalizedRole = user.role === 'kitchen' ? 'kasir' : user.role;
      localStorage.setItem('role', normalizedRole);
      localStorage.setItem('username', user.username);
      localStorage.setItem('userId', user.id);
      notifySuccess('Login Berhasil! Selamat datang.');

      // Redirect sesuai role
      try {
        if (normalizedRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (normalizedRole === 'kasir') {
          navigate('/kasir/dashboard');
        } else {
          navigate('/');
        }
      } catch (navErr) {
        console.error('Navigation error:', navErr);
        notifyError('Gagal navigasi ke halaman. Silakan refresh browser.');
      }
    } catch (err) {
      notifyError(err.response?.data?.error || 'Login gagal');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-5" style={{ width: '100%', maxWidth: '420px', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
        <div className="text-center mb-4">
          <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
            <h3 className="m-0 fw-bold">B</h3>
          </div>
          <h3 className="fw-bold">Billion Cafe</h3>
          <p className="text-muted small">Masuk ke sistem manajemen</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-warning w-100 py-2 fw-bold mt-3">Masuk</button>
        </form>
      </div>
    </div>
  );
};

export default Login;