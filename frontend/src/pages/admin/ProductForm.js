import React, { useState, useEffect, useCallback } from 'react';
import api, { API_IMAGE_URL } from '../../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { notifySuccess, notifyError } from '../../utils/notify';
import { ArrowLeft, Plus, Trash2, AlertCircle, Eye, X, ZoomIn, Upload } from 'lucide-react';

const cleanNumericValue = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  if (/^\d+\.00$/.test(str)) {
    return str.replace(/\.00$/, '');
  }
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
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [imageMeta, setImageMeta] = useState(null);
  const [priceType, setPriceType] = useState('retail');
  const [grosirPricePerUnit, setGrosirPricePerUnit] = useState('');
  const [grosirMinQty, setGrosirMinQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
      if (product.image_url) {
        setPreviewUrl(`${API_IMAGE_URL}/${product.image_url}`);
      }
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
    if (errors[`variant_name_${index}`] || errors[`variant_price_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`variant_name_${index}`]: null,
        [`variant_price_${index}`]: null
      }));
    }
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
    if (errors[`recipe_inv_${index}`] || errors[`recipe_qty_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`recipe_inv_${index}`]: null,
        [`recipe_qty_${index}`]: null
      }));
    }
  };

  const addRecipeField = () => {
    setRecipes([...recipes, { inventory_id: '', quantity_required: '' }]);
  };

  const removeRecipeField = (index) => {
    const newRecipes = recipes.filter((_, i) => i !== index);
    setRecipes(newRecipes);
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageMeta({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (currentImage) {
      setPreviewUrl(`${API_IMAGE_URL}/${currentImage}`);
    } else {
      setPreviewUrl('');
    }
    setImageMeta(null);
    const fileInput = document.getElementById('menu-image-input');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Validasi Nama Menu
    if (!name || !name.trim()) {
      newErrors.name = 'Nama menu wajib diisi';
    } else if (name.trim().length > 15) {
      newErrors.name = 'Nama menu tidak boleh melebihi 15 huruf';
    }

    // 2. Validasi Kategori Menu
    if (!categoryId) {
      newErrors.categoryId = 'Kategori menu wajib dipilih';
    }

    // 3. Validasi Harga Dasar
    if (basePrice === '' || basePrice === null || basePrice === undefined) {
      newErrors.basePrice = 'Harga dasar wajib diisi';
    } else if (Number(basePrice) <= 0) {
      newErrors.basePrice = 'Harga dasar harus lebih besar dari Rp 0';
    }

    // 4. Validasi Grosir jika Kategori Bahan Baku
    const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
    const isBahanBaku = selectedCategory && selectedCategory.name.toLowerCase() === 'bahan baku';
    if (isBahanBaku && priceType === 'grosir') {
      if (!grosirMinQty || Number(grosirMinQty) < 2) {
        newErrors.grosirMinQty = 'Minimal pembelian grosir minimal 2 pcs';
      }
      if (!grosirPricePerUnit || Number(grosirPricePerUnit) <= 0) {
        newErrors.grosirPricePerUnit = 'Harga grosir per unit harus lebih besar dari Rp 0';
      }
    }

    // 5. Validasi Varian Tambahan
    variants.forEach((v, idx) => {
      const vName = String(v.name || '').trim();
      const vPrice = v.extra_price !== '' && v.extra_price !== null && v.extra_price !== undefined ? Number(v.extra_price) : null;
      if (vName.length > 15) {
        newErrors[`variant_name_${idx}`] = 'Nama varian maksimal 15 huruf';
      }
      if (vPrice !== null && vPrice < 0) {
        newErrors[`variant_price_${idx}`] = 'Harga ekstra varian tidak boleh bernilai negatif';
      }
      if (vPrice !== null && vPrice > 0 && !vName) {
        newErrors[`variant_name_${idx}`] = 'Nama varian wajib diisi jika harga ekstra diisi';
      }
    });

    // 6. Validasi Resep
    recipes.forEach((r, idx) => {
      if (r.inventory_id && (!r.quantity_required || Number(r.quantity_required) <= 0)) {
        newErrors[`recipe_qty_${idx}`] = 'Jumlah takaran per porsi harus lebih dari 0';
      }
      if (!r.inventory_id && r.quantity_required && Number(r.quantity_required) > 0) {
        newErrors[`recipe_inv_${idx}`] = 'Pilih bahan inventori untuk takaran resep';
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorMessage = Object.values(validationErrors)[0];
      notifyError(firstErrorMessage || 'Mohon lengkapi field wajib dengan benar');
      return;
    }

    setErrors({});
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
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere'
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            
            {/* Section 1: Informasi Menu */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <span style={{ width: '4px', height: '18px', backgroundColor: '#d8a744', borderRadius: '2px' }}></span>
              <h5 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', margin: 0 }}>
                Informasi Menu
              </h5>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Nama Menu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '11px', color: name.length >= 15 ? '#e5bd65' : '#64748b', fontWeight: '600' }}>
                    {name.length}/15 huruf
                  </span>
                </div>
                <input 
                  type="text" 
                  style={{
                    ...inputStyle,
                    ...(errors.name ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                  }}
                  placeholder="Contoh: Es Kopi Susu"
                  value={name} 
                  maxLength={15}
                  onChange={e => {
                    setName(e.target.value.slice(0, 15));
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }} 
                />
                {errors.name && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>
                  Kategori Menu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  style={{
                    ...inputStyle,
                    ...(errors.categoryId ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                  }}
                  value={categoryId} 
                  onChange={e => {
                    setCategoryId(e.target.value);
                    if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: null }));
                  }} 
                >
                  <option value="" style={{ backgroundColor: '#1c1d27', color: '#94a3b8' }}>-- Pilih Kategori Menu --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1c1d27', color: '#f1f5f9' }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span>{errors.categoryId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label style={labelStyle}>
                  Harga Dasar (Rp) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  style={{
                    ...inputStyle,
                    ...(errors.basePrice ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                  }}
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
                    if (errors.basePrice) setErrors(prev => ({ ...prev, basePrice: null }));
                  }} 
                  maxLength={16}
                />
                {errors.basePrice && (
                  <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span>{errors.basePrice}</span>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Foto Menu</label>
                
                {previewUrl ? (
                  <div 
                    style={{
                      backgroundColor: '#1c1d27',
                      border: '1px solid #282a36',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}
                  >
                    {/* Thumbnail yang bisa diklik untuk pratinjau penuh */}
                    <div 
                      onClick={() => setPreviewModalOpen(true)}
                      title="Klik untuk melihat pratinjau foto penuh"
                      style={{
                        position: 'relative',
                        width: '74px',
                        height: '74px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid rgba(216, 167, 68, 0.4)',
                        flexShrink: 0,
                        backgroundColor: '#0d0d12'
                      }}
                    >
                      <img 
                        src={previewUrl} 
                        alt="Pratinjau Foto" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                      >
                        <ZoomIn size={20} color="#fff" />
                      </div>
                    </div>

                    {/* Info Foto & Tombol Aksi */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span 
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: image ? '#4ade80' : '#e5c165',
                            backgroundColor: image ? 'rgba(34, 197, 94, 0.12)' : 'rgba(216, 167, 68, 0.12)',
                            border: image ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(216, 167, 68, 0.25)',
                            padding: '2px 7px',
                            borderRadius: '4px'
                          }}
                        >
                          {image ? '✨ Foto Baru Dipilih' : 'Foto Saat Ini'}
                        </span>
                        {imageMeta?.size && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({imageMeta.size})</span>
                        )}
                      </div>
                      <div 
                        style={{
                          fontSize: '12.5px',
                          color: '#e2e8f0',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '8px'
                        }}
                        title={image ? image.name : currentImage}
                      >
                        {image ? image.name : currentImage}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          style={{
                            backgroundColor: 'rgba(216, 167, 68, 0.15)',
                            border: '1px solid rgba(216, 167, 68, 0.35)',
                            color: '#e5c165',
                            borderRadius: '6px',
                            padding: '4px 9px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={12} />
                          Pratinjau
                        </button>

                        <label
                          htmlFor="menu-image-input"
                          style={{
                            backgroundColor: '#282a36',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            borderRadius: '6px',
                            padding: '4px 9px',
                            fontSize: '11.5px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            margin: 0
                          }}
                        >
                          <Upload size={12} />
                          Ganti
                        </label>

                        {image && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '4px 9px',
                              fontSize: '11.5px',
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <input 
                      id="menu-image-input"
                      type="file" 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <label 
                    htmlFor="menu-image-input"
                    style={{
                      border: '1.5px dashed #334155',
                      backgroundColor: '#1c1d27',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#94a3b8',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      margin: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#d8a744';
                      e.currentTarget.style.backgroundColor = 'rgba(216, 167, 68, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.backgroundColor = '#1c1d27';
                    }}
                  >
                    <div 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(216, 167, 68, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d8a744'
                      }}
                    >
                      <Upload size={18} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: '#e5c165', fontWeight: '600', fontSize: '13px' }}>
                        Pilih foto menu
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', marginTop: '2px' }}>
                        Mendukung format JPG, PNG, WEBP
                      </span>
                    </div>
                    <input 
                      id="menu-image-input"
                      type="file" 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label style={labelStyle}>Deskripsi</label>
              <textarea 
                rows="3" 
                wrap="soft"
                style={{ 
                  ...inputStyle, 
                  resize: 'vertical',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  overflowX: 'hidden',
                  lineHeight: '1.5'
                }}
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
                          <label style={labelStyle}>
                            Minimal Pembelian Grosir (pcs) <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="5"
                            style={{
                              ...inputStyle,
                              ...(errors.grosirMinQty ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                            }}
                            value={grosirMinQty} 
                            onFocus={(e) => {
                              if (e.target.value === '0') setGrosirMinQty('');
                              else e.target.select();
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                              setGrosirMinQty(val);
                              if (errors.grosirMinQty) setErrors(prev => ({ ...prev, grosirMinQty: null }));
                            }} 
                          />
                          {errors.grosirMinQty && (
                            <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} color="#ef4444" />
                              <span>{errors.grosirMinQty}</span>
                            </div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label style={labelStyle}>
                            Harga Grosir per Unit (Rp) <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            style={{
                              ...inputStyle,
                              ...(errors.grosirPricePerUnit ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                            }}
                            value={grosirPricePerUnit} 
                            onFocus={(e) => {
                              if (e.target.value === '0') setGrosirPricePerUnit('');
                              else e.target.select();
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length > 1 && val.startsWith('0')) val = val.replace(/^0+/, '');
                              setGrosirPricePerUnit(val);
                              if (errors.grosirPricePerUnit) setErrors(prev => ({ ...prev, grosirPricePerUnit: null }));
                            }} 
                            maxLength={16}
                          />
                          {errors.grosirPricePerUnit && (
                            <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} color="#ef4444" />
                              <span>{errors.grosirPricePerUnit}</span>
                            </div>
                          )}
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
                          style={{
                            ...inputStyle,
                            ...(errors[`recipe_inv_${index}`] ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                          }}
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
                              borderBottomRightRadius: 0,
                              ...(errors[`recipe_qty_${index}`] ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
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
                    {(errors[`recipe_inv_${index}`] || errors[`recipe_qty_${index}`]) && (
                      <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} color="#ef4444" />
                        <span>{errors[`recipe_inv_${index}`] || errors[`recipe_qty_${index}`]}</span>
                      </div>
                    )}
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
                        maxLength={15}
                        onChange={e => handleVariantChange(index, 'name', e.target.value.slice(0, 15))} 
                        style={{
                          ...inputStyle,
                          ...(errors[`variant_name_${index}`] ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
                        }}
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
                            borderBottomLeftRadius: 0,
                            ...(errors[`variant_price_${index}`] ? { border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' } : {})
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
                  {(errors[`variant_name_${index}`] || errors[`variant_price_${index}`]) && (
                    <div style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} color="#ef4444" />
                      <span>{errors[`variant_name_${index}`] || errors[`variant_price_${index}`]}</span>
                    </div>
                  )}
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

      {/* Lightbox / Modal Pratinjau Foto Penuh */}
      {previewModalOpen && previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#161822',
              border: '1px solid rgba(216, 167, 68, 0.35)',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid #232530',
                backgroundColor: '#12131b'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <Eye size={17} color="#d8a744" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
                  Pratinjau Foto Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                style={{
                  background: '#202230',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = '#2a2d3f'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = '#202230'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Container Foto */}
            <div
              style={{
                padding: '24px',
                backgroundColor: '#0a0a0e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '65vh'
              }}
            >
              <img
                src={previewUrl}
                alt="Pratinjau Foto Menu Penuh"
                style={{
                  maxWidth: '100%',
                  maxHeight: '55vh',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                }}
              />
            </div>

            {/* Footer Modal */}
            <div
              className="d-flex justify-content-between align-items-center"
              style={{
                padding: '14px 22px',
                borderTop: '1px solid #232530',
                backgroundColor: '#14151e'
              }}
            >
              <div style={{ fontSize: '12.5px', color: '#94a3b8', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📷 {image ? image.name : currentImage} {imageMeta?.size && `(${imageMeta.size})`}
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                style={{
                  backgroundColor: '#d8a744',
                  border: 'none',
                  color: '#101116',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;