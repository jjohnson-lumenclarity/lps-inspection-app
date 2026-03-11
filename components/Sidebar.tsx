'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden>
      {children}
    </svg>
  );
}

const icons = {
  dashboard: <IconBase><path d="M3 13h8V3H3z" /><path d="M13 21h8v-6h-8z" /><path d="M13 11h8V3h-8z" /><path d="M3 21h8v-6H3z" /></IconBase>,
  inspections: <IconBase><path d="M4 4h11" /><path d="M4 9h11" /><path d="M4 14h7" /><path d="M4 19h7" /><circle cx="17" cy="17" r="3" /><path d="m19.5 19.5 2.5 2.5" /></IconBase>,
  maps: <IconBase><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14" /><path d="M15 6v14" /></IconBase>,
  checklist: <IconBase><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><path d="m4 6 1.5 1.5L8 5" /><path d="m4 12 1.5 1.5L8 11" /><path d="m4 18 1.5 1.5L8 17" /></IconBase>,
  reports: <IconBase><path d="M4 20V8" /><path d="M10 20V4" /><path d="M16 20v-6" /><path d="M22 20V10" /></IconBase>,
  settings: <IconBase><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" /></IconBase>,
};

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();


  useEffect(() => {
    const width = open ? '266px' : '88px';
    document.documentElement.style.setProperty('--sidebar-width', width);
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
    };
  }, [open]);

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: icons.dashboard },
    { label: 'Inspections', href: '/inspections', icon: icons.inspections },
    { label: 'Checklist', href: '/checklist', icon: icons.checklist },
    { label: 'Google Maps', href: '/maps', icon: icons.maps },
    { label: 'Reports', href: '/reports', icon: icons.reports },
    { label: 'Settings', href: '/settings', icon: icons.settings },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: open ? 266 : 88,
        background: '#f8fafc',
        borderRight: '1px solid #d1d5db',
        zIndex: 2000,
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 10px',
        boxShadow: '4px 0 14px rgba(15,23,42,0.08)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <button
        type="button"
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          height: 42,
          border: '1px solid #d1d5db',
          borderRadius: 10,
          background: '#fff',
          color: '#374151',
          fontSize: 20,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        {open ? '←' : '→'}
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
        {menuItems.map((item) => {
          const active = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 42,
                borderRadius: 10,
                padding: '0 10px',
                color: '#374151',
                textDecoration: 'none',
                background: active ? '#e5e7eb' : 'transparent',
                border: active ? '1px solid #d1d5db' : '1px solid transparent',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, color: '#374151' }}>{item.icon}</span>
              {open && <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
