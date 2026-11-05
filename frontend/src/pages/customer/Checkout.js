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
        border: '1px solid #282a36',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '34px',
        backgroundColor: '#1c1d27'
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
          backgroundColor: '#222433',
          color: '#cbd5e1',
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
          width: '45px',
          height: '100%',
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: '1px solid #282a36',
          borderRight: '1px solid #282a36',
          borderRadius: '0',
          fontSize: '0.9rem',
          outline: 'none',
          color: '#f1f5f9',
          backgroundColor: '#1c1d27',
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
          backgroundColor: '#222433',
          color: '#cbd5e1',
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
    backgroundColor: '#1c1d27',
    border: '1px solid #282a36',
    color: '#f1f5f9',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '0.92rem'
  };

  return (
    <div style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9', padding: '24px 16px' }}>
      <div className="container p-0" style={{ maxWidth: '560px' }}>
        <h4 className="mb-4 fw-bold" style={{ color: '#f1f5f9', fontSize: '1.3rem' }}>
          Konfirmasi Pesanan
        </h4>

        {/* Ringkasan Item */}
        <div 
          className="card border-0 mb-4"
          style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="card-header pt-4 pb-3"
            style={{
              backgroundColor: '#161720',
              borderBottom: '1px solid #23253a'
            }}
          >
            <h6 className="mb-0 fw-bold" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>
              Ringkasan Pesanan (Meja {tableNumber})
            </h6>
          </div>
          <ul className="list-group list-group-flush" style={{ backgroundColor: 'transparent' }}>
            {cart.map((item) => (
              <li 
                key={item.tempId} 
                className="list-group-item py-3 px-3"
                style={{
                  backgroundColor: '#161720',
                  borderBottom: '1px solid #23253a',
                  color: '#f1f5f9'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div style={{ maxWidth: '55%' }}>
                    <h6 className="mb-1 fw-bold text-truncate" style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>
                      {item.product.name}
                    </h6>
                    {item.variants.length > 0 && (
                      <small style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
                        + {item.variants.map(v => v.name).join(', ')}
                      </small>
                    )}
                    {item.notes && (
                      <small style={{ color: '#d8a744', display: 'block', fontSize: '0.75rem' }}>
                        "{item.notes}"
                      </small>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="fw-bold mb-2" style={{ color: '#d8a744', fontSize: '0.95rem' }}>
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </div>
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <CartItemQuantity
                        quantity={item.quantity}
                        onChange={(newQty) => handleUpdateQuantity(item.tempId, newQty)}
                        onRemove={() => handleRemoveItem(item.tempId)}
                      />
                      <button 
                        className="btn p-0 d-flex align-items-center justify-content-center" 
                        style={{
                          height: '34px',
                          width: '34px',
                          borderRadius: '8px',
                          backgroundColor: '#222433',
                          border: '1px solid #2c2f40',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
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
              <li className="list-group-item text-center py-4" style={{ backgroundColor: '#161720', color: '#94a3b8' }}>
                Keranjang Kosong
              </li>
            )}
          </ul>
          <div 
            className="card-footer d-flex justify-content-between align-items-center py-3 px-3"
            style={{
              backgroundColor: '#1c1d27',
              borderTop: '1px solid #23253a'
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Total Bayar</span>
            <span style={{ color: '#d8a744', fontWeight: '800', fontSize: '1.2rem' }}>
              Rp {cartTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Form Data Diri */}
        <div 
          className="card border-0 mb-4"
          style={{
            backgroundColor: '#161720',
            border: '1px solid #23253a',
            borderRadius: '16px'
          }}
        >
          <div className="card-body p-4">
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
                    borderRadius: '10px',
                    backgroundColor: diningMethod === 'dine-in' ? 'rgba(216, 167, 68, 0.15)' : '#1c1d27',
                    border: diningMethod === 'dine-in' ? '1.5px solid #d8a744' : '1px solid #282a36',
                    color: diningMethod === 'dine-in' ? '#d8a744' : '#94a3b8',
                    fontSize: '0.88rem'
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
                    borderRadius: '10px',
                    backgroundColor: diningMethod === 'takeaway' ? 'rgba(216, 167, 68, 0.15)' : '#1c1d27',
                    border: diningMethod === 'takeaway' ? '1.5px solid #d8a744' : '1px solid #282a36',
                    color: diningMethod === 'takeaway' ? '#d8a744' : '#94a3b8',
                    fontSize: '0.88rem'
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

            <div className="mb-2">
              <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.88rem', marginBottom: '8px', display: 'block' }}>
                Metode Pembayaran
              </label>
              <select 
                className="form-select" 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                style={inputStyle}
              >
                <option value="qris" style={{ backgroundColor: '#1c1d27' }}>QRIS</option>
                <option value="cash" style={{ backgroundColor: '#1c1d27' }}>Tunai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="d-grid gap-3 mt-4">
          <button 
            className="w-100 border-0 fw-bold py-3 transition-all"
            style={{
              backgroundColor: '#d8a744',
              color: '#101116',
              borderRadius: '14px',
              fontSize: '1.05rem',
              cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || cart.length === 0 ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(216, 167, 68, 0.35)'
            }}
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? 'Memproses...' : 'Pesan Sekarang'}
          </button>
          <button 
            className="w-100 border-0 fw-bold py-3" 
            style={{
              backgroundColor: '#222433',
              border: '1px solid #2c2f40',
              color: '#cbd5e1',
              borderRadius: '14px',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
            onClick={() => navigate(-1)}
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
