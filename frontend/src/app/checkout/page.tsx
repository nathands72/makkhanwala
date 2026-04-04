'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiCreditCard, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/lib/store/cart-store';
import { useAuthStore } from '@/lib/store/auth-store';
import type { Order, RazorpayOrder } from '@/lib/types';

const STEPS = ['Address', 'Payment', 'Confirm'];

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, fetchCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const [step, setStep] = useState(0);
    const [address, setAddress] = useState('');
    const [provider, setProvider] = useState<'razorpay' | 'stripe'>('razorpay');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchCart();
    }, [isAuthenticated, fetchCart, router]);

    const handlePlaceOrder = async () => {
        if (!address || address.length < 10) { toast.error('Please enter a valid delivery address'); return; }
        setProcessing(true);
        try {
            const res = await api.post<Order>('/api/orders', {
                delivery_address: address,
                payment_provider: provider,
            });
            const order = res.data;

            if (provider === 'razorpay') {
                // Create Razorpay payment order
                const payRes = await api.post<RazorpayOrder>('/api/payments/create-order', {
                    order_id: order.id,
                    provider: 'razorpay',
                });
                toast.success('Order placed! Payment details generated.');
                router.push(`/orders/${order.id}`);
            } else {
                // For Stripe, redirect to session URL
                const payRes = await api.post('/api/payments/create-order', {
                    order_id: order.id,
                    provider: 'stripe',
                });
                if (payRes.data.url) {
                    window.location.href = payRes.data.url;
                } else {
                    router.push(`/orders/${order.id}`);
                }
            }

            await fetchCart();
        } catch {
            toast.error('Failed to place order');
        }
        setProcessing(false);
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '120px 24px' }}>
                <p style={{ fontSize: 48 }}>📦</p>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>Nothing to checkout</h2>
                <p style={{ color: '#6B7280', marginTop: 8 }}>Add items to your cart first.</p>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: 720 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Checkout</h1>
            <p style={{ color: '#6B7280', marginBottom: 36 }}>Complete your order in 3 easy steps</p>

            {/* Step indicators */}
            <div style={{ display: 'flex', marginBottom: 40, gap: 4 }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: i <= step ? 'linear-gradient(135deg, #F0C040, #D4A020)' : '#E5E7EB',
                            color: i <= step ? '#1A1A1A' : '#9CA3AF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
                        }}>
                            {i < step ? <FiCheck size={18} /> : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? '#1A1A1A' : '#9CA3AF' }}>{s}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: Address */}
            {step === 0 && (
                <div className="glass-card animate-fadeup" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <FiMapPin size={22} color="#D4A020" />
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Delivery Address</h2>
                    </div>
                    <textarea
                        className="input-field" rows={4} placeholder="Enter your complete delivery address including pin code..."
                        value={address} onChange={(e) => setAddress(e.target.value)}
                        style={{ resize: 'vertical', marginBottom: 24 }}
                    />
                    <button className="btn-primary" onClick={() => {
                        if (!address || address.length < 10) { toast.error('Please enter a valid address (min 10 chars)'); return; }
                        setStep(1);
                    }} style={{ width: '100%' }}>
                        Continue to Payment
                    </button>
                </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 1 && (
                <div className="glass-card animate-fadeup" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <FiCreditCard size={22} color="#D4A020" />
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Payment Method</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                        {(['razorpay', 'stripe'] as const).map((p) => (
                            <label key={p} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                                border: provider === p ? '2px solid var(--butter-400)' : '2px solid #E5E7EB',
                                background: provider === p ? 'var(--butter-50)' : 'white',
                            }}>
                                <input type="radio" name="payment" checked={provider === p}
                                    onChange={() => setProvider(p)} style={{ accentColor: '#D4A020' }} />
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                                        {p === 'razorpay' ? '🇮🇳 Razorpay (UPI / Cards / Netbanking)' : '🌍 Stripe (International Cards)'}
                                    </span>
                                    <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                        {p === 'razorpay' ? 'Best for Indian payments' : 'Visa, Mastercard, and more'}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-secondary" onClick={() => setStep(0)} style={{ flex: 1 }}>Back</button>
                        <button className="btn-primary" onClick={() => setStep(2)} style={{ flex: 2 }}>Review Order</button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 2 && (
                <div className="glass-card animate-fadeup" style={{ padding: 32 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Order Review</h2>

                    {cart.items.map((item) => (
                        <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                            borderBottom: '1px solid #F3F4F6',
                        }}>
                            <span style={{ fontSize: 15 }}>{item.product_name} × {item.quantity}</span>
                            <span style={{ fontWeight: 700 }}>₹{item.subtotal.toFixed(2)}</span>
                        </div>
                    ))}

                    <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 16, paddingTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#6B7280' }}>
                            <span>Delivery to:</span>
                            <span style={{ maxWidth: 300, textAlign: 'right' }}>{address}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#6B7280' }}>
                            <span>Payment:</span>
                            <span>{provider === 'razorpay' ? 'Razorpay' : 'Stripe'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                            <span style={{ fontSize: 20, fontWeight: 700 }}>Total</span>
                            <span style={{ fontSize: 24, fontWeight: 800 }}>₹{cart.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                        <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                        <button className="btn-primary" onClick={handlePlaceOrder} disabled={processing} style={{ flex: 2 }}>
                            {processing ? 'Processing...' : 'Place Order 🧈'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
