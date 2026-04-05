'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/api';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const router = useRouter();
    const { cart, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchCart();
    }, [isAuthenticated, fetchCart, router]);

    const handleQuantity = async (itemId: string, newQty: number) => {
        try {
            await updateItem(itemId, newQty);
        } catch { toast.error('Failed to update quantity'); }
    };

    const handleRemove = async (itemId: string) => {
        try {
            await removeItem(itemId);
            toast.success('Item removed');
        } catch { toast.error('Failed to remove item'); }
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '120px 24px' }}>
                <p style={{ fontSize: 64, marginBottom: 16 }}>🛒</p>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h2>
                <p style={{ color: '#6B7280', marginBottom: 32 }}>Add some delicious butter to get started!</p>
                <Link href="/products" className="btn-primary" style={{
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    <FiShoppingBag size={18} /> Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 36 }}>Shopping Cart</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                <div style={{ display: 'grid', gap: 16, gridColumn: '1' }}>
                    {cart.items.map((item) => (
                        <div key={item.id} className="glass-card" style={{
                            padding: 24, display: 'flex', alignItems: 'center', gap: 20,
                        }}>
                            {/* Product thumbnail */}
                            <div style={{
                                width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                                background: 'linear-gradient(135deg, #FFF9E0, #FFF3C4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                                overflow: 'hidden', position: 'relative'
                            }}>
                                {item.product_image ? (
                                    <Image
                                        src={getImageUrl(item.product_image)!}
                                        alt={item.product_name}
                                        fill
                                        unoptimized
                                        style={{ objectFit: 'cover' }}
                                        sizes="80px"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <span>🧈</span>
                                )}
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.product_name}</h3>
                                <p style={{ color: '#6B7280', fontSize: 14 }}>₹{item.unit_price} each</p>
                            </div>

                            {/* Quantity controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    onClick={() => item.quantity > 1 && handleQuantity(item.id, item.quantity - 1)}
                                    disabled={isLoading || item.quantity <= 1}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, border: '2px solid #E5E7EB',
                                        background: 'white', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                ><FiMinus size={14} /></button>
                                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>
                                    {item.quantity}
                                </span>
                                <button
                                    onClick={() => handleQuantity(item.id, item.quantity + 1)}
                                    disabled={isLoading}
                                    style={{
                                        width: 32, height: 32, borderRadius: 8, border: '2px solid #E5E7EB',
                                        background: 'white', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                ><FiPlus size={14} /></button>
                            </div>

                            {/* Subtotal */}
                            <p style={{ fontWeight: 800, fontSize: 18, minWidth: 80, textAlign: 'right' }}>
                                ₹{item.subtotal.toFixed(2)}
                            </p>

                            {/* Remove */}
                            <button onClick={() => handleRemove(item.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#9CA3AF', padding: 8, borderRadius: 8, transition: 'color 0.2s',
                            }}
                                onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                                onMouseOut={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="glass-card" style={{ padding: 32, height: 'fit-content' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Order Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
                        <span style={{ color: '#6B7280' }}>Items ({cart.item_count})</span>
                        <span style={{ fontWeight: 600 }}>₹{cart.total.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
                        <span style={{ color: '#6B7280' }}>Shipping</span>
                        <span style={{ fontWeight: 600, color: '#22C55E' }}>Free</span>
                    </div>
                    <div style={{ borderTop: '2px solid #F3F4F6', margin: '16px 0', paddingTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 18, fontWeight: 700 }}>Total</span>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A' }}>₹{cart.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Link href="/checkout" className="btn-primary" style={{
                        width: '100%', marginTop: 20, textDecoration: 'none', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        Proceed to Checkout <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    );
}
