import Link from 'next/link';

export default function FormsHubPage() {
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, color: '#0f172a' }}>Forms</h1>
      <p style={{ color: '#475569', fontSize: 17 }}>Field-friendly digital forms for inspectors and foremen. Save drafts, submit clean reports, and maintain audit-ready records.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 16 }}>
        <section style={{ border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Daily Field Labor Report</h3>
          <p style={{ color: '#64748b' }}>Capture project info, labor, materials, notes, photos, signatures, and submit with PM/accounting distribution metadata.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/forms/daily-field-labor/new" style={{ borderRadius: 8, padding: '8px 12px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>New Report</Link>
            <Link href="/forms/daily-field-labor?status=draft" style={{ borderRadius: 8, padding: '8px 12px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#0f172a' }}>View Drafts</Link>
            <Link href="/forms/daily-field-labor?status=submitted" style={{ borderRadius: 8, padding: '8px 12px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#0f172a' }}>Submitted Reports</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
