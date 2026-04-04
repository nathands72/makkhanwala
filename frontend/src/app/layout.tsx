import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Makkanwala – Fresh Butter, Delivered",
  description: "Order premium, farm-fresh butter products online. Made with love from pure cream. Fast delivery across India.",
  keywords: ["butter", "makhan", "dairy", "fresh butter", "organic butter", "buy butter online"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F9D976" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: 12,
              padding: '14px 20px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
            success: { style: { border: '1px solid #22C55E' } },
            error: { style: { border: '1px solid #EF4444' } },
          }}
        />

        {/* Footer */}
        <footer style={{
          background: '#1A1A1A', color: '#9CA3AF', padding: '48px 24px',
          marginTop: 80, textAlign: 'center',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🧈</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: '#F9D976', marginBottom: 8 }}>Makkanwala</p>
            <p style={{ fontSize: 14, maxWidth: 400, margin: '0 auto 24px' }}>
              Fresh, pure, and delicious butter — from our farm to your table.
            </p>
            <div style={{ borderTop: '1px solid #2D2D2D', paddingTop: 24 }}>
              <p style={{ fontSize: 12 }}>© 2026 Makkanwala. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
