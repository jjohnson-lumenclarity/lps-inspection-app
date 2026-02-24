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
      <div className="mb-12 p-6 bg-white/80 backdrop-blur rounded-3xl shadow-xl border">
  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
    <h1 className="text-4xl font-black bg-gradient-to-r from-gray-800 to-slate-800 bg-clip-text text-transparent">
      Guardian Lightning Inspections
    </h1>
    
    {/* SEARCH + ACTIONS */}
    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="🔍 Search clients, addresses..."
          className="w-full p-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-blue-400 shadow-lg focus:shadow-xl transition-all"
          onChange={(e) => console.log('Search:', e.target.value)}
        />
        <span className="absolute left-4 top-4 text-gray-400">🔍</span>
      </div>
      <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
        + New Project
      </button>
    </div>
  </div>
  
  {/* RECENT */}
  <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="p-3 bg-blue-100 rounded-xl text-center text-sm cursor-pointer hover:bg-blue-200 transition-all">
        Recent #{i}
      </div>
    ))}
  </div>
</div>


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
            placeholder="Project Title"
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
            placeholder="Description"
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
            placeholder="123 Main St, Rockford MI"
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
              disabled={!newProject.title.trim()}
              style={{
                padding: '12px 24px',
                background: newProject.title.trim() ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: newProject.title.trim() ? 'pointer' : 'not-allowed',
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
      </div>

      {/* Static Map section (keep your iframe or remove if you want) */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
          Project Locations - Rockford, MI ({projects.length} projects)
        </h2>
        <iframe
          width="100%"
          height="500"
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAodLZjU2qN3sxua9fIy54Xc12tTwiVTD4&q=Rockford+MI&zoom=11"
          style={{
            border: 0,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          allowFullScreen
          loading="lazy"
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
