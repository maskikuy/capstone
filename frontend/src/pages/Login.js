import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../utils/notify';
import { Lock, User, LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      const normalizedRole = user.role === 'kitchen' ? 'kasir' : user.role;
      localStorage.setItem('role', normalizedRole);
      localStorage.setItem('username', user.username);
      localStorage.setItem('userId', user.id);
      notifySuccess('Login Berhasil! Selamat datang.');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        backgroundColor: '#0d0d12',
        color: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#161720',
          border: '1px solid #23253a',
          borderRadius: '18px',
          padding: '36px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Brand Logo Header */}
        <div className="text-center mb-4">
          <div 
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#c9973b',
              color: '#101116',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '28px',
              marginBottom: '14px',
              boxShadow: '0 4px 14px rgba(201, 151, 59, 0.3)'
            }}
          >
            B
          </div>
          <h3 style={{ margin: '0 0 4px', fontWeight: '800', color: '#f1f5f9', fontSize: '1.45rem', letterSpacing: '0.3px' }}>
            Billion Cafe
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            Sistem Manajemen Restoran & POS
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Username */}
          <div className="mb-3">
            <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <User size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Masukkan username..."
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                style={{ ...inputStyle, paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label style={{ display: 'block', fontSize: '12.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                placeholder="Masukkan password..."
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ ...inputStyle, paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#c9973b',
              color: '#101116',
              fontWeight: '700',
              fontSize: '14px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              width: '100%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(201, 151, 59, 0.25)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#c9973b'; }}
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>
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
  padding: '11px 14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};

export default Login;
