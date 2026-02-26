'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
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

export default function InspectionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pins, setPins] = useState<ProjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const projectPhoto = useMemo(() => selectedProject?.photo_url ?? null, [selectedProject]);

  const clearSelection = () => {
    setSelectedProject(null);
    setPins([]);
  };

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
        setPins(freshSelected?.project_areas || []);
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
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setPins(project.project_areas || []);
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
      setSelectedProject(null);
      setPins([]);
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
        return;
      }

      const { photo_url } = (await response.json()) as { photo_url: string };

      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, photo_url } : p)),
      );

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

  if (loading) {
    return <div className="p-8 text-center text-xl font-semibold text-gray-500">Loading inspections...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm cursor-pointer"
              onClick={() => handleSelectProject(project)}
            >
              <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
              <p className="mt-1 text-sm text-gray-500">📍 {project.address}</p>

              {project.photo_url && (
                <div
                  className="relative mt-3 h-44 w-full overflow-hidden rounded-lg"
                  style={{ position: 'relative', height: '11rem', width: '100%', overflow: 'hidden', borderRadius: '0.5rem' }}
                >
                  <Image
                    src={project.photo_url}
                    alt={`${project.title} photo`}
                    fill
                    unoptimized
                    className="object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
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

              <div className="mt-3 flex gap-2">
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

          {projects.length === 0 && (
            <p className="col-span-full text-center text-gray-500">No projects found. Create one from the dashboard.</p>
          )}
        </div>

        {selectedProject && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{selectedProject.title}</h2>
                <p className="text-gray-600">{selectedProject.address}</p>
              </div>
              <button
                type="button"
                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                onClick={() => {
                  setSelectedProject(null);
                  setPins([]);
                }}
              >
                Close
              </button>
            </div>

            <div
              className={`relative h-[45vh] w-full overflow-hidden rounded-xl border-2 border-dashed border-blue-300 bg-center md:h-[55vh] ${
                projectPhoto ? 'cursor-crosshair bg-cover' : 'bg-slate-100'
              }`}
              style={{
                minHeight: '420px',
                height: '55vh',
                ...(projectPhoto
                  ? {
                      backgroundImage: `url(${projectPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }
                  : { backgroundColor: '#f1f5f9' }),
              }}
              onClick={projectPhoto ? handleImageClick : undefined}
            >
              {projectPhoto ? (
                pins.map((pin, index) => (
                  <div
                    key={pin.id || `${pin.name}-${index}`}
                    className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white"
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

            {pins.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pins.map((pin, index) => (
                  <div key={pin.id || `${pin.name}-list-${index}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{pin.name}</p>
                    <p className="text-sm text-gray-600">
                      X: {pin.x_percent}% • Y: {pin.y_percent}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
