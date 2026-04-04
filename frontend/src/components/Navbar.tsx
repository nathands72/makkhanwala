'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiPackage, FiGrid } from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';

export default function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout, hydrate } = useAuthStore();
    const { cart, fetchCart } = useCartStore();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        if (isAuthenticated) fetchCart();
    }, [isAuthenticated, fetchCart]);

    const isAdmin = user?.role === 'ADMIN';
    const itemCount = cart?.item_count || 0;

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(249,217,118,0.3)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                maxWidth: 1280, margin: '0 auto', padding: '0 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72,
            }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>🧈</span>
                    <span style={{
                        fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
                        background: 'linear-gradient(135deg, #F0C040, #D4A020)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Makkanwala</span>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    className="desktop-nav">
                    <NavLink href="/products" active={pathname === '/products'}>Products</NavLink>

                    {isAuthenticated ? (
                        <>
                            <NavLink href="/cart" active={pathname === '/cart'}>
                                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <FiShoppingCart size={18} />
                                    Cart
                                    {itemCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: -8, right: -14,
                                            background: 'linear-gradient(135deg, #F0C040, #D4A020)',
                                            color: '#1A1A1A', fontSize: 11, fontWeight: 700,
                                            width: 20, height: 20, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{itemCount}</span>
                                    )}
                                </span>
                            </NavLink>
                            <NavLink href="/orders" active={pathname === '/orders'}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <FiPackage size={18} /> Orders
                                </span>
                            </NavLink>
                            {isAdmin && (
                                <NavLink href="/admin" active={pathname.startsWith('/admin')}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FiGrid size={18} /> Admin
                                    </span>
                                </NavLink>
                            )}
                            <div style={{ width: 1, height: 28, background: '#E5E7EB', margin: '0 8px' }} />
                            <span style={{ fontSize: 14, color: '#6B7280', marginRight: 4 }}>
                                <FiUser size={16} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                {user?.full_name?.split(' ')[0]}
                            </span>
                            <button onClick={logout} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#9CA3AF', padding: 8, borderRadius: 8,
                                display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                            }}
                                onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                                onMouseOut={(e) => (e.currentTarget.style.color = '#9CA3AF')}>
                                <FiLogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink href="/login" active={pathname === '/login'}>Login</NavLink>
                            <Link href="/register" className="btn-primary" style={{
                                padding: '10px 24px', fontSize: 14, textDecoration: 'none',
                            }}>Sign Up</Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button onClick={() => setMenuOpen(!menuOpen)}
                    className="mobile-menu-btn"
                    style={{
                        display: 'none', background: 'none', border: 'none',
                        cursor: 'pointer', padding: 8, color: '#1A1A1A',
                    }}>
                    {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div style={{
                    padding: '16px 24px', borderTop: '1px solid #F3F4F6',
                    background: 'white', display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <MobileLink href="/products" onClick={() => setMenuOpen(false)}>Products</MobileLink>
                    {isAuthenticated ? (
                        <>
                            <MobileLink href="/cart" onClick={() => setMenuOpen(false)}>
                                Cart {itemCount > 0 && `(${itemCount})`}
                            </MobileLink>
                            <MobileLink href="/orders" onClick={() => setMenuOpen(false)}>Orders</MobileLink>
                            {isAdmin && <MobileLink href="/admin" onClick={() => setMenuOpen(false)}>Admin</MobileLink>}
                            <button onClick={() => { setMenuOpen(false); logout(); }}
                                style={{
                                    padding: '12px 0', background: 'none', border: 'none',
                                    textAlign: 'left', color: '#EF4444', fontWeight: 600,
                                    cursor: 'pointer', fontSize: 15,
                                }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Login</MobileLink>
                            <MobileLink href="/register" onClick={() => setMenuOpen(false)}>Sign Up</MobileLink>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
        </nav>
    );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link href={href} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 14.5, fontWeight: 500,
            textDecoration: 'none', transition: 'all 0.2s',
            background: active ? 'var(--butter-100)' : 'transparent',
            color: active ? 'var(--butter-700)' : '#4B5563',
        }}>{children}</Link>
    );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link href={href} onClick={onClick} style={{
            padding: '12px 0', fontSize: 15, fontWeight: 500,
            color: '#1A1A1A', textDecoration: 'none',
            borderBottom: '1px solid #F3F4F6',
        }}>{children}</Link>
    );
}
