import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { notifyError, showAlert } from '../../utils/notify';

// Shopee-style quantity selector with direct numeric input support
const CartItemQuantity = ({ quantity, onChange, onRemove }) => {
  const [localQty, setLocalQty] = useState(quantity.toString());

  useEffect(() => {
    setLocalQty(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setLocalQty(val);
    
    if (val !== '') {
      const parsed = parseInt(val, 10);
      if (parsed > 0) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    if (localQty === '' || parseInt(localQty, 10) <= 0) {
      setLocalQty(quantity.toString());
      onChange(quantity);
    } else {
      const parsed = parseInt(localQty, 10);
      setLocalQty(parsed.toString());
      onChange(parsed);
    }
  };

  const handleMinus = () => {
    if (quantity <= 1) {
      onRemove();
    } else {
      onChange(quantity - 1);
    }
  };

  const handlePlus = () => {
    onChange(quantity + 1);
  };

  return (
    <div
      className="d-flex align-items-center"
      style={{
        border: '1px solid rgba(216, 167, 68, 0.35)',
        borderRadius: '999px',
        overflow: 'hidden',
        height: '34px',
        backgroundColor: '#12131a'
      }}
    >
      <button
        type="button"
        onClick={handleMinus}
        className="btn d-flex align-items-center justify-content-center p-0"
        style={{
          width: '32px',
          height: '100%',
          border: 'none',
          borderRadius: '0',
          backgroundColor: '#171821',
          color: '#e5bd65',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={localQty}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="text-center p-0 fw-bold"
        style={{
          width: '42px',
          height: '100%',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: '1px solid rgba(216, 167, 68, 0.25)',
          borderRight: '1px solid rgba(216, 167, 68, 0.25)',
          borderRadius: '0',
          fontSize: '0.9rem',
          outline: 'none',
          color: '#ffffff',
          backgroundColor: '#12131a',
          boxShadow: 'none'
        }}
      />
      <button
        type="button"
        onClick={handlePlus}
        className="btn d-flex align-items-center justify-content-center p-0"
        style={{
          width: '32px',
          height: '100%',
          border: 'none',
          borderRadius: '0',
          backgroundColor: '#171821',
          color: '#e5bd65',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        +
      </button>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  
  // Form Customer
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // default QRIS
  const [diningMethod, setDiningMethod] = useState('dine-in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

  const getProductUnitPrice = (product, qty) => {
    if (product.price_type === 'grosir' && qty >= product.grosir_min_qty) {
      return parseFloat(product.grosir_price_per_unit);
    }
    return parseFloat(product.base_price);
  };

  const handleUpdateQuantity = (tempId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(tempId);
      return;
    }

    const newCart = cart.map((item) => {
      if (item.tempId === tempId) {
        const activeUnitPrice = getProductUnitPrice(item.product, newQty);
        const variantsPrice = (item.variants || []).reduce(
          (total, v) => total + parseFloat(v.extra_price),
          0
        );
        const totalPrice = (activeUnitPrice + variantsPrice) * newQty;

        return {
          ...item,
          quantity: newQty,
          unitPrice: activeUnitPrice,
          totalPrice
        };
      }
      return item;
    });

    setCart(newCart);
    localStorage.setItem('wow_cart', JSON.stringify(newCart));
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      showAlert('Mohon isi nama Anda terlebih dahulu');
      return;
    }

    if (cart.length === 0) {
      showAlert('Keranjang belanja Anda kosong');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_order: item.unitPrice !== undefined ? item.unitPrice : item.product.base_price,
        notes: item.notes || null,
        itemVariants: (item.variants || []).map(v => ({
          variant_name: v.name,
          variant_price: v.extra_price
        }))
      }));

      const payload = {
        table_number: tableNumber || 0,
        customer_name: customerName,
        location: diningMethod,
        total_amount: cartTotal,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        items: itemsPayload
      };

      const res = await api.post('/order', payload);
      const newOrderId = res.data.id;

      localStorage.removeItem('wow_cart');
      localStorage.removeItem('wow_location');
      sessionStorage.removeItem('wow_location');
      sessionStorage.removeItem('wow_table');

      try {
        const existingHistory = localStorage.getItem('wow_order_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        if (!history.some(h => h.orderId === newOrderId)) {
          history.push({
            orderId: newOrderId,
            customerName: customerName,
            tableNumber: tableNumber,
            totalAmount: payload.total_amount,
            date: new Date().toISOString()
          });
          localStorage.setItem('wow_order_history', JSON.stringify(history));
        }
      } catch (err) {
        console.error('Gagal menyimpan riwayat pesanan:', err);
      }

      if (paymentMethod === 'qris') {
        navigate('/customer/payment-qris', { 
            state: { 
                orderId: newOrderId, 
                totalAmount: payload.total_amount,
                qris_image: res.data.qris_image,
                payment_link_url: res.data.payment_link_url,
                customerName, 
                tableNumber 
            } 
        });
      } else {
        showAlert('Pesanan Berhasil Dibuat! Silakan lakukan pembayaran tunai di kasir.');
        navigate('/customer/status', { 
          state: { 
            orderId: newOrderId,
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

  const inputStyle = {
    backgroundColor: '#12131a',
    border: '1px solid rgba(216, 167, 68, 0.35)',
    color: '#f8fafc',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '0.92rem'
  };

  return (
    <div className="billion-checkout-page">
      {/* Ornamen Garis Emas Atas */}
      <div className="status-top-divider">
        <span />
        <span className="status-divider-dot" />
        <span />
      </div>

      <div className="checkout-main-wrapper">
        {/* Header Judul */}
        <div className="text-center mb-4">
          <h1 className="status-table-title" style={{ fontSize: '28px' }}>
            Konfirmasi Pesanan
          </h1>
          <p className="status-customer-subtitle">
            Ringkasan menu dan metode pelayanan pesanan Anda
          </p>
        </div>

        {/* Ringkasan Item Card */}
        <div className="status-luxury-card mb-4" style={{ textAlign: 'left', padding: '0', overflow: 'hidden' }}>
          <div
            className="p-3 px-4 d-flex justify-content-between align-items-center"
            style={{
              borderBottom: '1px solid rgba(216, 167, 68, 0.25)',
              background: 'rgba(216, 167, 68, 0.05)'
            }}
          >
            <h2 className="mb-0 fw-bold" style={{ color: '#e5bd65', fontSize: '1.05rem', fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Ringkasan Pesanan (Meja {tableNumber})
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {cart.length} item
            </span>
          </div>

          <ul className="list-group list-group-flush" style={{ backgroundColor: 'transparent' }}>
            {cart.map((item) => (
              <li
                key={item.tempId}
                className="list-group-item py-3 px-4"
                style={{
                  backgroundColor: 'transparent',
                  borderBottom: '1px solid rgba(216, 167, 68, 0.15)',
                  color: '#f1f5f9'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div style={{ maxWidth: '56%' }}>
                    <h3 className="mb-1 fw-bold text-truncate" style={{ color: '#ffffff', fontSize: '0.98rem', fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {item.product.name}
                    </h3>
                    {item.variants.length > 0 && (
                      <small style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                        + {item.variants.map(v => v.name).join(', ')}
                      </small>
                    )}
                    {item.notes && (
                      <small style={{ color: '#e5bd65', display: 'block', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        "{item.notes}"
                      </small>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="fw-bold mb-2" style={{ color: '#e5bd65', fontSize: '0.98rem' }}>
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </div>
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <CartItemQuantity
                        quantity={item.quantity}
                        onChange={(newQty) => handleUpdateQuantity(item.tempId, newQty)}
                        onRemove={() => handleRemoveItem(item.tempId)}
                      />
                      <button
                        type="button"
                        className="btn-item-delete"
                        onClick={() => handleRemoveItem(item.tempId)}
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {cart.length === 0 && (
              <li className="list-group-item text-center py-4" style={{ backgroundColor: 'transparent', color: '#94a3b8' }}>
                Keranjang Kosong
              </li>
            )}
          </ul>

          <div
            className="d-flex justify-content-between align-items-center py-3 px-4"
            style={{
              backgroundColor: 'rgba(216, 167, 68, 0.08)',
              borderTop: '1px solid rgba(216, 167, 68, 0.25)'
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.95rem' }}>Total Bayar</span>
            <span style={{ color: '#e5bd65', fontWeight: '800', fontSize: '1.35rem', fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Rp {cartTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Form Data Diri Card */}
        <div className="status-luxury-card mb-4" style={{ textAlign: 'left', padding: '24px' }}>
          <div className="mb-3">
            <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
              Nama Pemesan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Masukkan nama Anda"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div className="mb-3">
            <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
              Tipe Pelayanan
            </label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn flex-fill py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  borderRadius: '999px',
                  backgroundColor: diningMethod === 'dine-in' ? 'rgba(216, 167, 68, 0.18)' : '#12131a',
                  border: diningMethod === 'dine-in' ? '1.5px solid #d8a744' : '1px solid rgba(216, 167, 68, 0.25)',
                  color: diningMethod === 'dine-in' ? '#e5bd65' : '#94a3b8',
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setDiningMethod('dine-in');
                  localStorage.setItem('wow_location', 'dine-in');
                }}
              >
                Makan di Sini
              </button>
              <button
                type="button"
                className="btn flex-fill py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  borderRadius: '999px',
                  backgroundColor: diningMethod === 'takeaway' ? 'rgba(216, 167, 68, 0.18)' : '#12131a',
                  border: diningMethod === 'takeaway' ? '1.5px solid #d8a744' : '1px solid rgba(216, 167, 68, 0.25)',
                  color: diningMethod === 'takeaway' ? '#e5bd65' : '#94a3b8',
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setDiningMethod('takeaway');
                  localStorage.setItem('wow_location', 'takeaway');
                }}
              >
                Bawa Pulang
              </button>
            </div>
          </div>

          <div className="mb-1">
            <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
              Metode Pembayaran
            </label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={inputStyle}
            >
              <option value="qris" style={{ backgroundColor: '#12131a', color: '#f8fafc' }}>QRIS (Otomatis & Cepat)</option>
              <option value="cash" style={{ backgroundColor: '#12131a', color: '#f8fafc' }}>Tunai (Bayar di Kasir)</option>
            </select>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="status-actions-group">
          <button
            type="button"
            className="btn-billion-gold"
            style={{
              cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || cart.length === 0 ? 0.6 : 1
            }}
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting
              ? 'Memproses...'
              : (paymentMethod === 'qris' ? 'Lanjut ke Pembayaran QRIS' : 'Selesaikan Transaksi (Bayar Tunai)')}
          </button>
          <button
            type="button"
            className="btn-billion-outline"
            onClick={() => navigate(-1)}
          >
            Kembali ke Menu
          </button>
        </div>
      </div>

      <style>{`
        .billion-checkout-page {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.14), transparent 55%), #0c0d12;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 18px 40px;
        }

        .checkout-main-wrapper {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        .status-top-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 340px;
          margin: 4px auto 24px;
        }

        .status-top-divider > span:not(.status-divider-dot) {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201, 151, 59, 0.75));
        }

        .status-top-divider > span:last-child {
          background: linear-gradient(90deg, rgba(201, 151, 59, 0.75), transparent);
        }

        .status-divider-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e5bd65;
          box-shadow: 0 0 10px rgba(229, 189, 101, 0.65);
        }

        .status-table-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: 0.3px;
        }

        .status-customer-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }

        .status-luxury-card {
          background: radial-gradient(ellipse at top, rgba(216, 167, 68, 0.08), transparent 55%), #171821;
          border: 1px solid rgba(216, 167, 68, 0.45);
          border-radius: 22px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 25px rgba(216, 167, 68, 0.06);
        }

        .btn-item-delete {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #171821;
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-item-delete:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
        }

        .status-actions-group {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .btn-billion-outline {
          width: 100%;
          padding: 14px 20px;
          border-radius: 999px;
          background: #171821;
          border: 1px solid rgba(216, 167, 68, 0.55);
          color: #f8fafc;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-billion-outline:hover {
          border-color: #e5bd65;
          background: rgba(216, 167, 68, 0.1);
          color: #ffffff;
        }

        .btn-billion-gold {
          width: 100%;
          padding: 14px 20px;
          border-radius: 999px;
          background: linear-gradient(90deg, #b88728 0%, #e5c165 50%, #c49335 100%);
          border: none;
          color: #141414;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(216, 167, 68, 0.25);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-billion-gold:hover {
          filter: brightness(1.06);
          color: #141414;
        }
      `}</style>
    </div>
  );
};

export default Checkout;
