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

const statusBadgeClasses: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  'in progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-200 text-slate-700',
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

  const projectPhoto = useMemo(() => selectedProject?.photo_url ?? null, [selectedProject]);

  const photoPanelStyle = useMemo<React.CSSProperties>(() => ({
    minHeight: '260px',
    height: 'clamp(260px, 38vh, 420px)',
    ...(projectPhoto
      ? {
          backgroundImage: `url(${projectPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : { backgroundColor: '#f1f5f9' }),
  }), [projectPhoto]);

  const clearSelection = () => {
    setSelectedProject(null);
    setPins([]);
    setAreaPhotosByZone({});
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

      setSelectedProject((currentSelected) => {
        if (!currentSelected) return currentSelected;

        const freshSelected = nextProjects.find((project) => project.id === currentSelected.id) || null;
        const nextAreas = freshSelected?.project_areas || [];
        setPins(nextAreas);
        void fetchZonePhotos(nextAreas);
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
  }, [fetchZonePhotos]);

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
        const message = typeof body?.error === 'string' ? body.error : 'Upload failed. Please check storage configuration and try again.';
        window.alert(message);
        return;
      }

      const { photo_url } = (await response.json()) as { photo_url: string };

      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, photo_url } : p)));

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
        window.alert(`Zone photo upload failed: ${uploadError.message}`);
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
        setZonePhotoFeatureEnabled(false);
        window.alert('Zone photo table is not ready yet. Ask admin to create table area_photos.');
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '16px' }}>
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="project-search" className="mb-2 block text-sm font-medium text-slate-700">
            Search building / address
          </label>
          <input
            id="project-search"
            type="text"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Start typing building name or address..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              onClick={() => handleSelectProject(project)}
            >
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{project.title}</h2>
              <p className="mt-2 text-2xl text-slate-600">{project.description}</p>
              <p className="mt-2 text-xl text-slate-700">📍 {project.address}</p>

              <span
                className={`mt-4 inline-flex rounded-full px-4 py-1 text-lg font-semibold ${
                  statusBadgeClasses[project.status.toLowerCase()] ?? 'bg-blue-100 text-blue-700'
                }`}
              >
                {project.status}
              </span>

              {project.photo_url && (
                <div
                  className="relative mt-4 h-44 w-full overflow-hidden rounded-xl"
                  style={{ position: 'relative', height: '11rem', width: '100%', overflow: 'hidden', borderRadius: '0.5rem' }}
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
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedProject.title}</h2>
                <p className="text-gray-600">{selectedProject.address}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/inspections/${selectedProject.id}`}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Quote Summary
                </Link>
                <button
                  type="button"
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
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
              style={photoPanelStyle}
              onClick={projectPhoto ? handleImageClick : undefined}
            >
              {projectPhoto ? (
                pins.map((pin, index) => (
                  <div
                    key={pin.id || `${pin.name}-${index}`}
                    className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white shadow-lg ring-2 ring-red-200"
                    style={{ left: `${pin.x_percent}%`, top: `${pin.y_percent}%` }}
                    title={`${pin.name} (${pin.x_percent}, ${pin.y_percent})`}
                  >
                    {pin.name.slice(0, 3).toUpperCase()}
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-600">
                  Upload a project photo from the card above to start placing lighting zone pins.
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {projectPhoto ? 'Click anywhere on the photo to add a lighting zone pin.' : 'Photo required to place pins.'}
            </p>

            {!zonePhotoFeatureEnabled && (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Zone photo uploads are disabled until the <code>area_photos</code> table is available.
              </p>
            )}

            {pins.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pins.map((pin, index) => {
                  const zonePhotos = pin.id ? areaPhotosByZone[pin.id] || [] : [];
                  return (
                    <div key={pin.id || `${pin.name}-list-${index}`} className="rounded-lg border border-gray-200 p-3">
                      <p className="font-medium text-gray-900">{pin.name}</p>
                      <p className="text-sm text-gray-600">
                        X: {pin.x_percent}% • Y: {pin.y_percent}%
                      </p>

                      {pin.id && (
                        <>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              disabled={savingZoneId === pin.id}
                              onClick={() => void handleRenameZone(pin)}
                            >
                              {savingZoneId === pin.id ? 'Saving…' : 'Rename'}
                            </button>
                            <button
                              type="button"
                              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                              disabled={savingZoneId === pin.id}
                              onClick={() => void handleDeleteZone(pin)}
                            >
                              Delete Zone
                            </button>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleZoneFileChange(pin.id!, e.target.files?.[0] || null)}
                            />
                            <button
                              type="button"
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:bg-slate-300"
                              disabled={!selectedZoneFiles[pin.id] || uploadingZoneId === pin.id || !zonePhotoFeatureEnabled}
                              onClick={() => void handleZonePhotoUpload(pin.id!)}
                            >
                              {uploadingZoneId === pin.id ? 'Uploading…' : 'Add photo'}
                            </button>
                          </div>

                          {zonePhotos.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {zonePhotos.map((photo) => (
                                <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer">
                                  <Image
                                    src={photo.photo_url}
                                    alt={`Zone ${pin.name}`}
                                    width={100}
                                    height={100}
                                    unoptimized
                                    className="h-16 w-full rounded object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
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
