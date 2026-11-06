
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Package,
  ChartNoAxesCombined,
  QrCode,
  Smartphone,
  LayoutDashboard,
  Users,
  Sparkles,
  Check,
  Menu,
  X,
  Search
} from 'lucide-react';
import './Welcome.css';

const features = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Self Order',
    category: 'CUSTOMER EXPERIENCE',
    description:
      'Pelanggan dapat melihat menu, memilih produk, dan melakukan pemesanan secara mandiri melalui smartphone.'
  },
  {
    number: '02',
    icon: Package,
    title: 'Inventory Management',
    category: 'STOCK MANAGEMENT',
    description:
      'Kelola bahan baku, stok, serta produk siap jual dalam satu sistem yang saling terintegrasi.'
  },
  {
    number: '03',
    icon: ChartNoAxesCombined,
    title: 'Business Dashboard',
    category: 'BUSINESS ANALYTICS',
    description:
      'Pantau transaksi dan perkembangan omzet melalui dashboard informasi yang tersusun secara ringkas.'
  },
  {
    number: '04',
    icon: QrCode,
    title: 'QR Table Ordering',
    category: 'SMART ORDERING',
    description:
      'Pelanggan dapat mengakses menu dan melakukan pemesanan melalui QR Code meja.'
  }
];

const Welcome = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const goToLogin = () => {
    setMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="welcome-page" id="home">

      {/* BACKGROUND */}
      <div className="welcome-background" aria-hidden="true">
        <div className="welcome-glow welcome-glow-one" />
        <div className="welcome-glow welcome-glow-two" />
        <div className="welcome-grid-pattern" />
      </div>

      {/* NAVBAR */}
      <header className="welcome-navbar">
        <div className="welcome-container welcome-nav-inner">

          <a href="#home" className="welcome-brand" onClick={closeMenu}>
            <span className="welcome-brand-icon">
              <Coffee size={23} strokeWidth={1.7} />
            </span>

            <span className="welcome-brand-name">
              <strong>BILLION</strong>
              <small>CAFE SYSTEM</small>
            </span>
          </a>

          <nav className={`welcome-nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#home" onClick={closeMenu}>Beranda</a>
            <a href="#features" onClick={closeMenu}>Fitur</a>
            <a href="#about" onClick={closeMenu}>Tentang Project</a>
            <a href="#team" onClick={closeMenu}>Tim Pengembang</a>

            <button
              type="button"
              className="welcome-mobile-login"
              onClick={goToLogin}
            >
              Masuk ke Sistem <ArrowRight size={16} />
            </button>
          </nav>

          <button
            type="button"
            className="welcome-login-button"
            onClick={goToLogin}
          >
            Masuk ke Sistem
            <ArrowUpRight size={16} />
          </button>

          <button
            type="button"
            className="welcome-menu-button"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="welcome-hero">
          <div className="welcome-container welcome-hero-layout">

            <div className="welcome-hero-copy">

              <h1>
                A Better Way
                <br />
                To Experience
                <br />
                <span>Billion Cafe.</span>
              </h1>

              <p className="welcome-hero-description">
                Pengalaman cafe yang lebih praktis melalui pemesanan mandiri
                dan pengelolaan operasional yang terintegrasi dalam satu
                platform digital.
              </p>

              <div className="welcome-hero-buttons">
                <button
                  type="button"
                  className="welcome-primary-button"
                  onClick={goToLogin}
                >
                  Masuk ke Sistem
                  <ArrowUpRight size={17} />
                </button>

                <a href="#features" className="welcome-outline-button">
                  Jelajahi Fitur
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="welcome-hero-trust">
                <span className="welcome-trust-icon">
                  <Check size={17} />
                </span>

                <div>
                  <strong>Integrated Cafe Management</strong>
                  <small>Ordering · Inventory · Analytics</small>
                </div>
              </div>
            </div>

            {/* MOCKUP LAPTOP DAN HP */}
            <div className="welcome-hero-mockup">

              <div className="welcome-mockup-glow" />

              <div className="welcome-floating-card floating-dashboard">
                <span className="welcome-floating-icon">
                  <LayoutDashboard size={17} />
                </span>
                <div>
                  <strong>Smart Dashboard</strong>
                  <small>Manage your business</small>
                </div>
              </div>

              {/* LAPTOP */}
              <div className="welcome-laptop">
                <div className="welcome-laptop-screen">

                  <div className="welcome-mockup-topbar">
                    <div className="welcome-mockup-brand">
                      <Coffee size={14} />
                      Billion Cafe
                    </div>
                    <div className="welcome-window-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="welcome-mockup-main">

                    <aside className="welcome-mockup-sidebar">
                      <div className="welcome-sidebar-logo">B.</div>
                      <span className="sidebar-selected"><LayoutDashboard size={14} /></span>
                      <span><ShoppingBag size={14} /></span>
                      <span><Package size={14} /></span>
                      <span><Users size={14} /></span>
                    </aside>

                    <div className="welcome-mockup-dashboard">

                      <div className="welcome-dashboard-heading">
                        <div>
                          <strong>Dashboard Overview</strong>
                          <small>Welcome back, Admin</small>
                        </div>
                        <span className="welcome-admin-avatar">A</span>
                      </div>

                      <div className="welcome-mockup-stats">
                        <div className="welcome-mockup-stat">
                          <span>Total Revenue</span>
                          <strong>Rp 25.000</strong>
                          <small>Today's revenue</small>
                        </div>

                        <div className="welcome-mockup-stat">
                          <span>Total Orders</span>
                          <strong>12</strong>
                          <small>Orders today</small>
                        </div>

                        <div className="welcome-mockup-stat">
                          <span>Menu Items</span>
                          <strong>24</strong>
                          <small>Available menu</small>
                        </div>
                      </div>

                      <div className="welcome-mockup-chart-card">
                        <div className="welcome-mockup-chart-heading">
                          <strong>Sales Overview</strong>
                          <span>This Week</span>
                        </div>

                        <svg
                          className="welcome-mockup-chart"
                          viewBox="0 0 500 130"
                          preserveAspectRatio="none"
                          role="img"
                          aria-label="Ilustrasi grafik penjualan"
                        >
                          <defs>
                            <linearGradient id="billionChartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d8a744" stopOpacity=".35" />
                              <stop offset="100%" stopColor="#d8a744" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          <path
                            d="M0 110 L75 90 L145 98 L220 52 L290 69 L365 28 L430 43 L500 9 L500 130 L0 130 Z"
                            fill="url(#billionChartGradient)"
                          />

                          <path
                            d="M0 110 L75 90 L145 98 L220 52 L290 69 L365 28 L430 43 L500 9"
                            fill="none"
                            stroke="#d8a744"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          <circle cx="75" cy="90" r="4" fill="#f2d58a" />
                          <circle cx="220" cy="52" r="4" fill="#f2d58a" />
                          <circle cx="365" cy="28" r="4" fill="#f2d58a" />
                          <circle cx="500" cy="9" r="4" fill="#f2d58a" />
                        </svg>

                        <div className="welcome-chart-labels">
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </div>
                      </div>

                      <div className="welcome-mockup-orders">
                        <div className="welcome-mockup-orders-heading">
                          <strong>Recent Orders</strong>
                          <span>View all</span>
                        </div>

                        <div className="welcome-mockup-order">
                          <span className="welcome-product-dot" />
                          <span>Americano</span>
                          <small>Completed</small>
                          <strong>Rp 25.000</strong>
                        </div>

                        <div className="welcome-mockup-order">
                          <span className="welcome-product-dot product-dot-two" />
                          <span>Signature Coffee</span>
                          <small>Processing</small>
                          <strong>Rp 32.000</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="welcome-laptop-base" />
              </div>

              {/* SMARTPHONE */}
              <div className="welcome-phone">
                <div className="welcome-phone-notch" />

                <div className="welcome-phone-screen">
                  <div className="welcome-phone-brand">
                    <Coffee size={14} />
                    <strong>Billion Cafe</strong>
                  </div>

                  <div className="welcome-phone-greeting">
                    <small>GOOD DAY!</small>
                    <strong>Find your coffee.</strong>
                  </div>

                  <div className="welcome-phone-search">
                    <Search size={11} />
                    <span>Search your favorite menu</span>
                  </div>

                  <div className="welcome-phone-categories">
                    <span className="phone-category-active">Semua</span>
                    <span>Makanan</span>
                    <span>Minuman</span>
                  </div>

                  <div className="welcome-phone-product">
                    <div className="welcome-phone-product-image">
                      <Coffee size={23} />
                    </div>
                    <div>
                      <strong>Americano</strong>
                      <small>Rp 25.000</small>
                    </div>
                    <span>+</span>
                  </div>

                  <div className="welcome-phone-product">
                    <div className="welcome-phone-product-image second-product">
                      <Coffee size={23} />
                    </div>
                    <div>
                      <strong>Signature Coffee</strong>
                      <small>Rp 32.000</small>
                    </div>
                    <span>+</span>
                  </div>

                  <div className="welcome-phone-cart">
                    <span>1 Item</span>
                    <strong>Rp 25.000</strong>
                  </div>
                </div>

                <div className="welcome-phone-home" />
              </div>

              <div className="welcome-floating-card floating-order">
                <span className="welcome-floating-icon">
                  <QrCode size={17} />
                </span>
                <div>
                  <strong>Scan & Order</strong>
                  <small>Easy customer experience</small>
                </div>
              </div>

            </div>
          </div>

          <div className="welcome-container welcome-hero-caption">
            <span>DESIGNED FOR BETTER SERVICE</span>
            <i />
            <span>POWERED BY SARIMI CAPSTONR</span>
          </div>
        </section>

        {/* ABOUT PROJECT */}
        <section className="welcome-about" id="about">
          <div className="welcome-container welcome-about-grid">

            <div>
              <div className="welcome-section-label">ABOUT THE PROJECT</div>

              <h2>
                More than just
                <br />
                <span>a cafe website.</span>
              </h2>
            </div>

            <div className="welcome-about-description">
              <p>
                Billion Cafe merupakan sistem informasi manajemen cafe
                yang dikembangkan untuk mendukung proses operasional
                cafe melalui teknologi berbasis web.
              </p>

              <p>
                Sistem ini mengintegrasikan pemesanan mandiri pelanggan
                dengan pengelolaan menu, inventaris, transaksi, serta
                pemantauan aktivitas bisnis dalam satu platform.
              </p>

              <a href="#features" className="welcome-text-link">
                Kenali fitur kami <ArrowRight size={16} />
              </a>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="welcome-features" id="features">
          <div className="welcome-container">

            <div className="welcome-section-heading">
              <div className="welcome-section-label">WHAT WE OFFER</div>

              <h2>
                Everything you need.
                <br />
                <span>One integrated system.</span>
              </h2>

              <p>
                Dirancang untuk membantu proses pemesanan dan
                pengelolaan cafe menjadi lebih praktis.
              </p>
            </div>

            <div className="welcome-feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article className="welcome-feature-card" key={feature.number}>
                    <div className="welcome-feature-top">
                      <span>{feature.number}</span>
                      <div className="welcome-feature-icon">
                        <Icon size={23} strokeWidth={1.6} />
                      </div>
                    </div>

                    <small>{feature.category}</small>

                    <h3>{feature.title}</h3>

                    <p>{feature.description}</p>

                    <ArrowUpRight className="welcome-feature-arrow" size={18} />
                  </article>
                );
              })}
            </div>

          </div>
        </section>

        {/* ORDERING PROCESS */}
        <section className="welcome-process">
          <div className="welcome-container">

            <div className="welcome-section-heading">
              <div className="welcome-section-label">HOW IT WORKS</div>

              <h2>
                Simple process.
                <br />
                <span>Better experience.</span>
              </h2>

              <p>
                Alur pemesanan digital yang mudah digunakan oleh pelanggan.
              </p>
            </div>

            <div className="welcome-process-grid">
              <article className="welcome-process-item">
                <div className="welcome-process-icon">
                  <QrCode size={27} />
                </div>
                <small>STEP 01</small>
                <h3>Scan QR Code</h3>
                <p>Pelanggan memindai QR Code yang tersedia di meja cafe.</p>
              </article>

              <div className="welcome-process-connector">
                <ArrowRight size={20} />
              </div>

              <article className="welcome-process-item">
                <div className="welcome-process-icon">
                  <Smartphone size={27} />
                </div>
                <small>STEP 02</small>
                <h3>Choose & Order</h3>
                <p>Pelanggan memilih menu dan menambahkan pesanan melalui smartphone.</p>
              </article>

              <div className="welcome-process-connector">
                <ArrowRight size={20} />
              </div>

              <article className="welcome-process-item">
                <div className="welcome-process-icon">
                  <Check size={27} />
                </div>
                <small>STEP 03</small>
                <h3>Enjoy Your Order</h3>
                <p>Pesanan diproses dan disajikan sesuai metode pelayanan.</p>
              </article>
            </div>
          </div>
        </section>

        {/* UNIVERSITY */}
        <section className="welcome-university">
          <div className="welcome-container">
            <div className="welcome-university-card">

              <div className="welcome-university-logos">
                <div className="welcome-university-logo">
                  <img
                    src="/images/logo-umy.png"
                    alt="Logo Universitas Muhammadiyah Yogyakarta"
                  />
                </div>

                <span className="welcome-university-divider" />

                <div className="welcome-university-logo">
                  <img
                    src="/images/logo-ti-umy.png"
                    alt="Logo Teknologi Informasi UMY"
                  />
                </div>
              </div>

              <div className="welcome-university-copy">
                <small>ACADEMIC PROJECT</small>

                <h2>
                  Developed with knowledge.
                  <br />
                  <span>Driven by innovation.</span>
                </h2>

                <p>
                  Bagian dari Capstone Project Program Studi
                  Teknologi Informasi, Universitas Muhammadiyah Yogyakarta.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* DEVELOPMENT TEAM */}
        <section className="welcome-team" id="team">
          <div className="welcome-container welcome-team-grid">

            <div className="welcome-team-copy">
              <div className="welcome-section-label">MEET OUR TEAM</div>

              <h2>
                Built together.
                <br />
                <span>Made with purpose.</span>
              </h2>

              <p>
                Di balik Billion Cafe terdapat tim pengembang yang
                bekerja melalui kolaborasi, kreativitas, dan penerapan
                teknologi untuk menghadirkan solusi digital yang bermanfaat.
              </p>

              <div className="welcome-team-caption">
                <Users size={18} />
                Tim Pengembang Billion Cafe
              </div>
            </div>

            <div className="welcome-team-photo-wrap">
              <div className="welcome-team-photo">
                <img
                  src="/images/team-kami.jpg"
                  alt="Foto bersama Tim Pengembang Billion Cafe"
                />
              </div>

              <div className="welcome-team-photo-label">
                <small>CAPSTONE PROJECT 2026</small>
                <strong>Technology · Collaboration · Innovation</strong>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="welcome-cta">
          <div className="welcome-container">
            <div className="welcome-cta-card">

              <div className="welcome-section-label">READY TO EXPLORE?</div>

              <h2>
                Welcome to
                <br />
                <span>Billion Cafe.</span>
              </h2>

              <p>
                Masuk dan jelajahi sistem manajemen cafe yang terintegrasi.
              </p>

              <button
                type="button"
                className="welcome-primary-button"
                onClick={goToLogin}
              >
                Masuk ke Sistem
                <ArrowUpRight size={17} />
              </button>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="welcome-footer">
        <div className="welcome-container">

          <div className="welcome-footer-main">
            <a href="#home" className="welcome-brand">
              <span className="welcome-brand-icon">
                <Coffee size={23} />
              </span>

              <span className="welcome-brand-name">
                <strong>BILLION</strong>
                <small>CAFE SYSTEM</small>
              </span>
            </a>

            <p>
              A digital platform for smarter cafe management
              and better customer experiences.
            </p>
          </div>

          <div className="welcome-footer-bottom">
            <span>© 2026 Billion Cafe. All rights reserved.</span>
            <span>Capstone Project · Teknologi Informasi UMY</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Welcome;
