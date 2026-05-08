import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="text-center p-5">
        {/* Ikon Besar dengan Animasi Goyang Sedikit */}
        <div className="mb-4 display-1">
          <DotLottieReact src="https://lottie.host/f2cda83e-1bc4-4738-8d64-e556a377d01d/1OE1Drwhg2.lottie" autoplay loop /> {/* Atau ganti bi-egg-fried kalau ada */}
        </div>
        
        <h1 className="fw-bold text-dark display-4">404: Mienya Habis!</h1>
        
        <p className="lead text-muted mb-4 mt-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
          Waduh, halaman yang kamu cari sepertinya belum dimasak, 
          sudah dimakan orang lain, atau salah resep.
        </p>

        {/* Dekorasi Footer Lucu */}
        <div className="mt-5 text-muted small">
          <small>Powered by Telur & Kornet</small>
        </div>
      </div>

      {/* Tambahan CSS in JS untuk animasi sederhana */}
      <style>
        {`
          .animate-bounce {
            animation: bounce 2s infinite;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-20px);}
            60% {transform: translateY(-10px);}
          }
        `}
      </style>
    </div>
  );
};

export default NotFound;