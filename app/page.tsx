'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://latrpcynyafmknmcvgha.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHJwY3lueWFmbWtubWN2Z2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTE0NjEsImV4cCI6MjA4NjQ4NzQ2MX0.h5nIamRUliPjyBxja7mr6oSm6RCsYfuLcABlCAl-2Kg';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Project {
  id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  created_at?: string;
  photo_url?: string | null;
}


const googleMapsApiKey = 'AIzaSyAodLZjU2qN3sxua9fIy54Xc12tTwiVTD4';

const getSatellitePlaceEmbedUrl = (address: string, zoom = 20) => {
  const query = encodeURIComponent(address.trim() || 'United States');
  return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${query}&maptype=satellite&zoom=${zoom}`;
};

const getProjectLocationsStaticMapUrl = (addresses: string[]) => {
  const valid = addresses.map((a) => a.trim()).filter(Boolean);
  const markerParams = valid.map((address) => `markers=color:0x374151|${encodeURIComponent(address)}`).join('&');
  const center = encodeURIComponent(valid[0] || 'United States');
  return `https://maps.googleapis.com/maps/api/staticmap?size=1400x700&maptype=satellite&zoom=12&center=${center}&${markerParams}&key=${googleMapsApiKey}`;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    address: '',
    status: 'Active',
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

  const canSubmitProject = newProject.title.trim().length > 0 && newProject.address.trim().length > 0;
  const addressPreviewUrl = newProject.address.trim() ? getSatellitePlaceEmbedUrl(newProject.address, 20) : null;
  const projectsMapUrl = getProjectLocationsStaticMapUrl(projects.map((project) => project.address));
  
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const addProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
    } else {
      setProjects([data, ...projects]);
      setNewProject({
        title: '',
        description: '',
        address: '',
        status: 'Active',
      });
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;

    const { error } = await supabase
      .from('projects')
      .update(newProject)
      .eq('id', editingProject.id);

    if (error) {
      console.error('Error updating project:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProject.id ? { ...p, ...newProject } : p
      )
    );

    setEditingProject(null);
    setNewProject({
      title: '',
      description: '',
      address: '',
      status: 'Active',
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.error('Error deleting project:', error);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      title: project.title,
      description: project.description,
      address: project.address,
      status: project.status,
    });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setNewProject({
      title: '',
      description: '',
      address: '',
      status: 'Active',
    });
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

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('project-media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('project-media')
        .getPublicUrl(uploadData.path);

      const publicUrl = publicUrlData?.publicUrl || null;

      const { error: updateError } = await supabase
        .from('projects')
        .update({ photo_url: publicUrl })
        .eq('id', project.id);

      if (updateError) {
        console.error('Error saving photo URL:', updateError);
        return;
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, photo_url: publicUrl } : p
        )
      );

      setSelectedFiles((prev) => ({ ...prev, [project.id]: null }));
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        Loading projects...
      </main>
    );
  }

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'system-ui',
      }}
    >
      <h1 style={{ fontSize: '32px', color: '#1F2937', marginBottom: '32px' }}>
        Guardian Lighting Inspection Dashboard
      </h1>

      {/* Add/Edit Project Form */}
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
          {editingProject ? 'Edit Project' : 'Add New Project'}
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            placeholder="Company Name (required)"
            value={newProject.title}
            onChange={(e) =>
              setNewProject({ ...newProject, title: e.target.value })
            }
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '300px',
            }}
          />
          <input
            placeholder="Description (optional)"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '300px',
            }}
          />
          <input
            placeholder="Street Address (required)"
            value={newProject.address}
            onChange={(e) =>
              setNewProject({ ...newProject, address: e.target.value })
            }
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '300px',
            }}
          />
          <select
            value={newProject.status}
            onChange={(e) =>
              setNewProject({ ...newProject, status: e.target.value })
            }
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            <option>Active</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={editingProject ? updateProject : addProject}
              disabled={!canSubmitProject}
              style={{
                padding: '12px 24px',
                background: canSubmitProject ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: canSubmitProject ? 'pointer' : 'not-allowed',
              }}
            >
              {editingProject ? 'Update Project' : 'Add Project'}
            </button>
            {editingProject && (
              <button
                onClick={cancelEdit}
                style={{
                  padding: '12px 24px',
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <p style={{ marginTop: '12px', color: '#6B7280', fontSize: '14px' }}>
          Company name and address are required. Enter an address to preview the overhead satellite image.
        </p>
      </div>

      {addressPreviewUrl && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', color: '#1F2937', marginBottom: '12px' }}>
            New Project Address Preview (Satellite)
          </h2>
          <iframe
            width="100%"
            height="420"
            src={addressPreviewUrl}
            style={{
              border: 0,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Project Locations Map */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
          Project Locations ({projects.length} projects)
        </h2>
        <img
          src={projectsMapUrl}
          alt="Satellite map with project location pins"
          style={{
            width: '100%',
            height: '500px',
            objectFit: 'cover',
            border: 0,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        />
      </div>

      {/* Projects with photo upload */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}
      >
        {projects.length === 0 ? (
          <p
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '18px',
            }}
          >
            No projects yet. Add your first project above!
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              style={{
                padding: '25px',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px 0',
                  color: '#1F2937',
                  fontSize: '20px',
                }}
              >
                {project.title}
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#6B7280' }}>
                {project.description}
              </p>
              <p
                style={{
                  margin: '0 0 12px 0',
                  color: '#374151',
                  fontSize: '14px',
                }}
              >
                📍 {project.address}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    padding: '4px 12px',
                    background:
                      project.status === 'Active'
                        ? '#10B981'
                        : project.status === 'In Progress'
                        ? '#F59E0B'
                        : '#6B7280',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {project.status}
                </span>
              </div>

              {/* Photo section */}
              {project.photo_url && (
                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={project.photo_url}
                    alt="Project"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(project.id, e)}
                />
                <button
                  onClick={() => handleUploadPhoto(project)}
                  disabled={!selectedFiles[project.id] || uploadingId === project.id}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    background:
                      !selectedFiles[project.id] || uploadingId === project.id
                        ? '#9CA3AF'
                        : '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor:
                      !selectedFiles[project.id] || uploadingId === project.id
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {uploadingId === project.id ? 'Uploading…' : 'Upload Photo'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(project)}
                  style={{
                    padding: '8px 16px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
