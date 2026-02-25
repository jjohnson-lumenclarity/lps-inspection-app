'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();

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
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '10px 14px',
          borderRadius: '12px',
          color: '#f9fafb',
          background: '#1e293b',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '20px',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
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
            zIndex: 4998,
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
          zIndex: 4999,
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
            Guardian Lightning Protection
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '4px 0 0 0' }}>
            Inspection System
          </p>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
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
                  color: '#f9fafb',
                  background: isActive ? '#3b82f6' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#374151';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
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
