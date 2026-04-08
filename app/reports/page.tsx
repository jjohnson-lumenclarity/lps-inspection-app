'use client';

import { useMemo, useState } from 'react';

type Status = 'all' | 'In Progress' | 'Submitted' | 'Completed';

export default function ReportsPage() {
  const [status, setStatus] = useState<Status>('all');
  const [dateRange, setDateRange] = useState('30');

  const kpis = useMemo(
    () => [
      { label: 'Inspections started', value: '24' },
      { label: 'Submitted for quote', value: '13' },
      { label: 'Avg. days to submission', value: '2.4' },
      { label: 'Zones flagged', value: '86' },
    ],
    [],
  );

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Reports</h1>
          <p style={{ color: '#64748b' }}>Track inspection throughput and prep quote-ready summaries for management review.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <label style={{ fontWeight: 600, color: '#334155' }}>Date range
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Project status
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option value="all">All</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {kpis.map((kpi) => (
            <article key={kpi.label} style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '12px', padding: '14px' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{kpi.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{kpi.value}</p>
            </article>
          ))}
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Report Types to Export (Next step)</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
            <li>Inspection completion report by inspector and date range.</li>
            <li>Quote-ready project packet list (submitted status only).</li>
            <li>Zone issue frequency report (top repeated deficiencies).</li>
            <li>Photo evidence completeness report (projects missing zone photos).</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
