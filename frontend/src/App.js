import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Navbar from './components/Navbar';

// Admin Pages
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import OrderHistory from './pages/admin/OrderHistory';
import Dashboard from './pages/admin/Dashboard';

// Kitchen Pages
import KitchenDashboard from './pages/kitchen/Dashboard';

// Customer Pages
import CustomerMenu from './pages/customer/Menu';
import Checkout from './pages/customer/Checkout';
import OrderStatus from './pages/customer/OrderStatus';
import QRCodeGenerator from './pages/admin/QRCodeGenerator';
import PaymentQris from './pages/customer/PaymentQris';

import NotFound from './pages/NotFound';

// Layout Component agar Navbar selalu muncul setelah login
const DashboardLayout = () => (
  <>
    <Navbar />
    <div className="container-fluid">
      <Outlet /> {/* Ini tempat konten halaman dirender */}
    </div>
  </>
);

// Komponen Proteksi Route (Cek Token)
const ProtectedRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;

  return children ? children : <Outlet />;
};

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#fff',
            color: '#000',
          },
        }}
      />
      <Routes>
        {/* Route Public */}
        <Route path="/" element={<Login />} />

        {/* Route Customer */}
        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/status" element={<OrderStatus />} />
        <Route path="/customer/payment-qris" element={<PaymentQris />} />

        {/* Route Admin */}
        <Route element={<ProtectedRoute allowedRole="admin"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<Dashboard />} /> {/* Default Admin Page */}
          <Route path="/admin/products" element={<ProductList />} />
          <Route path="/admin/product/new" element={<ProductForm />} />
          <Route path="/admin/product/edit/:id" element={<ProductForm />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/history" element={<OrderHistory />} />
          <Route path="/admin/qr-codes" element={<QRCodeGenerator />} />
        </Route>

        {/* Route Kitchen */}
        <Route element={<ProtectedRoute allowedRole="kitchen"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
        </Route>

        {/* Route Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;