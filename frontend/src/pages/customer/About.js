
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(`/customer/menu${location.search || ''}`);
  };

  return (
    <div style={{
      backgroundColor: '#101116',
      minHeight: '100vh',
      color: '#f1f5f9',
      paddingBottom: '40px'
    }}>

      {/* Header */}
      <header
        className="sticky-top d-flex align-items-center gap-3 p-3"
        style={{
          backgroundColor: '#161720',
          borderBottom: '1px solid #23253a',
          zIndex: 1020,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali ke menu"
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#222433',
            border: '1px solid #2c2f40',
            borderRadius: '11px',
            color: '#cbd5e1',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        <h5 className="mb-0 fw-bold" style={{
          color: '#f1f5f9',
          fontSize: '1.1rem'
        }}>
          Tentang Kami
        </h5>
      </header>

      <main className="container py-4" style={{ maxWidth: '850px' }}>

        {/* Identitas Universitas */}
        <section
          className="text-center p-4 p-md-5 mb-4"
          style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '20px'
          }}
        >
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-4 mb-4">

            <img
              src="/images/logo-umy.png"
              alt="Logo Universitas Muhammadiyah Yogyakarta"
              style={{
                width: '105px',
                height: '105px',
                objectFit: 'contain'
              }}
            />

            <div style={{
              width: '1px',
              height: '75px',
              backgroundColor: '#383b4d'
            }} />

            <img
              src="/images/logo-ti-umy.png"
              alt="Logo Teknologi Informasi UMY"
              style={{
                width: '115px',
                height: '115px',
                objectFit: 'contain'
              }}
            />

          </div>

          <span style={{
            display: 'inline-block',
            backgroundColor: 'rgba(216,167,68,0.12)',
            color: '#d8a744',
            border: '1px solid rgba(216,167,68,0.3)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '1px',
            marginBottom: '15px'
          }}>
            CAPSTONE PROJECT
          </span>

          <h2 className="fw-bold mb-3" style={{
            color: '#f1f5f9',
            fontSize: '1.7rem'
          }}>
            Billion Cafe
          </h2>

          <p className="mb-0 mx-auto" style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            lineHeight: '1.8',
            maxWidth: '600px'
          }}>
            Kami merupakan tim pengembang yang merancang dan mengembangkan
            sistem informasi Billion Cafe sebagai bagian dari Capstone Project.
            Melalui pengembangan sistem ini, kami berupaya menghadirkan solusi
            digital yang mendukung proses pemesanan mandiri serta pengelolaan
            inventaris cafe berbasis web.
          </p>
        </section>

        {/* Foto Bersama Tim */}
        <section className="mb-4">

          <div className="text-center mb-4">
            <span style={{
              color: '#d8a744',
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '1.5px'
            }}>
              OUR TEAM
            </span>

            <h4 className="fw-bold mt-2 mb-2" style={{
              color: '#f1f5f9'
            }}>
              Tim Pengembang
            </h4>

            <p style={{
              color: '#94a3b8',
              fontSize: '0.85rem'
            }}>
              Bersama membangun inovasi melalui kolaborasi dan teknologi.
            </p>
          </div>

          <div style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '18px',
            padding: '12px',
            overflow: 'hidden'
          }}>
            <img
              src="/images/team-kami.jpg"
              alt="Foto bersama Tim Pengembang Billion Cafe"
              style={{
                display: 'block',
                width: '100%',
                maxHeight: '430px',
                minHeight: '220px',
                objectFit: 'cover',
                objectPosition: 'center',
                borderRadius: '12px'
              }}
            />
          </div>

        </section>

        {/* Hubungi Tim Kami */}
        <section
          className="p-4 mb-4 text-center"
          style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '18px'
          }}
        >
          <h5 className="fw-bold mb-3" style={{
            color: '#f1f5f9',
            fontSize: '1.1rem'
          }}>
            Hubungi Tim Kami
          </h5>

          <div style={{
            width: '65px',
            height: '2px',
            backgroundColor: '#d8a744',
            borderRadius: '2px',
            margin: '0 auto 16px'
          }} />

          <a
            href="mailto:sarimicapstone@gmail.com"
            style={{
              display: 'inline-block',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            sarimicapstone@gmail.com
          </a>
        </section>

        {/* Ucapan Terima Kasih */}
        <section
          className="p-4 p-md-5 text-center"
          style={{
            backgroundColor: '#161720',
            border: '1px solid #38312a',
            borderRadius: '20px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }}
        >

          {/* Ilustrasi Tangan dan Hati */}
          <div style={{
            width: '66px',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            backgroundColor: 'rgba(216,167,68,0.12)',
            border: '1px solid rgba(216,167,68,0.3)',
            borderRadius: '50%'
          }}>
            <svg
              width="34"
              height="34"
              viewBox="0 0 40 40"
              fill="none"
              stroke="#d8a744"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 11.5c-2.2-5-9.8-3.9-9.8 2 0 4 4.4 7 9.8 11.1 5.4-4.1 9.8-7.1 9.8-11.1 0-5.9-7.6-7-9.8-2Z" />
              <path d="m5 22 7-3.5c1.2-.6 2.6-.1 3.2 1.1l1.1 2.1" />
              <path d="m35 22-7-3.5c-1.2-.6-2.6-.1-3.2 1.1l-1.1 2.1" />
              <path d="m5 22 8 8c1.2 1.2 2.7 1.8 4.4 1.8h5.2c1.7 0 3.2-.6 4.4-1.8l8-8" />
              <path d="m11 28 3 2.5" />
              <path d="m29 28-3 2.5" />
            </svg>
          </div>

          <h4 className="fw-bold mb-3" style={{
            color: '#d8a744',
            fontSize: '1.25rem'
          }}>
            Ucapan Terima Kasih
          </h4>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.88rem',
            lineHeight: '1.9',
            marginBottom: '14px'
          }}>
            Segala puji dan syukur kami panjatkan ke hadirat Allah SWT atas
            rahmat, karunia, kesehatan, dan kemudahan yang telah diberikan
            sehingga kami dapat menyelesaikan proses pengembangan sistem
            Billion Cafe ini.
          </p>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.88rem',
            lineHeight: '1.9',
            marginBottom: '14px'
          }}>
            Kami mengucapkan terima kasih kepada orang tua dan keluarga
            atas doa, kasih sayang, serta dukungan yang tidak pernah
            berhenti diberikan selama proses pengerjaan proyek ini.
          </p>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.88rem',
            lineHeight: '1.9',
            marginBottom: '14px'
          }}>
            Terima kasih juga kepada teman-teman dan seluruh pihak yang
            telah memberikan bantuan, semangat, masukan, serta dukungan,
            baik secara langsung maupun tidak langsung, sehingga proyek
            ini dapat terselesaikan.
          </p>

          <p className="mb-0" style={{
            color: '#cbd5e1',
            fontSize: '0.88rem',
            lineHeight: '1.9'
          }}>
            Setiap proses dan tantangan yang kami lalui menjadi pengalaman
            serta pembelajaran berharga bagi kami. Semoga sistem yang
            dikembangkan dapat memberikan manfaat dan menjadi langkah
            kecil dalam mendukung digitalisasi layanan Billion Cafe.
          </p>

          <div style={{
            width: '55px',
            height: '2px',
            backgroundColor: '#d8a744',
            margin: '25px auto 15px'
          }} />

          <h6 className="fw-bold mb-1" style={{
            color: '#f1f5f9',
            fontSize: '0.95rem'
          }}>
            With Gratitude,
          </h6>

          <span style={{
            color: '#d8a744',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            Tim Pengembang Billion Cafe
          </span>

        </section>

        {/* Footer */}
        <footer className="text-center mt-4">
          <p className="mb-1" style={{
            color: '#64748b',
            fontSize: '0.72rem'
          }}>
            Billion Cafe · Capstone Project
          </p>

          <p className="mb-0" style={{
            color: '#475569',
            fontSize: '0.68rem'
          }}>
            Teknologi Informasi · Universitas Muhammadiyah Yogyakarta
          </p>
        </footer>

      </main>
    </div>
  );
};

export default About;
