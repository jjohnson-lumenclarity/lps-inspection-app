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

const FALLBACK_IMAGE = 'https://via.placeholder.com/1200x800/4F46E5/FFFFFF?text=Upload+Project+Photo';

export default function InspectionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [pins, setPins] = useState<ProjectArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const projectPhoto = useMemo(() => selectedProject?.photo_url || FALLBACK_IMAGE, [selectedProject]);

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

      if (selectedProject) {
        const freshSelected = nextProjects.find((project) => project.id === selectedProject.id) || null;
        setSelectedProject(freshSelected);
        setPins(freshSelected?.project_areas || []);
      }
    } catch (error) {
      console.error('Unexpected error loading projects:', error);
      setErrorMessage('Could not load projects. Please refresh and try again.');
      setProjects([]);
      clearSelection();
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setPins(project.project_areas || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.alert(`Delete failed: ${error.message}`);
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));
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
        window.alert('Upload failed. Please try again.');
        return;
      }

      const { photo_url } = (await response.json()) as { photo_url: string };

      setProjects((prev) => prev.map((item) => (item.id === project.id ? { ...item, photo_url } : item)));

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

  const handleImageClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedProject) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

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

    setPins((prev) => [...prev.slice(0, -1), data as ProjectArea]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-20 sm:p-8 sm:pt-24">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          {selectedProject && (
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={clearSelection}
            >
              Back to project list
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
            <button
              type="button"
              className="ml-3 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white"
              onClick={() => void fetchProjects()}
            >
              Retry
            </button>
          </div>
        )}

        {selectedProject && (
          <section className="relative z-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{selectedProject.title}</h2>
                <p className="text-gray-600">{selectedProject.address}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                onClick={clearSelection}
              >
                Close
              </button>
            </div>

            <div
              className="relative h-[40vh] w-full cursor-crosshair overflow-hidden rounded-xl border-2 border-dashed border-blue-300 bg-slate-100 md:h-[52vh]"
              style={{ position: 'relative', height: '52vh', minHeight: '320px', maxHeight: '620px', width: '100%' }}
              onClick={handleImageClick}
            >
              <Image src={projectPhoto} alt={`${selectedProject.title} inspection`} fill className="object-contain" unoptimized />

              {pins.map((pin, index) => (
                <div
                  key={pin.id || `${pin.name}-${index}`}
                  className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white shadow"
                  style={{ left: `${pin.x_percent}%`, top: `${pin.y_percent}%` }}
                  title={`${pin.name} (${pin.x_percent}, ${pin.y_percent})`}
                >
                  {pin.name.slice(0, 3).toUpperCase()}
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm text-gray-600">Click anywhere on the image to add a lighting zone pin.</p>

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

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-lg font-semibold text-gray-500">
            Loading inspections...
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem' }}
                onClick={() => handleSelectProject(project)}
              >
                <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
                <p className="text-sm text-gray-600">{project.description}</p>
                <p className="mt-1 text-sm text-gray-500">📍 {project.address}</p>

                {project.photo_url && (
                  <div
                    className="relative mt-3 h-44 w-full overflow-hidden rounded-lg"
                    style={{ position: 'relative', height: '11rem', width: '100%' }}
                  >
                    <Image src={project.photo_url} alt={`${project.title} photo`} fill unoptimized className="object-cover" />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(project.id, event.target.files?.[0] || null)}
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
              <p className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                No projects found. Create one from the dashboard.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
