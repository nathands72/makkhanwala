'use client';

import Link from 'next/link';
import { FiArrowRight, FiStar, FiTruck, FiShield } from 'react-icons/fi';
import { useAuthStore } from '@/lib/store/auth-store';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  return (
    <div>
      {/* ── Hero Section ── */}
      <section style={{
        background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF3C4 50%, #FFF9E0 100%)',
        padding: '80px 24px 100px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,217,118,0.3) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,192,64,0.2) 0%, transparent 70%)',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 640 }}>
            <span className="badge badge-warning animate-fadeup" style={{ marginBottom: 20, display: 'inline-block' }}>
              🧈 Farm-Fresh Quality
            </span>
            <h1 className="animate-fadeup animate-fadeup-delay-1" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: -1, marginBottom: 20,
              color: '#1A1A1A',
            }}>
              Pure Butter,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #F0C040, #D4A020)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Made Fresh</span>
              {' '}Daily
            </h1>
            <p className="animate-fadeup animate-fadeup-delay-2" style={{
              fontSize: 18, lineHeight: 1.7, color: '#4B5563', marginBottom: 36, maxWidth: 480,
            }}>
              From farm-fresh cream to your kitchen table. Experience the richness of
              handcrafted butter, made the traditional way with love.
            </p>
            <div className="animate-fadeup animate-fadeup-delay-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/products" className="btn-primary" style={{
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16,
                padding: '16px 32px',
              }}>
                Browse Products <FiArrowRight />
              </Link>
              {!isAuthenticated && (
                <Link href="/register" className="btn-secondary" style={{
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 32px',
                }}>
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Why Makkanwala?</h2>
            <p style={{ color: '#6B7280', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              We believe in quality, freshness, and tradition.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28,
          }}>
            <FeatureCard
              icon={<FiStar size={28} />}
              title="Premium Quality"
              description="Made from 100% pure cream sourced from grass-fed cows. No preservatives, no additives."
            />
            <FeatureCard
              icon={<FiTruck size={28} />}
              title="Fast Delivery"
              description="Temperature-controlled delivery to your doorstep. Fresh butter, always cold."
            />
            <FeatureCard
              icon={<FiShield size={28} />}
              title="100% Secure"
              description="Safe and secure online payments. Your data is always protected with industry-standard encryption."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{
        margin: '0 24px 80px',
        background: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
        borderRadius: 24, padding: '64px 40px', textAlign: 'center',
        maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F9D976', marginBottom: 16 }}>
          Ready to taste the difference?
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: 16, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
          Join thousands of butter lovers who trust Makkanwala for their daily dairy needs.
        </p>
        <Link href="/products" className="btn-primary" style={{
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '16px 36px', fontSize: 16,
        }}>
          Shop Now <FiArrowRight />
        </Link>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card" style={{ padding: 32 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--butter-100), var(--butter-200))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--butter-700)', marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: '#6B7280', lineHeight: 1.7, fontSize: 15 }}>{description}</p>
    </div>
  );
}
