import React, { useState, useEffect, useRef } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { notifyError, notifySuccess, showAlert } from '../../utils/notify';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, X, User, MapPin, 
  CreditCard, Banknote, QrCode, Printer, SlidersHorizontal, RefreshCw 
} from 'lucide-react';

const KasirPOS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Modal State
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedVariants, setSelectedVariants] = useState([]);

  // Form checkout state
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('1');
  const [diningMethod, setDiningMethod] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qris'
  const [cashReceived, setCashReceived] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: focus search with "/"
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, varRes] = await Promise.all([
        api.get('/product'),
        api.get('/categories?type=menu'),
        api.get('/product-variant')
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setProductVariants(varRes.data || []);
    } catch (err) {
      console.error('Gagal memuat data menu', err);
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate product unit price considering grosir rule
  const getProductUnitPrice = (product, qty) => {
    if (product.price_type === 'grosir' && qty >= product.grosir_min_qty) {
      return parseFloat(product.grosir_price_per_unit);
    }
    return parseFloat(product.base_price);
  };

  // Check if product has variants
  const hasVariants = (productId) => {
    return productVariants.some(v => v.product_id === productId);
  };

  // Open detail / variant modal
  const openCustomModal = (product) => {
    if (!product.is_available) return;
    setSelectedProduct(product);
    setOrderQty(1);
    setOrderNotes('');
    setSelectedVariants([]);
  };

  // Handle click on product card
  const handleProductCardClick = (product) => {
    if (!product.is_available) return;
    if (hasVariants(product.id)) {
      openCustomModal(product);
    } else {
      quickAddToCart(product);
    }
  };

  // Quick add (1 qty, no variants)
  const quickAddToCart = (product) => {
    const existingIndex = cart.findIndex(item =>
      item.product.id === product.id &&
      (!item.variants || item.variants.length === 0) &&
      (!item.notes || item.notes.trim() === '')
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      const existingItem = updatedCart[existingIndex];
      const newQty = existingItem.quantity + 1;
      const unitPrice = getProductUnitPrice(product, newQty);
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        unitPrice,
        totalPrice: unitPrice * newQty
      };
    } else {
      const unitPrice = getProductUnitPrice(product, 1);
      updatedCart = [...cart, {
        tempId: Date.now(),
        product,
        quantity: 1,
        variants: [],
        notes: '',
        unitPrice,
        totalPrice: unitPrice
      }];
    }
    setCart(updatedCart);
  };

  const handleVariantToggle = (variant) => {
    setSelectedVariants(prev =>
      prev.some(v => v.id === variant.id)
        ? prev.filter(v => v.id !== variant.id)
        : [...prev, variant]
    );
  };

  // Add item with custom variants / notes from modal
  const addToCartFromModal = () => {
    if (!selectedProduct) return;

    const areVariantsEqual = (v1 = [], v2 = []) => {
      if (v1.length !== v2.length) return false;
      const ids1 = v1.map(v => v.id).sort();
      const ids2 = v2.map(v => v.id).sort();
      return ids1.every((id, i) => id === ids2[i]);
    };

    const existingIndex = cart.findIndex(item =>
      item.product.id === selectedProduct.id &&
      areVariantsEqual(item.variants, selectedVariants) &&
      (item.notes || '').trim().toLowerCase() === (orderNotes || '').trim().toLowerCase()
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      const ei = updatedCart[existingIndex];
      const newQty = ei.quantity + orderQty;
      const unitPrice = getProductUnitPrice(selectedProduct, newQty);
      const varPrice = selectedVariants.reduce((s, v) => s + parseFloat(v.extra_price), 0);
      updatedCart[existingIndex] = {
        ...ei,
        quantity: newQty,
        unitPrice,
        totalPrice: (unitPrice + varPrice) * newQty
      };
    } else {
      const unitPrice = getProductUnitPrice(selectedProduct, orderQty);
      const varPrice = selectedVariants.reduce((s, v) => s + parseFloat(v.extra_price), 0);
      updatedCart = [...cart, {
        tempId: Date.now(),
        product: selectedProduct,
        quantity: orderQty,
        variants: selectedVariants,
        notes: orderNotes,
        unitPrice,
        totalPrice: (unitPrice + varPrice) * orderQty
      }];
    }

    setCart(updatedCart);
    setSelectedProduct(null);
  };

  // Cart quantity controls
  const updateCartQty = (tempId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(tempId);
      return;
    }
    setCart(cart.map(item => {
      if (item.tempId !== tempId) return item;
      const unitPrice = getProductUnitPrice(item.product, newQty);
      const varPrice = (item.variants || []).reduce((s, v) => s + parseFloat(v.extra_price), 0);
      return { 
        ...item, 
        quantity: newQty, 
        unitPrice, 
        totalPrice: (unitPrice + varPrice) * newQty 
      };
    }));
  };

  const removeFromCart = (tempId) => {
    setCart(cart.filter(i => i.tempId !== tempId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCashReceived('');
  };

  const cartTotal = cart.reduce((s, i) => s + i.totalPrice, 0);

  // Cash change calculation
  const numericCashReceived = parseFloat(cashReceived) || 0;
  const cashChange = numericCashReceived >= cartTotal ? numericCashReceived - cartTotal : 0;

  // Submit order to backend (Di Kasir POS langsung lunas & langsung masuk antrean dapur)
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      showAlert('Keranjang belanja masih kosong');
      return;
    }

    if (paymentMethod === 'cash' && numericCashReceived < cartTotal) {
      showAlert(`Uang tunai yang diterima (Rp ${numericCashReceived.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${cartTotal.toLocaleString('id-ID')})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_order: item.unitPrice,
        notes: item.notes || null,
        itemVariants: (item.variants || []).map(v => ({
          variant_name: v.name,
          variant_price: v.extra_price
        }))
      }));

      // Di Kasir POS (baik Tunai maupun Mesin EDC/QRIS Statis), transaksi selalu langsung lunas!
      const payload = {
        table_number: parseInt(tableNumber) || 0,
        customer_name: customerName.trim() || 'Pelanggan Kasir',
        location: diningMethod,
        total_amount: cartTotal,
        payment_method: paymentMethod,
        payment_status: 'paid', // Langsung lunas agar pesanan bisa langsung dieksekusi di dapur!
        order_status: 'pending',
        items: itemsPayload
      };

      const res = await api.post('/order', payload);
      const newOrderId = res.data.id;

      const orderSummary = {
        orderId: newOrderId,
        customerName: payload.customer_name,
        tableNumber: payload.table_number,
        diningMethod,
        paymentMethod,
        paymentStatus: 'paid',
        items: [...cart],
        totalAmount: cartTotal,
        cashReceived: paymentMethod === 'cash' ? numericCashReceived : cartTotal,
        cashChange: paymentMethod === 'cash' ? cashChange : 0,
        date: new Date()
      };

      notifySuccess(`Transaksi #${newOrderId} berhasil & lunas! Pesanan langsung masuk ke antrean dapur.`);
      setCompletedOrder(orderSummary);

      // Reset cart
      setCart([]);
      setCustomerName('');
      setCashReceived('');
      fetchData(); // refresh stock numbers
    } catch (err) {
      console.error(err);
      notifyError('Gagal memproses transaksi kasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Receipt handler
  const handlePrintReceipt = () => {
    window.print();
  };

  // Styles
  const cardBg = '#161720';
  const borderColor = '#23253a';
  const goldColor = '#d8a744';

  return (
    <div className="row g-3 mt-1" style={{ minHeight: 'calc(100vh - 80px)' }}>

      {/* ===== BAGIAN KIRI: DAFTAR MENU (PRODUK & KATEGORI) ===== */}
      <div className="col-lg-8">
        {/* Search Bar & Kategori */}
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="position-relative flex-grow-1">
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                ref={searchRef}
                type="text"
                placeholder='Cari menu... (tekan "/" untuk mencari cepat)'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control"
                style={{
                  backgroundColor: '#1c1d27',
                  border: `1px solid ${borderColor}`,
                  color: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '9px 12px 9px 36px',
                  fontSize: '0.88rem'
                }}
              />
            </div>
            <button
              onClick={fetchData}
              className="btn d-flex align-items-center gap-1"
              style={{
                backgroundColor: '#222433',
                border: `1px solid ${borderColor}`,
                color: '#cbd5e1',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '0.85rem'
              }}
              title="Refresh Menu & Stok"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Category Tabs */}
          <div className="d-flex flex-wrap gap-2">
            <button
              className="border-0 transition-all"
              style={{
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '0.82rem',
                fontWeight: '700',
                backgroundColor: activeCategory === 'all' ? goldColor : '#222433',
                color: activeCategory === 'all' ? '#101116' : '#94a3b8',
                border: activeCategory === 'all' ? 'none' : `1px solid ${borderColor}`,
                cursor: 'pointer'
              }}
              onClick={() => setActiveCategory('all')}
            >
              Semua Menu
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className="border-0 transition-all"
                style={{
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  backgroundColor: activeCategory === cat.id ? goldColor : '#222433',
                  color: activeCategory === cat.id ? '#101116' : '#94a3b8',
                  border: activeCategory === cat.id ? 'none' : `1px solid ${borderColor}`,
                  cursor: 'pointer'
                }}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="row g-2">
          {filteredProducts.length === 0 && (
            <div className="col-12 text-center py-5" style={{ color: '#64748b' }}>
              Tidak ada menu ditemukan
            </div>
          )}
          {filteredProducts.map(product => {
            const available = product.is_available;
            const hasGrosir = product.price_type === 'grosir';
            const cartQty = cart.filter(i => i.product.id === product.id).reduce((s, i) => s + i.quantity, 0);
            const withVariants = hasVariants(product.id);

            return (
              <div key={product.id} className="col-6 col-md-4 col-xl-3">
                <div
                  onClick={() => handleProductCardClick(product)}
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cartQty > 0 ? goldColor : borderColor}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: available ? 'pointer' : 'default',
                    opacity: available ? 1 : 0.5,
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: cartQty > 0 ? '0 2px 10px rgba(216, 167, 68, 0.2)' : 'none'
                  }}
                  className="h-100 d-flex flex-column justify-content-between"
                >
                  {/* Cart badge */}
                  {cartQty > 0 && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px', zIndex: 2,
                      backgroundColor: goldColor, color: '#101116',
                      borderRadius: '50%', width: '24px', height: '24px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: '800',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                    }}>
                      {cartQty}
                    </div>
                  )}

                  {/* Product Image */}
                  <div>
                    <div style={{ height: '110px', backgroundColor: '#222433', overflow: 'hidden', position: 'relative' }}>
                      {product.image_url ? (
                        <img
                          src={`${API_IMAGE_URL}/${product.image_url}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover', filter: !available ? 'grayscale(100%)' : 'none' }}
                          alt={product.name}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100" style={{ color: '#4a4d5e', fontSize: '0.75rem' }}>
                          No Image
                        </div>
                      )}

                      {!available && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
                          <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '6px' }}>
                            HABIS
                          </span>
                        </div>
                      )}

                      {/* Small badge if has options */}
                      {withVariants && available && (
                        <span 
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            backgroundColor: 'rgba(28, 29, 39, 0.85)',
                            color: '#cbd5e1',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid #3b3e54'
                          }}
                        >
                          + Opsi
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div style={{ padding: '8px 10px' }}>
                      <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem', color: '#f1f5f9' }} title={product.name}>
                        {product.name}
                      </div>
                      <div style={{ color: goldColor, fontWeight: '700', fontSize: '0.92rem' }}>
                        Rp {parseInt(product.base_price, 10).toLocaleString('id-ID')}
                      </div>
                      {hasGrosir && (
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          Grosir: Rp {parseInt(product.grosir_price_per_unit, 10).toLocaleString('id-ID')} (min {product.grosir_min_qty} pcs)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ padding: '0 10px 8px 10px' }}>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn flex-fill py-1 fw-bold"
                        disabled={!available}
                        style={{
                          backgroundColor: available ? goldColor : '#282a36',
                          color: available ? '#101116' : '#64748b',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          border: 'none'
                        }}
                      >
                        {available ? '+ Tambah' : 'Stok Habis'}
                      </button>
                      {available && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomModal(product);
                          }}
                          className="btn p-1"
                          style={{
                            backgroundColor: '#222433',
                            border: `1px solid ${borderColor}`,
                            color: '#cbd5e1',
                            borderRadius: '8px',
                            width: '28px'
                          }}
                          title="Kustomisasi varian / catatan"
                        >
                          <SlidersHorizontal size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== BAGIAN KANAN: KERANJANG & CHECKOUT FORM ===== */}
      <div className="col-lg-4">
        <div style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '14px',
          position: 'sticky',
          top: '70px',
          maxHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Cart Header */}
          <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2"
            style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div className="d-flex align-items-center gap-2">
              <ShoppingCart size={18} style={{ color: goldColor }} />
              <span className="fw-bold" style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>
                Pesanan Transaksi
              </span>
              {cart.length > 0 && (
                <span style={{
                  backgroundColor: goldColor, color: '#101116',
                  borderRadius: '10px', padding: '1px 8px',
                  fontSize: '0.72rem', fontWeight: '700'
                }}>
                  {cart.reduce((s, i) => s + i.quantity, 0)} item
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="btn btn-sm p-0 d-flex align-items-center gap-1"
                style={{ color: '#ef4444', fontSize: '0.78rem', border: 'none', background: 'none' }}
              >
                <Trash2 size={13} /> Hapus Semua
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', padding: '0 12px' }}>
            {cart.length === 0 ? (
              <div className="text-center py-5" style={{ color: '#4a4d5e', fontSize: '0.85rem' }}>
                <ShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                Belum ada menu yang dipilih.<br />Klik menu di samping untuk menambahkan.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.tempId} className="d-flex align-items-center gap-2 py-2"
                  style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-bold text-truncate" style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
                      {item.product.name}
                    </div>
                    {item.variants?.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        + {item.variants.map(v => v.name).join(', ')}
                      </div>
                    )}
                    {item.notes && (
                      <div style={{ fontSize: '0.7rem', color: goldColor }}>"{item.notes}"</div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: goldColor, fontWeight: '600' }}>
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                      <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.72rem', marginLeft: '4px' }}>
                        (@ Rp {item.unitPrice.toLocaleString('id-ID')})
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="d-flex align-items-center" style={{
                    border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden',
                    backgroundColor: '#1c1d27'
                  }}>
                    <button onClick={() => updateCartQty(item.tempId, item.quantity - 1)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px', border: 'none', backgroundColor: '#222433', color: '#cbd5e1' }}>
                      <Minus size={13} />
                    </button>
                    <span className="px-2 fw-bold" style={{ fontSize: '0.82rem', color: '#f1f5f9', minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateCartQty(item.tempId, item.quantity + 1)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '28px', height: '28px', border: 'none', backgroundColor: '#222433', color: '#cbd5e1' }}>
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button onClick={() => removeFromCart(item.tempId)}
                    className="btn p-0" style={{ border: 'none', background: 'none', color: '#ef4444' }}
                    title="Hapus menu">
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Payment Section */}
          {cart.length > 0 && (
            <div style={{ padding: '12px', borderTop: `1px solid ${borderColor}`, backgroundColor: '#14151d' }}>
              {/* Customer & Table */}
              <div className="d-flex gap-2 mb-2">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <User size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Nama Pelanggan</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Pelanggan Kasir"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="form-control"
                    style={{
                      backgroundColor: '#1c1d27', border: `1px solid ${borderColor}`,
                      color: '#f1f5f9', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem'
                    }}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <div className="d-flex align-items-center gap-1 mb-1">
                    <MapPin size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>No Meja</span>
                  </div>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    className="form-control"
                    style={{
                      backgroundColor: '#1c1d27', border: `1px solid ${borderColor}`,
                      color: '#f1f5f9', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              {/* Service Method (Dine In / Take Away) */}
              <div className="mb-2">
                <div className="d-flex gap-1">
                  {[{ val: 'dine-in', label: 'Makan di Sini' }, { val: 'takeaway', label: 'Bawa Pulang' }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setDiningMethod(opt.val)}
                      className="btn flex-fill py-1 fw-bold"
                      style={{
                        fontSize: '0.75rem', borderRadius: '7px',
                        backgroundColor: diningMethod === opt.val ? 'rgba(216,167,68,0.15)' : '#1c1d27',
                        border: diningMethod === opt.val ? `1.5px solid ${goldColor}` : `1px solid ${borderColor}`,
                        color: diningMethod === opt.val ? goldColor : '#94a3b8'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector (Di kasir: Tunai & QRIS Mesin EDC / Statis) */}
              <div className="mb-2">
                <div className="d-flex align-items-center gap-1 mb-1">
                  <CreditCard size={12} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Metode Pembayaran Kasir</span>
                </div>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className="btn flex-fill py-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                    style={{
                      fontSize: '0.78rem', borderRadius: '7px',
                      backgroundColor: paymentMethod === 'cash' ? 'rgba(216,167,68,0.15)' : '#1c1d27',
                      border: paymentMethod === 'cash' ? `1.5px solid ${goldColor}` : `1px solid ${borderColor}`,
                      color: paymentMethod === 'cash' ? goldColor : '#94a3b8'
                    }}
                  >
                    <Banknote size={14} /> Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className="btn flex-fill py-1 fw-bold d-flex align-items-center justify-content-center gap-1"
                    style={{
                      fontSize: '0.78rem', borderRadius: '7px',
                      backgroundColor: paymentMethod === 'qris' ? 'rgba(216,167,68,0.15)' : '#1c1d27',
                      border: paymentMethod === 'qris' ? `1.5px solid ${goldColor}` : `1px solid ${borderColor}`,
                      color: paymentMethod === 'qris' ? goldColor : '#94a3b8'
                    }}
                  >
                    <QrCode size={14} /> QRIS / Mesin EDC
                  </button>
                </div>
              </div>

              {/* Cash Helper (Uang Diterima & Kembalian) - Hanya tampil jika Tunai */}
              {paymentMethod === 'cash' && (
                <div className="p-2 mb-2 rounded" style={{ backgroundColor: '#1c1d27', border: `1px solid ${borderColor}` }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Uang Diterima</span>
                    <button
                      type="button"
                      onClick={() => setCashReceived(cartTotal.toString())}
                      className="btn btn-sm p-0"
                      style={{ fontSize: '0.7rem', color: goldColor, border: 'none', background: 'none' }}
                    >
                      Uang Pas
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className="form-control mb-1 fw-bold"
                    style={{
                      backgroundColor: '#161720', border: `1px solid ${borderColor}`,
                      color: '#f1f5f9', borderRadius: '6px', padding: '5px 8px', fontSize: '0.85rem'
                    }}
                  />
                  <div className="d-flex gap-1 mb-1">
                    {[10000, 20000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashReceived(amt.toString())}
                        className="btn flex-fill p-1"
                        style={{
                          backgroundColor: '#222433', border: `1px solid ${borderColor}`,
                          color: '#cbd5e1', fontSize: '0.68rem', borderRadius: '4px'
                        }}
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-1" style={{ borderTop: `1px dashed ${borderColor}` }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Kembalian:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: cashChange >= 0 && numericCashReceived >= cartTotal ? '#22c55e' : '#ef4444' }}>
                      Rp {cashChange.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Total Tagihan */}
              <div className="d-flex justify-content-between align-items-center mb-2 pt-1">
                <span style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.85rem' }}>Total Tagihan:</span>
                <span style={{ color: goldColor, fontWeight: '800', fontSize: '1.25rem' }}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Submit Button: Bayar & Selesaikan Transaksi */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-100 border-0 fw-bold py-2 transition-all"
                style={{
                  backgroundColor: goldColor, color: '#101116',
                  borderRadius: '10px', fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(216,167,68,0.35)'
                }}
              >
                {isSubmitting ? 'Memproses Transaksi...' : 'Bayar & Selesaikan Transaksi'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL KUSTOMISASI / VARIAN PRODUK ===== */}
      {selectedProduct && (
        <div className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050, backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 shadow-lg"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: '16px', color: '#f1f5f9' }}>
              <div className="modal-header border-0 pb-0 pt-3 px-4 d-flex justify-content-between align-items-center">
                <h6 className="modal-title fw-bold" style={{ color: '#f1f5f9' }}>{selectedProduct.name}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedProduct(null)} />
              </div>
              <div className="modal-body px-4 pt-2 pb-3">
                {selectedProduct.image_url && (
                  <img src={`${API_IMAGE_URL}/${selectedProduct.image_url}`}
                    className="w-100 rounded mb-3" style={{ maxHeight: '160px', objectFit: 'cover', borderRadius: '10px' }}
                    alt="detail" />
                )}

                {/* Promo Grosir info */}
                {selectedProduct.price_type === 'grosir' && (
                  <div style={{
                    backgroundColor: 'rgba(216,167,68,0.1)', border: '1px solid rgba(216,167,68,0.3)',
                    borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem', marginBottom: '12px'
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong style={{ color: goldColor }}>Promo Grosir</strong>
                      {orderQty >= selectedProduct.grosir_min_qty ? (
                        <span style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '5px' }}>
                          Harga Grosir Aktif
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          Kurang {selectedProduct.grosir_min_qty - orderQty} pcs untuk harga grosir
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#cbd5e1' }}>
                      Beli min {selectedProduct.grosir_min_qty} pcs: <strong style={{ color: goldColor }}>Rp {parseInt(selectedProduct.grosir_price_per_unit, 10).toLocaleString('id-ID')}</strong>/pcs
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                      Harga normal: Rp {parseInt(selectedProduct.base_price, 10).toLocaleString('id-ID')}
                    </div>
                  </div>
                )}

                {/* Variants */}
                {productVariants.filter(v => v.product_id === selectedProduct.id).length > 0 && (
                  <div className="mb-3">
                    <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                      Opsi / Varian Tambahan:
                    </label>
                    {productVariants.filter(v => v.product_id === selectedProduct.id).map(v => (
                      <div key={v.id}
                        className="form-check d-flex justify-content-between align-items-center p-2 rounded mb-1"
                        style={{ backgroundColor: '#1c1d27', border: `1px solid ${borderColor}` }}>
                        <div className="d-flex align-items-center gap-2">
                          <input type="checkbox" className="form-check-input"
                            checked={selectedVariants.some(sv => sv.id === v.id)}
                            onChange={() => handleVariantToggle(v)}
                            style={{ cursor: 'pointer' }} />
                          <span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>{v.name}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: goldColor }}>
                          +Rp {parseFloat(v.extra_price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes input */}
                <div className="mb-3">
                  <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                    Catatan Pesanan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Less sugar, extra pedas"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    className="form-control"
                    style={{
                      backgroundColor: '#1c1d27', border: `1px solid ${borderColor}`,
                      color: '#f1f5f9', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem'
                    }}
                  />
                </div>

                {/* Qty & Price preview */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center" style={{
                    border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden'
                  }}>
                    <button onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', border: 'none', backgroundColor: '#222433', color: '#cbd5e1' }}>
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      value={orderQty}
                      onChange={e => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center fw-bold"
                      style={{
                        width: '50px', height: '36px', border: 'none',
                        backgroundColor: '#1c1d27', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none'
                      }}
                    />
                    <button onClick={() => setOrderQty(orderQty + 1)}
                      className="btn p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', border: 'none', backgroundColor: '#222433', color: '#cbd5e1' }}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <div style={{ color: goldColor, fontWeight: '800', fontSize: '1.15rem' }}>
                    Rp {(() => {
                      const up = getProductUnitPrice(selectedProduct, orderQty);
                      const vp = selectedVariants.reduce((s, v) => s + parseFloat(v.extra_price), 0);
                      return ((up + vp) * orderQty).toLocaleString('id-ID');
                    })()}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-3">
                <button
                  onClick={addToCartFromModal}
                  className="w-100 border-0 fw-bold py-2"
                  style={{ backgroundColor: goldColor, color: '#101116', borderRadius: '10px', fontSize: '0.95rem' }}
                >
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL STRUK BUKTI TRANSAKSI KASIR ===== */}
      {completedOrder && (
        <div className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1070, backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '380px' }}>
            <div className="modal-content border-0 shadow-lg p-4"
              style={{ backgroundColor: '#ffffff', color: '#1e293b', borderRadius: '16px', fontFamily: 'monospace' }}>
              
              <div className="text-center pb-2 mb-2" style={{ borderBottom: '2px dashed #94a3b8' }}>
                <h5 className="fw-bold mb-0" style={{ letterSpacing: '1px' }}>BILLION CAFE</h5>
                <small style={{ color: '#64748b' }}>Struk Pembayaran Kasir</small>
                <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#64748b' }}>
                  {new Date(completedOrder.date).toLocaleString('id-ID')}
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '8px' }}>
                <div><strong>No Order:</strong> #{completedOrder.orderId}</div>
                <div><strong>Pelanggan:</strong> {completedOrder.customerName}</div>
                <div><strong>Meja:</strong> {completedOrder.tableNumber} ({completedOrder.diningMethod === 'dine-in' ? 'Dine In' : 'Take Away'})</div>
                <div><strong>Metode:</strong> {completedOrder.paymentMethod === 'cash' ? 'TUNAI' : 'QRIS / MESIN EDC'} ({completedOrder.paymentStatus.toUpperCase()})</div>
              </div>

              {/* Items List */}
              <div className="py-2" style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', fontSize: '0.8rem' }}>
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="mb-1">
                    <div className="d-flex justify-content-between">
                      <span>{it.quantity}x {it.product.name}</span>
                      <span>Rp {it.totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {it.variants?.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', paddingLeft: '12px' }}>
                        + {it.variants.map(v => v.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total & Change */}
              <div className="pt-2 mb-3" style={{ fontSize: '0.85rem' }}>
                <div className="d-flex justify-content-between fw-bold">
                  <span>TOTAL:</span>
                  <span>Rp {completedOrder.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                {completedOrder.paymentMethod === 'cash' && (
                  <>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.8rem' }}>
                      <span>Tunai Diterima:</span>
                      <span>Rp {completedOrder.cashReceived.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.8rem' }}>
                      <span>Kembalian:</span>
                      <span>Rp {completedOrder.cashChange.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-muted small mb-3" style={{ fontSize: '0.72rem' }}>
                Terima kasih atas kunjungan Anda!<br />Billion Cafe
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="btn flex-fill d-flex align-items-center justify-content-center gap-1"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  <Printer size={15} /> Cetak
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedOrder(null)}
                  className="btn flex-fill"
                  style={{ backgroundColor: goldColor, color: '#101116', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Pesanan Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KasirPOS;
