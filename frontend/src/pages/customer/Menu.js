import React, { useState, useEffect } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

    // Setup polling: Auto refresh menu data every 5 seconds
    const interval = setInterval(fetchData, 5000);

    // Load keranjang lama jika ada
    const savedCart = localStorage.getItem('wow_cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    // Simpan nomor meja ke localStorage
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
      console.error("Gagal memuat menu", err);
    }
  };

  // Filter Produk berdasarkan Kategori
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === parseInt(activeCategory));

  // --- Logic Tambah ke Keranjang ---

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
      
      {/* 1. Header Info Meja & Menu (Dark Theme) */}
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

        {/* Tombol Riwayat Pesanan */}
        <button 
          className="d-flex align-items-center gap-1 shadow-sm"
          style={{
            fontSize: '0.78rem',
            fontWeight: '600',
            backgroundColor: '#222433',
            color: '#cbd5e1',
            border: '1px solid #2c2f40',
            borderRadius: '20px',
            padding: '7px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setShowHistoryModal(true)}
        >
          <i className="bi bi-clock-history me-1" style={{ fontSize: '0.85rem' }}></i> Riwayat
        </button>
      </div>

      {/* 2. Kategori Filter (Pills Bar) */}
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
                  {/* Foto Produk */}
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

                      {/* Badge HABIS */}
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

                    {/* Informasi Produk */}
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
                      
                      {/* Sub-keterangan Grosir jika ada */}
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

                  {/* Tombol Tambah */}
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

      {/* 5. Modal Detail Produk (Dark Theme) */}
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
                
                {/* Informasi Promo Grosir */}
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
                      Beli min {selectedProduct.grosir_min_qty} pcs: <strong style={{ color: '#d8a744' }}>Rp {parseInt(selectedProduct.grosir_price_per_unit, 10).toLocaleString('id-ID')}</strong>/pcs
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                      Harga Satuan Normal: Rp {parseInt(selectedProduct.base_price, 10).toLocaleString('id-ID')}/pcs
                    </div>
                  </div>
                )}
                
                {/* Opsi Varian Tambahan */}
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

                {/* Catatan Khusus */}
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

                {/* Counter Jumlah */}
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

              {/* Tombol Simpan ke Keranjang */}
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
                  Tambah ke Pesanan • Rp {((getProductUnitPrice(selectedProduct, orderQty) + selectedVariants.reduce((t,v)=>t+parseFloat(v.extra_price),0)) * orderQty).toLocaleString('id-ID')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Pilihan Tipe Pesanan (Dine In / Take Away) */}
      {showDiningModal && (
        <div 
          className="modal show d-block" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1060,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div 
              className="modal-content border-0 shadow-lg mx-3"
              style={{
                backgroundColor: '#161720',
                border: '1px solid #23253a',
                borderRadius: '20px',
                overflow: 'hidden',
                color: '#f1f5f9'
              }}
            >
              <div className="modal-body p-4 text-center">
                <h5 className="fw-bold mb-1" style={{ color: '#f1f5f9' }}>
                  Selamat Datang di Billion Cafe
                </h5>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '20px' }}>
                  Silakan pilih metode pelayanan untuk pesanan Anda:
                </p>
                
                <div className="d-grid gap-3">
                  {/* Pilihan Dine In */}
                  <div 
                    className="p-3 text-start transition-all"
                    style={{
                      borderRadius: '14px',
                      border: diningMethod === 'dine-in' ? '1.5px solid #d8a744' : '1px solid #282a36',
                      backgroundColor: diningMethod === 'dine-in' ? 'rgba(216, 167, 68, 0.12)' : '#1c1d27',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectDiningMethod('dine-in')}
                  >
                    <div>
                      <h6 className="fw-bold mb-1" style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>
                        Makan di Sini
                      </h6>
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Disajikan langsung di Meja {tableNumber}
                      </small>
                    </div>
                  </div>

                  {/* Pilihan Take Away */}
                  <div 
                    className="p-3 text-start transition-all"
                    style={{
                      borderRadius: '14px',
                      border: diningMethod === 'takeaway' ? '1.5px solid #d8a744' : '1px solid #282a36',
                      backgroundColor: diningMethod === 'takeaway' ? 'rgba(216, 167, 68, 0.12)' : '#1c1d27',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectDiningMethod('takeaway')}
                  >
                    <div>
                      <h6 className="fw-bold mb-1" style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>
                        Bawa Pulang
                      </h6>
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Dibungkus rapi untuk dibawa pulang
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Riwayat Pesanan */}
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
