'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiTruck, FiCheckCircle, FiBox, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import type { DashboardStats } from '@/lib/types';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get<DashboardStats>('/api/admin/dashboard');
            setStats(res.data);
        } catch { toast.error('Failed to load dashboard'); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') { router.push('/login'); return; }
        fetchStats();
    }, [isAuthenticated, user, fetchStats, router]);

    if (loading || !stats) {
        return (
            <div className="page-container">
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 36 }}>Admin Dashboard</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Admin Dashboard</h1>
                <p style={{ color: '#6B7280' }}>Overview of your Makkanwala business</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
                <StatCard icon={<FiUsers />} label="Total Users" value={stats.total_users} color="#3B82F6" bg="#EFF6FF" />
                <StatCard icon={<FiShoppingBag />} label="Total Orders" value={stats.total_orders} color="#8B5CF6" bg="#F5F3FF" />
                <StatCard icon={<FiDollarSign />} label="Revenue" value={`₹${Number(stats.total_revenue).toLocaleString()}`} color="#059669" bg="#ECFDF5" />
                <StatCard
                    icon={<FiAlertTriangle />} label="Low Stock Items"
                    value={stats.low_stock_products.length} color="#F59E0B" bg="#FFFBEB"
                />
            </div>

            {/* Orders by Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                <div className="glass-card" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Orders by Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(stats.orders_by_status).map(([status, count]) => {
                            const icons: Record<string, React.ReactNode> = {
                                PLACED: <FiBox />, PROCESSING: <FiClock />, SHIPPED: <FiTruck />, DELIVERED: <FiCheckCircle />,
                            };
                            const colors: Record<string, string> = {
                                PLACED: '#3B82F6', PROCESSING: '#F59E0B', SHIPPED: '#8B5CF6', DELIVERED: '#22C55E',
                            };
                            return (
                                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 14 }}>
                                        <span style={{ color: colors[status] || '#6B7280' }}>{icons[status] || <FiBox />}</span>
                                        {status}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: 18, color: colors[status] || '#1A1A1A' }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Low Stock */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiAlertTriangle color="#F59E0B" /> Low Stock Alert
                    </h3>
                    {stats.low_stock_products.length === 0 ? (
                        <p style={{ color: '#22C55E', fontSize: 14 }}>All products well-stocked! ✅</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.low_stock_products.map((p) => (
                                <div key={p.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 14px', borderRadius: 10, background: '#FFFBEB',
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                                    <span className="badge badge-warning">{p.stock} left</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="glass-card" style={{ padding: 28, marginTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recent Orders</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                                {['Order ID', 'Amount', 'Status', 'Payment', 'Date'].map((h) => (
                                    <th key={h} style={{
                                        textAlign: 'left', padding: '12px 16px', fontSize: 13,
                                        fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_orders.map((o) => (
                                <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500 }}>
                                        #{o.id.slice(0, 8).toUpperCase()}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700 }}>₹{o.total_amount}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span className={`badge ${o.order_status === 'DELIVERED' ? 'badge-success' : o.order_status === 'SHIPPED' ? 'badge-info' : 'badge-warning'}`}>
                                            {o.order_status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span className={`badge ${o.payment_status === 'SUCCESS' ? 'badge-success' : 'badge-error'}`}>
                                            {o.payment_status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                                        {new Date(o.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, bg }: {
    icon: React.ReactNode; label: string; value: string | number; color: string; bg: string;
}) {
    return (
        <div className="glass-card" style={{ padding: 24 }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: 20, marginBottom: 14,
            }}>{icon}</div>
            <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A' }}>{value}</p>
        </div>
    );
}
