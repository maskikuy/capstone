import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { confirmAction } from '../utils/notify';
import { User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const roleRaw = localStorage.getItem('role');
  const role = roleRaw === 'kitchen' ? 'kasir' : roleRaw;
  const username = localStorage.getItem('username') || 'Super Admin';

  const handleLogout = async () => {
    const isConfirmed = await confirmAction(
      'Logout?', 
      'Yakin ingin keluar dari sistem?'
    );
    
    if (isConfirmed) {
      localStorage.clear();
      navigate('/');
    }
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? '#e5a83b' : '#9ca3af',
    fontWeight: isActive ? '600' : '400',
    fontSize: '13.5px',
    padding: '8px 2px',
    marginRight: '22px',
    textDecoration: 'none',
    borderBottom: isActive ? '2px solid #e5a83b' : '2px solid transparent',
    borderRadius: 0,
    transition: 'color 0.15s ease',
    display: 'inline-block'
  });

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3 px-md-4 py-2 sticky-top" style={{ backgroundColor: '#101116', borderBottom: '1px solid #1f212a' }}>
      <div className="container-fluid px-0">
        <Link className="navbar-brand d-flex flex-column text-decoration-none me-4" style={{ lineHeight: '1.1' }} to="#">
          <span style={{ color: '#e5a83b', fontSize: '1.35rem', fontWeight: '800', letterSpacing: '0.5px' }}>
            Billion
          </span>
          <span style={{ color: '#e5a83b', fontSize: '0.75rem', fontWeight: '500', letterSpacing: '0.5px' }}>
            Cafe System
          </span>
        </Link>
        
        <div className="collapse navbar-collapse show">
          <ul className="navbar-nav me-auto mb-0 d-flex flex-row flex-wrap align-items-center">
            {role === 'admin' && (
              <>
                <li className="nav-item">
                  <NavLink to="/admin/dashboard" style={navLinkStyle}>Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/products" style={navLinkStyle}>Manajemen Menu</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/categories" style={navLinkStyle}>Kategori</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/inventory" style={navLinkStyle}>Inventori</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/qr-codes" style={navLinkStyle}>QR Meja</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/qris-settings" style={navLinkStyle}>QRIS Statis</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/admin/users" style={navLinkStyle}>Kelola User</NavLink>
                </li>
              </>
            )}
            {(role === 'kasir' || role === 'kitchen') && (
              <>
                <li className="nav-item">
                  <NavLink to="/kasir/dashboard" style={navLinkStyle}>Dashboard Kasir</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/kasir/history" style={navLinkStyle}>Riwayat Pesanan</NavLink>
                </li>
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-2 ms-auto mt-2 mt-lg-0">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#1f212d',
                border: '1px solid #2d303f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af'
              }}
            >
              <User size={18} />
            </div>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ color: '#cbd5e1', fontSize: '12.5px', fontWeight: '500' }}>
                Halo, {username}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '11.5px' }}>
                ({role}) <span 
                  onClick={handleLogout} 
                  style={{ color: '#e5a83b', cursor: 'pointer', marginLeft: '4px', textDecoration: 'none', fontWeight: '500' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Logout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;