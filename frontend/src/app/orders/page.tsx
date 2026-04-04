'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import type { Order, OrderListResponse } from '@/lib/types';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    PLACED: { icon: <FiBox size={16} />, color: '#1E40AF', bg: '#E1EFFE' },
    PROCESSING: { icon: <FiClock size={16} />, color: '#723B13', bg: '#FDF6B2' },
    SHIPPED: { icon: <FiTruck size={16} />, color: '#065F46', bg: '#DEF7EC' },
    DELIVERED: { icon: <FiCheckCircle size={16} />, color: '#03543F', bg: '#DEF7EC' },
};

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<OrderListResponse>('/api/orders');
            setOrders(res.data.orders);
        } catch { toast.error('Failed to load orders'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        fetchOrders();
    }, [isAuthenticated, fetchOrders, router]);

    if (loading) {
        return (
            <div className="page-container">
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 36 }}>My Orders</h1>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, marginBottom: 16, borderRadius: 16 }} />)}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '120px 24px' }}>
                <p style={{ fontSize: 64, marginBottom: 16 }}>📦</p>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No orders yet</h2>
                <p style={{ color: '#6B7280' }}>Start shopping to see your orders here!</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 36 }}>My Orders</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map((order) => {
                    const sc = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.PLACED;
                    return (
                        <div key={order.id} className="glass-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>
                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p style={{ fontSize: 13, color: '#6B7280' }}>
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                                        background: sc.bg, color: sc.color,
                                    }}>
                                        {sc.icon} {order.order_status}
                                    </span>
                                    <span className={`badge ${order.payment_status === 'SUCCESS' ? 'badge-success' : order.payment_status === 'FAILED' ? 'badge-error' : 'badge-warning'}`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
                                {order.items.map((item) => (
                                    <div key={item.id} style={{
                                        display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0',
                                    }}>
                                        <span style={{ color: '#4B5563' }}>{item.product_name} × {item.quantity}</span>
                                        <span style={{ fontWeight: 600 }}>₹{item.subtotal.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginTop: 16, paddingTop: 16, borderTop: '2px solid #F3F4F6',
                            }}>
                                <span style={{ fontSize: 14, color: '#6B7280' }}>
                                    <FiPackage size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                </span>
                                <span style={{ fontSize: 20, fontWeight: 800 }}>₹{Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
