import Link from 'next/link';

export default function FormsHubPage() {
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: '#0f172a' }}>Forms</h1>
      <p style={{ color: '#475569', fontSize: 16, maxWidth: 860 }}>
        Launch, draft, and submit field-ready forms with structured workflows built for tablet crews. The hub is designed to scale as new form types are added.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 16 }}>
        <section style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Daily Field Labor Report</h3>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Capture project details, daily scope, labor and material usage, photos, and signatures with review + submit validation.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/forms/daily-field-labor/new" style={{ borderRadius: 10, padding: '9px 13px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>New Report</Link>
            <Link href="/forms/daily-field-labor?status=draft" style={{ borderRadius: 10, padding: '9px 13px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#0f172a' }}>View Drafts</Link>
            <Link href="/forms/daily-field-labor?status=submitted" style={{ borderRadius: 10, padding: '9px 13px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#0f172a' }}>Submitted Reports</Link>
          </div>
        </section>

        <section style={{ border: '1px dashed #cbd5e1', borderRadius: 16, background: '#fff', padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>More forms coming soon</h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            This layout supports additional operational forms (safety checklists, quality punch lists, closeout docs) without redesign.
          </p>
        </section>
      </div>
    </div>
  );
}
