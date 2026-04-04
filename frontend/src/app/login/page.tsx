'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth-store';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(form);
            toast.success('Welcome back! 🧈');
            router.push('/products');
        } catch {
            toast.error('Invalid email or password');
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
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>Welcome Back</h1>
                    <p style={{ color: '#6B7280', fontSize: 15 }}>Sign in to your Makkanwala account</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                            Password
                        </label>
                        <input
                            type="password" required className="input-field" placeholder="••••••••" minLength={8}
                            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6B7280' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: '#D4A020', fontWeight: 600, textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
