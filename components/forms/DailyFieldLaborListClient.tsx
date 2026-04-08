'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function DailyFieldLaborListClient({ initialStatus }: { initialStatus: string }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [rows, setRows] = useState<Array<{ id: string; project_name_snapshot: string; report_date: string; status: string; lead_foreman_name: string; updated_at: string }>>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      let query = supabase.from('forms_daily_field_reports').select('id,project_name_snapshot,report_date,status,lead_foreman_name,updated_at').order('updated_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query;
      setRows((data as Array<{ id: string; project_name_snapshot: string; report_date: string; status: string; lead_foreman_name: string; updated_at: string }>) || []);
    };
    void load();
  }, [statusFilter]);

  const badgeColor = useMemo(() => ({
    draft: '#e2e8f0', submitted: '#dbeafe', pm_reviewed: '#fef3c7', client_signed: '#d1fae5', sent_to_accounting: '#ede9fe',
  }), []);

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>Daily Field Labor Reports</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Track drafts, submitted reports, and workflow status.</p>
        </div>
        <Link href="/forms/daily-field-labor/new" style={{ borderRadius: 8, padding: '8px 12px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>+ New Report</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {['all', 'draft', 'submitted', 'pm_reviewed', 'client_signed', 'sent_to_accounting'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ borderRadius: 999, padding: '6px 12px', border: '1px solid #cbd5e1', background: statusFilter === s ? '#0f172a' : '#fff', color: statusFilter === s ? '#fff' : '#0f172a' }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((row) => (
          <Link key={row.id} href={`/forms/daily-field-labor/${row.id}`} style={{ textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{row.project_name_snapshot || 'Untitled Project'}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{row.report_date} • {row.lead_foreman_name || 'No lead specified'}</div>
            </div>
            <span style={{ borderRadius: 999, background: badgeColor[row.status as keyof typeof badgeColor] || '#e2e8f0', padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{row.status}</span>
          </Link>
        ))}
        {rows.length === 0 && <p style={{ color: '#64748b' }}>No reports found for this filter.</p>}
      </div>
    </div>
  );
}
