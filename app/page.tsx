'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { NewProjectModal } from '@/components/dashboard/NewProjectModal';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import type { Project, ProjectMeta } from '@/components/dashboard/types';

const statuses = ['Draft', 'Inspection In Progress', 'Ready for Review', 'Completed'];
const defaultMeta = (): ProjectMeta => ({ inspectors: '', inspectionDate: '' });

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectorFilter, setInspectorFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draft, setDraft] = useState({ title: '', address: '', description: '', inspectors: '', inspectionDate: new Date().toISOString().slice(0, 10), status: 'Draft' });

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      const nextProjects = (data as Project[]) || [];
      setProjects(nextProjects);
      const nextMeta: Record<string, ProjectMeta> = {};
      for (const project of nextProjects) {
        try {
          const raw = window.localStorage.getItem(`project-meta:${project.id}`);
          nextMeta[project.id] = raw ? { ...defaultMeta(), ...JSON.parse(raw) } : defaultMeta();
        } catch { nextMeta[project.id] = defaultMeta(); }
      }
      setProjectMeta(nextMeta);
      setLoading(false);
    };
    void fetchProjects();
  }, []);

  const inspectorOptions = useMemo(() => ['All', ...Array.from(new Set(Object.values(projectMeta).map((m) => m.inspectors).filter(Boolean)))], [projectMeta]);
  const filteredProjects = useMemo(() => projects.filter((project) => {
    const meta = projectMeta[project.id] || defaultMeta();
    return (!search || `${project.title} ${project.address}`.toLowerCase().includes(search.toLowerCase()))
      && (statusFilter === 'All' || project.status === statusFilter)
      && (inspectorFilter === 'All' || meta.inspectors === inspectorFilter);
  }), [inspectorFilter, projectMeta, projects, search, statusFilter]);

  const groupedProjects = useMemo(() => statuses.map((status) => ({ status, items: filteredProjects.filter((p) => p.status === status) })), [filteredProjects]);

  const createProject = async () => {
    if (!draft.title.trim() || !draft.address.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').insert([{ title: draft.title, address: draft.address, description: draft.description, status: draft.status }]).select().single();
    if (error || !data) return;
    const created = data as Project;
    const meta = { inspectors: draft.inspectors, inspectionDate: draft.inspectionDate };
    window.localStorage.setItem(`project-meta:${created.id}`, JSON.stringify(meta));
    setProjects((prev) => [created, ...prev]);
    setProjectMeta((prev) => ({ ...prev, [created.id]: meta }));
    setDraft({ title: '', address: '', description: '', inspectors: '', inspectionDate: new Date().toISOString().slice(0, 10), status: 'Draft' });
    setShowCreateModal(false);
  };

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%', background: '#fff' };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 20, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: '#0f172a' }}>Project Workflow Dashboard</h1>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>Track jobs by status and jump directly into the next action.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>+ New Project</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10 }}>
          <input style={inputStyle} placeholder="Search by project or address" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
          <select style={inputStyle} value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)}>{inspectorOptions.map((inspector) => <option key={inspector}>{inspector}</option>)}</select>
        </div>
      </header>

      <div style={{ marginTop: 18 }}>
        {loading ? <p style={{ color: '#64748b' }}>Loading projects…</p> : groupedProjects.map((group) => (
          <section key={group.status} style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b' }}>{group.status}</h2>
            {group.items.length === 0 ? <p style={{ border: '1px dashed #cbd5e1', borderRadius: 10, padding: 12, background: '#fff', color: '#64748b' }}>No projects in this lane.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 12 }}>
                {group.items.map((project) => <ProjectCard key={project.id} project={project} meta={projectMeta[project.id] || defaultMeta()} />)}
              </div>
            )}
          </section>
        ))}
      </div>

      <NewProjectModal open={showCreateModal} draft={draft} setDraft={setDraft} onClose={() => setShowCreateModal(false)} onSave={createProject} />
    </div>
  );
}
