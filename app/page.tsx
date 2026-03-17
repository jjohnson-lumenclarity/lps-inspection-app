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
  const [draft, setDraft] = useState({
    title: '',
    address: '',
    description: '',
    inspectors: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    status: 'Draft',
  });

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
        } catch {
          nextMeta[project.id] = defaultMeta();
        }
      }
      setProjectMeta(nextMeta);
      setLoading(false);
    };

    void fetchProjects();
  }, []);

  const inspectorOptions = useMemo(
    () => ['All', ...Array.from(new Set(Object.values(projectMeta).map((meta) => meta.inspectors).filter(Boolean)))],
    [projectMeta],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const meta = projectMeta[project.id] || defaultMeta();
      const matchesSearch = !search || `${project.title} ${project.address}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      const matchesInspector = inspectorFilter === 'All' || meta.inspectors === inspectorFilter;
      return matchesSearch && matchesStatus && matchesInspector;
    });
  }, [inspectorFilter, projectMeta, projects, search, statusFilter]);

  const groupedProjects = useMemo(() => {
    return statuses.map((status) => ({
      status,
      items: filteredProjects.filter((project) => project.status === status),
    }));
  }, [filteredProjects]);

  const createProject = async () => {
    if (!draft.title.trim() || !draft.address.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .insert([{ title: draft.title, address: draft.address, description: draft.description, status: draft.status }])
      .select()
      .single();

    if (error || !data) return;

    const created = data as Project;
    const meta = { inspectors: draft.inspectors, inspectionDate: draft.inspectionDate };
    window.localStorage.setItem(`project-meta:${created.id}`, JSON.stringify(meta));

    setProjects((prev) => [created, ...prev]);
    setProjectMeta((prev) => ({ ...prev, [created.id]: meta }));
    setDraft({
      title: '',
      address: '',
      description: '',
      inspectors: '',
      inspectionDate: new Date().toISOString().slice(0, 10),
      status: 'Draft',
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5 p-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Workflow Dashboard</h1>
            <p className="text-sm text-slate-600">Track jobs by status and jump directly into the next action.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="rounded-md border p-2" placeholder="Search by project or address" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-md border p-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select className="rounded-md border p-2" value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)}>
            {inspectorOptions.map((inspector) => (
              <option key={inspector}>{inspector}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Loading projects…</p>
      ) : (
        <div className="space-y-5">
          {groupedProjects.map((group) => (
            <section key={group.status}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{group.status}</h2>
              {group.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No projects in this lane.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {group.items.map((project) => (
                    <ProjectCard key={project.id} project={project} meta={projectMeta[project.id] || defaultMeta()} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <NewProjectModal open={showCreateModal} draft={draft} setDraft={setDraft} onClose={() => setShowCreateModal(false)} onSave={createProject} />
    </div>
  );
}
