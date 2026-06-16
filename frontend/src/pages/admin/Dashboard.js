import React, { useEffect, useState, useCallback } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import { Banknote, FileText, Users, AlertCircle, ChevronRight, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    unavailableItems: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getLast7Days = useCallback(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('id-ID');
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/order'),
        api.get('/product'),
      ]);

      const orders = orderRes.data;
      const products = productRes.data;
      const today = new Date().toLocaleDateString('id-ID');

      let todayRev = 0;
      let todayOrd = 0;
      let active = 0;

      orders.forEach((o) => {
        const orderDate = new Date(o.created_at).toLocaleDateString('id-ID');

        if (orderDate === today) {
          todayOrd += 1;
          if (o.payment_status === 'paid') {
            todayRev += parseFloat(o.total_amount) || 0;
          }
        }

        if (o.order_status === 'pending' || o.order_status === 'processing') {
          active += 1;
        }
      });

      const unavailable = products.filter(
        (p) => p.is_available === 0 || p.is_available === false
      ).length;

      setStats({
        todayRevenue: todayRev,
        todayOrders: todayOrd,
        activeOrders: active,
        unavailableItems: unavailable,
      });

      const last7Days = getLast7Days();
      const chartRows = last7Days.map((dateString) => {
        const omzet = orders
          .filter(
            (o) =>
              new Date(o.created_at).toLocaleDateString('id-ID') === dateString &&
              o.payment_status === 'paid'
          )
          .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

        return {
          name: dateString.replace(/\/\d{4}$/, ''),
          omzet,
        };
      });

      setChartData(chartRows);
      setTopProducts(products.slice(0, 5));
    } catch (err) {
      console.error('Gagal memuat dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [getLast7Days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-white" role="status" />
      </div>
    );
  }

  return (
    <div className="dashboard-page text-light">
      <main className="container-fluid px-4 py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2 className="dashboard-title mb-1">Dashboard Admin</h2>
            <p className="text-secondary small mb-0">Ringkasan kinerja harian dan penjualan dalam 7 hari terakhir.</p>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6 col-xl-3">
            <div className="dashboard-card p-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3 text-success small fw-semibold">
                <span className="dashboard-badge dashboard-badge-success"><Banknote size={16} /></span>
                OMZET HARI INI
              </div>
              <div className="display-6 fw-bold text-success">Rp {stats.todayRevenue.toLocaleString('id-ID')}</div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <div className="dashboard-card p-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3 text-primary small fw-semibold">
                <span className="dashboard-badge dashboard-badge-primary"><FileText size={16} /></span>
                PESANAN HARI INI
              </div>
              <div className="display-6 fw-bold text-primary">{stats.todayOrders}</div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <div className="dashboard-card p-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3 text-warning small fw-semibold">
                <span className="dashboard-badge dashboard-badge-warning"><Users size={16} /></span>
                ANTREAN DAPUR
              </div>
              <div className="display-6 fw-bold text-warning">{stats.activeOrders}</div>
              <div className="small text-secondary">Pending / Processing</div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <div className="dashboard-card p-4 h-100">
              <div className="d-flex align-items-center gap-2 mb-3 text-danger small fw-semibold">
                <span className="dashboard-badge dashboard-badge-danger"><AlertCircle size={16} /></span>
                MENU HABIS
              </div>
              <div className="display-6 fw-bold text-danger">{stats.unavailableItems}</div>
              <Link to="/admin/products" className="small text-warning text-decoration-none d-inline-flex align-items-center gap-1 mt-2">
                Cek Stok <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="dashboard-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 mb-0">Tren Penjualan (7 Hari Terakhir)</h3>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid stroke="#2c2c2c" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                    <Line type="monotone" dataKey="omzet" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-secondary small d-flex align-items-center gap-2">
                <span className="legend-dot bg-info"></span>
                Omzet (Rp)
              </div>
            </div>
          </div>

          <div className="col-lg-4 d-flex flex-column gap-4">
            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 mb-0">Menu Preview</h3>
                <Link to="/admin/products" className="small text-warning text-decoration-none">Lihat Semua</Link>
              </div>
              <div className="list-group list-group-flush">
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <div key={product.id} className="d-flex justify-content-between align-items-center mb-3 p-2 rounded-3 hover-fade">
                      <div className="d-flex align-items-center gap-3">
                        <div className="preview-image bg-secondary rounded-3 overflow-hidden">
                          {product.image_url ? (
                            <img src={`${API_IMAGE_URL}/${product.image_url}`} alt={product.name} />
                          ) : (
                            <div className="placeholder-image" />
                          )}
                        </div>
                        <span className="text-white small fw-semibold text-capitalize">{product.name}</span>
                      </div>
                      <span className={`badge ${product.is_available ? 'bg-success' : 'bg-danger'}`}>
                        {product.is_available ? 'Ready' : 'Habis'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-secondary small">Belum ada menu.</div>
                )}
              </div>
            </div>

            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 mb-0">Aksi Cepat</h3>
              </div>
              <div className="list-group list-group-flush">
                {[
                  { label: 'Tambah Menu Baru', to: '/admin/product/new' },
                  { label: 'Cetak QR Code Meja', to: '/admin/qr-codes' },
                  { label: 'Pengaturan QRIS Statis', to: '/admin/qris-settings' },
                  { label: 'Buat Akun Dapur', to: '/admin/users' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="d-flex justify-content-between align-items-center p-3 mb-2 rounded-3 text-decoration-none text-secondary hover-card"
                  >
                    <span>{action.label}</span>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
