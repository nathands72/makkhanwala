'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth-store';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(form);
            toast.success('Account created! Welcome to Makkanwala 🧈');
            router.push('/products');
        } catch {
            toast.error('Registration failed. Email may already be in use.');
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #FFFDF5, #FFF9E0)', padding: 24,
        }}>
            <div className="glass-card animate-fadeup" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <p style={{ fontSize: 36, marginBottom: 8 }}>🧈</p>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>Create Account</h1>
                    <p style={{ color: '#6B7280', fontSize: 15 }}>Join the Makkanwala family</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                            Full Name
                        </label>
                        <input
                            type="text" required className="input-field" placeholder="Your full name"
                            value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                            Email
                        </label>
                        <input
                            type="email" required className="input-field" placeholder="you@example.com"
                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                            Phone (optional)
                        </label>
                        <input
                            type="tel" className="input-field" placeholder="+91 98765 43210"
                            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                            Password
                        </label>
                        <input
                            type="password" required className="input-field" placeholder="Min 8 characters" minLength={8}
                            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                        {isLoading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6B7280' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#D4A020', fontWeight: 600, textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
