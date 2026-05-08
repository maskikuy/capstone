import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmAction } from '../utils/notify';

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 px-3">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-warning" to="#">W.O.W System</Link>
        
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
                {/* --- TAMBAHAN BARU --- */}
                <li className="nav-item">
                <Link className="nav-link" to="/admin/history">Riwayat Pesanan</Link>
                </li>
                {/* --------------------- */}
                <li className="nav-item">
                <Link className="nav-link" to="/admin/qr-codes">QR Meja</Link>
                </li>
                <li className="nav-item">
                <Link className="nav-link" to="/admin/users">Kelola User</Link>
                </li>
            </>
            )}
            {role === 'kitchen' && (
              <li className="nav-item">
                <Link className="nav-link active" to="/kitchen/dashboard">Dashboard Dapur</Link>
              </li>
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