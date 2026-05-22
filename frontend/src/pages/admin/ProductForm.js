import React, { useState, useEffect, useCallback } from 'react'; // 1. Tambah useCallback
import api, { API_IMAGE_URL } from '../../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import { notifySuccess, notifyError } from '../../utils/notify';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [categories, setCategories] = useState([]);
  
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

  // State Data Varian
  const [variants, setVariants] = useState([{ name: '', extra_price: 0 }]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  // 2. Gunakan useCallback untuk fetchCategories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories?type=menu');
      setCategories(res.data);
    } catch (err) {
      console.error("Gagal ambil kategori", err);
    }
  }, []);

  // 3. Gunakan useCallback untuk fetchProductData
  // Dependency-nya adalah [id], karena fungsi ini bergantung pada nilai id
  const fetchProductData = useCallback(async () => {
    try {
      // Ambil data detail produk
      const { data: product } = await api.get(`/product/${id}`);
      setName(product.name);
      setCategoryId(product.category_id || '');
      setBasePrice(product.base_price);
      setDescription(product.description || '');
      setCurrentImage(product.image_url);
      setPriceType(product.price_type || 'retail');
      setGrosirPricePerUnit(product.grosir_price_per_unit !== undefined && product.grosir_price_per_unit !== null ? product.grosir_price_per_unit : '');
      setGrosirMinQty(product.grosir_min_qty !== undefined && product.grosir_min_qty !== null ? product.grosir_min_qty : '');

      // Ambil varian
      const { data: allVariants } = await api.get('/product-variant');
      const productVariants = allVariants.filter(v => v.product_id === parseInt(id));
      
      if (productVariants.length > 0) {
        setVariants(productVariants.map(v => ({
          id: v.id,
          name: v.name,
          extra_price: v.extra_price
        })));
      }
    } catch (err) {
      console.error("Gagal ambil data produk", err);
      alert("Gagal memuat data produk");
    }
  }, [id]);

  // 4. Masukkan fungsi ke dependency array useEffect
  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProductData();
    }
  }, [id, fetchCategories, fetchProductData]);

  // ... (Sisa kode handler dan return JSX tetap sama seperti sebelumnya) ...

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariantField = () => {
    setVariants([...variants, { name: '', extra_price: 0 }]);
  };

  const removeVariantField = (index) => {
    const variantToRemove = variants[index];
    if (variantToRemove.id) {
      setDeletedVariantIds([...deletedVariantIds, variantToRemove.id]);
    }
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        if (variant.name.trim() !== '') {
          const payload = {
            product_id: targetProductId,
            name: variant.name,
            extra_price: variant.extra_price
          };

          if (variant.id) {
            await api.put(`/product-variant/${variant.id}`, payload);
          } else {
            await api.post('/product-variant', payload);
          }
        }
      }

      notifySuccess('Data berhasil disimpan!');
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      notifyError('Gagal menyimpan data.');
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{id ? 'Edit Menu' : 'Tambah Menu Baru'}</h4>
          <button className="btn btn-sm btn-light" onClick={() => navigate('/admin/products')}>Kembali</button>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            
            <h5 className="mb-3 text-secondary">Informasi Menu</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nama Menu</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Harga Dasar (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-control" 
                  value={basePrice} 
                  onChange={e => setBasePrice(e.target.value.replace(/[^0-9]/g, ''))} 
                  required 
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Foto Menu</label>
                <input type="file" className="form-control" onChange={e => setImage(e.target.files[0])} accept="image/*" />
                {currentImage && !image && (
                  <div className="mt-2">
                    <small className="text-muted">Gambar saat ini: </small>
                    <img src={`${API_IMAGE_URL}/${currentImage}`} alt="Preview" height="50" className="rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Deskripsi</label>
              <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>

            {(() => {
              const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
              const isBahanBaku = selectedCategory && selectedCategory.name.toLowerCase() === 'bahan baku';
              if (!isBahanBaku) return null;
              return (
                <div className="card p-3 mb-3 bg-light border-0 shadow-sm" style={{ borderRadius: '0.75rem' }}>
                  <h6 className="fw-bold mb-3 text-warning">⚙️ Pengaturan Grosir & Retail</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label small fw-bold text-secondary">Tipe Harga</label>
                      <select className="form-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                        <option value="retail">Retail (Eceran)</option>
                        <option value="grosir">Grosir</option>
                      </select>
                    </div>
                    {priceType === 'grosir' && (
                      <>
                        <div className="col-md-4 mb-3">
                          <label className="form-label small fw-bold text-secondary">Minimal Pembelian Grosir (pcs)</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="form-control" 
                            value={grosirMinQty} 
                            onChange={e => setGrosirMinQty(e.target.value.replace(/[^0-9]/g, ''))} 
                            required
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label small fw-bold text-secondary">Harga Grosir per Unit (Rp)</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="form-control" 
                            value={grosirPricePerUnit} 
                            onChange={e => setGrosirPricePerUnit(e.target.value.replace(/[^0-9]/g, ''))} 
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <hr />

            <h5 className="mb-3 text-secondary">Varian / Opsi Tambahan</h5>
            <p className="small text-muted">Contoh: "Level Pedas", "Extra Kerupuk".</p>
            
            {variants.map((variant, index) => (
              <div key={index} className="row g-2 align-items-center mb-2">
                <div className="col-md-6">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama Varian" 
                    value={variant.name}
                    onChange={e => handleVariantChange(index, 'name', e.target.value)} 
                  />
                </div>
                <div className="col-md-4">
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Harga Tambahan" 
                    value={variant.extra_price}
                    onChange={e => handleVariantChange(index, 'extra_price', e.target.value)} 
                  />
                </div>
                <div className="col-md-2">
                  <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeVariantField(index)}>
                    <i className="bi bi-trash"></i> Hapus
                  </button>
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={addVariantField}>+ Tambah Varian</button>

            <div className="d-grid gap-2 mt-5">
              <button type="submit" className="btn btn-success btn-lg">
                {id ? 'Simpan Perubahan' : 'Simpan Menu Baru'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;