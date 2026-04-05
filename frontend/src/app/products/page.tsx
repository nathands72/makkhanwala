'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FiSearch, FiShoppingCart, FiFilter, FiEdit, FiTrash2, FiPlus, FiX, FiImage, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '@/lib/api';
import type { Product, ProductListResponse } from '@/lib/types';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const { addToCart } = useCartStore();
    const { isAuthenticated, user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), page_size: '12' });
            if (search) params.set('search', search);
            const res = await api.get<ProductListResponse>(`/api/products?${params}`);
            setProducts(res.data.products);
            setTotalPages(res.data.total_pages);
            setTotal(res.data.total);
        } catch {
            toast.error('Failed to load products');
        }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleAddToCart = async (productId: string) => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            return;
        }
        try {
            await addToCart(productId);
            toast.success('Added to cart! 🧈');
        } catch {
            toast.error('Failed to add to cart');
        }
    };

    const handleImageSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5 MB');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async (productId: string): Promise<void> => {
        if (!imageFile) return;
        setImageUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            await api.post(`/api/admin/products/${productId}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch {
            toast.error('Product saved, but image upload failed');
        } finally {
            setImageUploading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const handleSaveProduct = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProduct?.name || editingProduct.price === undefined || editingProduct.stock === undefined || !editingProduct.weight) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (editingProduct.id) {
                await api.put(`/api/admin/products/${editingProduct.id}`, editingProduct);
                if (imageFile) await uploadImage(editingProduct.id);
                toast.success('Product updated!');
            } else {
                const res = await api.post<{ id: string }>('/api/admin/products', editingProduct);
                if (imageFile) await uploadImage(res.data.id);
                toast.success('Product created!');
            }
            closeModal();
            fetchProducts();
        } catch {
            toast.error('Failed to save product');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/api/admin/products/${id}`);
            toast.success('Product deleted!');
            fetchProducts();
        } catch {
            toast.error('Failed to delete product');
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Our Products</h1>
                    <p style={{ color: '#6B7280', fontSize: 16 }}>Fresh butter, made with love. {total} products available.</p>
                </div>
                {isAdmin && (
                    <button
                        className="btn-primary"
                        onClick={() => { setEditingProduct({ is_active: true, stock: 10, weight: 500 }); setIsModalOpen(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}
                    >
                        <FiPlus size={20} /> Add Product
                    </button>
                )}
            </div>

            {/* Search */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FiSearch size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                        className="input-field" placeholder="Search butter products..."
                        style={{ paddingLeft: 44 }}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <button className="btn-secondary" style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px',
                }}>
                    <FiFilter size={16} /> Filter
                </button>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 360, borderRadius: 16 }} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
                    <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#4B5563' }}>No products found</p>
                    <p style={{ fontSize: 14 }}>Try adjusting your search or filters</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                    {products.map((product, i) => (
                        <div key={product.id} className="glass-card animate-fadeup" style={{
                            overflow: 'hidden', animationDelay: `${i * 0.05}s`, opacity: 0,
                        }}>
                            {/* Product Image */}
                            <div style={{
                                height: 200,
                                background: `linear-gradient(135deg, #FFF9E0, #FFF3C4)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 64, position: 'relative', overflow: 'hidden',
                            }}>
                                {product.image_url ? (
                                    <Image
                                        src={getImageUrl(product.image_url)!}
                                        alt={product.name}
                                        fill
                                        unoptimized
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <span>🧈</span>
                                )}
                                {isAdmin && (
                                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, zIndex: 1 }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setIsModalOpen(true); }}
                                            style={{ background: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            title="Edit Product"
                                        ><FiEdit size={16} color="#3B82F6" /></button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                                            style={{ background: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            title="Delete Product"
                                        ><FiTrash2 size={16} color="#EF4444" /></button>
                                    </div>
                                )}
                                {product.stock <= 10 && product.stock > 0 && (
                                    <span className="badge badge-warning" style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                                        Low Stock
                                    </span>
                                )}
                                {product.stock === 0 && (
                                    <span className="badge badge-error" style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '20px 24px 24px' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1A1A1A' }}>
                                    {product.name}
                                </h3>
                                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
                                    {product.description?.slice(0, 80)}{product.description && product.description.length > 80 ? '...' : ''}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A' }}>₹{product.price}</span>
                                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>{product.weight}g</span>
                                </div>
                                <button
                                    className="btn-primary"
                                    disabled={product.stock === 0}
                                    onClick={() => handleAddToCart(product.id)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        opacity: product.stock === 0 ? 0.5 : 1,
                                    }}
                                >
                                    <FiShoppingCart size={16} />
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            style={{
                                width: 40, height: 40, borderRadius: 10,
                                border: page === i + 1 ? '2px solid var(--butter-400)' : '2px solid #E5E7EB',
                                background: page === i + 1 ? 'var(--butter-100)' : 'white',
                                color: page === i + 1 ? 'var(--butter-700)' : '#6B7280',
                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Admin Product Modal */}
            {isModalOpen && editingProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="glass-card" style={{
                        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
                        padding: 32, position: 'relative', background: 'white',
                        borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                    }}>
                        <button
                            onClick={closeModal}
                            style={{ position: 'absolute', top: 20, right: 20, background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', transition: 'background 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}
                        ><FiX size={18} /></button>

                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, color: '#111827' }}>
                            {editingProduct.id ? '✏️ Edit Product' : '➕ Add New Product'}
                        </h2>

                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* ── Image Upload Zone ── */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>
                                    <FiImage size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Product Image
                                </label>
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
                                    style={{
                                        border: isDragOver ? '2px dashed #F59E0B' : '2px dashed #D1D5DB',
                                        borderRadius: 14,
                                        background: isDragOver ? '#FFFBEB' : '#F9FAFB',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        minHeight: 140,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {/* Preview */}
                                    {(imagePreview || editingProduct.image_url) ? (
                                        <>
                                            <Image
                                                src={imagePreview ?? getImageUrl(editingProduct.image_url)!}
                                                alt="Product preview"
                                                fill
                                                unoptimized
                                                style={{ objectFit: 'cover', opacity: isDragOver ? 0.5 : 1, transition: 'opacity 0.2s' }}
                                                sizes="560px"
                                            />
                                            {/* Hover overlay */}
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(0,0,0,0.45)',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                opacity: 0, transition: 'opacity 0.2s',
                                                color: 'white', gap: 6,
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                            >
                                                <FiUploadCloud size={28} />
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>Change image</span>
                                            </div>
                                            {/* Remove button */}
                                            {imagePreview && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setImageFile(null); URL.revokeObjectURL(imagePreview); setImagePreview(null); }}
                                                    style={{
                                                        position: 'absolute', top: 8, right: 8,
                                                        background: 'rgba(0,0,0,0.6)', border: 'none',
                                                        borderRadius: '50%', width: 28, height: 28,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', color: 'white', zIndex: 2,
                                                    }}
                                                ><FiX size={14} /></button>
                                            )}
                                        </>
                                    ) : (
                                        /* Empty state */
                                        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#9CA3AF' }}>
                                            <FiUploadCloud size={36} style={{ marginBottom: 8, color: isDragOver ? '#F59E0B' : '#D1D5DB' }} />
                                            <p style={{ fontSize: 14, fontWeight: 600, color: isDragOver ? '#92400E' : '#6B7280', marginBottom: 4 }}>
                                                {isDragOver ? 'Drop to upload' : 'Click or drag & drop'}
                                            </p>
                                            <p style={{ fontSize: 12, color: '#9CA3AF' }}>PNG, JPG, WebP up to 5 MB</p>
                                        </div>
                                    )}
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ''; }}
                                    />
                                </div>
                                {imageFile && (
                                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
                                        📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB) — will upload on save
                                    </p>
                                )}
                            </div>

                            {/* ── Text Fields ── */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Name *</label>
                                <input
                                    className="input-field" required
                                    placeholder="e.g. Amul Gold Butter"
                                    value={editingProduct.name || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Description</label>
                                <textarea
                                    className="input-field" rows={3}
                                    placeholder="Brief description of the product..."
                                    value={editingProduct.description || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Price (₹) *</label>
                                    <input
                                        className="input-field" type="number" required min="0" step="0.01"
                                        placeholder="0.00"
                                        value={editingProduct.price ?? ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Weight (g) *</label>
                                    <input
                                        className="input-field" type="number" required min="0"
                                        placeholder="500"
                                        value={editingProduct.weight ?? ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, weight: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Stock *</label>
                                    <input
                                        className="input-field" type="number" required min="0"
                                        placeholder="0"
                                        value={editingProduct.stock ?? ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>Status</label>
                                    <select
                                        className="input-field"
                                        value={editingProduct.is_active ? 'true' : 'false'}
                                        onChange={e => setEditingProduct({ ...editingProduct, is_active: e.target.value === 'true' })}
                                    >
                                        <option value="true">✅ Active</option>
                                        <option value="false">🚫 Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Actions ── */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '12px 0' }}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={imageUploading}
                                    style={{ flex: 2, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    {imageUploading ? (
                                        <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Uploading image...</>
                                    ) : (
                                        editingProduct.id ? '💾 Save Changes' : '✨ Create Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
