'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { NewProjectModal } from '@/components/dashboard/NewProjectModal';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import type { Project, ProjectMeta } from '@/components/dashboard/types';

const statuses = ['Draft', 'Inspection In Progress', 'Ready for Review', 'Completed'];
const statusColors: Record<string, string> = {
  Draft: '#e2e8f0',
  'Inspection In Progress': '#dbeafe',
  'Ready for Review': '#fef3c7',
  Completed: '#d1fae5',
};

const defaultMeta = (): ProjectMeta => ({
  contactName: '', phone: '', email: '', inspectionDate: new Date().toISOString().slice(0, 10), reportDate: new Date().toISOString().slice(0, 10), dueDate: '', weather: 'Clear', temperature: '', contractorJobNumber: '', inspectors: '', certificationType: 'Recert', aerialImages: [],
});

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [inspectorFilter, setInspectorFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', address: '', description: '', status: 'Draft', ...defaultMeta() });

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

  const resetDraft = () => setDraft({ title: '', address: '', description: '', status: 'Draft', ...defaultMeta() });

  const saveProject = async () => {
    if (!draft.title.trim() || !draft.address.trim()) return;
    const supabase = createClient();

    const payload = { title: draft.title, address: draft.address, description: draft.description, status: draft.status };
    if (editingId) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editingId);
      if (error) return;
      setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
      const metaOnly: ProjectMeta = {
        contactName: draft.contactName,
        phone: draft.phone,
        email: draft.email,
        inspectionDate: draft.inspectionDate,
        reportDate: draft.reportDate,
        dueDate: draft.dueDate,
        weather: draft.weather,
        temperature: draft.temperature,
        contractorJobNumber: draft.contractorJobNumber,
        inspectors: draft.inspectors,
        certificationType: draft.certificationType,
        aerialImages: projectMeta[editingId]?.aerialImages || [],
      };
      window.localStorage.setItem(`project-meta:${editingId}`, JSON.stringify(metaOnly));
      setProjectMeta((prev) => ({ ...prev, [editingId]: metaOnly }));
    } else {
      const { data, error } = await supabase.from('projects').insert([payload]).select().single();
      if (error || !data) return;
      const created = data as Project;
      const meta: ProjectMeta = {
        contactName: draft.contactName, phone: draft.phone, email: draft.email, inspectionDate: draft.inspectionDate, reportDate: draft.reportDate, dueDate: draft.dueDate, weather: draft.weather, temperature: draft.temperature, contractorJobNumber: draft.contractorJobNumber, inspectors: draft.inspectors, certificationType: draft.certificationType, aerialImages: [],
      };
      window.localStorage.setItem(`project-meta:${created.id}`, JSON.stringify(meta));
      setProjects((prev) => [created, ...prev]);
      setProjectMeta((prev) => ({ ...prev, [created.id]: meta }));
    }

    setShowModal(false);
    setEditingId(null);
    resetDraft();
  };

  const openCreate = () => {
    setEditingId(null);
    resetDraft();
    setShowModal(true);
  };

  const openEdit = (project: Project) => {
    const meta = projectMeta[project.id] || defaultMeta();
    setEditingId(project.id);
    setDraft({ title: project.title, address: project.address, description: project.description, status: project.status, ...meta });
    setShowModal(true);
  };

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 16, width: '100%', minWidth: 0, background: '#fff' };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 24, boxShadow: '0 1px 2px rgba(15,23,42,.06)', display: 'grid', gap: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: '#0f172a' }}>Project Workflow Dashboard</h1>
            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 18 }}>Track jobs by status and jump directly into the next action.</p>
          </div>
          <button onClick={openCreate} style={{ borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', padding: '10px 14px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>+ New Project</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <input style={inputStyle} placeholder="Search by project or address" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
          <select style={inputStyle} value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)}>{inspectorOptions.map((inspector) => <option key={inspector}>{inspector}</option>)}</select>
        </div>
      </header>

      <div style={{ marginTop: 20 }}>
        {loading ? <p style={{ color: '#64748b' }}>Loading projects…</p> : groupedProjects.map((group) => (
          <section key={group.status} style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18, letterSpacing: '.02em', color: '#334155', background: statusColors[group.status] || '#e2e8f0', display: 'inline-block', padding: '10px 14px', borderRadius: 10 }}>{group.status}</h2>
            {group.items.length === 0 ? <p style={{ border: '1px dashed #cbd5e1', borderRadius: 10, padding: 12, background: '#fff', color: '#64748b' }}>No projects in this lane.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 14 }}>
                {group.items.map((project) => <ProjectCard key={project.id} project={project} meta={projectMeta[project.id] || defaultMeta()} onEdit={() => openEdit(project)} />)}
              </div>
            )}
          </section>
        ))}
      </div>

      <NewProjectModal open={showModal} draft={draft} setDraft={setDraft} onClose={() => setShowModal(false)} onSave={saveProject} editing={Boolean(editingId)} />
    </div>
  );
}
