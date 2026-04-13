'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <main style={{ minHeight: '100vh', padding: '96px 24px', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '22px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
        <h1 style={{ marginTop: 0, color: '#0f172a' }}>Inspector Login</h1>
        <p style={{ color: '#64748b' }}>Simple login placeholder for now. We can connect this to Supabase Auth in the next step.</p>

        <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Inspector name" style={{ width: '100%', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }} />
        </label>
        <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '14px' }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="inspector@company.com" style={{ width: '100%', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px' }} />
        </label>

        <button type="button" style={{ border: 'none', borderRadius: '8px', padding: '10px 14px', background: '#2563eb', color: '#fff', fontWeight: 600 }}>Login (coming next)</button>
      </div>
    </main>
  );
}
