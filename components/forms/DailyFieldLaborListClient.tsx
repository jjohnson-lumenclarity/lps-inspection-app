'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const STATUS_GROUPS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
] as const;

export function DailyFieldLaborListClient({ initialStatus }: { initialStatus: string }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [rows, setRows] = useState<Array<{ id: string; project_name_snapshot: string; report_date: string; status: string; lead_foreman_name: string; updated_at: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from('forms_daily_field_reports').select('id,project_name_snapshot,report_date,status,lead_foreman_name,updated_at').order('updated_at', { ascending: false });

      if (statusFilter === 'draft' || statusFilter === 'submitted') {
        query = query.eq('status', statusFilter);
      }

      if (statusFilter === 'reviewed') {
        query = query.in('status', ['pm_reviewed', 'client_signed', 'sent_to_accounting']);
      }

      const { data } = await query;
      setRows((data as Array<{ id: string; project_name_snapshot: string; report_date: string; status: string; lead_foreman_name: string; updated_at: string }>) || []);
      setLoading(false);
    };
    void load();
  }, [statusFilter]);

  const badgeColor = useMemo(
    () => ({
      draft: '#e2e8f0',
      submitted: '#dbeafe',
      pm_reviewed: '#fef3c7',
      client_signed: '#d1fae5',
      sent_to_accounting: '#ede9fe',
    }),
    [],
  );

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>Daily Field Labor Reports</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Find reports by lifecycle status and resume drafts quickly from the field.</p>
        </div>
        <Link href="/forms/daily-field-labor/new" style={{ borderRadius: 10, padding: '10px 14px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>+ New Report</Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATUS_GROUPS.map((status) => (
          <button
            key={status.key}
            type="button"
            onClick={() => setStatusFilter(status.key)}
            style={{ borderRadius: 999, padding: '8px 14px', border: '1px solid #cbd5e1', background: statusFilter === status.key ? '#0f172a' : '#fff', color: statusFilter === status.key ? '#fff' : '#0f172a' }}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading reports…</p> : null}

      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/forms/daily-field-labor/${row.id}`}
            style={{
              textDecoration: 'none',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              background: '#fff',
              padding: 14,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{row.project_name_snapshot || 'Untitled Project'}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Date: {row.report_date || 'N/A'} • Lead: {row.lead_foreman_name || 'Not set'} • Last updated: {new Date(row.updated_at).toLocaleString()}
              </div>
            </div>
            <span style={{ borderRadius: 999, background: badgeColor[row.status as keyof typeof badgeColor] || '#e2e8f0', padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>
              {row.status.replaceAll('_', ' ')}
            </span>
          </Link>
        ))}

        {!loading && rows.length === 0 ? (
          <div style={{ border: '1px dashed #cbd5e1', borderRadius: 14, background: '#fff', padding: 20 }}>
            <strong>No reports in this status yet.</strong>
            <p style={{ marginBottom: 0, color: '#64748b' }}>Create a new report to get started or switch status filters above.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
