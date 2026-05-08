import React, { useState, useEffect, useCallback } from 'react'; // 1. Tambah useCallback
import api from '../../utils/api';
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

  // State Data Varian
  const [variants, setVariants] = useState([{ name: '', extra_price: 0 }]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  // 2. Gunakan useCallback untuk fetchCategories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
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
                <input type="number" className="form-control" value={basePrice} onChange={e => setBasePrice(e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Foto Menu</label>
                <input type="file" className="form-control" onChange={e => setImage(e.target.files[0])} accept="image/*" />
                {currentImage && !image && (
                  <div className="mt-2">
                    <small className="text-muted">Gambar saat ini: </small>
                    <img src={`${process.env.REACT_APP_API_IMAGE_URL}/${currentImage}`} alt="Preview" height="50" className="rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Deskripsi</label>
              <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>

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