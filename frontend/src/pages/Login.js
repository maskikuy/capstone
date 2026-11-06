import React, { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../utils/notify';
import { Lock, User, LogIn, Coffee } from 'lucide-react';

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
    <div className="billion-login-page">
      <div className="billion-login-card">
        {/* Garis Aksen Emas Atas */}
        <div className="login-top-accent" />

        {/* Brand Logo Header */}
        <div className="text-center">
          <div className="login-brand-icon">
            <Coffee size={26} strokeWidth={1.6} />
          </div>

          <p className="login-eyebrow">WELCOME TO</p>

          <h3 className="login-brand-title">
            Billion Cafe
          </h3>

          <div className="login-title-divider">
            <span />
            <span className="login-divider-dot" />
            <span />
          </div>

          <p className="login-brand-subtitle">
            Silakan masuk dengan akun Anda untuk mengakses sistem.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Username */}
          <div className="login-field-group">
            <label className="login-label">
              Username
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <User size={16} strokeWidth={1.8} />
              </span>
              <input
                type="text"
                className="login-input"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field-group mb-4">
            <label className="login-label">
              Password
            </label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <Lock size={16} strokeWidth={1.8} />
              </span>
              <input
                type="password"
                className="login-input"
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-login-gold"
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={17} strokeWidth={2.2} />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        {/* Garis Aksen Emas Bawah */}
        <div className="login-bottom-accent" />
      </div>

      <style>{`
        .billion-login-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.14), transparent 55%), #0c0d12;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 18px;
        }

        .billion-login-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.10), transparent 48%), #161720;
          border: 1px solid rgba(216, 167, 68, 0.45);
          border-radius: 22px;
          padding: 34px 32px 36px;
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55), 0 0 30px rgba(216, 167, 68, 0.08);
          overflow: hidden;
        }

        .login-top-accent {
          width: 84px;
          height: 3px;
          margin: 0 auto 22px;
          border-radius: 99px;
          background: linear-gradient(90deg, transparent, #e5bd65, transparent);
          box-shadow: 0 0 10px rgba(229, 189, 101, 0.5);
        }

        .login-brand-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(216, 167, 68, 0.5);
          border-radius: 50%;
          color: #e3bd69;
          background: radial-gradient(circle, rgba(216, 167, 68, 0.18), rgba(216, 167, 68, 0.04));
          box-shadow: inset 0 0 14px rgba(216, 167, 68, 0.12), 0 0 18px rgba(216, 167, 68, 0.1);
        }

        .login-eyebrow {
          margin: 0 0 4px;
          color: #c9973b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
        }

        .login-brand-title {
          margin: 0;
          color: #f8e4b0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .login-title-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 72%;
          margin: 14px auto 12px;
        }

        .login-title-divider > span:not(.login-divider-dot) {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, #c9973b);
        }

        .login-title-divider > span:last-child {
          background: linear-gradient(90deg, #c9973b, transparent);
        }

        .login-divider-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e5bd65;
          box-shadow: 0 0 8px rgba(229, 189, 101, 0.5);
        }

        .login-brand-subtitle {
          margin: 0 0 26px;
          color: #aab1c0;
          font-size: 12.5px;
          line-height: 1.5;
        }

        .login-field-group {
          margin-bottom: 18px;
        }

        .login-label {
          display: block;
          font-size: 12px;
          color: #e2d1a7;
          font-weight: 600;
          letter-spacing: 0.3px;
          margin-bottom: 7px;
        }

        .login-input-wrapper {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #c9973b;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .login-input {
          width: 100%;
          background: linear-gradient(145deg, #1d1e29, #14151e);
          border: 1px solid rgba(216, 167, 68, 0.28);
          border-radius: 13px;
          color: #f1f5f9;
          font-size: 13.5px;
          padding: 12.5px 16px 12.5px 42px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .login-input::placeholder {
          color: #64748b;
        }

        .login-input:focus {
          border-color: #d8a744;
          background: #191a24;
          box-shadow: 0 0 0 3px rgba(216, 167, 68, 0.14);
        }

        .login-input-wrapper:focus-within .login-input-icon {
          color: #f0cf7a;
        }

        .btn-login-gold {
          width: 100%;
          padding: 13.5px 20px;
          border-radius: 999px;
          background: linear-gradient(90deg, #b88728 0%, #e5c165 50%, #c49335 100%);
          border: none;
          color: #141414;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(216, 167, 68, 0.25);
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-login-gold:hover:not(:disabled) {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(216, 167, 68, 0.32);
        }

        .btn-login-gold:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2.2px solid rgba(20, 20, 20, 0.25);
          border-top-color: #141414;
          border-radius: 50%;
          animation: login-spin 0.8s linear infinite;
        }

        @keyframes login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-bottom-accent {
          position: absolute;
          bottom: 0;
          left: 25%;
          width: 50%;
          height: 2px;
          border-radius: 99px;
          background: linear-gradient(90deg, transparent, #d8a744, transparent);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default Login;