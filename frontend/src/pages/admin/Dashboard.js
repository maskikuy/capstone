import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import { 
  Banknote, 
  FileText, 
  Users, 
  Clock, 
  ChevronRight, 
  Calendar, 
  Search, 
  X, 
  ArrowUpRight, 
  Receipt, 
  CheckCircle2, 
  Filter,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Periode omzet: 'today' | 'week' | 'month' | 'custom_month'
  const [period, setPeriod] = useState('today');
  
  // Custom month picker (format: 'YYYY-MM')
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customMonth, setCustomMonth] = useState(currentYearMonth);

  // State Modal Detail Omzet
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPaymentFilter, setModalPaymentFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/order'),
        api.get('/product'),
      ]);
      setOrders(orderRes.data || []);
      setProducts(productRes.data || []);
    } catch (err) {
      console.error('Gagal memuat dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard escape listener untuk modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showDetailModal) {
        setShowDetailModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal]);

  // Helper untuk mengecek apakah tanggal order masuk ke periode yang dipilih
  const isOrderInPeriod = useCallback((orderDateStr, currentPeriod, chosenMonthStr) => {
    if (!orderDateStr) return false;
    const d = new Date(orderDateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();

    if (currentPeriod === 'today') {
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }

    if (currentPeriod === 'week') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return d >= sevenDaysAgo && d <= today;
    }

    if (currentPeriod === 'month') {
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth()
      );
    }

    if (currentPeriod === 'custom_month' && chosenMonthStr) {
      const [year, month] = chosenMonthStr.split('-').map(Number);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month - 1
      );
    }

    return true;
  }, []);

  // Title label sesuai periode
  const getPeriodTitle = useCallback(() => {
    const currDate = new Date();
    if (period === 'today') return 'OMZET HARI INI';
    if (period === 'week') return 'OMZET 7 HARI TERAKHIR';
    if (period === 'month') return `OMZET BULAN INI (${MONTH_NAMES[currDate.getMonth()]})`;
    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      const mName = MONTH_NAMES[month - 1] || '';
      return `OMZET ${mName.toUpperCase()} ${year}`;
    }
    return 'OMZET';
  }, [period, customMonth]);

  const getPeriodLabelFormatted = useCallback(() => {
    const currDate = new Date();
    if (period === 'today') {
      return currDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (period === 'week') {
      return '7 Hari Terakhir';
    }
    if (period === 'month') {
      return `${MONTH_NAMES[currDate.getMonth()]} ${currDate.getFullYear()}`;
    }
    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      return `${MONTH_NAMES[month - 1] || ''} ${year}`;
    }
    return '';
  }, [period, customMonth]);

  // Filter pesanan sesuai periode
  const periodOrders = useMemo(() => {
    return orders.filter((o) => isOrderInPeriod(o.created_at, period, customMonth));
  }, [orders, period, customMonth, isOrderInPeriod]);

  // Pesanan yang berstatus 'paid' (menyumbang omzet)
  const periodPaidOrders = useMemo(() => {
    return periodOrders.filter((o) => o.payment_status === 'paid');
  }, [periodOrders]);

  // Total nominal omzet
  const periodRevenue = useMemo(() => {
    return periodPaidOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  }, [periodPaidOrders]);

  // Filter pesanan di dalam Modal
  const modalOrders = useMemo(() => {
    let result = periodPaidOrders;

    if (modalPaymentFilter !== 'all') {
      result = result.filter((o) => {
        const pm = (o.payment_method || '').toLowerCase();
        if (modalPaymentFilter === 'qris') return pm === 'qris';
        if (modalPaymentFilter === 'cash') return pm === 'cash' || pm === 'tunai';
        return true;
      });
    }

    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      result = result.filter((o) => {
        const idMatch = String(o.id).includes(q);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
        const tableMatch = String(o.table_number || '').includes(q);
        const itemMatch = (o.items || []).some((it) => 
          (it.product_name || '').toLowerCase().includes(q)
        );
        return idMatch || nameMatch || tableMatch || itemMatch;
      });
    }

    return result;
  }, [periodPaidOrders, modalPaymentFilter, modalSearch]);

  // Antrean dapur (pending / processing)
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.order_status === 'pending' || o.order_status === 'processing'
    ).length;
  }, [orders]);

  // Menu habis
  const unavailableItemsCount = useMemo(() => {
    return products.filter((p) => p.is_available === 0 || p.is_available === false).length;
  }, [products]);

  // Top products preview
  const topProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Perhitungan Data Tren Penjualan
  const chartData = useMemo(() => {
    if (period === 'month' || period === 'custom_month') {
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth(); // 0-indexed

      if (period === 'custom_month' && customMonth) {
        const [y, m] = customMonth.split('-').map(Number);
        targetYear = y;
        targetMonth = m - 1;
      }

      // Hitung jumlah hari dalam bulan
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      return [...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const omzet = orders
          .filter((o) => {
            if (o.payment_status !== 'paid') return false;
            const d = new Date(o.created_at);
            return (
              d.getFullYear() === targetYear &&
              d.getMonth() === targetMonth &&
              d.getDate() === day
            );
          })
          .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

        return {
          name: `${day}`,
          fullDate: `${day} ${MONTH_NAMES[targetMonth]} ${targetYear}`,
          omzet,
        };
      });
    }

    // Default: 7 Hari Terakhir
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const fullDateStr = d.toLocaleDateString('id-ID');
      const day = d.getDate();
      const month = d.getMonth() + 1;

      const omzet = orders
        .filter(
          (o) =>
            new Date(o.created_at).toLocaleDateString('id-ID') === fullDateStr &&
            o.payment_status === 'paid'
        )
        .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      return {
        name: `${day}/${month}`,
        fullDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        omzet,
      };
    });
  }, [period, customMonth, orders, now]);

  const chartTitle = useMemo(() => {
    if (period === 'month') return `Tren Penjualan Harian (${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()})`;
    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      return `Tren Penjualan Harian (${MONTH_NAMES[month - 1]} ${year})`;
    }
    return 'Tren Penjualan (7 Hari Terakhir)';
  }, [period, customMonth, now]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: '#e5a83b' }} role="status" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', paddingBottom: '30px' }}>
      
      {/* Header Dashboard & Filter Periode */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 pb-3 mb-2">
        <div>
          <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: 0 }}>
            Dashboard Admin
          </h3>
          <small style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            Pantau dan sesuaikan laporan omzet penjualan restoran
          </small>
        </div>

        {/* Filter Periode Buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div 
            className="d-flex align-items-center p-1"
            style={{
              backgroundColor: '#171821',
              border: '1px solid #232530',
              borderRadius: '10px'
            }}
          >
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: 'week', label: '7 Hari' },
              { key: 'month', label: 'Bulan Ini' },
              { key: 'custom_month', label: 'Pilih Bulan' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriod(tab.key)}
                className="btn btn-sm"
                style={{
                  border: 'none',
                  borderRadius: '7px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: period === tab.key ? '700' : '500',
                  backgroundColor: period === tab.key ? '#10b981' : 'transparent',
                  color: period === tab.key ? '#090a0f' : '#94a3b8',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input Picker Bulan jika 'Pilih Bulan' aktif */}
          {period === 'custom_month' && (
            <div className="d-flex align-items-center gap-2">
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="form-control form-control-sm"
                style={{
                  width: 'auto',
                  backgroundColor: '#171821',
                  border: '1px solid #10b981',
                  color: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="row g-3 mb-4">
        
        {/* Card 1: Omzet (Bisa Disesuaikan & Diklik untuk Melihat Detail) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            onClick={() => setShowDetailModal(true)}
            title="Klik untuk melihat rincian pesanan omzet ini"
            role="button"
            tabIndex={0}
            style={{
              backgroundColor: '#171821',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '136px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.borderColor = '#34d399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#10b981';
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
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
                  {getPeriodTitle()}
                </span>
              </div>
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontSize: '10.5px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                Lihat Detail <ArrowUpRight size={12} />
              </span>
            </div>

            <div style={{ color: '#22c55e', fontSize: '1.65rem', fontWeight: '700' }}>
              Rp {periodRevenue.toLocaleString('id-ID')}
            </div>

            <div className="d-flex align-items-center justify-content-between pt-1" style={{ fontSize: '11.5px' }}>
              <span style={{ color: '#94a3b8' }}>
                {periodPaidOrders.length} pesanan berhasil
              </span>
              <span style={{ color: '#10b981', fontWeight: '600', textDecoration: 'underline' }}>
                Klik rincian &gt;
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Pesanan Sesuai Periode */}
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
              minHeight: '136px'
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
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                PESANAN ({period === 'today' ? 'HARI INI' : period === 'week' ? '7 HARI' : 'BULAN INI'})
              </span>
            </div>
            <div style={{ color: '#38bdf8', fontSize: '1.65rem', fontWeight: '700' }}>
              {periodOrders.length}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11.5px' }}>
              <span style={{ color: '#22c55e' }}>{periodPaidOrders.length} Lunas</span>
              {periodOrders.length - periodPaidOrders.length > 0 && (
                <span style={{ color: '#fbbf24', marginLeft: '6px' }}>
                  • {periodOrders.length - periodPaidOrders.length} Belum Bayar
                </span>
              )}
            </div>
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
              minHeight: '136px'
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
              {activeOrdersCount}
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
              minHeight: '136px'
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
              {unavailableItemsCount}
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
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
              <h5 style={{ color: '#e2e8f0', fontSize: '14.5px', fontWeight: '600', margin: 0 }}>
                {chartTitle}
              </h5>
              <small style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                Omzet Periode: <strong style={{ color: '#22c55e' }}>Rp {periodRevenue.toLocaleString('id-ID')}</strong>
              </small>
            </div>

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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#171821', 
                      borderColor: '#232530', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      fontSize: '12px' 
                    }}
                    formatter={(val) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Omzet']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
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

      {/* ======================================================== */}
      {/* MODAL DETAIL PESANAN OMZET                              */}
      {/* ======================================================== */}
      {showDetailModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 6, 10, 0.78)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailModal(false);
          }}
        >
          <div 
            style={{
              backgroundColor: '#161722',
              border: '1px solid #282a3c',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '880px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #242738',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#181926'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981'
                  }}
                >
                  <Banknote size={20} />
                </span>
                <div>
                  <h5 style={{ margin: 0, color: '#f1f5f9', fontWeight: '700', fontSize: '1.15rem' }}>
                    Rincian Pesanan Omzet
                  </h5>
                  <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    Periode: <strong style={{ color: '#10b981' }}>{getPeriodLabelFormatted()}</strong>
                  </small>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="btn p-0 d-flex align-items-center justify-content-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#202230',
                  border: '1px solid #2d3042',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Summary Banner */}
            <div 
              style={{
                padding: '14px 24px',
                backgroundColor: '#12131c',
                borderBottom: '1px solid #232535',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>Total Omzet:</span>
                <span style={{ color: '#22c55e', fontWeight: '800', fontSize: '1.25rem' }}>
                  Rp {periodRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.84rem' }}>
                <span style={{ color: '#cbd5e1' }}>
                  Total Transaksi Paid: <strong style={{ color: '#38bdf8' }}>{periodPaidOrders.length}</strong>
                </span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>
                  Rata-rata: <strong style={{ color: '#fbbf24' }}>
                    Rp {periodPaidOrders.length > 0 ? Math.round(periodRevenue / periodPaidOrders.length).toLocaleString('id-ID') : 0}
                  </strong>
                </span>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div 
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid #232535',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Cari ID, pelanggan, meja, menu..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1b1c28',
                    border: '1px solid #282a3c',
                    borderRadius: '9px',
                    padding: '7px 12px 7px 34px',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Payment Filter Pills */}
              <div className="d-flex align-items-center gap-1">
                <span style={{ color: '#64748b', fontSize: '0.78rem', marginRight: '4px' }}>Metode:</span>
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'qris', label: 'QRIS' },
                  { key: 'cash', label: 'Tunai' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setModalPaymentFilter(f.key)}
                    style={{
                      border: 'none',
                      borderRadius: '7px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: modalPaymentFilter === f.key ? '700' : '500',
                      backgroundColor: modalPaymentFilter === f.key ? '#3b82f6' : '#1e202e',
                      color: modalPaymentFilter === f.key ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Daftar Pesanan */}
            <div 
              style={{
                padding: '16px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {modalOrders.length === 0 ? (
                <div className="text-center py-5" style={{ color: '#64748b' }}>
                  <Receipt size={40} className="mb-2" style={{ opacity: 0.4 }} />
                  <p className="mb-1" style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
                    Tidak ada pesanan yang sesuai filter.
                  </p>
                  <small style={{ fontSize: '0.8rem' }}>
                    Pastikan status pembayaran sudah lunas (Paid) pada periode {getPeriodLabelFormatted()}.
                  </small>
                </div>
              ) : (
                modalOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const isQris = (order.payment_method || '').toLowerCase() === 'qris';

                  return (
                    <div 
                      key={order.id}
                      style={{
                        backgroundColor: '#1b1c28',
                        border: '1px solid #282a3c',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span 
                            style={{
                              backgroundColor: 'rgba(216, 167, 68, 0.15)',
                              color: '#d8a744',
                              fontWeight: '700',
                              fontSize: '0.82rem',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            #{order.id}
                          </span>
                          <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.96rem' }}>
                            {order.customer_name || 'Pelanggan'}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            (Meja {order.table_number || '-'} • {order.location || 'Dine-In'})
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <span 
                            style={{
                              backgroundColor: isQris ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                              color: isQris ? '#38bdf8' : '#fbbf24',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              textTransform: 'uppercase'
                            }}
                          >
                            {order.payment_method || 'QRIS'}
                          </span>
                          <span 
                            style={{
                              backgroundColor: 'rgba(34, 197, 94, 0.15)',
                              color: '#22c55e',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <CheckCircle2 size={11} /> Lunas
                          </span>
                          <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '1.05rem', marginLeft: '6px' }}>
                            Rp {parseFloat(order.total_amount || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {/* Baris Waktu & Toggle Menu */}
                      <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        <span>
                          <Clock size={12} className="me-1" />
                          {formatDateTime(order.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline'
                          }}
                        >
                          {isExpanded ? 'Sembunyikan Menu ▲' : `Lihat Rincian (${order.items?.length || 0} item) ▼`}
                        </button>
                      </div>

                      {/* Rincian Menu yang dibeli */}
                      {isExpanded && (
                        <div 
                          style={{
                            backgroundColor: '#141520',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginTop: '8px',
                            border: '1px solid #232537'
                          }}
                        >
                          <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Daftar Menu:
                          </small>
                          <div className="d-flex flex-column gap-2">
                            {(order.items || []).map((it, idx) => (
                              <div key={idx} className="d-flex justify-content-between align-items-start" style={{ fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: '#f1f5f9', fontWeight: '600' }}>
                                    {it.quantity}x {it.product_name || 'Item'}
                                  </span>
                                  {it.variants && it.variants.length > 0 && (
                                    <small style={{ color: '#38bdf8', display: 'block', fontSize: '0.75rem' }}>
                                      + {it.variants.map((v) => v.variant_name).join(', ')}
                                    </small>
                                  )}
                                  {it.notes && (
                                    <small style={{ color: '#d8a744', display: 'block', fontSize: '0.75rem' }}>
                                      "{it.notes}"
                                    </small>
                                  )}
                                </div>
                                <span style={{ color: '#cbd5e1', fontWeight: '600' }}>
                                  Rp {((parseFloat(it.price_at_order) || 0) * it.quantity).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div 
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #242738',
                backgroundColor: '#181926',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                Menampilkan <strong>{modalOrders.length}</strong> dari <strong>{periodPaidOrders.length}</strong> pesanan
              </span>

              <div className="d-flex align-items-center gap-2">
                <Link
                  to="/admin/orders"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: '#202230',
                    border: '1px solid #2d3042',
                    color: '#f1f5f9',
                    fontSize: '0.82rem',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  Buka Riwayat Pesanan ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#090a0f',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
