import React, { useEffect, useState, useCallback } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import { Banknote, FileText, Users, Clock, ChevronRight } from 'lucide-react';
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
      const day = d.getDate();
      const month = d.getMonth() + 1;
      return `${day}/${month}/`;
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
      const chartRows = last7Days.map((dateLabel, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const fullDateStr = d.toLocaleDateString('id-ID');

        const omzet = orders
          .filter(
            (o) =>
              new Date(o.created_at).toLocaleDateString('id-ID') === fullDateStr &&
              o.payment_status === 'paid'
          )
          .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

        return {
          name: dateLabel,
          omzet,
        };
      });

      setChartData(chartRows);
      setTopProducts(products.slice(0, 4));
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#e5a83b' }} role="status" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', paddingBottom: '30px' }}>
      <div className="pt-3 pb-3">
        <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: 0 }}>
          Dashboard Admin
        </h3>
      </div>

      {/* 4 Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Card 1: Omzet Hari Ini */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981'
                }}
              >
                <Banknote size={15} />
              </span>
              <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px' }}>
                OMZET HARI INI
              </span>
            </div>
            <div style={{ color: '#22c55e', fontSize: '1.65rem', fontWeight: '700' }}>
              Rp {stats.todayRevenue.toLocaleString('id-ID')}
            </div>
            <div style={{ height: '16px' }}></div>
          </div>
        </div>

        {/* Card 2: Pesanan Hari Ini */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #2563eb',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                  color: '#38bdf8'
                }}
              >
                <FileText size={15} />
              </span>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px' }}>
                PESANAN HARI INI
              </span>
            </div>
            <div style={{ color: '#38bdf8', fontSize: '1.65rem', fontWeight: '700' }}>
              {stats.todayOrders}
            </div>
            <div style={{ height: '16px' }}></div>
          </div>
        </div>

        {/* Card 3: Antrean Dapur */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #d97706',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(217, 119, 6, 0.15)',
                  color: '#fbbf24'
                }}
              >
                <Users size={15} />
              </span>
              <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px' }}>
                ANTREAN DAPUR
              </span>
            </div>
            <div style={{ color: '#fbbf24', fontSize: '1.65rem', fontWeight: '700' }}>
              {stats.activeOrders}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11.5px' }}>
              Pending / Processing
            </div>
          </div>
        </div>

        {/* Card 4: Menu Habis */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #dc2626',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '128px'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(220, 38, 38, 0.15)',
                  color: '#f87171'
                }}
              >
                <Clock size={15} />
              </span>
              <span style={{ color: '#f87171', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px' }}>
                MENU HABIS
              </span>
            </div>
            <div style={{ color: '#f87171', fontSize: '1.65rem', fontWeight: '700' }}>
              {stats.unavailableItems}
            </div>
            <div>
              <Link 
                to="/admin/products" 
                style={{ color: '#eab308', fontSize: '11.5px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                Cek Stok ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Tren Penjualan & Right Column */}
      <div className="row g-3">
        {/* Left Column: Tren Penjualan */}
        <div className="col-12 col-lg-8">
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #232530',
              borderRadius: '14px',
              padding: '20px 24px',
              height: '100%'
            }}
          >
            <h5 style={{ color: '#e2e8f0', fontSize: '14.5px', fontWeight: '600', marginBottom: '12px' }}>
              Tren Penjualan (7 Hari Terakhir)
            </h5>

            {/* Centered Legend */}
            <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
              <div style={{ width: '32px', height: '14px', backgroundColor: '#2563eb', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>Omzet (Rp)</span>
            </div>

            <div style={{ width: '100%', height: '330px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="#232634" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#2e3242' }} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#2e3242' }}
                    domain={[0, 'auto']}
                  />
                  <Line 
                    type="linear" 
                    dataKey="omzet" 
                    stroke="#2563eb" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#3b82f6', stroke: '#3b82f6' }} 
                    activeDot={{ r: 5, fill: '#60a5fa' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Menu Preview & Aksi Cepat */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-3">
          {/* Menu Preview */}
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #232530',
              borderRadius: '14px',
              padding: '20px'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ color: '#e2e8f0', fontSize: '14.5px', fontWeight: '600', margin: 0 }}>
                Menu Preview
              </h5>
              <Link 
                to="/admin/products" 
                style={{ color: '#eab308', fontSize: '11.5px', textDecoration: 'none' }}
              >
                Lihat Semua
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <div key={product.id} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#262835',
                          flexShrink: 0
                        }}
                      >
                        {product.image_url ? (
                          <img 
                            src={`${API_IMAGE_URL}/${product.image_url}`} 
                            alt={product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary" style={{ fontSize: '10px' }}>
                            No Img
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#f1f5f9', fontSize: '13.5px', fontWeight: '500', textTransform: 'lowercase' }}>
                        {product.name}
                      </span>
                    </div>
                    <span 
                      style={{
                        padding: '2px 14px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: product.is_available ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: product.is_available ? '#22c55e' : '#ef4444',
                        border: `1px solid ${product.is_available ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                      }}
                    >
                      {product.is_available ? 'Ready' : 'Habis'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>Belum ada menu.</div>
              )}
            </div>
          </div>

          {/* Aksi Cepat */}
          <div 
            style={{
              backgroundColor: '#171821',
              border: '1px solid #232530',
              borderRadius: '14px',
              padding: '20px'
            }}
          >
            <h5 style={{ color: '#e2e8f0', fontSize: '14.5px', fontWeight: '600', marginBottom: '10px' }}>
              Aksi Cepat
            </h5>
            <div className="d-flex flex-column">
              {[
                { label: 'Tambah Menu Baru', to: '/admin/product/new' },
                { label: 'Cetak QR Code Meja', to: '/admin/qr-codes' },
                { label: 'Pengaturan QRIS Statis', to: '/admin/qris-settings' },
                { label: 'Buat Akun Dapur', to: '/admin/users' },
              ].map((action, idx, arr) => (
                <Link
                  key={action.label}
                  to={action.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 2px',
                    borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #22242f',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  <span>{action.label}</span>
                  <ChevronRight size={15} color="#64748b" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
