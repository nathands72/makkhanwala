'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiShoppingCart, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
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
    const { isAuthenticated } = useAuthStore();

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

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Our Products</h1>
                <p style={{ color: '#6B7280', fontSize: 16 }}>Fresh butter, made with love. {total} products available.</p>
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
                            {/* Image placeholder */}
                            <div style={{
                                height: 200,
                                background: `linear-gradient(135deg, #FFF9E0, #FFF3C4)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 64, position: 'relative',
                            }}>
                                🧈
                                {product.stock <= 10 && product.stock > 0 && (
                                    <span className="badge badge-warning" style={{ position: 'absolute', top: 12, right: 12 }}>
                                        Low Stock
                                    </span>
                                )}
                                {product.stock === 0 && (
                                    <span className="badge badge-error" style={{ position: 'absolute', top: 12, right: 12 }}>
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
        </div>
    );
}
