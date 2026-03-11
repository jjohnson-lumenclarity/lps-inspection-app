'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = { id: string; title: string; address: string; status: string };

export default function QuoteSummaryHub() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('id, title, address, status').order('created_at', { ascending: false });
      const list = (data as Project[]) || [];
      setProjects(list);
      setSelectedId(list[0]?.id || '');
    };
    void fetchProjects();
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '96px 24px 24px 24px', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '22px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>Quote Summary</h1>
        <p style={{ color: '#64748b' }}>Choose a project, review/edit final details, and open the full quote summary view.</p>

        <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>Project</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.title} — {project.address}</option>
          ))}
        </select>

        {selectedId && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href={`/inspections/${selectedId}`} style={{ background: '#2563eb', color: '#fff', borderRadius: '8px', padding: '10px 14px', textDecoration: 'none' }}>Open Full Quote Summary</Link>
            <Link href={`/dashboard?edit=${selectedId}`} style={{ background: '#059669', color: '#fff', borderRadius: '8px', padding: '10px 14px', textDecoration: 'none' }}>Edit Project Info</Link>
            <Link href={`/checklist?projectId=${selectedId}`} style={{ background: '#334155', color: '#fff', borderRadius: '8px', padding: '10px 14px', textDecoration: 'none' }}>Edit Checklist</Link>
          </div>
        )}
      </div>
    </main>
  );
}
