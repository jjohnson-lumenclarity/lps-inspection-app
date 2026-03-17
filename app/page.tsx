'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latrpcynyafmknmcvgha.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHJwY3lueWFmbWtubWN2Z2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTE0NjEsImV4cCI6MjA4NjQ4NzQ2MX0.h5nIamRUliPjyBxja7mr6oSm6RCsYfuLcABlCAl-2Kg';

const supabase = createClient(supabaseUrl, supabaseKey);
const googleMapsApiKey = 'AIzaSyAodLZjU2qN3sxua9fIy54Xc12tTwiVTD4';

interface Project {
  id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  created_at?: string;
  photo_url?: string | null;
}

type ProjectMeta = {
  contactName: string;
  phone: string;
  email: string;
  inspectionDate: string;
  reportDate: string;
  dueDate: string;
  weather: string;
  temperature: string;
  contractorJobNumber: string;
  inspectors: string;
  certificationType: string;
  aerialImages: string[];
};

const defaultMeta = (): ProjectMeta => ({
  contactName: '',
  phone: '',
  email: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  reportDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  weather: 'Clear',
  temperature: '',
  contractorJobNumber: '',
  inspectors: '',
  certificationType: 'Recert',
  aerialImages: [],
});

const getMetaKey = (projectId: string) => `project-meta:${projectId}`;

const getStaticPreviewUrl = (address: string, zoom: number) => {
  const query = encodeURIComponent(address.trim() || 'United States');
  return `https://maps.googleapis.com/maps/api/staticmap?size=1600x1200&maptype=satellite&zoom=${zoom}&center=${query}&key=${googleMapsApiKey}`;
};

