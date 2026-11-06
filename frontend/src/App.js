import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import Inventory from './pages/admin/Inventory';
import Categories from './pages/admin/Categories';
import Discounts from './pages/admin/Discounts';
import Users from './pages/admin/Users';
import OrderHistory from './pages/admin/OrderHistory';
import Dashboard from './pages/admin/Dashboard';
import QrisSettings from './pages/admin/QrisSettings';
import KitchenDashboard from './pages/kitchen/Dashboard';
import CustomerMenu from './pages/customer/Menu';
import Checkout from './pages/customer/Checkout';
import OrderStatus from './pages/customer/OrderStatus';
import QRCodeGenerator from './pages/admin/QRCodeGenerator';
import PaymentQris from './pages/customer/PaymentQris';
import CustomerAbout from './pages/customer/About';
import NotFound from './pages/NotFound';
import KasirPOS from './pages/kasir/POS';
import Welcome from './pages/Welcome';

const DashboardLayout = () => (
  <div style={{ minHeight: '100vh', backgroundColor: '#101116', color: '#f8fafc' }}>
    <Navbar />
    <div className="container-fluid px-3 px-md-4 pb-4">
      <Outlet />
    </div>
  </div>
);

const ProtectedRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem('token');
  const roleRaw = localStorage.getItem('role');
  const role = roleRaw === 'kitchen' ? 'kasir' : roleRaw;

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
            color: '#000'
          }
        }}
      />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />

        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/about" element={<CustomerAbout />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/status" element={<OrderStatus />} />
        <Route path="/customer/payment-qris" element={<PaymentQris />} />

        <Route element={<ProtectedRoute allowedRole="admin"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<ProductList />} />
          <Route path="/admin/product/new" element={<ProductForm />} />
          <Route path="/admin/product/edit/:id" element={<ProductForm />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/discounts" element={<Discounts />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/qr-codes" element={<QRCodeGenerator />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/qris-settings" element={<QrisSettings />} />
        </Route>

        <Route element={<ProtectedRoute allowedRole="kasir"><DashboardLayout /></ProtectedRoute>}>
          <Route path="/kasir/pos" element={<KasirPOS />} />
          <Route path="/kasir/dashboard" element={<KitchenDashboard />} />
          <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
          <Route path="/kasir/history" element={<OrderHistory />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
