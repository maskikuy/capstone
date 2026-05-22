import React, { useState, useEffect } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { notifySuccess } from '../../utils/notify'; // Opsional jika ingin pakai toast saat tambah

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
        api.get('/product'), // <-- PERUBAHAN 1: Ambil SEMUA data (jangan difilter is_available di sini)
        api.get('/categories?type=menu'),
        api.get('/product-variant')
      ]);
      setProducts(prodRes.data); 
      setCategories(catRes.data);
      setProductVariants(varRes.data);
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
    // PERUBAHAN 2: Cegah buka modal jika produk habis
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

    // Helper functions to check identical items
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
      // Item matching exists! Update quantity and recalculate price
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
        priceAtOrder: activeUnitPrice
      };
    } else {
      // New item
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
        priceAtOrder: activeUnitPrice
      };
      updatedCart = [...cart, newItem];
    }

    setCart(updatedCart);
    localStorage.setItem('wow_cart', JSON.stringify(updatedCart));
    localStorage.setItem('wow_table', tableNumber);
    
    // Optional: Feedback visual
    notifySuccess(`${selectedProduct.name} masuk keranjang`);

    setSelectedProduct(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container-fluid p-0 mb-5 pb-5">
      {/* Header */}
      <div className="bg-warning text-white p-3 sticky-top shadow-sm d-flex justify-content-between align-items-center" style={{zIndex: 1020}}>
        <div>
          <h5 className="mb-0 fw-bold">Billion Cafe Menu</h5>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span className="badge bg-white text-dark py-1 px-2" style={{fontSize: '0.75rem', borderRadius: '5px'}}>
              Meja {tableNumber !== '0' ? tableNumber : '-'}
            </span>
            {diningMethod && (
              <span 
                className="badge py-1 px-2 text-white" 
                style={{
                  fontSize: '0.75rem', 
                  borderRadius: '5px', 
                  backgroundColor: diningMethod === 'dine-in' ? '#198754' : '#6c757d',
                  cursor: 'pointer'
                }}
                onClick={() => setShowDiningModal(true)}
              >
                {diningMethod === 'dine-in' ? '🍽️ Makan di Sini' : '🛍️ Bawa Pulang'}
                <i className="bi bi-pencil-square ms-1" style={{fontSize: '0.65rem'}}></i>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kategori Filter */}
      <div className="d-flex overflow-auto p-3 bg-white border-bottom gap-2 hide-scrollbar shadow-sm sticky-top" style={{whiteSpace: 'nowrap', top: '70px', zIndex: 1010}}>
        <button 
          className={`btn btn-sm rounded-pill px-3 ${activeCategory === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setActiveCategory('all')}
        >
          Semua
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition-all ${activeCategory === cat.id ? 'btn-warning text-white shadow-sm' : 'btn-outline-secondary border-0 bg-light'}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Daftar Produk Grid */}
      <div className="row g-3 p-3">
        {filteredProducts.map(product => {
          // Cek ketersediaan untuk styling
          const isAvailable = product.is_available;

          return (
            <div 
              key={product.id} 
              className="col-6 col-md-4 col-lg-3" 
              // PERUBAHAN 3: Hanya bisa diklik jika available
              onClick={() => isAvailable && openProductModal(product)}
              style={{ cursor: isAvailable ? 'pointer' : 'default' }}
            >
              <div className={`card h-100 border-0 ${isAvailable ? 'card-hover-lift' : 'opacity-75 bg-light'}`}>
                
                {/* Image Container */}
                <div style={{height: '120px', overflow: 'hidden', position: 'relative'}} className="bg-secondary rounded-top">
                  {product.image_url ? (
                    <img 
                      src={`${API_IMAGE_URL}/${product.image_url}`} 
                      className={`w-100 h-100 ${!isAvailable ? 'grayscale' : ''}`} 
                      style={{objectFit: 'cover', filter: !isAvailable ? 'grayscale(100%)' : 'none'}} 
                      alt={product.name}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-white small">No Image</div>
                  )}

                  {/* Badge HABIS di atas gambar */}
                  {!isAvailable && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                         style={{backgroundColor: 'rgba(0,0,0,0.4)'}}>
                      <span className="badge bg-danger fs-6 px-3 py-2 border border-white">HABIS</span>
                    </div>
                  )}
                </div>

                <div className="card-body p-2">
                  <h6 className={`card-title mb-1 fw-bold ${!isAvailable ? 'text-muted text-decoration-line-through' : 'text-dark'}`} style={{fontSize: '0.95rem'}}>
                    {product.name}
                  </h6>
                  <p className={`card-text fw-bold mb-0 ${!isAvailable ? 'text-muted' : 'text-warning'}`}>
                    Rp {parseInt(product.base_price).toLocaleString('id-ID')}
                  </p>
                  {product.price_type === 'grosir' && (
                    <div className="text-success small fw-bold mt-1 animate-pulse" style={{ fontSize: '0.75rem' }}>
                      📦 Grosir: Rp {parseInt(product.grosir_price_per_unit).toLocaleString('id-ID')} (min {product.grosir_min_qty} pcs)
                    </div>
                  )}
                </div>
                
                <div className="card-footer p-2 bg-transparent border-0">
                  <button 
                    className={`btn btn-sm w-100 ${isAvailable ? 'btn-outline-warning' : 'btn-secondary disabled'}`}
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

      {/* Floating Cart Button (Hanya muncul jika ada item) */}
      {cart.length > 0 && (
        <div className="fixed-bottom p-3" style={{zIndex: 1040}}>
          <button 
            className="btn btn-cart-pulse text-white w-100 py-3 rounded-pill d-flex justify-content-between align-items-center shadow-lg px-4"
            onClick={() => navigate('/customer/checkout')}
          >
            <span className="fw-bold fs-6">🛒 {cartCount} Item</span>
            <span className="fw-bold fs-5">Rp {cartTotal.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      {/* --- Modal Detail Produk --- */}
      {selectedProduct && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, backdropFilter: 'blur(5px)'}}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{borderRadius: '1.5rem'}}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold fs-4">{selectedProduct.name}</h5>
                <button className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body">
                {selectedProduct.image_url && (
                  <img src={`${API_IMAGE_URL}/${selectedProduct.image_url}`} className="w-100 rounded mb-3" style={{maxHeight: '200px', objectFit: 'cover'}} alt="detail"/>
                )}
                <p className="text-muted small">{selectedProduct.description}</p>
                
                {selectedProduct.price_type === 'grosir' && (
                  <div className={`alert ${orderQty >= selectedProduct.grosir_min_qty ? 'alert-success border-success' : 'alert-info border-info'} py-2 px-3 mb-3 d-flex align-items-center justify-content-between`} style={{ borderRadius: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <strong className="d-block text-dark">🏷️ Promo Grosir Aktif</strong>
                      <span className="text-muted">Beli min {selectedProduct.grosir_min_qty} pcs: Rp {parseInt(selectedProduct.grosir_price_per_unit).toLocaleString('id-ID')}/pcs</span>
                      <br/>
                      <span className="text-muted">Eceran: Rp {parseInt(selectedProduct.base_price).toLocaleString('id-ID')}/pcs</span>
                    </div>
                    {orderQty >= selectedProduct.grosir_min_qty ? (
                      <span className="badge bg-success py-1 px-2 text-white">🎉 Aktif</span>
                    ) : (
                      <span className="badge bg-secondary py-1 px-2 text-white">Kurang {selectedProduct.grosir_min_qty - orderQty} pcs</span>
                    )}
                  </div>
                )}
                
                {productVariants.filter(v => v.product_id === selectedProduct.id).length > 0 && (
                  <div className="mb-3">
                    <label className="fw-bold mb-2">Opsi Tambahan:</label>
                    {productVariants
                      .filter(v => v.product_id === selectedProduct.id)
                      .map(v => (
                        <div key={v.id} className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`var-${v.id}`}
                            checked={selectedVariants.some(sv => sv.id === v.id)}
                            onChange={() => handleVariantToggle(v)}
                          />
                          <label className="form-check-label d-flex justify-content-between" htmlFor={`var-${v.id}`}>
                            <span>{v.name}</span>
                            <span className="text-muted">+Rp {parseInt(v.extra_price).toLocaleString('id-ID')}</span>
                          </label>
                        </div>
                    ))}
                  </div>
                )}

                <div className="mb-3">
                  <label className="fw-bold mb-1">Catatan Khusus</label>
                  <input 
                    type="text" className="form-control" 
                    placeholder="Contoh: Jangan pakai bawang"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center justify-content-center gap-3 mt-4">
                  <button className="btn btn-outline-secondary rounded-circle" 
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))} style={{width:40, height:40}}>-</button>
                  <span className="fs-4 fw-bold">{orderQty}</span>
                  <button className="btn btn-outline-secondary rounded-circle" 
                    onClick={() => setOrderQty(orderQty + 1)} style={{width:40, height:40}}>+</button>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-warning w-100 fw-bold py-2" onClick={addToCart}>
                  Tambah ke Pesanan - Rp {((getProductUnitPrice(selectedProduct, orderQty) + selectedVariants.reduce((t,v)=>t+parseFloat(v.extra_price),0)) * orderQty).toLocaleString('id-ID')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Tipe Pesanan (Dine In / Take Away) */}
      {showDiningModal && (
        <div className="modal show d-block animate-fade-in" style={{backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060, backdropFilter: 'blur(10px)'}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth: '450px'}}>
            <div className="modal-content border-0 shadow-lg text-dark mx-3" style={{borderRadius: '1.5rem', overflow: 'hidden'}}>
              <div className="modal-body p-4 text-center">
                <div className="mb-2" style={{fontSize: '3rem'}}>☕</div>
                <h4 className="fw-bold mb-1">Selamat Datang di Billion Cafe</h4>
                <p className="text-muted small mb-4">Silakan pilih metode pelayanan untuk pesanan Anda:</p>
                
                <div className="d-grid gap-3">
                  {/* Card Dine In */}
                  <div 
                    className="card border-2 p-3 text-start transition-all"
                    style={{
                      borderRadius: '1rem',
                      borderColor: diningMethod === 'dine-in' ? '#ffc107' : '#f1f3f5',
                      backgroundColor: diningMethod === 'dine-in' ? '#fffbe6' : '#f8f9fa',
                      cursor: 'pointer',
                      borderStyle: 'solid'
                    }}
                    onClick={() => handleSelectDiningMethod('dine-in')}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 48, height: 48}}>
                        <i className="bi bi-shop fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">Makan di Sini (Dine In)</h6>
                        <small className="text-muted" style={{fontSize: '0.75rem'}}>Disajikan di piring hangat di meja Anda</small>
                      </div>
                    </div>
                  </div>

                  {/* Card Take Away */}
                  <div 
                    className="card border-2 p-3 text-start transition-all"
                    style={{
                      borderRadius: '1rem',
                      borderColor: diningMethod === 'takeaway' ? '#ffc107' : '#f1f3f5',
                      backgroundColor: diningMethod === 'takeaway' ? '#fffbe6' : '#f8f9fa',
                      cursor: 'pointer',
                      borderStyle: 'solid'
                    }}
                    onClick={() => handleSelectDiningMethod('takeaway')}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 48, height: 48}}>
                        <i className="bi bi-bag-check-fill fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">Bawa Pulang (Take Away)</h6>
                        <small className="text-muted" style={{fontSize: '0.75rem'}}>Dibungkus rapi, praktis dibawa pulang</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;