const getInteractiveEmbedUrl = (address: string, zoom: number) => {
  const query = encodeURIComponent(address.trim() || 'United States');
  return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${query}&maptype=satellite&zoom=${zoom}`;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    address: '',
    status: 'Draft',
    contactName: '',
    phone: '',
    email: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    reportDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    weather: 'Clear',
    temperature: '',
    contractorJobNumber: '',
    inspectors: '',
    certificationType: 'Recert',
  });
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [previewZoom, setPreviewZoom] = useState(18);
  const formRef = useRef<HTMLDivElement | null>(null);

  const canSubmitProject = newProject.title.trim().length > 0 && newProject.address.trim().length > 0;
  const previewUrl = newProject.address.trim() ? getStaticPreviewUrl(newProject.address, previewZoom) : null;
  const interactivePreviewUrl = newProject.address.trim() ? getInteractiveEmbedUrl(newProject.address, previewZoom) : null;

  useEffect(() => {
    void fetchProjects();
  }, []);


  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (!editId || projects.length === 0) return;
    const target = projects.find((project) => project.id === editId);
    if (target) {
      handleEdit(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  const hydrateMeta = (list: Project[]) => {
    const next: Record<string, ProjectMeta> = {};
    for (const project of list) {
      try {
        const stored = window.localStorage.getItem(getMetaKey(project.id));
        next[project.id] = stored ? { ...defaultMeta(), ...(JSON.parse(stored) as ProjectMeta) } : defaultMeta();
      } catch {
        next[project.id] = defaultMeta();
      }
    }
    setProjectMeta(next);
  };

  const saveMeta = (projectId: string, meta: ProjectMeta) => {
    try {
      window.localStorage.setItem(getMetaKey(projectId), JSON.stringify(meta));
    } catch {
      // no-op
    }
    setProjectMeta((prev) => ({ ...prev, [projectId]: meta }));
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
    } else {
      const list = (data as Project[]) || [];
      setProjects(list);
      hydrateMeta(list);
    }
    setLoading(false);
  };

  const addProject = async () => {
    const payload = {
      title: newProject.title,
      description: newProject.description,
      address: newProject.address,
      status: newProject.status,
    };

    const { data, error } = await supabase.from('projects').insert([payload]).select().single();
    if (error) {
      console.error('Error adding project:', error);
      return;
    }

    const created = data as Project;
    setProjects((prev) => [created, ...prev]);
    saveMeta(created.id, {
      contactName: newProject.contactName,
      phone: newProject.phone,
      email: newProject.email,
      inspectionDate: newProject.inspectionDate,
      reportDate: newProject.reportDate,
      dueDate: newProject.dueDate,
      weather: newProject.weather,
      temperature: newProject.temperature,
      contractorJobNumber: newProject.contractorJobNumber,
      inspectors: newProject.inspectors,
      certificationType: newProject.certificationType,
      aerialImages: projectMeta[created.id]?.aerialImages || [],
    });

    setNewProject({
      title: '', description: '', address: '', status: 'Draft', contactName: '', phone: '', email: '',
      inspectionDate: new Date().toISOString().slice(0, 10), reportDate: new Date().toISOString().slice(0, 10), dueDate: '', weather: 'Clear', temperature: '',
      contractorJobNumber: '', inspectors: '', certificationType: 'Recert',
    });
  };

  const updateProject = async () => {
    if (!editingProject) return;

    const payload = {
      title: newProject.title,
      description: newProject.description,
      address: newProject.address,
      status: newProject.status,
    };

    const { error } = await supabase.from('projects').update(payload).eq('id', editingProject.id);
    if (error) {
      console.error('Error updating project:', error);
      return;
    }

    setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? { ...p, ...payload } : p)));
    saveMeta(editingProject.id, {
      contactName: newProject.contactName,
      phone: newProject.phone,
      email: newProject.email,
      inspectionDate: newProject.inspectionDate,
      reportDate: newProject.reportDate,
      dueDate: newProject.dueDate,
      weather: newProject.weather,
      temperature: newProject.temperature,
      contractorJobNumber: newProject.contractorJobNumber,
      inspectors: newProject.inspectors,
      certificationType: newProject.certificationType,
      aerialImages: projectMeta[editingProject.id]?.aerialImages || [],
    });

    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setNewProject({
      title: '', description: '', address: '', status: 'Draft', contactName: '', phone: '', email: '',
      inspectionDate: new Date().toISOString().slice(0, 10), reportDate: new Date().toISOString().slice(0, 10), dueDate: '', weather: 'Clear', temperature: '',
      contractorJobNumber: '', inspectors: '', certificationType: 'Recert',
    });
  };

  const handleDelete = async (id: string) => {
    const first = window.confirm('Are you sure you want to permanently delete this project?');
    if (!first) return;
    const confirmText = window.prompt('Type DELETE to permanently remove this project.');
    if (confirmText !== 'DELETE') {
      window.alert('Delete canceled. You must type DELETE exactly.');
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Error deleting project:', error);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    setProjectMeta((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      window.localStorage.removeItem(getMetaKey(id));
    } catch {
      // no-op
    }
  };

  const handleEdit = (project: Project) => {
    const meta = projectMeta[project.id] || defaultMeta();
    setEditingProject(project);
    setNewProject({
      title: project.title,
      description: project.description,
      address: project.address,
      status: project.status,
      contactName: meta.contactName,
      phone: meta.phone,
      email: meta.email,
      inspectionDate: meta.inspectionDate,
      reportDate: meta.reportDate,
      dueDate: meta.dueDate,
      weather: meta.weather,
      temperature: meta.temperature,
      contractorJobNumber: meta.contractorJobNumber,
      inspectors: meta.inspectors,
      certificationType: meta.certificationType,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileChange = (projectId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFiles((prev) => ({ ...prev, [projectId]: file }));
  };

  const handleUploadPhoto = async (project: Project) => {
    const file = selectedFiles[project.id];
    if (!file) return;

    try {
      setUploadingId(project.id);
      const ext = file.name.split('.').pop();
      const path = `${project.id}/${Date.now()}.${ext}`;

      const { error: uploadError, data: uploadData } = await supabase.storage.from('project-media').upload(path, file, { cacheControl: '3600', upsert: true });
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('project-media').getPublicUrl(uploadData.path);
      const publicUrl = publicUrlData?.publicUrl || null;

      const { error: updateError } = await supabase.from('projects').update({ photo_url: publicUrl }).eq('id', project.id);
      if (updateError) {
        console.error('Error saving photo URL:', updateError);
        return;
      }

      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, photo_url: publicUrl } : p)));
      setSelectedFiles((prev) => ({ ...prev, [project.id]: null }));
    } finally {
      setUploadingId(null);
    }
  };

  const downloadSnapshot = async () => {
    if (!newProject.address.trim()) return;

    const url = getStaticPreviewUrl(newProject.address, previewZoom);
    const filename = `${newProject.title.trim() || 'project'}-overhead-map-z${previewZoom}.png`.replace(/\s+/g, '-').toLowerCase();

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Unable to download snapshot:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>Loading projects...</main>;
  }

  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', color: '#1F2937', marginBottom: '32px' }}>Guardian Lighting Inspection Dashboard</h1>

      <div
        ref={formRef}
        style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '24px' }}
      >
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <input placeholder="Client/ Facility Name (required)" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Description (optional)" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Street Address (required)" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Owner/ Contact" value={newProject.contactName} onChange={(e) => setNewProject({ ...newProject, contactName: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Phone Number" value={newProject.phone} onChange={(e) => setNewProject({ ...newProject, phone: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Email Address" value={newProject.email} onChange={(e) => setNewProject({ ...newProject, email: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Contractor Project/ Job #" value={newProject.contractorJobNumber} onChange={(e) => setNewProject({ ...newProject, contractorJobNumber: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <input placeholder="Inspector(s)" value={newProject.inspectors} onChange={(e) => setNewProject({ ...newProject, inspectors: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Inspection Date
            <input type="date" value={newProject.inspectionDate} onChange={(e) => setNewProject({ ...newProject, inspectionDate: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Report Date
            <input type="date" value={newProject.reportDate} onChange={(e) => setNewProject({ ...newProject, reportDate: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Due Date
            <input type="date" value={newProject.dueDate} onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Weather
            <select value={newProject.weather} onChange={(e) => setNewProject({ ...newProject, weather: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }}>
              <option>Clear</option><option>Partly Cloudy</option><option>Cloudy</option><option>Rain</option><option>Snow</option><option>Windy</option><option>Storm</option><option>Other</option>
            </select>
          </label>
          <input placeholder="Temperature (°F or °C)" value={newProject.temperature} onChange={(e) => setNewProject({ ...newProject, temperature: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Certification Type
            <select value={newProject.certificationType} onChange={(e) => setNewProject({ ...newProject, certificationType: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }}>
              <option>Recert</option>
              <option>UL 96A</option>
              <option>NFFPA 780</option>
              <option>Other</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '13px' }}>
            Project Status
            <select value={newProject.status} onChange={(e) => setNewProject({ ...newProject, status: e.target.value })} style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px' }}>
              <option>Draft</option>
              <option>Ready for review</option>
              <option>Submitted</option>
              <option>Quoted</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button onClick={editingProject ? updateProject : addProject} disabled={!canSubmitProject} style={{ padding: '12px 20px', background: canSubmitProject ? '#3B82F6' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: canSubmitProject ? 'pointer' : 'not-allowed' }}>{editingProject ? 'Update Project' : 'Add Project'}</button>
          {editingProject && <button onClick={cancelEdit} style={{ padding: '12px 20px', background: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>}
        </div>
      </div>

      {previewUrl && (
        <div style={{ marginBottom: '30px', background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '22px', color: '#1F2937', margin: 0 }}>New Project Address Preview (Satellite)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ color: '#475569', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Zoom
                <input type="range" min="14" max="22" value={previewZoom} onChange={(e) => setPreviewZoom(Number(e.target.value))} />
              </label>
              <button onClick={() => void downloadSnapshot()} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #2563eb', color: '#2563eb', background: '#fff', cursor: 'pointer' }}>Download Overhead Image</button>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newProject.address)}`} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none' }}>Open in Google Maps</a>
            </div>
          </div>
          <iframe width="100%" height="720" src={interactivePreviewUrl || ''} style={{ border: 0, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} allowFullScreen loading="lazy" />
          <p style={{ marginTop: '8px', color: '#64748b', fontSize: '13px' }}>Tip: use a lower zoom (14-17) for large buildings. Download currently uses the address + zoom setting; for an exact framed capture, save an aerial reference image on the project tile and use that in Inspection Prep.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {projects.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6B7280', fontSize: '18px' }}>No projects yet. Add your first project above!</p>
        ) : (
          projects.map((project) => {
            const meta = projectMeta[project.id] || defaultMeta();
            return (
              <div key={project.id} style={{ padding: '25px', border: '1px solid #E5E7EB', borderRadius: '12px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '20px' }}>{project.title}</h3>
                <p style={{ margin: '0 0 8px 0', color: '#6B7280' }}>{project.description}</p>
                <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px' }}>📍 {project.address}</p>
                <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '13px' }}>Owner/ Contact: {meta.contactName || '—'}</p>
                <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '13px' }}>Phone: {meta.phone || '—'} • Email: {meta.email || '—'}</p>
                <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '13px' }}>Inspection Date: {meta.inspectionDate || '—'} • Weather: {meta.weather}{meta.temperature ? ` ${meta.temperature}` : ''}</p>
                <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '13px' }}>Report Date: {meta.reportDate || '—'} • Due Date: {meta.dueDate || '—'}</p>
                <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '13px' }}>Job #: {meta.contractorJobNumber || '—'} • Inspectors: {meta.inspectors || '—'} • Cert: {meta.certificationType || '—'}</p>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ padding: '4px 12px', background: project.status === 'Draft' ? '#64748b' : project.status === 'Ready for review' ? '#d97706' : project.status === 'Submitted' ? '#2563eb' : '#059669', color: 'white', borderRadius: '20px', fontSize: '14px', fontWeight: 500, display: 'inline-flex' }}>{project.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <Link href={`/inspections?projectId=${project.id}`} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #2563eb', color: '#2563eb', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Open Inspection</Link>
                  <Link href={`/checklist?projectId=${project.id}`} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #059669', color: '#059669', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Open Checklist</Link>
                </div>

                {project.photo_url && <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>Project photo + optional multiple aerial references</p><img src={project.photo_url} alt="Project" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} /></div>}


                {(meta.aerialImages || []).length > 0 && (
                  <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
                    {meta.aerialImages.slice(0, 6).map((img, idx) => (
                      <img key={`${project.id}-aerial-${idx}`} src={img} alt="Aerial reference" style={{ width: '100%', height: '68px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    ))}
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>Project photo + optional multiple aerial references</p>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(project.id, e)} style={{ fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: '#f8fafc' }} />
                  <input type="file" accept="image/*" multiple onChange={async (e) => { const files = Array.from(e.target.files || []); if (!files.length) return; const urls = await Promise.all(files.map((f) => new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(typeof r.result === 'string' ? r.result : ''); r.readAsDataURL(f); }))); const existing = (projectMeta[project.id]?.aerialImages || []); saveMeta(project.id, { ...(projectMeta[project.id] || defaultMeta()), aerialImages: [...existing, ...urls] }); }} style={{ fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', background: '#f8fafc', marginTop: '6px' }} />
                  <button onClick={() => void handleUploadPhoto(project)} disabled={!selectedFiles[project.id] || uploadingId === project.id} style={{ marginTop: '8px', padding: '8px 16px', background: !selectedFiles[project.id] || uploadingId === project.id ? '#9CA3AF' : '#10B981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: !selectedFiles[project.id] || uploadingId === project.id ? 'not-allowed' : 'pointer' }}>{uploadingId === project.id ? 'Uploading…' : 'Upload Photo'}</button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(project)} style={{ padding: '8px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => void handleDelete(project.id)} style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
