import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmAction } from '../utils/notify';

const Navbar = () => {
  const navigate = useNavigate();
  const roleRaw = localStorage.getItem('role');
  const role = roleRaw === 'kitchen' ? 'kasir' : roleRaw;
  const username = localStorage.getItem('username');

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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark glass-navbar sticky-top mb-4 px-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-warning" to="#">Billion Cafe System</Link>
        
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {role === 'admin' && (
            <>
                <li className="nav-item">
                <Link className="nav-link fw-bold" to="/admin/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/products">Manajemen Menu</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/categories">Kategori</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/inventory">Inventori</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/qr-codes">QR Meja</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/qris-settings">QRIS Statis</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/users">Kelola User</Link>
                </li>
            </>
            )}
            {(role === 'kasir' || role === 'kitchen') && (
              <>
                <li className="nav-item">
                  <Link className="nav-link active" to="/kasir/dashboard">Dashboard Kasir</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/kasir/history">Riwayat Pesanan</Link>
                </li>
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center">
            <span className="text-light me-3">Halo, {username} ({role})</span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;