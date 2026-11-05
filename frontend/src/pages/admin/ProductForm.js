import React, { useState, useEffect, useCallback } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { notifySuccess, notifyError } from '../../utils/notify';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const cleanNumericValue = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return '';
  return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(4)));
};

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [categories, setCategories] = useState([]);
  const [inventories, setInventories] = useState([]);
  
  // State Data Produk
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [priceType, setPriceType] = useState('retail');
  const [grosirPricePerUnit, setGrosirPricePerUnit] = useState('');
  const [grosirMinQty, setGrosirMinQty] = useState('');
  const [saving, setSaving] = useState(false);

  // State Data Varian & Resep
  const [variants, setVariants] = useState([{ name: '', extra_price: '' }]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);
  const [recipes, setRecipes] = useState([{ inventory_id: '', quantity_required: '' }]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories?type=menu');
      const menuCategories = (res.data || []).filter(c => !c.type || c.type === 'menu');
      setCategories(menuCategories);
    } catch (err) {
      console.error("Gagal ambil kategori menu", err);
    }
  }, []);

  const fetchInventories = useCallback(async () => {
    try {
      const res = await api.get('/inventory');
      setInventories(res.data);
    } catch (err) {
      console.error("Gagal ambil data inventori", err);
    }
  }, []);

  const fetchProductData = useCallback(async () => {
    try {
      const { data: product } = await api.get(`/product/${id}`);
      setName(product.name);
      setCategoryId(product.category_id || '');
      setBasePrice(cleanNumericValue(product.base_price));
      setDescription(product.description || '');
      setCurrentImage(product.image_url);
      setPriceType(product.price_type || 'retail');
      setGrosirPricePerUnit(cleanNumericValue(product.grosir_price_per_unit));
      setGrosirMinQty(cleanNumericValue(product.grosir_min_qty));

      const { data: allVariants } = await api.get('/product-variant');
      const productVariants = allVariants.filter(v => v.product_id === parseInt(id));
      
      if (productVariants.length > 0) {
        setVariants(productVariants.map(v => ({
          id: v.id,
          name: v.name,
          extra_price: cleanNumericValue(v.extra_price)
        })));
      }

      try {
        const { data: recipeData } = await api.get(`/product-recipe/${id}`);
        if (recipeData && recipeData.length > 0) {
          setRecipes(recipeData.map(r => ({
            inventory_id: r.inventory_id,
            quantity_required: cleanNumericValue(r.quantity_required)
          })));
        }
      } catch (rErr) {
        console.error("Gagal ambil resep produk", rErr);
      }
    } catch (err) {
      console.error("Gagal ambil data produk", err);
      notifyError("Gagal memuat data produk");
    }
  }, [id]);

  useEffect(() => {
    fetchCategories();
    fetchInventories();
    if (id) {
      fetchProductData();
    }
  }, [id, fetchCategories, fetchInventories, fetchProductData]);

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariantField = () => {
    setVariants([...variants, { name: '', extra_price: '' }]);
  };

  const removeVariantField = (index) => {
    const variantToRemove = variants[index];
    if (variantToRemove.id) {
      setDeletedVariantIds([...deletedVariantIds, variantToRemove.id]);
    }
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipes = [...recipes];
    newRecipes[index][field] = value;
    setRecipes(newRecipes);
  };

  const addRecipeField = () => {
    setRecipes([...recipes, { inventory_id: '', quantity_required: '' }]);
  };

  const removeRecipeField = (index) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(newRecipes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId);
    formData.append('base_price', basePrice);
    formData.append('description', description);
    formData.append('is_available', 1);
    formData.append('price_type', priceType);
    formData.append('grosir_price_per_unit', priceType === 'grosir' ? (Number(grosirPricePerUnit) || 0) : 0);
    formData.append('grosir_min_qty', priceType === 'grosir' ? (Number(grosirMinQty) || 0) : 0);
    
    if (image) {
      formData.append('image', image);
    } else if (currentImage && !image) {
      formData.append('image_url', currentImage);
    } else {
      formData.append('image_url', '');
    }

    try {
      let targetProductId = id;

      if (id) {
        await api.put(`/product/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const res = await api.post('/product', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        targetProductId = res.data.id;
      }

      for (const varId of deletedVariantIds) {
        await api.delete(`/product-variant/${varId}`);
      }

      for (const variant of variants) {
        if (variant.name && variant.name.trim() !== '') {
          const payload = {
            product_id: Number(targetProductId),
            name: variant.name.trim(),
            extra_price: Number(variant.extra_price) || 0
          };

          if (variant.id) {
            await api.put(`/product-variant/${variant.id}`, payload);
          } else {
            await api.post('/product-variant', payload);
          }
        }
      }

      const validRecipes = recipes.filter(r => r.inventory_id && Number(r.quantity_required) > 0);
      await api.put(`/product-recipe/${targetProductId}`, { recipes: validRecipes });

      notifySuccess('Data berhasil disimpan!');
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      notifyError(err?.response?.data?.error || err?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#1c1d27',
    border: '1px solid #282a36',
    color: '#f1f5f9',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13.5px',
    outline: 'none',
    width: '100%'
  };

  const labelStyle = {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <div style={{ backgroundColor: '#101116', color: '#f8fafc', minHeight: '88vh', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '0 12px' }}>
        
        {/* Top Header Bar */}
        <div className="d-flex justify-content-between align-items-center pt-3 pb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '1.45rem', margin: 0 }}>
              {id ? 'Edit Menu' : 'Tambah Menu Baru'}
            </h3>
            <span style={{ color: '#64748b', fontSize: '12.5px' }}>
              Atur detail menu, harga, resep komposisi bahan, dan varian pesanan.
            </span>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            style={{
              backgroundColor: '#161720',
              border: '1px solid #282a36',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#232530'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#161720'; }}
          >
            <ArrowLeft size={15} />
            <span>Kembali</span>
          </button>
        </div>

        {/* Main Card Form */}
        <div 
          style={{
            backgroundColor: '#161720',
            border: '1px solid #232530',
            borderRadius: '14px',
            padding: '28px 30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <form onSubmit={handleSubmit}>
            
            {/* Section 1: Informasi Menu */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <span style={{ width: '4px', height: '18px', backgroundColor: '#d8a744', borderRadius: '2px' }}></span>
              <h5 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                Informasi Menu
              </h5>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label style={labelStyle}>Nama Menu</label>
                <input 
                  type="text" 
                  style={inputStyle}
                  placeholder="Contoh: Es Kopi Susu Gula Aren"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Kategori Menu</label>
                <select 
                  style={inputStyle}
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)} 
                  required
                >
                  <option value="" style={{ backgroundColor: '#1c1d27', color: '#94a3b8' }}>-- Pilih Kategori Menu --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1c1d27', color: '#f1f5f9' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label style={labelStyle}>Harga Dasar (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  style={inputStyle}
                  placeholder="Contoh: 25000"
                  value={basePrice} 
                  onFocus={(e) => {
                    if (e.target.value === '0') setBasePrice('');
                    else e.target.select();
                  }}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                    setBasePrice(val);
                  }} 
                  required 
                />
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Foto Menu</label>
                <div 
                  style={{
                    backgroundColor: '#1c1d27',
                    border: '1px solid #282a36',
                    borderRadius: '8px',
                    padding: '6px 12px'
                  }}
                >
                  <input 
                    type="file" 
                    onChange={e => setImage(e.target.files[0])} 
                    accept="image/*" 
                    style={{ color: '#cbd5e1', fontSize: '12.5px', width: '100%' }}
                  />
                </div>
                {(image || currentImage) && (
                  <div 
                    className="mt-2 d-flex align-items-center gap-3 p-2" 
                    style={{ backgroundColor: '#1c1d27', borderRadius: '8px', border: '1px solid #282a36' }}
                  >
                    <img 
                      src={image ? URL.createObjectURL(image) : `${API_IMAGE_URL}/${currentImage}`} 
                      alt="Preview" 
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} 
                    />
                    <div>
                      <span style={{ fontSize: '11px', color: '#d8a744', fontWeight: '600', textTransform: 'uppercase' }}>
                        {image ? 'Foto Baru Dipilih' : 'Foto Saat Ini'}
                      </span>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {image ? image.name : currentImage}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label style={labelStyle}>Deskripsi</label>
              <textarea 
                rows="2" 
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Tuliskan keterangan singkat tentang menu ini..."
                value={description} 
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Opsi Khusus Grosir & Retail (jika Kategori Bahan Baku) */}
            {(() => {
              const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
              const isBahanBaku = selectedCategory && selectedCategory.name.toLowerCase() === 'bahan baku';
              if (!isBahanBaku) return null;
              return (
                <div 
                  style={{
                    backgroundColor: '#1c1d27',
                    border: '1px solid #3b301c',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}
                >
                  <h6 style={{ color: '#d8a744', fontWeight: '700', fontSize: '13.5px', marginBottom: '14px' }}>
                    ⚙️ Pengaturan Grosir & Retail
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label style={labelStyle}>Tipe Harga</label>
                      <select style={inputStyle} value={priceType} onChange={e => setPriceType(e.target.value)}>
                        <option value="retail" style={{ backgroundColor: '#1c1d27' }}>Retail (Eceran)</option>
                        <option value="grosir" style={{ backgroundColor: '#1c1d27' }}>Grosir</option>
                      </select>
                    </div>
                    {priceType === 'grosir' && (
                      <>
                        <div className="col-md-4">
                          <label style={labelStyle}>Minimal Pembelian Grosir (pcs)</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="5"
                            style={inputStyle}
                            value={grosirMinQty} 
                            onFocus={(e) => {
                              if (e.target.value === '0') setGrosirMinQty('');
                              else e.target.select();
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                              setGrosirMinQty(val);
                            }} 
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label style={labelStyle}>Harga Grosir per Unit (Rp)</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            style={inputStyle}
                            value={grosirPricePerUnit} 
                            onFocus={(e) => {
                              if (e.target.value === '0') setGrosirPricePerUnit('');
                              else e.target.select();
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                              setGrosirPricePerUnit(val);
                            }} 
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <div style={{ borderTop: '1px solid #232530', margin: '28px 0' }}></div>

            {/* Section 2: Komposisi / Resep Bahan Baku */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: '4px', height: '18px', backgroundColor: '#38bdf8', borderRadius: '2px' }}></span>
                <h5 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                  Komposisi / Resep Bahan Baku
                </h5>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '16px' }}>
              Pilih bahan dari inventori yang akan otomatis memotong stok setiap kali menu ini dipesan.
            </p>

            <div className="d-flex flex-column gap-2 mb-3">
              {recipes.map((recipe, index) => {
                const selectedItem = inventories.find(i => i.id === parseInt(recipe.inventory_id));
                return (
                  <div 
                    key={index} 
                    style={{
                      backgroundColor: '#1c1d27',
                      border: '1px solid #282a36',
                      borderRadius: '8px',
                      padding: '12px 14px'
                    }}
                  >
                    <div className="row g-2 align-items-center">
                      <div className="col-md-6">
                        <select 
                          style={inputStyle}
                          value={recipe.inventory_id}
                          onChange={e => handleRecipeChange(index, 'inventory_id', e.target.value)}
                        >
                          <option value="" style={{ backgroundColor: '#1c1d27', color: '#94a3b8' }}>
                            -- Pilih Bahan Baku dari Inventori --
                          </option>
                          {inventories.map(inv => (
                            <option key={inv.id} value={inv.id} style={{ backgroundColor: '#1c1d27', color: '#f1f5f9' }}>
                              {inv.name} (Stok: {inv.stock_available} {inv.stock_unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                          <input 
                            type="number" 
                            step="0.001"
                            placeholder="Jumlah per Porsi" 
                            value={recipe.quantity_required}
                            onFocus={(e) => {
                              if (e.target.value === '0') handleRecipeChange(index, 'quantity_required', '');
                              else e.target.select();
                            }}
                            onChange={e => {
                              let val = e.target.value;
                              if (typeof val === 'string' && val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                val = val.replace(/^0+/, '');
                              }
                              handleRecipeChange(index, 'quantity_required', val);
                            }} 
                            style={{
                              ...inputStyle,
                              width: 'auto',
                              flex: 1,
                              borderTopRightRadius: 0,
                              borderBottomRightRadius: 0
                            }}
                          />
                          <span 
                            style={{
                              backgroundColor: '#282a36',
                              border: '1px solid #282a36',
                              borderLeft: 'none',
                              color: '#cbd5e1',
                              fontSize: '12.5px',
                              padding: '10px 14px',
                              borderTopRightRadius: '8px',
                              borderBottomRightRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {selectedItem ? selectedItem.stock_unit : 'unit'}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <button 
                          type="button" 
                          onClick={() => removeRecipeField(index)}
                          style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.12)',
                            border: '1px solid #7f1d1d',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '9px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            width: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.22)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.12)'; }}
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              type="button" 
              onClick={addRecipeField}
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed #3b3f52',
                color: '#d8a744',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3b3f52'; }}
            >
              <Plus size={14} />
              <span>Tambah Bahan Baku</span>
            </button>

            <div style={{ borderTop: '1px solid #232530', margin: '28px 0' }}></div>

            {/* Section 3: Varian / Opsi Tambahan */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: '4px', height: '18px', backgroundColor: '#a855f7', borderRadius: '2px' }}></span>
                <h5 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                  Varian / Opsi Tambahan
                </h5>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '16px' }}>
              Tambahkan opsi kustomisasi seperti "Level Pedas", "Extra Telur", atau "Less Sugar".
            </p>
            
            <div className="d-flex flex-column gap-2 mb-3">
              {variants.map((variant, index) => (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: '#1c1d27',
                    border: '1px solid #282a36',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div className="row g-2 align-items-center">
                    <div className="col-md-6">
                      <input 
                        type="text" 
                        placeholder="Nama Varian (misal: Extra Keju)" 
                        value={variant.name}
                        onChange={e => handleVariantChange(index, 'name', e.target.value)} 
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-md-4">
                      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                        <span 
                          style={{
                            backgroundColor: '#282a36',
                            border: '1px solid #282a36',
                            borderRight: 'none',
                            color: '#cbd5e1',
                            fontSize: '12.5px',
                            padding: '10px 14px',
                            borderTopLeftRadius: '8px',
                            borderBottomLeftRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          +Rp
                        </span>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={variant.extra_price}
                          onFocus={(e) => {
                            if (e.target.value === '0') handleVariantChange(index, 'extra_price', '');
                            else e.target.select();
                          }}
                          onChange={e => {
                            let val = e.target.value;
                            if (typeof val === 'string' && val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                              val = val.replace(/^0+/, '');
                            }
                            handleVariantChange(index, 'extra_price', val);
                          }} 
                          style={{
                            ...inputStyle,
                            width: 'auto',
                            flex: 1,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <button 
                        type="button" 
                        onClick={() => removeVariantField(index)}
                        style={{
                          backgroundColor: 'rgba(220, 38, 38, 0.12)',
                          border: '1px solid #7f1d1d',
                          color: '#ef4444',
                          borderRadius: '6px',
                          padding: '9px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          width: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.12)'; }}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={addVariantField}
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed #3b3f52',
                color: '#d8a744',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d8a744'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3b3f52'; }}
            >
              <Plus size={14} />
              <span>Tambah Varian</span>
            </button>

            {/* Bottom Submit Action */}
            <div className="mt-5">
              <button 
                type="submit" 
                disabled={saving}
                style={{
                  backgroundColor: '#d8a744',
                  color: '#181920',
                  fontWeight: '700',
                  fontSize: '14px',
                  padding: '13px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(216, 167, 68, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5b34e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#d8a744'; }}
              >
                {saving ? 'Menyimpan...' : (id ? 'Simpan Perubahan Menu' : 'Simpan Menu Baru')}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default ProductForm;