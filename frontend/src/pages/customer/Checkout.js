import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { notifyError, showAlert } from '../../utils/notify';

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  
  // Form Customer
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash atau qris
  const [diningMethod, setDiningMethod] = useState('dine-in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load data dari LocalStorage
    const savedCart = localStorage.getItem('wow_cart');
    const savedTable = localStorage.getItem('wow_table');
    const savedLocation = localStorage.getItem('wow_location');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedTable) setTableNumber(savedTable);
    if (savedLocation) setDiningMethod(savedLocation);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleRemoveItem = (tempId) => {
    const newCart = cart.filter(item => item.tempId !== tempId);
    setCart(newCart);
    localStorage.setItem('wow_cart', JSON.stringify(newCart));
  };

  const handleSubmitOrder = async () => {
    if (!customerName) return showAlert('Mohon isi nama Anda');
    if (cart.length === 0) return showAlert('Keranjang kosong');

    setIsSubmitting(true);

    // Siapkan payload sesuai struktur backend createOrder
    // items: [{ product_id, quantity, price_at_order, notes, itemVariants: [{ variant_name, variant_price }] }]
    const orderItems = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_order: item.priceAtOrder, // Harga satuan base saat dipesan
      notes: item.notes,
      itemVariants: item.variants.map(v => ({
        variant_name: v.name,
        variant_price: v.extra_price
      }))
    }));

    const payload = {
      table_number: tableNumber,
      customer_name: customerName,
      location: diningMethod, // Menggunakan state diningMethod dinamis
      total_amount: cartTotal,
      payment_method: paymentMethod,
      payment_status: 'pending', // Default pending
      order_status: 'pending',
      items: orderItems
    };

    try {
      // API call (Tanpa header auth token karena ini public access)
      // Note: Di backend pastikan route POST /api/order TIDAK dilindungi middleware verifyToken, 
      // atau buat route khusus /api/public/order jika perlu.
      // Jika route /api/order diprotect, kita harus lepas protection di backend server.js dulu.
      const res = await api.post('/order', payload);

      const newOrderId = res.data.id;
      
      // Bersihkan cart
      localStorage.removeItem('wow_cart');

      if(paymentMethod === 'qris') {
        navigate('/customer/payment-qris', { 
            state: { 
                orderId: newOrderId, 
                totalAmount: payload.total_amount,
                qris_image: res.data.qris_image,
                customerName, 
                tableNumber 
            } 
        });
      } else{
        // Redirect ke halaman sukses/lacak
        navigate('/customer/status', { 
          state: { 
            orderId: newOrderId, // <--- PENTING: Kirim ID ini
            customerName, 
            tableNumber 
          } 
      });
      }
    } catch (err) {
      console.error(err);
      notifyError('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4" style={{maxWidth: '600px'}}>
      <h4 className="mb-4">Konfirmasi Pesanan</h4>

      {/* Ringkasan Item */}
      <div className="card border-0 shadow-sm mb-4" style={{borderRadius: '1rem', overflow: 'hidden'}}>
        <div className="card-header bg-white border-bottom pt-4 pb-3">
          <h6 className="mb-0 fw-bold fs-5">Ringkasan Pesanan (Meja {tableNumber})</h6>
        </div>
        <ul className="list-group list-group-flush">
          {cart.map((item) => (
            <li key={item.tempId} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{item.quantity}x {item.product.name}</h6>
                  {item.variants.length > 0 && (
                    <small className="text-muted d-block">
                      + {item.variants.map(v => v.name).join(', ')}
                    </small>
                  )}
                  {item.notes && <small className="text-danger d-block">"{item.notes}"</small>}
                </div>
                <div className="text-end">
                  <div className="fw-bold">Rp {item.totalPrice.toLocaleString('id-ID')}</div>
                  <button className="btn btn-link text-danger p-0 small text-decoration-none" 
                    onClick={() => handleRemoveItem(item.tempId)}>Hapus</button>
                </div>
              </div>
            </li>
          ))}
          {cart.length === 0 && <li className="list-group-item text-center">Keranjang Kosong</li>}
        </ul>
        <div className="card-footer d-flex justify-content-between fw-bold">
          <span>Total Bayar</span>
          <span className="text-primary fs-5">Rp {cartTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Form Data Diri */}
      <div className="card border-0 shadow-sm mb-4" style={{borderRadius: '1rem'}}>
        <div className="card-body p-4">
          <div className="mb-3">
            <label className="form-label fw-bold">Nama Pemesan</label>
            <input 
              type="text" className="form-control" 
              placeholder="Masukkan nama Anda" 
              value={customerName} onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Tipe Pesanan</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-fill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 ${diningMethod === 'dine-in' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
                style={{ borderRadius: '0.5rem' }}
                onClick={() => {
                  setDiningMethod('dine-in');
                  localStorage.setItem('wow_location', 'dine-in');
                }}
              >
                🍽️ Makan di Sini
              </button>
              <button
                type="button"
                className={`btn flex-fill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 ${diningMethod === 'takeaway' ? 'btn-secondary text-white shadow-sm' : 'btn-outline-secondary'}`}
                style={{ borderRadius: '0.5rem' }}
                onClick={() => {
                  setDiningMethod('takeaway');
                  localStorage.setItem('wow_location', 'takeaway');
                }}
              >
                🛍️ Bawa Pulang
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Metode Pembayaran</label>
            <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Tunai (Bayar di Kasir)</option>
              <option value="qris">QRIS (Scan di Meja/Kasir)</option>
            </select>
            {paymentMethod === 'qris' && (
              <div className="alert alert-info mt-2 small">
                Silakan tunjukkan bukti bayar QRIS ke kasir setelah pesanan dibuat.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="d-grid gap-3 mt-5">
        <button 
          className="btn btn-warning btn-lg fw-bold text-white shadow-sm py-3" 
          style={{borderRadius: '1rem'}}
          onClick={handleSubmitOrder}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? 'Memproses...' : 'Pesan Sekarang 🚀'}
        </button>
        <button className="btn btn-light fw-bold py-3" style={{borderRadius: '1rem', color: '#6c757d'}} onClick={() => navigate(-1)}>Kembali ke Menu</button>
      </div>
    </div>
  );
};

export default Checkout;