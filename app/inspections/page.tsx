'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type ProjectArea = {
  id?: string;
  name: string;
  x_percent: number;
  y_percent: number;
};

type Project = {
  id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  photo_url?: string | null;
  project_areas?: ProjectArea[];
};

type AreaPhoto = {
  id: string;
  area_id: string;
  photo_url: string;
  created_at?: string;
};

type ProjectMeta = {
  contactName: string;
  phone: string;
  email: string;
  inspectionDate: string;
  dueDate: string;
  weather: string;
  temperature: string;
};

const statusBadgeClasses: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  'in progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-200 text-slate-700',
};

const statusBadgeStyles: Record<string, React.CSSProperties> = {
  active: { backgroundColor: '#10b981', color: '#ffffff' },
  'in progress': { backgroundColor: '#f59e0b', color: '#ffffff' },
  completed: { backgroundColor: '#64748b', color: '#ffffff' },
};

export default function InspectionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pins, setPins] = useState<ProjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [areaPhotosByZone, setAreaPhotosByZone] = useState<Record<string, AreaPhoto[]>>({});
  const [selectedZoneFiles, setSelectedZoneFiles] = useState<Record<string, File | null>>({});
  const [uploadingZoneId, setUploadingZoneId] = useState<string | null>(null);
  const [zonePhotoFeatureEnabled, setZonePhotoFeatureEnabled] = useState(true);
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
  const [localProjectPhotos, setLocalProjectPhotos] = useState<Record<string, string>>({});
  const [localZonePhotos, setLocalZonePhotos] = useState<Record<string, AreaPhoto[]>>({});
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [zoneNotesById, setZoneNotesById] = useState<Record<string, string>>({});
  const [savingZoneNoteId, setSavingZoneNoteId] = useState<string | null>(null);

  const projectPhoto = useMemo(() => {
    if (!selectedProject) return null;
    return selectedProject.photo_url ?? localProjectPhotos[selectedProject.id] ?? null;
  }, [localProjectPhotos, selectedProject]);

  const photoPanelStyle = useMemo<React.CSSProperties>(() => ({
    minHeight: '260px',
    height: 'clamp(260px, 38vh, 420px)',
    ...(projectPhoto
      ? {
          backgroundImage: `url(${projectPhoto})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : { backgroundColor: '#f1f5f9' }),
  }), [projectPhoto]);

  const clearSelection = () => {
    setSelectedProject(null);
    setPins([]);
    setAreaPhotosByZone({});
    setZoneNotesById({});
  };


  const loadZoneNotes = useCallback((projectId: string, areas: ProjectArea[]) => {
    const notes: Record<string, string> = {};
    for (const area of areas) {
      if (!area.id) continue;
      const key = `zone-note:${projectId}:${area.id}`;
      notes[area.id] = window.localStorage.getItem(key) || '';
    }
    setZoneNotesById(notes);
  }, []);

  const saveZoneNote = async (projectId: string, zoneId: string) => {
    const note = zoneNotesById[zoneId] || '';
    setSavingZoneNoteId(zoneId);
    try {
      window.localStorage.setItem(`zone-note:${projectId}:${zoneId}`, note);
    } finally {
      setSavingZoneNoteId(null);
    }
  };

  const fetchZonePhotos = useCallback(async (areas: ProjectArea[]) => {
    const areaIds = areas.map((area) => area.id).filter(Boolean) as string[];
    if (areaIds.length === 0) {
      setAreaPhotosByZone({});
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('area_photos')
      .select('id, area_id, photo_url, created_at')
      .in('area_id', areaIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Area photo table unavailable or query failed:', error.message);
      setZonePhotoFeatureEnabled(false);
      setAreaPhotosByZone({});
      return;
    }

    setZonePhotoFeatureEnabled(true);
    const grouped = (data as AreaPhoto[]).reduce<Record<string, AreaPhoto[]>>((acc, photo) => {
      acc[photo.area_id] = [...(acc[photo.area_id] || []), photo];
      return acc;
    }, {});
    setAreaPhotosByZone(grouped);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_areas(id, name, x_percent, y_percent)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        setErrorMessage('Could not load projects. Please refresh and try again.');
      }

      const nextProjects = (data as Project[]) || [];
      setProjects(nextProjects);
      const meta: Record<string, ProjectMeta> = {};
      for (const project of nextProjects) {
        try {
          const raw = window.localStorage.getItem(`project-meta:${project.id}`);
          meta[project.id] = raw
            ? ({ contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', ...JSON.parse(raw) } as ProjectMeta)
            : { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '' };
        } catch {
          meta[project.id] = { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '' };
        }
      }
      setProjectMeta(meta);

      setSelectedProject((currentSelected) => {
        if (!currentSelected) return currentSelected;

        const freshSelected = nextProjects.find((project) => project.id === currentSelected.id) || null;
        const nextAreas = freshSelected?.project_areas || [];
        setPins(nextAreas);
        void fetchZonePhotos(nextAreas);
        if (freshSelected) loadZoneNotes(freshSelected.id, nextAreas);
        return freshSelected;
      });
    } catch (error) {
      console.error('Unexpected error loading projects:', error);
      setErrorMessage('Could not load projects. Please refresh and try again.');
      setProjects([]);
      clearSelection();
    } finally {
      setLoading(false);
    }
  }, [fetchZonePhotos, loadZoneNotes]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    const nextAreas = project.project_areas || [];
    setPins(nextAreas);
    void fetchZonePhotos(nextAreas);
  };

  const handleFileChange = (projectId: string, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [projectId]: file }));
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Delete this project?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      console.error('Delete failed:', error);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      clearSelection();
    }
  };

  const handleUploadPhoto = async (project: Project) => {
    const file = selectedFiles[project.id];
    if (!file) return;

    setUploadingId(project.id);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('projectId', project.id);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('Upload failed:', body);
        const localUrl = URL.createObjectURL(file);
        setLocalProjectPhotos((prev) => ({ ...prev, [project.id]: localUrl }));
        if (selectedProject?.id === project.id) {
          setSelectedProject((prev) => (prev ? { ...prev, photo_url: prev.photo_url ?? localUrl } : prev));
        }
        setSelectedFiles((prev) => ({ ...prev, [project.id]: null }));
        window.alert('Cloud upload failed, but a local demo preview was attached so you can continue your client demo.');
        return;
      }

      const { photo_url } = (await response.json()) as { photo_url: string };

      const supabase = createClient();
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({ photo_url })
        .eq('id', project.id);

      if (projectUpdateError) {
        console.warn('Uploaded photo but failed to persist project photo_url:', projectUpdateError.message);
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, photo_url } : p)),
      );
      setLocalProjectPhotos((prev) => ({ ...prev, [project.id]: photo_url }));

      if (selectedProject?.id === project.id) {
        setSelectedProject((prev) => (prev ? { ...prev, photo_url } : prev));
      }

      setSelectedFiles((prev) => ({ ...prev, [project.id]: null }));
    } catch (error) {
      console.error('Upload failed:', error);
      window.alert('Upload failed. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedProject) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const name = window.prompt('Lighting zone name?');
    if (!name) return;

    const optimisticPin: ProjectArea = { name, x_percent: x, y_percent: y };
    setPins((prev) => [...prev, optimisticPin]);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('project_areas')
      .insert([{ project_id: selectedProject.id, ...optimisticPin }])
      .select('id, name, x_percent, y_percent')
      .single();

    if (error) {
      console.error('Save failed:', error);
      setPins((prev) => prev.slice(0, -1));
      window.alert(`Save failed: ${error.message}`);
      return;
    }

    const savedPin = data as ProjectArea;
    setPins((prev) => [...prev.slice(0, -1), savedPin]);
  };

  const handleZoneFileChange = (zoneId: string, file: File | null) => {
    setSelectedZoneFiles((prev) => ({ ...prev, [zoneId]: file }));
  };

  const handleZonePhotoUpload = async (zoneId: string) => {
    const file = selectedZoneFiles[zoneId];
    if (!file) return;

    setUploadingZoneId(zoneId);
    const supabase = createClient();

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `zone-photos/${zoneId}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        const localUrl = URL.createObjectURL(file);
        const localPhoto: AreaPhoto = {
          id: `local-${Date.now()}`,
          area_id: zoneId,
          photo_url: localUrl,
        };
        setLocalZonePhotos((prev) => ({
          ...prev,
          [zoneId]: [localPhoto, ...(prev[zoneId] || [])],
        }));
        setSelectedZoneFiles((prev) => ({ ...prev, [zoneId]: null }));
        window.alert('Zone upload saved locally for demo mode (cloud storage unavailable).');
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('project-media').getPublicUrl(uploadData.path);
      const photo_url = publicUrlData.publicUrl;

      const { data, error } = await supabase
        .from('area_photos')
        .insert([{ area_id: zoneId, photo_url }])
        .select('id, area_id, photo_url, created_at')
        .single();

      if (error) {
        const localPhoto: AreaPhoto = {
          id: `local-${Date.now()}`,
          area_id: zoneId,
          photo_url,
        };
        setLocalZonePhotos((prev) => ({
          ...prev,
          [zoneId]: [localPhoto, ...(prev[zoneId] || [])],
        }));
        setZonePhotoFeatureEnabled(false);
        setSelectedZoneFiles((prev) => ({ ...prev, [zoneId]: null }));
        window.alert('Zone photo metadata table is unavailable, so photos are being shown in local demo mode.');
        return;
      }

      setZonePhotoFeatureEnabled(true);
      const savedPhoto = data as AreaPhoto;
      setAreaPhotosByZone((prev) => ({
        ...prev,
        [zoneId]: [savedPhoto, ...(prev[zoneId] || [])],
      }));
      setSelectedZoneFiles((prev) => ({ ...prev, [zoneId]: null }));
    } finally {
      setUploadingZoneId(null);
    }
  };


  const handleRenameZone = async (zone: ProjectArea) => {
    if (!zone.id) return;

    const nextName = window.prompt('Edit zone name', zone.name)?.trim();
    if (!nextName || nextName === zone.name) return;

    setSavingZoneId(zone.id);
    const supabase = createClient();
    const { error } = await supabase.from('project_areas').update({ name: nextName }).eq('id', zone.id);

    if (error) {
      window.alert(`Unable to rename zone: ${error.message}`);
      setSavingZoneId(null);
      return;
    }

    setPins((prev) => prev.map((pin) => (pin.id === zone.id ? { ...pin, name: nextName } : pin)));
    setSelectedProject((prev) => {
      if (!prev) return prev;
      const nextAreas = (prev.project_areas || []).map((area) => (area.id === zone.id ? { ...area, name: nextName } : area));
      return { ...prev, project_areas: nextAreas };
    });
    setSavingZoneId(null);
  };

  const handleDeleteZone = async (zone: ProjectArea) => {
    if (!zone.id) return;
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;

    setSavingZoneId(zone.id);
    const supabase = createClient();

    if (zonePhotoFeatureEnabled) {
      const { error: photoDeleteError } = await supabase.from('area_photos').delete().eq('area_id', zone.id);
      if (photoDeleteError) {
        console.warn('Could not delete area photo records before zone delete:', photoDeleteError.message);
      }
    }

    const { error } = await supabase.from('project_areas').delete().eq('id', zone.id);

    if (error) {
      window.alert(`Unable to delete zone: ${error.message}`);
      setSavingZoneId(null);
      return;
    }

    setPins((prev) => prev.filter((pin) => pin.id !== zone.id));
    setAreaPhotosByZone((prev) => {
      const next = { ...prev };
      delete next[zone.id!];
      return next;
    });
    setSelectedZoneFiles((prev) => {
      const next = { ...prev };
      delete next[zone.id!];
      return next;
    });
    setSelectedProject((prev) => {
      if (!prev) return prev;
      const nextAreas = (prev.project_areas || []).filter((area) => area.id !== zone.id);
      return { ...prev, project_areas: nextAreas };
    });
    setSavingZoneId(null);
  };

  const filteredProjects = useMemo(() => {
    const term = projectSearch.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      [project.title, project.address, project.description].join(' ').toLowerCase().includes(term),
    );
  }, [projects, projectSearch]);

  if (loading) {
    return <div className="p-8 text-center text-xl font-semibold text-gray-500">Loading inspections...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '16px', paddingTop: '88px', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
      <div className="mx-auto max-w-7xl space-y-8" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Inspections</h1>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', padding: '16px', marginBottom: '16px' }}>
          <label htmlFor="project-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search building / address
          </label>
          <input
            id="project-search"
            type="text"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Start typing building name or address..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', fontSize: '14px' }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ border: '1px solid #dbe3ea', borderRadius: '14px', background: '#ffffff', padding: '20px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}
              onClick={() => handleSelectProject(project)}
            >
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{project.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{project.description}</p>
              <p className="mt-1 text-sm text-slate-700">📍 {project.address}</p>
              <p className="text-xs text-slate-600">Contact: {projectMeta[project.id]?.contactName || '—'}</p>
              <p className="text-xs text-slate-600">Phone: {projectMeta[project.id]?.phone || '—'} • Email: {projectMeta[project.id]?.email || '—'}</p>
              <p className="text-xs text-slate-600">Inspection: {projectMeta[project.id]?.inspectionDate || '—'} • Due: {projectMeta[project.id]?.dueDate || '—'}</p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[project.status.toLowerCase()] ?? 'bg-blue-100 text-blue-700'}`}
                style={{ width: 'fit-content', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, ...(statusBadgeStyles[project.status.toLowerCase()] || { backgroundColor: '#2563eb', color: '#fff' }) }}
              >
                {project.status}
              </span>

              {(project.photo_url || localProjectPhotos[project.id]) && (
                <div
                  className="relative mt-4 h-44 w-full overflow-hidden rounded-xl"
                  style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden', borderRadius: '10px' }}
                >
                  <Image
                    src={project.photo_url || localProjectPhotos[project.id] || ''}
                    alt={`${project.title} photo`}
                    fill
                    unoptimized
                    className="object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  style={{ fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', backgroundColor: '#f8fafc' }}
                  onChange={(e) => handleFileChange(project.id, e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:bg-gray-400"
                  disabled={!selectedFiles[project.id] || uploadingId === project.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleUploadPhoto(project);
                  }}
                >
                  {uploadingId === project.id ? 'Uploading…' : 'Upload'}
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(project.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <p className="col-span-full text-center text-gray-500">No matching projects found.</p>
          )}
        </div>

        {selectedProject && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" style={{ border: '1px solid #dbe3ea', borderRadius: '16px', backgroundColor: '#fff', padding: '24px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedProject.title}</h2>
                <p className="text-gray-600">{selectedProject.address}</p>
              </div>
              <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <Link
                  href={`/inspections/${selectedProject.id}`}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '8px', padding: '10px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Quote Summary
                </Link>
                <Link
                  href={`/dashboard?edit=${selectedProject.id}`}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#059669', color: '#fff', borderRadius: '8px', padding: '10px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Edit Project Info
                </Link>
                <button
                  type="button"
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                  style={{ backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '8px', padding: '10px 14px', border: '1px solid #d1d5db' }}
                  onClick={clearSelection}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className={`relative w-full overflow-hidden rounded-xl border-2 border-dashed border-blue-300 bg-center ${
                projectPhoto ? 'cursor-crosshair bg-cover' : 'bg-slate-100'
              }`}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '2px dashed #93c5fd', minHeight: '300px', ...photoPanelStyle }}
              onClick={projectPhoto ? handleImageClick : undefined}
            >
              {projectPhoto ? (
                pins.map((pin, index) => (
                  <div
                    key={pin.id || `${pin.name}-${index}`}
                    className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white shadow-lg ring-2 ring-red-200"
                    style={{ position: 'absolute', left: `${pin.x_percent}%`, top: `${pin.y_percent}%`, transform: 'translate(-50%, -50%)', width: '44px', height: '44px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', color: '#fff', border: '2px solid #fff', boxShadow: '0 6px 16px rgba(239,68,68,0.35)', fontSize: '11px', fontWeight: 700, zIndex: 5 }}
                    title={`${pin.name} (${pin.x_percent}, ${pin.y_percent})`}
                  >
                    {pin.name.slice(0, 3).toUpperCase()}
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-600">
                  Upload a project photo from the card above to start placing zone pins.
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {projectPhoto ? 'Click anywhere on the photo to add a zone pin.' : 'Photo required to place pins.'}
            </p>

            {!zonePhotoFeatureEnabled && (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Zone photo uploads are disabled until the <code>area_photos</code> table is available.
              </p>
            )}

            {pins.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pins.map((pin, index) => {
                  const zonePhotos = pin.id ? [...(localZonePhotos[pin.id] || []), ...(areaPhotosByZone[pin.id] || [])] : [];
                  return (
                    <div key={pin.id || `${pin.name}-list-${index}`} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-gray-900">{pin.name}</p>
                      {pin.id && (
                        <>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: '#334155', color: '#fff', borderRadius: '8px', padding: '6px 10px', border: 'none' }}
                              disabled={savingZoneId === pin.id}
                              onClick={() => void handleRenameZone(pin)}
                            >
                              {savingZoneId === pin.id ? 'Saving…' : 'Rename'}
                            </button>
                            <button
                              type="button"
                              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: '#dc2626', color: '#fff', borderRadius: '8px', padding: '6px 10px', border: 'none' }}
                              disabled={savingZoneId === pin.id}
                              onClick={() => void handleDeleteZone(pin)}
                            >
                              Delete Zone
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-2" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', backgroundColor: '#f8fafc', maxWidth: '220px' }}
                              onChange={(e) => handleZoneFileChange(pin.id!, e.target.files?.[0] || null)}
                            />
                            <button
                              type="button"
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:bg-slate-300"
                              style={{ backgroundColor: '#2563eb', color: '#fff', borderRadius: '8px', padding: '6px 10px', border: 'none' }}
                              disabled={!selectedZoneFiles[pin.id] || uploadingZoneId === pin.id || !zonePhotoFeatureEnabled || savingZoneId === pin.id}
                              onClick={() => void handleZonePhotoUpload(pin.id!)}
                            >
                              {uploadingZoneId === pin.id ? 'Uploading…' : 'Add photo'}
                            </button>
                          </div>

                          {zonePhotos.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {zonePhotos.map((photo) => (
                                <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
                                  <Image
                                    src={photo.photo_url}
                                    alt={`Zone ${pin.name}`}
                                    width={100}
                                    height={100}
                                    unoptimized
                                    className="h-16 w-full rounded object-cover"
                                  />
                                  <span style={{ position: 'absolute', left: '4px', bottom: '4px', fontSize: '9px', background: 'rgba(255,255,255,0.72)', color: '#0f172a', padding: '2px 4px', borderRadius: '4px' }}>
                                    {new Date(photo.created_at || Date.now()).toLocaleDateString()} • Logo
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="mt-3" style={{ marginTop: '12px' }}>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Zone Notes</label>
                            <textarea
                              value={pin.id ? zoneNotesById[pin.id] || '' : ''}
                              onChange={(event) => {
                                if (!pin.id) return;
                                const value = event.target.value;
                                setZoneNotesById((prev) => ({ ...prev, [pin.id!]: value }));
                              }}
                              placeholder="Add inspector notes, deficiencies, and quote guidance for this zone..."
                              className="w-full rounded border border-slate-300 p-2 text-xs"
                              style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px', minHeight: '74px' }}
                            />
                            <button
                              type="button"
                              className="mt-2 rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white disabled:bg-slate-300"
                              style={{ marginTop: '8px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', padding: '6px 10px' }}
                              disabled={!pin.id || savingZoneNoteId === pin.id}
                              onClick={() => pin.id && selectedProject && void saveZoneNote(selectedProject.id, pin.id)}
                            >
                              {savingZoneNoteId === pin.id ? 'Saving…' : 'Save notes'}
                            </button>
                          </div>
                        </>
                      )}
                      {!pin.id && <p className="mt-2 text-xs text-slate-500">Save in progress…</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
