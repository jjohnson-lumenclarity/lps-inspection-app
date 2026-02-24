'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { icon: '👤', label: 'Login', href: '/login' },
    { icon: '🔍', label: 'Inspections', href: '/inspections' },
    { icon: '🗺️', label: 'Google Maps', href: '/maps' },
    { icon: '✅', label: 'Checklist', href: '/checklist' },
    { icon: '📊', label: 'Reports', href: '/reports' },
    { icon: '⚙️', label: 'Settings', href: '/settings' },
  ];

   return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          background: '#1F2937',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '22px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 998,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : '-280px',
          width: '260px',
          height: '100vh',
          background: '#1F2937',
          zIndex: 999,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            padding: '80px 24px 24px 24px',
            borderBottom: '1px solid #374151',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '12px',
            }}
          >
            ⚡
          </div>
          <p style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>
            Guardian LPS
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0 0' }}>
            Inspection System
          </p>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '4px',
                color: 'white',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#374151')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            padding: '16px 12px',
            borderTop: '1px solid #374151',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#374151',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                background: '#3B82F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              JJ
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                Jason Johnson
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: '2px 0 0 0' }}>
                Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
