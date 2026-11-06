
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import {
  Banknote,
  FileText,
  Users,
  Clock,
  ChevronRight,
  Search,
  X,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState('today');

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customMonth, setCustomMonth] = useState(currentYearMonth);

  // Modal Detail Omzet
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPaymentFilter, setModalPaymentFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/order'),
        api.get('/product')
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

  // Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showDetailModal) {
        setShowDetailModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal]);

  // Pemeriksaan Periode
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

  const getPeriodTitle = useCallback(() => {
    const currDate = new Date();

    if (period === 'today') return 'OMZET HARI INI';
    if (period === 'week') return 'OMZET 7 HARI TERAKHIR';
    if (period === 'month') return `OMZET BULAN INI (${MONTH_NAMES[currDate.getMonth()]})`;

    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      return `OMZET ${(MONTH_NAMES[month - 1] || '').toUpperCase()} ${year}`;
    }

    return 'OMZET';
  }, [period, customMonth]);

  const getPeriodLabelFormatted = useCallback(() => {
    const currDate = new Date();

    if (period === 'today') {
      return currDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    if (period === 'week') return '7 Hari Terakhir';

    if (period === 'month') {
      return `${MONTH_NAMES[currDate.getMonth()]} ${currDate.getFullYear()}`;
    }

    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      return `${MONTH_NAMES[month - 1] || ''} ${year}`;
    }

    return '';
  }, [period, customMonth]);

  // Filter Pesanan Periode
  const periodOrders = useMemo(() => {
    return orders.filter((o) =>
      isOrderInPeriod(o.created_at, period, customMonth)
    );
  }, [orders, period, customMonth, isOrderInPeriod]);

  // Pesanan Lunas
  const periodPaidOrders = useMemo(() => {
    return periodOrders.filter((o) => o.payment_status === 'paid');
  }, [periodOrders]);

  // Total Omzet
  const periodRevenue = useMemo(() => {
    return periodPaidOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total_amount) || 0),
      0
    );
  }, [periodPaidOrders]);

  // Filter Modal
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

  // Antrean Dapur
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.order_status === 'pending' || o.order_status === 'processing'
    ).length;
  }, [orders]);

  // Menu Habis
  const unavailableItemsCount = useMemo(() => {
    return products.filter(
      (p) => p.is_available === 0 || p.is_available === false
    ).length;
  }, [products]);

  // Preview Menu
  const topProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Data Grafik Penjualan
  const chartData = useMemo(() => {
    if (period === 'month' || period === 'custom_month') {
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth();

      if (period === 'custom_month' && customMonth) {
        const [y, m] = customMonth.split('-').map(Number);
        targetYear = y;
        targetMonth = m - 1;
      }

      const daysInMonth = new Date(
        targetYear,
        targetMonth + 1,
        0
      ).getDate();

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
          .reduce(
            (sum, o) => sum + (parseFloat(o.total_amount) || 0),
            0
          );

        return {
          name: `${day}`,
          fullDate: `${day} ${MONTH_NAMES[targetMonth]} ${targetYear}`,
          omzet
        };
      });
    }

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
        .reduce(
          (sum, o) => sum + (parseFloat(o.total_amount) || 0),
          0
        );

      return {
        name: `${day}/${month}`,
        fullDate: d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        omzet
      };
    });
  }, [period, customMonth, orders, now]);

  const chartTitle = useMemo(() => {
    if (period === 'month') {
      return `Tren Penjualan Harian (${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()})`;
    }

    if (period === 'custom_month') {
      const [year, month] = customMonth.split('-').map(Number);
      return `Tren Penjualan Harian (${MONTH_NAMES[month - 1]} ${year})`;
    }

    return 'Tren Penjualan (7 Hari Terakhir)';
  }, [period, customMonth, now]);

  // Format Tanggal
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div
          className="spinner-border"
          style={{ color: '#d8a744' }}
          role="status"
        />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#101116',
      color: '#f8fafc',
      paddingBottom: '30px'
    }}>

      {/* HEADER DASHBOARD */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 pb-3 mb-2">
        <div>
          <h3 style={{
            color: '#f1f5f9',
            fontWeight: '700',
            fontSize: '1.45rem',
            margin: 0
          }}>
            Dashboard Admin
          </h3>
        </div>

        {/* Filter Periode */}
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
                  backgroundColor: period === tab.key ? '#d8a744' : 'transparent',
                  color: period === tab.key ? '#101116' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {period === 'custom_month' && (
            <input
              type="month"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="form-control form-control-sm"
              style={{
                width: 'auto',
                backgroundColor: '#171821',
                border: '1px solid #c9973b',
                color: '#f1f5f9',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="row g-3 mb-4">

        {/* Omzet */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            onClick={() => setShowDetailModal(true)}
            title="Klik untuk melihat rincian pesanan omzet ini"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowDetailModal(true);
              }
            }}
            style={{
              backgroundColor: '#171821',
              border: '1px solid #c9973b',
              borderRadius: '12px',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '136px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(216,167,68,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(216,167,68,0.13)',
                  color: '#d8a744'
                }}>
                  <Banknote size={15} />
                </span>

                <span style={{
                  color: '#d8a744',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.4px'
                }}>
                  {getPeriodTitle()}
                </span>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(216,167,68,0.1)',
                color: '#e5bd65',
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(216,167,68,0.25)'
              }}>
                Lihat Detail <ArrowUpRight size={12} />
              </span>
            </div>

            <div style={{
              color: '#e5bd65',
              fontSize: '1.65rem',
              fontWeight: '700'
            }}>
              {formatRupiah(periodRevenue)}
            </div>

            <div
              className="d-flex align-items-center justify-content-between pt-1"
              style={{ fontSize: '11.5px' }}
            >
              <span style={{ color: '#94a3b8' }}>
                {periodPaidOrders.length} pesanan berhasil
              </span>

              <span style={{
                color: '#d8a744',
                fontWeight: '600'
              }}>
                Klik rincian &gt;
              </span>
            </div>
          </div>
        </div>

        {/* Pesanan */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #303348',
            borderRadius: '12px',
            padding: '16px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '136px'
          }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(148,163,184,0.12)',
                color: '#94a3b8'
              }}>
                <FileText size={15} />
              </span>

              <span style={{
                color: '#aab3c4',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.4px'
              }}>
                PESANAN
              </span>
            </div>

            <div style={{
              color: '#f1f5f9',
              fontSize: '1.65rem',
              fontWeight: '700'
            }}>
              {periodOrders.length}
            </div>

            <div style={{ color: '#9ca3af', fontSize: '11.5px' }}>
              <span style={{ color: '#4ade80' }}>
                {periodPaidOrders.length} Lunas
              </span>

              {periodOrders.length - periodPaidOrders.length > 0 && (
                <span style={{ color: '#e5bd65', marginLeft: '6px' }}>
                  • {periodOrders.length - periodPaidOrders.length} Belum Bayar
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Antrean Dapur */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #38312a',
            borderRadius: '12px',
            padding: '16px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '136px'
          }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(216,167,68,0.1)',
                color: '#d8a744'
              }}>
                <Users size={15} />
              </span>

              <span style={{
                color: '#d8a744',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.4px'
              }}>
                ANTREAN DAPUR
              </span>
            </div>

            <div style={{
              color: '#e5bd65',
              fontSize: '1.65rem',
              fontWeight: '700'
            }}>
              {activeOrdersCount}
            </div>

            <div style={{ color: '#9ca3af', fontSize: '11.5px' }}>
              Pending / Processing
            </div>
          </div>
        </div>

        {/* Menu Habis */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #38312a',
            borderRadius: '12px',
            padding: '16px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '136px'
          }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(148,163,184,0.12)',
                color: '#94a3b8'
              }}>
                <Clock size={15} />
              </span>

              <span style={{
                color: '#aab3c4',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.4px'
              }}>
                MENU HABIS
              </span>
            </div>

            <div style={{
              color: '#f1f5f9',
              fontSize: '1.65rem',
              fontWeight: '700'
            }}>
              {unavailableItemsCount}
            </div>

            <div>
              <Link
                to="/admin/products"
                style={{
                  color: '#d8a744',
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                Cek Stok <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="row g-3">

        {/* Tren Penjualan */}
        <div className="col-12 col-lg-8">
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #232530',
            borderRadius: '14px',
            padding: '20px 24px',
            height: '100%'
          }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
              <h5 style={{
                color: '#e2e8f0',
                fontSize: '14.5px',
                fontWeight: '600',
                margin: 0
              }}>
                {chartTitle}
              </h5>

              <small style={{
                color: '#94a3b8',
                fontSize: '11.5px'
              }}>
                Omzet Periode:{' '}
                <strong style={{ color: '#d8a744' }}>
                  {formatRupiah(periodRevenue)}
                </strong>
              </small>
            </div>

            <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '3px',
                background: 'linear-gradient(90deg,#a7792e,#f2d58a,#c9973b)',
                borderRadius: '4px'
              }} />

              <span style={{
                fontSize: '11.5px',
                color: '#cbd5e1'
              }}>
                Omzet (Rp)
              </span>
            </div>

            <div style={{ width: '100%', height: '330px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                >
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
                      borderColor: '#38312a',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [
                      formatRupiah(val),
                      'Omzet'
                    ]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.fullDate || label
                    }
                  />

                  <Line
                    type="linear"
                    dataKey="omzet"
                    stroke="#d8a744"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#e5bd65', stroke: '#d8a744' }}
                    activeDot={{ r: 5, fill: '#f2d58a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Menu Preview & Aksi Cepat */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-3">

          {/* Menu Preview */}
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #232530',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{
                color: '#e2e8f0',
                fontSize: '14.5px',
                fontWeight: '600',
                margin: 0
              }}>
                Menu Preview
              </h5>

              <Link
                to="/admin/products"
                style={{
                  color: '#d8a744',
                  fontSize: '11.5px',
                  textDecoration: 'none'
                }}
              >
                Lihat Semua
              </Link>
            </div>

            <div className="d-flex flex-column gap-3">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <div
                    key={product.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#262835',
                        flexShrink: 0
                      }}>
                        {product.image_url ? (
                          <img
                            src={`${API_IMAGE_URL}/${product.image_url}`}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary" style={{ fontSize: '10px' }}>
                            No Img
                          </div>
                        )}
                      </div>

                      <span style={{
                        color: '#f1f5f9',
                        fontSize: '13.5px',
                        fontWeight: '500',
                        textTransform: 'lowercase'
                      }}>
                        {product.name}
                      </span>
                    </div>

                    <span style={{
                      padding: '2px 14px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: product.is_available ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: product.is_available ? '#22c55e' : '#ef4444',
                      border: `1px solid ${product.is_available ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`
                    }}>
                      {product.is_available ? 'Ready' : 'Habis'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                  Belum ada menu.
                </div>
              )}
            </div>
          </div>

          {/* Aksi Cepat */}
          <div style={{
            backgroundColor: '#171821',
            border: '1px solid #232530',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <h5 style={{
              color: '#e2e8f0',
              fontSize: '14.5px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Aksi Cepat
            </h5>

            <div className="d-flex flex-column">
              {[
                { label: 'Tambah Menu Baru', to: '/admin/product/new' },
                { label: 'Cetak QR Code Meja', to: '/admin/qr-codes' },
                { label: 'Pengaturan QRIS Statis', to: '/admin/qris-settings' },
                { label: 'Buat Akun Dapur', to: '/admin/users' }
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#d8a744';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  <span>{action.label}</span>
                  <ChevronRight size={15} color="#64748b" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MODAL DETAIL PESANAN OMZET */}
      {/* ====================================================== */}

      {showDetailModal && (
        <div
          className="revenue-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false);
            }
          }}
        >
          <div
            className="revenue-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revenueTitle"
          >

            {/* HEADER */}
            <div className="revenue-header">
              <div>
                <h4 id="revenueTitle">Rincian Omzet</h4>

                <span className="revenue-period">
                  {getPeriodLabelFormatted()}
                </span>
              </div>

              <button
                type="button"
                className="revenue-close"
                onClick={() => setShowDetailModal(false)}
                aria-label="Tutup rincian omzet"
              >
                <X size={19} />
              </button>
            </div>

            {/* RINGKASAN OMZET */}
            <div className="revenue-summary">
              <div className="revenue-total">
                <span>Total Omzet</span>
                <strong>{formatRupiah(periodRevenue)}</strong>
              </div>

              <div className="revenue-summary-stat">
                <span>Transaksi Lunas</span>
                <strong>{periodPaidOrders.length}</strong>
              </div>

              <div className="revenue-summary-stat">
                <span>Rata-rata Transaksi</span>
                <strong>
                  {formatRupiah(
                    periodPaidOrders.length > 0
                      ? Math.round(periodRevenue / periodPaidOrders.length)
                      : 0
                  )}
                </strong>
              </div>
            </div>

            {/* PENCARIAN DAN FILTER */}
            <div className="revenue-tools">
              <div className="revenue-search">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Cari nama pelanggan, ID, meja, atau menu..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />

                {modalSearch && (
                  <button
                    type="button"
                    onClick={() => setModalSearch('')}
                    aria-label="Hapus pencarian"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="revenue-filter">
                <span>Metode pembayaran</span>

                <div className="revenue-filter-options">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'qris', label: 'QRIS' },
                    { key: 'cash', label: 'Tunai' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={modalPaymentFilter === filter.key ? 'active' : ''}
                      onClick={() => setModalPaymentFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DAFTAR TRANSAKSI */}
            <div className="revenue-list">

              <div className="revenue-list-heading">
                <span>Daftar transaksi</span>

                <span>
                  {modalOrders.length} pesanan
                </span>
              </div>

              {modalOrders.length === 0 ? (
                <div className="revenue-empty">
                  <Receipt size={30} />

                  <strong>Pesanan tidak ditemukan</strong>

                  <span>
                    Coba ubah kata pencarian atau filter pembayaran.
                  </span>
                </div>
              ) : (
                modalOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="revenue-order"
                    >
                      {/* Informasi utama pesanan */}
                      <div className="revenue-order-main">

                        <div className="revenue-order-left">
                          <span className="revenue-order-id">
                            #{order.id}
                          </span>

                          <div className="revenue-customer">
                            <strong>
                              {order.customer_name || 'Pelanggan'}
                            </strong>

                            <span>
                              Meja {order.table_number || '-'}
                              {' · '}
                              {order.location || 'Dine-In'}
                            </span>
                          </div>
                        </div>

                        <strong className="revenue-order-total">
                          {formatRupiah(order.total_amount)}
                        </strong>
                      </div>

                      {/* Status dan waktu */}
                      <div className="revenue-order-info">
                        <div className="revenue-badges">
                          <span className="revenue-method">
                            {order.payment_method || 'QRIS'}
                          </span>

                          <span className="revenue-status">
                            <CheckCircle2 size={13} />
                            Lunas
                          </span>
                        </div>

                        <span className="revenue-date">
                          <Clock size={13} />
                          {formatDateTime(order.created_at)}
                        </span>
                      </div>

                      {/* Detail Pesanan */}
                      <button
                        type="button"
                        className="revenue-detail-toggle"
                        onClick={() => {
                          setExpandedOrderId(isExpanded ? null : order.id);
                        }}
                        aria-expanded={isExpanded}
                      >
                        <span>
                          {isExpanded ? 'Sembunyikan item' : 'Lihat item pesanan'}

                          <span className="revenue-item-count">
                            {order.items?.length || 0}
                          </span>
                        </span>

                        {isExpanded
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                        }
                      </button>

                      {/* Daftar Menu */}
                      {isExpanded && (
                        <div className="revenue-items">
                          {(order.items || []).length > 0 ? (
                            order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="revenue-item"
                              >
                                <div className="revenue-item-description">
                                  <strong>
                                    {item.product_name || 'Item'}
                                  </strong>

                                  <span>
                                    {item.quantity} × {formatRupiah(item.price_at_order)}
                                  </span>

                                  {item.variants && item.variants.length > 0 && (
                                    <small>
                                      Varian: {item.variants.map((v) => v.variant_name).join(', ')}
                                    </small>
                                  )}

                                  {item.notes && (
                                    <small>
                                      Catatan: {item.notes}
                                    </small>
                                  )}
                                </div>

                                <strong className="revenue-item-subtotal">
                                  {formatRupiah(
                                    (parseFloat(item.price_at_order) || 0) * item.quantity
                                  )}
                                </strong>
                              </div>
                            ))
                          ) : (
                            <div className="revenue-no-items">
                              Tidak ada rincian item untuk pesanan ini.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* FOOTER */}
            <div className="revenue-footer">
              <span className="revenue-count">
                Menampilkan {modalOrders.length} dari {periodPaidOrders.length} transaksi
              </span>

              <div className="revenue-actions">
                <Link
                  to="/admin/orders"
                  className="revenue-history"
                >
                  Riwayat Pesanan
                  <ArrowUpRight size={14} />
                </Link>

                <button
                  type="button"
                  className="revenue-done"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* CSS MODAL DETAIL OMZET */}
          {/* ================================================== */}

          <style>{`
            .revenue-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 22px;
              background: rgba(5,6,10,0.78);
              backdrop-filter: blur(7px);
              -webkit-backdrop-filter: blur(7px);
            }

            .revenue-dialog {
              width: 100%;
              max-width: 900px;
              max-height: 88vh;
              max-height: 88dvh;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              background: #15161e;
              border: 1px solid #303140;
              border-radius: 15px;
              box-shadow: 0 24px 75px rgba(0,0,0,0.55);
              animation: revenueEnter 0.2s ease-out;
            }

            @keyframes revenueEnter {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            /* Header */
            .revenue-header {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 15px;
              padding: 18px 23px;
              background: #191a23;
              border-bottom: 1px solid #2a2c38;
            }

            .revenue-header h4 {
              margin: 0 0 5px;
              color: #f1f5f9;
              font-size: 16px;
              font-weight: 700;
            }

            .revenue-period {
              color: #9ca3af;
              font-size: 12px;
            }

            .revenue-close {
              width: 35px;
              height: 35px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #222431;
              border: 1px solid #373949;
              border-radius: 8px;
              color: #cbd5e1;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .revenue-close:hover {
              color: #fff;
              border-color: #c9973b;
              background: #292a35;
            }

            /* Summary */
            .revenue-summary {
              flex-shrink: 0;
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) minmax(140px, 0.7fr) minmax(170px, 0.8fr);
              align-items: center;
              gap: 22px;
              padding: 20px 23px;
              background: #15161e;
              border-bottom: 1px solid #2a2c38;
            }

            .revenue-total {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            .revenue-total span,
            .revenue-summary-stat span {
              color: #929bad;
              font-size: 12px;
            }

            .revenue-total strong {
              color: #e5bd65;
              font-size: 27px;
              font-weight: 800;
              line-height: 1.2;
              letter-spacing: -0.5px;
            }

            .revenue-summary-stat {
              display: flex;
              flex-direction: column;
              gap: 7px;
              padding-left: 20px;
              border-left: 1px solid #303140;
            }

            .revenue-summary-stat strong {
              color: #f1f5f9;
              font-size: 16px;
              font-weight: 700;
            }

            /* Search and Filter */
            .revenue-tools {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 17px;
              padding: 15px 23px;
              background: #191a23;
              border-bottom: 1px solid #2a2c38;
            }

            .revenue-search {
              min-width: 180px;
              max-width: 420px;
              width: 100%;
              height: 42px;
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 0 13px;
              background: #101116;
              border: 1px solid #303140;
              border-radius: 9px;
              color: #8791a3;
              transition: border-color 0.2s ease;
            }

            .revenue-search:focus-within {
              border-color: #c9973b;
            }

            .revenue-search input {
              flex: 1;
              min-width: 0;
              border: none;
              outline: none;
              background: transparent;
              color: #f1f5f9;
              font-size: 12px;
            }

            .revenue-search input::placeholder {
              color: #788195;
            }

            .revenue-search button {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              border: none;
              background: transparent;
              color: #94a3b8;
              cursor: pointer;
            }

            .revenue-filter {
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex-shrink: 0;
            }

            .revenue-filter > span {
              color: #929bad;
              font-size: 11px;
            }

            .revenue-filter-options {
              display: flex;
              align-items: center;
              gap: 5px;
            }

            .revenue-filter-options button {
              min-width: 55px;
              padding: 7px 12px;
              border: 1px solid #303140;
              border-radius: 7px;
              background: #222431;
              color: #aab1c0;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
            }

            .revenue-filter-options button:hover {
              border-color: #c9973b;
              color: #e5bd65;
            }

            .revenue-filter-options button.active {
              color: #171717;
              background: linear-gradient(135deg,#f0d48b,#c9973b);
              border-color: #d8a744;
            }

            /* List */
            .revenue-list {
              flex: 1;
              min-height: 130px;
              overflow-y: auto;
              padding: 17px 23px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              scrollbar-width: thin;
              scrollbar-color: #454451 #15161e;
            }

            .revenue-list-heading {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2px;
              color: #e2e8f0;
              font-size: 12px;
              font-weight: 700;
            }

            .revenue-list-heading span:last-child {
              color: #929bad;
              font-size: 11px;
              font-weight: 500;
            }

            /* Order Card */
            .revenue-order {
              padding: 15px 17px;
              background: #1a1b25;
              border: 1px solid #303140;
              border-radius: 11px;
              transition: border-color 0.2s ease;
            }

            .revenue-order:hover {
              border-color: #494453;
            }

            .revenue-order-main {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 15px;
            }

            .revenue-order-left {
              display: flex;
              align-items: center;
              gap: 11px;
              min-width: 0;
            }

            .revenue-order-id {
              flex-shrink: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 39px;
              padding: 6px 8px;
              color: #e5bd65;
              background: rgba(216,167,68,0.1);
              border: 1px solid rgba(216,167,68,0.22);
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
            }

            .revenue-customer {
              display: flex;
              flex-direction: column;
              gap: 3px;
              min-width: 0;
            }

            .revenue-customer strong {
              color: #f1f5f9;
              font-size: 13px;
              font-weight: 700;
              overflow-wrap: anywhere;
            }

            .revenue-customer span {
              color: #929bad;
              font-size: 11px;
            }

            .revenue-order-total {
              flex-shrink: 0;
              color: #e5bd65;
              font-size: 16px;
              font-weight: 800;
              white-space: nowrap;
            }

            /* Meta */
            .revenue-order-info {
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 9px;
              margin-top: 13px;
            }

            .revenue-badges {
              display: flex;
              align-items: center;
              gap: 7px;
            }

            .revenue-method,
            .revenue-status {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 5px 9px;
              border-radius: 20px;
              font-size: 10.5px;
              font-weight: 600;
            }

            .revenue-method {
              color: #e5bd65;
              background: rgba(216,167,68,0.1);
              border: 1px solid rgba(216,167,68,0.2);
              text-transform: uppercase;
            }

            .revenue-status {
              color: #86c99b;
              background: rgba(34,197,94,0.08);
              border: 1px solid rgba(34,197,94,0.18);
            }

            .revenue-date {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              color: #929bad;
              font-size: 11px;
            }

            /* Detail Toggle */
            .revenue-detail-toggle {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 12px;
              padding: 11px 0 0;
              border: none;
              border-top: 1px solid #303140;
              background: transparent;
              color: #d8a744;
              font-size: 11.5px;
              font-weight: 600;
              text-align: left;
              cursor: pointer;
            }

            .revenue-detail-toggle > span {
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }

            .revenue-detail-toggle:hover {
              color: #f2d58a;
            }

            .revenue-item-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 19px;
              height: 19px;
              padding: 0 5px;
              background: rgba(216,167,68,0.12);
              border-radius: 5px;
              color: #e5bd65;
              font-size: 10px;
            }

            /* Order Items */
            .revenue-items {
              margin-top: 11px;
              padding: 12px 14px;
              background: #12131b;
              border: 1px solid #2d2f3b;
              border-radius: 8px;
            }

            .revenue-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 14px;
              padding: 10px 0;
              border-bottom: 1px solid #282a36;
            }

            .revenue-item:first-child {
              padding-top: 0;
            }

            .revenue-item:last-child {
              padding-bottom: 0;
              border-bottom: none;
            }

            .revenue-item-description {
              min-width: 0;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .revenue-item-description strong {
              color: #f1f5f9;
              font-size: 12px;
              font-weight: 600;
            }

            .revenue-item-description span {
              color: #aab1c0;
              font-size: 11px;
            }

            .revenue-item-description small {
              color: #8f9aad;
              font-size: 10.5px;
            }

            .revenue-item-subtotal {
              flex-shrink: 0;
              color: #e5bd65;
              font-size: 12px;
              font-weight: 700;
              white-space: nowrap;
            }

            .revenue-no-items {
              color: #929bad;
              font-size: 11px;
            }

            /* Empty State */
            .revenue-empty {
              min-height: 180px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 10px;
              text-align: center;
              color: #d8a744;
            }

            .revenue-empty strong {
              color: #f1f5f9;
              font-size: 13px;
            }

            .revenue-empty span {
              color: #929bad;
              font-size: 11px;
            }

            /* Footer */
            .revenue-footer {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              flex-wrap: wrap;
              padding: 14px 23px;
              background: #191a23;
              border-top: 1px solid #2a2c38;
            }

            .revenue-count {
              color: #929bad;
              font-size: 11px;
            }

            .revenue-actions {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .revenue-history,
            .revenue-done {
              min-height: 37px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 7px;
              padding: 8px 14px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              text-decoration: none;
              cursor: pointer;
              transition: all 0.15s ease;
            }

            .revenue-history {
              background: #222431;
              border: 1px solid #373949;
              color: #cbd5e1;
            }

            .revenue-history:hover {
              color: #e5bd65;
              border-color: #c9973b;
            }

            .revenue-done {
              background: linear-gradient(135deg,#f0d48b,#c9973b);
              border: 1px solid #d8a744;
              color: #171717;
            }

            .revenue-done:hover {
              background: linear-gradient(135deg,#f5dfa7,#dfb653);
            }

            /* Responsive */
            @media (max-width: 650px) {
              .revenue-overlay {
                padding: 12px;
              }

              .revenue-dialog {
                max-height: 92vh;
                max-height: 92dvh;
                border-radius: 12px;
              }

              .revenue-header {
                padding: 15px 16px;
              }

              .revenue-header h4 {
                font-size: 15px;
              }

              .revenue-summary {
                grid-template-columns: 1fr 1fr;
                gap: 13px;
                padding: 16px;
              }

              .revenue-total {
                grid-column: 1 / -1;
                padding-bottom: 12px;
                border-bottom: 1px solid #303140;
              }

              .revenue-total strong {
                font-size: 24px;
              }

              .revenue-summary-stat {
                padding-left: 0;
                border-left: none;
              }

              .revenue-summary-stat span {
                font-size: 10.5px;
              }

              .revenue-summary-stat strong {
                font-size: 13px;
              }

              .revenue-tools {
                align-items: stretch;
                flex-direction: column;
                padding: 13px 16px;
                gap: 12px;
              }

              .revenue-search {
                max-width: none;
              }

              .revenue-filter {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
              }

              .revenue-list {
                padding: 14px 13px;
              }

              .revenue-order {
                padding: 13px;
              }

              .revenue-order-total {
                font-size: 14px;
              }

              .revenue-order-info {
                align-items: flex-start;
                flex-direction: column;
              }

              .revenue-footer {
                padding: 13px 15px;
                flex-direction: column;
                align-items: stretch;
              }

              .revenue-count {
                text-align: center;
              }

              .revenue-actions {
                display: grid;
                grid-template-columns: 1fr auto;
              }
            }

            @media (max-width: 380px) {
              .revenue-filter {
                align-items: flex-start;
                flex-direction: column;
              }

              .revenue-order-main {
                align-items: flex-start;
                flex-direction: column;
                gap: 9px;
              }

              .revenue-order-total {
                padding-left: 50px;
              }

              .revenue-item {
                flex-direction: column;
                gap: 7px;
              }

              .revenue-item-subtotal {
                align-self: flex-end;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .revenue-dialog,
              .revenue-close,
              .revenue-order,
              .revenue-filter-options button,
              .revenue-history,
              .revenue-done {
                animation: none;
                transition: none;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
