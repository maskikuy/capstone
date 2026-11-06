
import React, { useState, useEffect } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MenuDropdown from './MenuDropdown';
import { Coffee, Utensils, ShoppingBag, Check, X, Mail, HeartHandshake, Info } from 'lucide-react';

const Menu = () => {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '0';
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  // State Keranjang & Modal
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [productVariants, setProductVariants] = useState([]);

  // State Dine In / Take Away
  const [diningMethod, setDiningMethod] = useState(() => {
    return localStorage.getItem('wow_location') || null;
  });

  const [showDiningModal, setShowDiningModal] = useState(() => {
    return !localStorage.getItem('wow_location');
  });

  const [showAboutModal, setShowAboutModal] = useState(false);

  // Tutup popup About dengan tombol Escape
  useEffect(() => {
    if (!showAboutModal) return undefined;

    const handleAboutEscape = (event) => {
      if (event.key === 'Escape') setShowAboutModal(false);
    };

    window.addEventListener('keydown', handleAboutEscape);
    return () => window.removeEventListener('keydown', handleAboutEscape);
  }, [showAboutModal]);

  // State Riwayat Pesanan
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('wow_order_history');
    if (savedHistory) {
      setOrderHistory(JSON.parse(savedHistory));
    }
  }, [showHistoryModal]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    const savedCart = localStorage.getItem('wow_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    if (tableNumber !== '0') {
      localStorage.setItem('wow_table', tableNumber);
    }

    return () => clearInterval(interval);
  }, [tableNumber]);

  const handleSelectDiningMethod = (method) => {
    setDiningMethod(method);
    localStorage.setItem('wow_location', method);
    setShowDiningModal(false);
  };

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
      console.error('Gagal memuat menu', err);
    }
  };

  // Filter Produk berdasarkan Kategori
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_id === parseInt(activeCategory));

  // Logic Tambah ke Keranjang
  const openProductModal = (product) => {
    if (!product.is_available) return;

    setSelectedProduct(product);
    setOrderQty(1);
    setOrderNotes('');
    setSelectedVariants([]);
  };

  const handleVariantToggle = (variant) => {
    const isSelected = selectedVariants.some(v => v.id === variant.id);

    if (isSelected) {
      setSelectedVariants(selectedVariants.filter(v => v.id !== variant.id));
    } else {
      setSelectedVariants([...selectedVariants, variant]);
    }
  };

  const getProductUnitPrice = (product, qty) => {
    if (product.price_type === 'grosir' && qty >= product.grosir_min_qty) {
      return parseFloat(product.grosir_price_per_unit);
    }

    return parseFloat(product.base_price);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const areVariantsEqual = (varList1, varList2) => {
      const v1 = varList1 || [];
      const v2 = varList2 || [];

      if (v1.length !== v2.length) return false;

      const ids1 = v1.map(v => v.id).sort();
      const ids2 = v2.map(v => v.id).sort();

      return ids1.every((id, idx) => id === ids2[idx]);
    };

    const areNotesEqual = (note1, note2) => {
      return (note1 || '').trim().toLowerCase() === (note2 || '').trim().toLowerCase();
    };

    const existingIndex = cart.findIndex(item =>
      item.product.id === selectedProduct.id &&
      areVariantsEqual(item.variants, selectedVariants) &&
      areNotesEqual(item.notes, orderNotes)
    );

    let updatedCart;

    if (existingIndex > -1) {
      updatedCart = [...cart];
      const existingItem = updatedCart[existingIndex];
      const newQty = existingItem.quantity + orderQty;

      const activeUnitPrice = getProductUnitPrice(selectedProduct, newQty);
      const variantsPrice = selectedVariants.reduce((total, v) => total + parseFloat(v.extra_price), 0);
      const finalPrice = (activeUnitPrice + variantsPrice) * newQty;

      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        totalPrice: finalPrice,
        unitPrice: activeUnitPrice
      };
    } else {
      const activeUnitPrice = getProductUnitPrice(selectedProduct, orderQty);
      const variantsPrice = selectedVariants.reduce((total, v) => total + parseFloat(v.extra_price), 0);
      const finalPrice = (activeUnitPrice + variantsPrice) * orderQty;

      const newItem = {
        tempId: Date.now(),
        product: selectedProduct,
        quantity: orderQty,
        variants: selectedVariants,
        notes: orderNotes,
        totalPrice: finalPrice,
        unitPrice: activeUnitPrice
      };

      updatedCart = [...cart, newItem];
    }

    setCart(updatedCart);
    localStorage.setItem('wow_cart', JSON.stringify(updatedCart));
    setSelectedProduct(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ backgroundColor: '#101116', minHeight: '100vh', color: '#f1f5f9', paddingBottom: '90px' }}>

      {/* 1. Header Info Meja & Menu */}
      <div
        className="d-flex justify-content-between align-items-center p-3 sticky-top"
        style={{
          backgroundColor: '#161720',
          borderBottom: '1px solid #23253a',
          top: 0,
          zIndex: 1020,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <div>
          <h5 className="mb-0 fw-bold" style={{ color: '#f1f5f9', fontSize: '1.2rem', letterSpacing: '0.2px' }}>
            Billion Cafe Menu
          </h5>

          <div className="d-flex align-items-center gap-2 mt-2">
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                backgroundColor: '#222433',
                color: '#cbd5e1',
                border: '1px solid #2c2f40',
                borderRadius: '20px',
                padding: '3px 10px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Meja {tableNumber}
            </span>

            {diningMethod && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  backgroundColor: '#222433',
                  color: '#cbd5e1',
                  border: '1px solid #2c2f40',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setShowDiningModal(true)}
              >
                {diningMethod === 'dine-in' ? 'Makan di Sini' : 'Bawa Pulang'}
                <i className="bi bi-pencil-square" style={{ fontSize: '0.65rem', color: '#94a3b8' }}></i>
              </span>
            )}
          </div>
        </div>

        <MenuDropdown
          onHistoryClick={() => setShowHistoryModal(true)}
          onAboutClick={() => {
            const query = searchParams.toString();
            navigate(query ? `/customer/about?${query}` : '/customer/about');
          }}
        />
      </div>

      {/* 2. Kategori Filter */}
      <div
        className="d-flex overflow-auto p-3 gap-2 hide-scrollbar sticky-top"
        style={{
          whiteSpace: 'nowrap',
          top: '73px',
          zIndex: 1010,
          backgroundColor: '#101116',
          borderBottom: '1px solid #1c1d27'
        }}
      >
        <button
          className="border-0 transition-all"
          style={{
            borderRadius: '20px',
            padding: '7px 18px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: activeCategory === 'all' ? '#d8a744' : '#222433',
            color: activeCategory === 'all' ? '#101116' : '#94a3b8',
            border: activeCategory === 'all' ? 'none' : '1px solid #2c2f40',
            cursor: 'pointer',
            boxShadow: activeCategory === 'all' ? '0 2px 8px rgba(216, 167, 68, 0.3)' : 'none'
          }}
          onClick={() => setActiveCategory('all')}
        >
          Semua
        </button>

        {categories.map(cat => {
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              className="border-0 transition-all"
              style={{
                borderRadius: '20px',
                padding: '7px 18px',
                fontSize: '0.85rem',
                fontWeight: '700',
                backgroundColor: isActive ? '#d8a744' : '#222433',
                color: isActive ? '#101116' : '#94a3b8',
                border: isActive ? 'none' : '1px solid #2c2f40',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(216, 167, 68, 0.3)' : 'none'
              }}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 3. Daftar Produk Grid */}
      <div className="container-fluid px-3 pt-3">
        <div className="row g-3">
          {filteredProducts.map(product => {
            const isAvailable = product.is_available;
            const hasGrosir = product.price_type === 'grosir';

            return (
              <div
                key={product.id}
                className="col-6 col-md-4 col-lg-3"
                onClick={() => isAvailable && openProductModal(product)}
                style={{ cursor: isAvailable ? 'pointer' : 'default' }}
              >
                <div
                  className="h-100 d-flex flex-column justify-content-between transition-all"
                  style={{
                    backgroundColor: '#161720',
                    border: '1px solid #23253a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    opacity: isAvailable ? 1 : 0.6,
                    padding: '10px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        height: '135px',
                        overflow: 'hidden',
                        position: 'relative',
                        borderRadius: '12px',
                        backgroundColor: '#222433'
                      }}
                    >
                      {product.image_url ? (
                        <img
                          src={`${API_IMAGE_URL}/${product.image_url}`}
                          className="w-100 h-100"
                          style={{
                            objectFit: 'cover',
                            filter: !isAvailable ? 'grayscale(100%)' : 'none'
                          }}
                          alt={product.name}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                          No Image
                        </div>
                      )}

                      {!isAvailable && (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                        >
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              fontSize: '0.8rem',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              letterSpacing: '0.5px',
                              fontWeight: '700'
                            }}
                          >
                            HABIS
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 px-1">
                      <h6
                        className="mb-1 fw-bold text-truncate"
                        style={{
                          fontSize: '0.92rem',
                          color: isAvailable ? '#f1f5f9' : '#94a3b8',
                          textDecoration: !isAvailable ? 'line-through' : 'none'
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </h6>

                      <div
                        style={{
                          color: '#d8a744',
                          fontWeight: '700',
                          fontSize: '1rem',
                          marginBottom: hasGrosir ? '2px' : '4px'
                        }}
                      >
                        Rp {parseInt(product.base_price, 10).toLocaleString('id-ID')}
                      </div>

                      {hasGrosir && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#94a3b8',
                            fontWeight: '500',
                            marginBottom: '6px'
                          }}
                        >
                          Grosir: Rp {parseInt(product.grosir_price_per_unit, 10).toLocaleString('id-ID')} (min {product.grosir_min_qty} pcs)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      className="w-100 border-0 fw-bold transition-all"
                      style={{
                        backgroundColor: isAvailable ? '#d8a744' : '#282a36',
                        color: isAvailable ? '#101116' : '#64748b',
                        padding: '8px 0',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}
                      disabled={!isAvailable}
                    >
                      {isAvailable ? 'Tambah' : 'Stok Habis'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Floating Cart Button */}
      {cart.length > 0 && (
        <div
          className="fixed-bottom p-3 d-flex justify-content-center"
          style={{ zIndex: 1040 }}
        >
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <button
              className="w-100 border-0 d-flex justify-content-between align-items-center shadow-lg transition-all"
              style={{
                backgroundColor: '#d8a744',
                color: '#101116',
                padding: '14px 22px',
                borderRadius: '30px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(216, 167, 68, 0.4)'
              }}
              onClick={() => navigate('/customer/checkout')}
            >
              <span className="d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                {cartCount} Item
              </span>

              <span style={{ fontSize: '1.05rem', fontWeight: '800' }}>
                Rp {cartTotal.toLocaleString('id-ID')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Detail Produk */}
      {selectedProduct && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(0,0,0,0.75)',
            zIndex: 1050,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '440px' }}>
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                borderRadius: '20px',
                color: '#f1f5f9',
                overflow: 'hidden'
              }}
            >
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ color: '#f1f5f9', fontSize: '1.2rem' }}>
                  {selectedProduct.name}
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedProduct(null)}
                />
              </div>

              <div className="modal-body px-4 pt-3 pb-2">
                {selectedProduct.image_url && (
                  <img
                    src={`${API_IMAGE_URL}/${selectedProduct.image_url}`}
                    className="w-100 rounded mb-3"
                    style={{ maxHeight: '190px', objectFit: 'cover', borderRadius: '12px' }}
                    alt="detail"
                  />
                )}

                {selectedProduct.description && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                    {selectedProduct.description}
                  </p>
                )}

                {selectedProduct.price_type === 'grosir' && (
                  <div
                    style={{
                      backgroundColor: 'rgba(216, 167, 68, 0.1)',
                      border: '1px solid rgba(216, 167, 68, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      fontSize: '0.82rem',
                      marginBottom: '16px'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong style={{ color: '#d8a744' }}>📦 Promo Grosir</strong>

                      {orderQty >= selectedProduct.grosir_min_qty ? (
                        <span
                          style={{
                            backgroundColor: '#22c55e',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          Harga Grosir Aktif
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                          Kurang {selectedProduct.grosir_min_qty - orderQty} pcs
                        </span>
                      )}
                    </div>

                    <div style={{ color: '#cbd5e1' }}>
                      Beli min {selectedProduct.grosir_min_qty} pcs:{' '}
                      <strong style={{ color: '#d8a744' }}>
                        Rp {parseInt(selectedProduct.grosir_price_per_unit, 10).toLocaleString('id-ID')}
                      </strong>/pcs
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      Harga Satuan Normal: Rp {parseInt(selectedProduct.base_price, 10).toLocaleString('id-ID')}/pcs
                    </div>
                  </div>
                )}

                {productVariants.filter(v => v.product_id === selectedProduct.id).length > 0 && (
                  <div className="mb-3">
                    <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                      Opsi Tambahan:
                    </label>

                    <div className="d-flex flex-column gap-2">
                      {productVariants
                        .filter(v => v.product_id === selectedProduct.id)
                        .map(v => (
                          <div
                            key={v.id}
                            className="form-check d-flex justify-content-between align-items-center p-2 rounded"
                            style={{ backgroundColor: '#1c1d27', border: '1px solid #282a36' }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <input
                                className="form-check-input ms-0"
                                type="checkbox"
                                id={`var-${v.id}`}
                                checked={selectedVariants.some(sv => sv.id === v.id)}
                                onChange={() => handleVariantToggle(v)}
                                style={{ cursor: 'pointer', backgroundColor: '#161720', borderColor: '#475569' }}
                              />

                              <label
                                className="form-check-label mb-0"
                                htmlFor={`var-${v.id}`}
                                style={{ color: '#f1f5f9', fontSize: '0.85rem', cursor: 'pointer' }}
                              >
                                {v.name}
                              </label>
                            </div>

                            <span style={{ color: '#d8a744', fontSize: '0.8rem', fontWeight: '600' }}>
                              +Rp {parseInt(v.extra_price, 10).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label style={{ color: '#cbd5e1', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Catatan Khusus
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Jangan terlalu manis, tanpa es batu"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    style={{
                      backgroundColor: '#1c1d27',
                      border: '1px solid #282a36',
                      color: '#f1f5f9',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      padding: '10px 12px'
                    }}
                  />
                </div>

                <div className="d-flex align-items-center justify-content-center gap-4 my-3">
                  <button
                    className="border-0 rounded-circle d-flex align-items-center justify-content-center"
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: '#222433',
                      border: '1px solid #2c2f40',
                      color: '#f1f5f9',
                      fontSize: '1.2rem',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>

                  <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f1f5f9' }}>
                    {orderQty}
                  </span>

                  <button
                    className="border-0 rounded-circle d-flex align-items-center justify-content-center"
                    onClick={() => setOrderQty(orderQty + 1)}
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: '#222433',
                      border: '1px solid #2c2f40',
                      color: '#f1f5f9',
                      fontSize: '1.2rem',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="modal-footer border-0 p-4 pt-2">
                <button
                  className="w-100 border-0 fw-bold py-3 transition-all"
                  style={{
                    backgroundColor: '#d8a744',
                    color: '#101116',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(216, 167, 68, 0.35)'
                  }}
                  onClick={addToCart}
                >
                  Tambah ke Pesanan • Rp {((getProductUnitPrice(selectedProduct, orderQty) + selectedVariants.reduce((t, v) => t + parseFloat(v.extra_price), 0)) * orderQty).toLocaleString('id-ID')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Pilihan Tipe Pesanan */}
      {showDiningModal && (
        <div
          className="modal show d-block dining-modal-overlay"
          role="presentation"
          style={{
            backgroundColor: 'rgba(0,0,0,0.82)',
            zIndex: 1060,
            backdropFilter: 'blur(9px)',
            overflowY: 'auto'
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered dining-modal-dialog"
            style={{ maxWidth: '490px', minHeight: '100%', display: 'flex', alignItems: 'center' }}
          >
            <div
              className="modal-content dining-modal-content border-0 shadow-lg mx-3"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(216,167,68,0.10), transparent 48%), #161720',
                border: '1px solid rgba(216,167,68,0.45)',
                borderRadius: '22px',
                overflow: 'hidden',
                color: '#f1f5f9',
                boxShadow: '0 22px 70px rgba(0,0,0,0.55), 0 0 30px rgba(216,167,68,0.08)'
              }}
            >
              <div className="modal-body dining-modal-body">

                <div className="dining-modal-brand-icon">
                  <Coffee size={25} strokeWidth={1.6} />
                </div>

                <p className="dining-eyebrow">WELCOME TO</p>

                <h5 className="dining-modal-title">
                  Billion Cafe
                </h5>

                <div className="dining-title-divider">
                  <span />
                  <span className="dining-divider-dot" />
                  <span />
                </div>

                <p className="dining-modal-subtitle">
                  Silakan pilih metode pelayanan untuk pesanan Anda
                </p>

                <div className="dining-choice-list">
                  <button
                    type="button"
                    className={`dining-choice-card ${diningMethod === 'dine-in' ? 'selected' : ''}`}
                    onClick={() => handleSelectDiningMethod('dine-in')}
                    aria-pressed={diningMethod === 'dine-in'}
                  >
                    <span className="dining-choice-check">
                      {diningMethod === 'dine-in' && <Check size={13} strokeWidth={3} />}
                    </span>

                    <span className="dining-choice-icon">
                      <Utensils size={26} strokeWidth={1.7} />
                    </span>

                    <span className="dining-choice-title">
                      Makan di Sini
                    </span>

                    <span className="dining-choice-description">
                      Disajikan langsung di Meja {tableNumber}
                    </span>

                    <span className="dining-choice-accent" />
                  </button>

                  <button
                    type="button"
                    className={`dining-choice-card ${diningMethod === 'takeaway' ? 'selected' : ''}`}
                    onClick={() => handleSelectDiningMethod('takeaway')}
                    aria-pressed={diningMethod === 'takeaway'}
                  >
                    <span className="dining-choice-check">
                      {diningMethod === 'takeaway' && <Check size={13} strokeWidth={3} />}
                    </span>

                    <span className="dining-choice-icon">
                      <ShoppingBag size={26} strokeWidth={1.7} />
                    </span>

                    <span className="dining-choice-title">
                      Bawa Pulang
                    </span>

                    <span className="dining-choice-description">
                      Dibungkus untuk dibawa pulang
                    </span>

                    <span className="dining-choice-accent" />
                  </button>
                </div>

                {/* Tombol Tentang Kami */}
                  <button
                    type="button"
                    className="dining-about-trigger"
                    onClick={() => setShowAboutModal(true)}
                    aria-label="Buka informasi tentang tim Billion Cafe"
                  >
                    <span className="dining-about-trigger-icon">
                      <Info size={20} strokeWidth={1.8} />
                    </span>

                    <span className="dining-about-trigger-content">
                      <span className="dining-about-trigger-title">
                        Tentang Kami
                      </span>
                    </span>

                    <span className="dining-about-trigger-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>

                <p className="dining-modal-footer">
                  Pilihan ini dapat diubah kembali melalui menu pesanan.
                </p>
              </div>
            </div>
          </div>

          <style>{`
            .dining-modal-dialog {
              width: 100%;
              margin: 0 auto;
              padding-top: 18px;
              padding-bottom: 18px;
            }

            .dining-modal-body {
              padding: 29px 30px 23px;
              text-align: center;
            }

            .dining-modal-brand-icon {
              width: 52px;
              height: 52px;
              margin: 0 auto 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid rgba(216,167,68,0.42);
              border-radius: 50%;
              color: #e3bd69;
              background: radial-gradient(circle, rgba(216,167,68,0.17), rgba(216,167,68,0.04));
            }

            .dining-eyebrow {
              margin: 0 0 3px;
              color: #c9973b;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 2.4px;
            }

            .dining-modal-title {
              margin: 0;
              color: #f8e4b0;
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 27px;
              font-weight: 700;
              letter-spacing: 0.2px;
            }

            .dining-title-divider {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              width: 70%;
              margin: 15px auto 13px;
            }

            .dining-title-divider > span:not(.dining-divider-dot) {
              height: 1px;
              flex: 1;
              background: linear-gradient(90deg, transparent, #c9973b);
            }

            .dining-title-divider > span:last-child {
              background: linear-gradient(90deg, #c9973b, transparent);
            }

            .dining-divider-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #e5bd65;
              box-shadow: 0 0 8px rgba(229,189,101,0.4);
            }

            .dining-modal-subtitle {
              margin: 0 0 22px;
              color: #aab1c0;
              font-size: 12.5px;
              line-height: 1.5;
            }

            .dining-choice-list {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 13px;
            }

            .dining-choice-card {
              position: relative;
              width: 100%;
              min-height: 176px;
              padding: 20px 12px 18px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              border: 1px solid #343444;
              border-radius: 16px;
              background: linear-gradient(145deg, #20212c, #191a24 75%);
              color: #f1f5f9;
              cursor: pointer;
              transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
              overflow: hidden;
            }

            .dining-choice-card:hover {
              border-color: rgba(216,167,68,0.72);
              background: linear-gradient(145deg, #292638, #1b1c26 75%);
              transform: translateY(-2px);
              box-shadow: 0 8px 23px rgba(0,0,0,0.22);
            }

            .dining-choice-card.selected {
              border: 1.5px solid #d8a744;
              background: linear-gradient(145deg, rgba(216,167,68,0.16), #1c1d27 78%);
              box-shadow: inset 0 0 0 1px rgba(216,167,68,0.08), 0 0 20px rgba(216,167,68,0.08);
            }

            .dining-choice-card:focus-visible {
              outline: 2px solid #f0cf7a;
              outline-offset: 3px;
            }

            .dining-choice-check {
              position: absolute;
              top: 10px;
              right: 10px;
              width: 21px;
              height: 21px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid rgba(216,167,68,0.4);
              border-radius: 50%;
              color: #171717;
              background: transparent;
            }

            .dining-choice-card.selected .dining-choice-check {
              background: #d8a744;
            }

            .dining-choice-icon {
              width: 54px;
              height: 54px;
              margin-bottom: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid rgba(216,167,68,0.35);
              border-radius: 15px;
              color: #e0b65d;
              background: rgba(216,167,68,0.09);
            }

            .dining-choice-title {
              display: block;
              margin-bottom: 7px;
              color: #f6e5bd;
              font-size: 15px;
              font-weight: 800;
              line-height: 1.25;
            }

            .dining-choice-description {
              display: block;
              max-width: 190px;
              margin: 0 auto;
              color: #aeb4c1;
              font-size: 11.5px;
              font-weight: 400;
              line-height: 1.5;
            }

            .dining-choice-accent {
              position: absolute;
              bottom: 0;
              left: 25%;
              width: 50%;
              height: 2px;
              border-radius: 99px;
              background: linear-gradient(90deg, transparent, #d8a744, transparent);
              opacity: 0.7;
            }

            .dining-about-trigger {
              width: 100%;
              min-height: 43px;
              margin-top: 15px;
              padding: 9px 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 9px;
              position: relative;
              border: 1px solid rgba(216,167,68,0.38);
              border-radius: 11px;
              background: linear-gradient(110deg, rgba(216,167,68,0.08), rgba(216,167,68,0.025));
              color: #e5bd65;
              font-size: 12.5px;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.2s ease, border-color 0.2s ease;
            }

            .dining-about-trigger:hover {
              border-color: rgba(216,167,68,0.75);
              background: rgba(216,167,68,0.13);
            }

            .dining-about-trigger-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: #d8a744;
            }

            .dining-about-trigger-arrow {
              position: absolute;
              right: 12px;
              color: #81899a;
              font-size: 10px;
              font-weight: 500;
            }

            .dining-modal-footer {
              margin: 14px 0 0;
              color: #737d90;
              font-size: 10.5px;
              line-height: 1.5;
            }

            @media (max-width: 420px) {
              .dining-modal-body {
                padding: 25px 19px 20px;
              }

              .dining-choice-list {
                grid-template-columns: 1fr;
                gap: 11px;
              }

              .dining-choice-card {
                min-height: 145px;
                padding: 16px 12px;
              }

              .dining-choice-icon {
                width: 47px;
                height: 47px;
                margin-bottom: 9px;
              }
            }
          `}</style>
        </div>
      )}

      {/* 7. Modal Tentang Kami */}
      {showAboutModal && (
        <div
          className="about-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAboutModal(false);
          }}
        >
          <div
            className="about-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aboutModalTitle"
          >
            <header className="about-modal-header">
              <div className="about-modal-header-title">
                <span className="about-modal-header-icon">
                  <Coffee size={18} />
                </span>

                <div>
                  <h5 id="aboutModalTitle">Tentang Kami</h5>
                  <p>Billion Cafe · Capstone Project</p>
                </div>
              </div>

              <button
                type="button"
                className="about-modal-close"
                onClick={() => setShowAboutModal(false)}
                aria-label="Tutup Tentang Kami"
              >
                <X size={20} />
              </button>
            </header>

            <div className="about-modal-body">

              {/* Identitas Universitas */}
              <section className="about-identity-card">
                <div className="about-logo-row">
                  <img
                    src="/images/logo-umy.png"
                    alt="Logo Universitas Muhammadiyah Yogyakarta"
                    className="about-umy-logo"
                  />

                  <span className="about-logo-separator" />

                  <img
                    src="/images/logo-ti-umy.png"
                    alt="Logo Teknologi Informasi UMY"
                    className="about-ti-logo"
                  />
                </div>

                <span className="about-project-badge">CAPSTONE PROJECT</span>

                <h2>Billion Cafe</h2>

                <p>
                  Kami merupakan tim pengembang yang merancang dan mengembangkan
                  sistem informasi Billion Cafe sebagai bagian dari Capstone Project.
                  Melalui pengembangan sistem ini, kami berupaya menghadirkan solusi
                  digital yang mendukung proses pemesanan mandiri serta pengelolaan
                  inventaris cafe berbasis web.
                </p>
              </section>

              {/* Foto Bersama Tim */}
              <section className="about-team-section">
                <div className="about-section-heading">
                  <span>OUR TEAM</span>
                  <h4>Tim Pengembang</h4>
                  <p>Bersama membangun inovasi melalui kolaborasi dan teknologi.</p>
                </div>

                <div className="about-team-photo-card">
                  <img
                    src="/images/team-kami.jpg"
                    alt="Foto bersama Tim Pengembang Billion Cafe"
                  />
                </div>
              </section>

              {/* Hubungi Tim Kami */}
              <section className="about-contact-card">
                <div className="about-contact-icon">
                  <Mail size={21} />
                </div>

                <h5>Hubungi Tim Kami</h5>

                <div className="about-gold-divider" />

                <a href="mailto:sarimicapstone@gmail.com">
                  sarimicapstone@gmail.com
                </a>
              </section>

              {/* Ucapan Terima Kasih */}
              <section className="about-thanks-card">
                <div className="about-thanks-icon">
                  <HeartHandshake size={34} strokeWidth={1.6} />
                </div>

                <h4>Ucapan Terima Kasih</h4>

                <p>
                  Segala puji dan syukur kami panjatkan ke hadirat Allah SWT atas
                  rahmat, karunia, kesehatan, dan kemudahan yang telah diberikan
                  sehingga kami dapat menyelesaikan proses pengembangan sistem
                  Billion Cafe ini.
                </p>

                <p>
                  Kami mengucapkan terima kasih kepada orang tua dan keluarga
                  atas doa, kasih sayang, serta dukungan yang tidak pernah
                  berhenti diberikan selama proses pengerjaan proyek ini.
                </p>

                <p>
                  Terima kasih juga kepada teman-teman dan seluruh pihak yang
                  telah memberikan bantuan, semangat, masukan, serta dukungan,
                  baik secara langsung maupun tidak langsung, sehingga proyek
                  ini dapat terselesaikan.
                </p>

                <p>
                  Setiap proses dan tantangan yang kami lalui menjadi pengalaman
                  serta pembelajaran berharga bagi kami. Semoga sistem yang
                  dikembangkan dapat memberikan manfaat dan menjadi langkah
                  kecil dalam mendukung digitalisasi layanan Billion Cafe.
                </p>

                <div className="about-thanks-divider" />

                <h6>With Gratitude,</h6>
                <span>Tim Pengembang Billion Cafe</span>
              </section>

              <footer className="about-modal-footer">
                <p>Billion Cafe · Capstone Project</p>
                <span>Teknologi Informasi · Universitas Muhammadiyah Yogyakarta</span>
              </footer>

            </div>
          </div>

          <style>{`
            /* OVERLAY: background tetap terlihat samar dan blur */
            .about-modal-overlay {
              position: fixed;
              inset: 0;
              z-index: 1080;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 26px 18px;
              overflow-y: auto;
              background: rgba(5,6,10,0.58);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
            }

            /* POPUP: ukuran lebih kecil dan benar-benar mengambang */
            .about-modal-dialog {
              display: flex;
              flex-direction: column;
              width: 100%;
              max-width: 680px;
              max-height: 84vh;
              max-height: 84dvh;
              min-height: 0;
              margin: auto;
              overflow: hidden;
              background: #101116;
              border: 1px solid rgba(216,167,68,0.48);
              border-radius: 22px;
              box-shadow: 0 28px 90px rgba(0,0,0,0.72), 0 0 35px rgba(216,167,68,0.09);
              animation: aboutModalEnter 0.24s ease-out;
            }

            @keyframes aboutModalEnter {
              from {
                opacity: 0;
                transform: translateY(10px) scale(0.985);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .about-modal-header {
              position: relative;
              z-index: 2;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 15px 19px;
              background: #161720;
              border-bottom: 1px solid #292b3a;
            }

            .about-modal-header-title {
              display: flex;
              align-items: center;
              gap: 11px;
              min-width: 0;
            }

            .about-modal-header-icon {
              width: 38px;
              height: 38px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #e3bd69;
              border: 1px solid rgba(216,167,68,0.35);
              border-radius: 11px;
              background: rgba(216,167,68,0.09);
            }

            .about-modal-header h5 {
              margin: 0 0 3px;
              color: #f1f5f9;
              font-size: 15px;
              font-weight: 700;
            }

            .about-modal-header p {
              margin: 0;
              color: #8791a3;
              font-size: 10.5px;
            }

            .about-modal-close {
              width: 36px;
              height: 36px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #cbd5e1;
              background: #222433;
              border: 1px solid #343749;
              border-radius: 10px;
              cursor: pointer;
              transition: background 0.2s ease, color 0.2s ease;
            }

            .about-modal-close:hover {
              color: #fff;
              background: #343749;
            }

            .about-modal-body {
              min-height: 0;
              overflow-y: auto;
              overscroll-behavior: contain;
              padding: 20px;
              scrollbar-width: thin;
              scrollbar-color: #55505a #15161e;
            }

            .about-identity-card,
            .about-contact-card,
            .about-thanks-card {
              background: #161720;
              border: 1px solid #292b3b;
              border-radius: 16px;
            }

            .about-identity-card {
              padding: 25px 22px;
              text-align: center;
              margin-bottom: 22px;
            }

            .about-logo-row {
              display: flex;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap;
              gap: 23px;
              margin-bottom: 20px;
            }

            .about-umy-logo {
              width: 82px;
              height: 82px;
              object-fit: contain;
            }

            .about-ti-logo {
              width: 94px;
              height: 94px;
              object-fit: contain;
            }

            .about-logo-separator {
              width: 1px;
              height: 62px;
              background: #383b4d;
            }

            .about-project-badge {
              display: inline-block;
              padding: 5px 12px;
              margin-bottom: 12px;
              color: #d8a744;
              background: rgba(216,167,68,0.1);
              border: 1px solid rgba(216,167,68,0.3);
              border-radius: 20px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1px;
            }

            .about-identity-card h2 {
              margin: 0 0 10px;
              color: #f1f5f9;
              font-size: 25px;
              font-weight: 700;
            }

            .about-identity-card p {
              max-width: 570px;
              margin: 0 auto;
              color: #94a3b8;
              font-size: 12px;
              line-height: 1.85;
            }

            .about-team-section {
              margin-bottom: 22px;
            }

            .about-section-heading {
              margin-bottom: 13px;
              text-align: center;
            }

            .about-section-heading > span {
              color: #d8a744;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.5px;
            }

            .about-section-heading h4 {
              margin: 5px 0 6px;
              color: #f1f5f9;
              font-size: 19px;
              font-weight: 700;
            }

            .about-section-heading p {
              margin: 0;
              color: #94a3b8;
              font-size: 11.5px;
            }

            .about-team-photo-card {
              padding: 9px;
              overflow: hidden;
              background: #161720;
              border: 1px solid #292b3b;
              border-radius: 16px;
            }

            .about-team-photo-card img {
              display: block;
              width: 100%;
              max-height: 360px;
              min-height: 170px;
              object-fit: cover;
              object-position: center;
              border-radius: 10px;
            }

            .about-contact-card {
              padding: 23px 18px;
              margin-bottom: 22px;
              text-align: center;
            }

            .about-contact-icon {
              width: 43px;
              height: 43px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 12px;
              color: #e0b65d;
              background: rgba(216,167,68,0.1);
              border: 1px solid rgba(216,167,68,0.3);
              border-radius: 13px;
            }

            .about-contact-card h5 {
              margin: 0 0 12px;
              color: #f1f5f9;
              font-size: 17px;
              font-weight: 700;
            }

            .about-gold-divider {
              width: 65px;
              height: 2px;
              margin: 0 auto 13px;
              border-radius: 2px;
              background: linear-gradient(90deg, #9c6e26, #f2d58a, #b6812c);
            }

            .about-contact-card a {
              color: #cbd5e1;
              font-size: 12.5px;
              font-weight: 500;
              text-decoration: none;
              overflow-wrap: anywhere;
            }

            .about-contact-card a:hover {
              color: #e5bd65;
            }

            .about-thanks-card {
              padding: 28px 25px;
              border-color: #38312a;
              text-align: center;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }

            .about-thanks-icon {
              width: 62px;
              height: 62px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 17px;
              color: #d8a744;
              background: rgba(216,167,68,0.12);
              border: 1px solid rgba(216,167,68,0.3);
              border-radius: 50%;
            }

            .about-thanks-card h4 {
              margin: 0 0 17px;
              color: #d8a744;
              font-size: 20px;
              font-weight: 700;
            }

            .about-thanks-card p {
              margin: 0 0 12px;
              color: #cbd5e1;
              font-size: 12px;
              line-height: 1.85;
            }

            .about-thanks-divider {
              width: 55px;
              height: 2px;
              margin: 22px auto 13px;
              background: linear-gradient(90deg, #9c6e26, #f2d58a, #b6812c);
            }

            .about-thanks-card h6 {
              margin: 0 0 5px;
              color: #f1f5f9;
              font-size: 13px;
              font-weight: 700;
            }

            .about-thanks-card > span {
              color: #d8a744;
              font-size: 12px;
              font-weight: 600;
            }

            .about-modal-footer {
              padding: 17px 0 2px;
              text-align: center;
            }

            .about-modal-footer p {
              margin: 0 0 4px;
              color: #64748b;
              font-size: 10px;
            }

            .about-modal-footer span {
              color: #475569;
              font-size: 9px;
            }

            @media (max-width: 520px) {
              .about-modal-overlay {
                align-items: center;
                padding: 24px 17px;
              }

              .about-modal-dialog {
                width: 100%;
                max-height: 80vh;
                max-height: 80dvh;
                border-radius: 19px;
              }

              .about-modal-body {
                padding: 13px;
              }

              .about-identity-card {
                padding: 20px 14px;
              }

              .about-umy-logo {
                width: 68px;
                height: 68px;
              }

              .about-ti-logo {
                width: 78px;
                height: 78px;
              }

              .about-logo-row {
                gap: 15px;
              }

              .about-thanks-card {
                padding: 24px 17px;
              }

              .about-team-photo-card img {
                min-height: 150px;
                max-height: 260px;
              }
            }
          `}</style>
        </div>
      )}

      {/* 8. Modal Riwayat Pesanan */}
      {showHistoryModal && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: 'rgba(0,0,0,0.75)',
            zIndex: 1050,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '440px' }}>
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                borderRadius: '20px',
                color: '#f1f5f9'
              }}
            >
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ color: '#f1f5f9', fontSize: '1.2rem' }}>
                  📜 Riwayat Pesanan
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHistoryModal(false)}
                />
              </div>

              <div className="modal-body p-4">
                {orderHistory.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {orderHistory.slice().reverse().map((item) => (
                      <div
                        key={item.orderId}
                        className="p-3 transition-all"
                        style={{
                          backgroundColor: '#1c1d27',
                          border: '1px solid #282a36',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setShowHistoryModal(false);
                          navigate('/customer/status', {
                            state: {
                              orderId: item.orderId,
                              customerName: item.customerName,
                              tableNumber: item.tableNumber
                            }
                          });
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span
                              style={{
                                backgroundColor: 'rgba(216, 167, 68, 0.2)',
                                color: '#d8a744',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                marginRight: '6px'
                              }}
                            >
                              #{item.orderId}
                            </span>

                            <span
                              style={{
                                backgroundColor: '#222433',
                                color: '#94a3b8',
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              Meja {item.tableNumber}
                            </span>
                          </div>

                          <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {new Date(item.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>
                              Total Pembayaran
                            </span>

                            <span style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem' }}>
                              Rp {parseInt(item.totalAmount || 0, 10).toLocaleString('id-ID')}
                            </span>
                          </div>

                          <span
                            style={{
                              backgroundColor: '#282a36',
                              color: '#cbd5e1',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              border: '1px solid #333647'
                            }}
                          >
                            Lacak Status ⚡
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4" style={{ color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📭</div>
                    <p className="mb-0 small">Belum ada riwayat pesanan dari perangkat ini.</p>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 p-4 pt-0">
                <button
                  className="w-100 border-0 fw-bold py-2"
                  style={{
                    backgroundColor: '#282a36',
                    color: '#cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowHistoryModal(false)}
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

export default Menu;
