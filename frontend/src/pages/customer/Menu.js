import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
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

  useEffect(() => {
    fetchData();
    // Load keranjang lama jika ada
    const savedCart = localStorage.getItem('wow_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, varRes] = await Promise.all([
        api.get('/product'), // <-- PERUBAHAN 1: Ambil SEMUA data (jangan difilter is_available di sini)
        api.get('/categories'),
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

  const addToCart = () => {
    if (!selectedProduct) return;

    const basePrice = parseFloat(selectedProduct.base_price);
    const variantsPrice = selectedVariants.reduce((total, v) => total + parseFloat(v.extra_price), 0);
    const finalPrice = (basePrice + variantsPrice) * orderQty;

    const newItem = {
      tempId: Date.now(),
      product: selectedProduct,
      quantity: orderQty,
      variants: selectedVariants,
      notes: orderNotes,
      totalPrice: finalPrice,
      priceAtOrder: basePrice
    };

    const updatedCart = [...cart, newItem];
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
      <div className="bg-warning p-3 sticky-top shadow-sm d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold">W.O.W Menu</h5>
          <small>Meja No: {tableNumber}</small>
        </div>
      </div>

      {/* Kategori Filter */}
      <div className="d-flex overflow-auto p-2 bg-white border-bottom gap-2" style={{whiteSpace: 'nowrap'}}>
        <button 
          className={`btn btn-sm rounded-pill px-3 ${activeCategory === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
          onClick={() => setActiveCategory('all')}
        >
          Semua
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id} 
            className={`btn btn-sm rounded-pill px-3 ${activeCategory === cat.id ? 'btn-dark' : 'btn-outline-dark'}`}
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
              <div className={`card h-100 border-0 shadow-sm ${!isAvailable ? 'opacity-75 bg-light' : ''}`}>
                
                {/* Image Container */}
                <div style={{height: '120px', overflow: 'hidden', position: 'relative'}} className="bg-secondary rounded-top">
                  {product.image_url ? (
                    <img 
                      src={`${process.env.REACT_APP_API_IMAGE_URL}/${product.image_url}`} 
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
                  <h6 className={`card-title mb-1 ${!isAvailable ? 'text-muted text-decoration-line-through' : ''}`} style={{fontSize: '0.9rem'}}>
                    {product.name}
                  </h6>
                  <p className={`card-text fw-bold mb-0 ${!isAvailable ? 'text-muted' : 'text-warning'}`}>
                    Rp {parseInt(product.base_price).toLocaleString('id-ID')}
                  </p>
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
            className="btn btn-success w-100 py-3 d-flex justify-content-between align-items-center shadow fw-bold"
            onClick={() => navigate('/customer/checkout')}
          >
            <span>🛒 {cartCount} Item</span>
            <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      {/* --- Modal Detail Produk --- */}
      {selectedProduct && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050}}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">{selectedProduct.name}</h5>
                <button className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body">
                {selectedProduct.image_url && (
                  <img src={`${process.env.REACT_APP_API_IMAGE_URL}/${selectedProduct.image_url}`} className="w-100 rounded mb-3" style={{maxHeight: '200px', objectFit: 'cover'}} alt="detail"/>
                )}
                <p className="text-muted small">{selectedProduct.description}</p>
                
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
                  Tambah ke Pesanan - Rp {((parseFloat(selectedProduct.base_price) + selectedVariants.reduce((t,v)=>t+parseFloat(v.extra_price),0)) * orderQty).toLocaleString('id-ID')}
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