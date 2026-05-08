import React, { useEffect, useState, useCallback } from 'react'; // 1. Import useCallback
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    unavailableItems: 0,
  });
  const [chartData, setChartData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Gunakan useCallback agar fungsi ini stabil dan tidak memicu infinite loop
  const fetchData = useCallback(async () => {
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/order'),
        api.get('/product'),
      ]);

      const orders = orderRes.data;
      const products = productRes.data;

      // --- LOGIKA PROSES DATA (Dipindahkan ke dalam sini agar rapi) ---
      const today = new Date().toLocaleDateString('id-ID');
      
      // A. Hitung Stats Kartu
      let todayRev = 0;
      let todayOrd = 0;
      let active = 0;

      orders.forEach(o => {
        const orderDate = new Date(o.created_at).toLocaleDateString('id-ID');
        
        // Data Hari Ini
        if (orderDate === today) {
          todayOrd++;
          if (o.payment_status === 'paid') {
            todayRev += parseFloat(o.total_amount);
          }
        }

        // Pesanan Aktif
        if (o.order_status === 'pending' || o.order_status === 'processing') {
          active++;
        }
      });

      // B. Cek Menu Habis
      const unavailable = products.filter(p => p.is_available === 0 || p.is_available === false).length;

      setStats({
        todayRevenue: todayRev,
        todayOrders: todayOrd,
        activeOrders: active,
        unavailableItems: unavailable
      });

      // C. Siapkan Data Grafik (7 Hari Terakhir)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('id-ID');
      }).reverse();

      const revenuePerDay = last7Days.map(date => {
        return orders
          .filter(o => new Date(o.created_at).toLocaleDateString('id-ID') === date && o.payment_status === 'paid')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      });

      setChartData({
        labels: last7Days.map(d => d.slice(0, 5)), 
        datasets: [
          {
            label: 'Omzet (Rp)',
            data: revenuePerDay,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      });

      // D. Ambil 5 Produk Teratas (Sekedar preview daftar menu)
      setTopProducts(products.slice(0, 5));

    } catch (err) {
      console.error("Gagal memuat dashboard", err);
    } finally {
      setLoading(false);
    }
  }, []); // Dependency array kosong karena tidak bergantung variable luar

  // 3. Masukkan fetchData ke dependency array
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">Dashboard Admin</h2>

      {/* --- KARTU RINGKASAN --- */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-success h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-uppercase mb-2" style={{fontSize: '0.8rem'}}>Omzet Hari Ini</h6>
              <h3 className="fw-bold">Rp {stats.todayRevenue.toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-dark bg-light h-100 shadow-sm border-start border-4 border-primary">
            <div className="card-body">
              <h6 className="card-title text-uppercase text-muted mb-2" style={{fontSize: '0.8rem'}}>Pesanan Hari Ini</h6>
              <h3 className="fw-bold text-primary">{stats.todayOrders}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-uppercase mb-2 text-dark" style={{fontSize: '0.8rem'}}>Antrean Dapur</h6>
              <h3 className="fw-bold text-dark">{stats.activeOrders}</h3>
              <small className="text-dark">Pending / Processing</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-danger h-100 shadow-sm">
            <div className="card-body">
              <h6 className="card-title text-uppercase mb-2" style={{fontSize: '0.8rem'}}>Menu Habis</h6>
              <h3 className="fw-bold">{stats.unavailableItems}</h3>
              <Link to="/admin/products" className="text-white text-decoration-underline small">Cek Stok</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* GRAFIK */}
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white fw-bold">Tren Penjualan (7 Hari Terakhir)</div>
            <div className="card-body">
              {chartData && <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />}
            </div>
          </div>
        </div>

        {/* SIDEBAR KANAN */}
        <div className="col-lg-4">
          
          {/* 4. Tampilkan 'topProducts' disini agar variabelnya terpakai */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>Menu Preview</span>
              <Link to="/admin/products" className="text-decoration-none small">Lihat Semua</Link>
            </div>
            <ul className="list-group list-group-flush">
              {topProducts.map((product) => (
                <li key={product.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {product.image_url ? (
                      <img src={`${process.env.REACT_APP_API_IMAGE_URL}/${product.image_url}`} alt="icon" 
                        style={{width: 30, height: 30, objectFit: 'cover', borderRadius: '4px'}} className="me-2"/>
                    ) : (
                      <div className="bg-secondary rounded me-2" style={{width: 30, height: 30}}></div>
                    )}
                    <span className="small fw-bold text-truncate" style={{maxWidth: '120px'}}>{product.name}</span>
                  </div>
                  <span className={`badge ${product.is_available ? 'bg-success' : 'bg-danger'}`}>
                    {product.is_available ? 'Ready' : 'Habis'}
                  </span>
                </li>
              ))}
              {topProducts.length === 0 && <li className="list-group-item text-muted small">Belum ada menu.</li>}
            </ul>
          </div>

          {/* AKSI CEPAT */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white fw-bold">Aksi Cepat</div>
            <div className="list-group list-group-flush">
              <Link to="/admin/product/new" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                Tambah Menu Baru <span className="text-muted">➔</span>
              </Link>
              <Link to="/admin/qr-codes" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                Cetak QR Code Meja <span className="text-muted">➔</span>
              </Link>
              <Link to="/admin/users" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                Buat Akun Dapur <span className="text-muted">➔</span>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;