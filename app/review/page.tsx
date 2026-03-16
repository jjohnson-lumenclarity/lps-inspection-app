'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = {
  id: string;
  title: string;
  address: string;
  status: string;
  created_at?: string;
};

const statusColor: Record<string, string> = {
  draft: '#64748b',
  'ready for review': '#d97706',
  submitted: '#2563eb',
  quoted: '#059669',
};

export default function ReviewQueuePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('id,title,address,status,created_at').order('created_at', { ascending: false });
      setProjects((data as Project[]) || []);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter((project) => project.status.toLowerCase() === statusFilter);
  }, [projects, statusFilter]);

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Quote Review Queue</h1>
          <p style={{ color: '#64748b', marginBottom: '12px' }}>Purpose-built page for Ryan/quoting team to review projects in full and jump into final summaries fast.</p>
          <label style={{ fontWeight: 600, color: '#334155' }}>Filter by status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: 8, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }}>
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready for review">Ready for review</option>
              <option value="submitted">Submitted</option>
              <option value="quoted">Quoted</option>
            </select>
          </label>
        </section>

        <section style={{ display: 'grid', gap: '10px' }}>
          {filtered.map((project) => (
            <article key={project.id} style={{ display: 'grid', gap: '8px', background: '#fff', border: '1px solid #dbe3ea', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>{project.title}</h3>
                  <p style={{ margin: '2px 0 0', color: '#64748b' }}>{project.address}</p>
                </div>
                <span style={{ alignSelf: 'start', background: statusColor[project.status.toLowerCase()] || '#64748b', color: '#fff', borderRadius: '999px', padding: '5px 12px', fontSize: 12, fontWeight: 700 }}>{project.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href={`/quote-summary?projectId=${project.id}`} style={{ textDecoration: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>Open Full Review</Link>
                <Link href={`/inspections?projectId=${project.id}`} style={{ textDecoration: 'none', border: '1px solid #0f766e', color: '#0f766e', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>Edit Inspection</Link>
                <Link href={`/checklist?projectId=${project.id}`} style={{ textDecoration: 'none', border: '1px solid #2563eb', color: '#2563eb', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>Edit Checklist</Link>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p style={{ color: '#64748b' }}>No projects in this status.</p>}
        </section>
      </div>
    </main>
  );
}
