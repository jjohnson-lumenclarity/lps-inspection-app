'use client'

import { useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  address: string; 
  status: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', address: '', status: 'Active' });

  const addProject = () => {
    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      address: newProject.address,
      status: newProject.status
    };
    setProjects([...projects, project]);
    setNewProject({ title: '', description: '', status: 'Active' });
  };

  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', color: '#1F2937', marginBottom: '32px' }}>
        LPS Inspection Dashboard
      </h1>

      {/* Add Project Form */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
          Add New Project
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            placeholder="Project Title"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '300px'
            }}
          />
          <input
            placeholder="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '300px'
            }}
          />
          <input
  placeholder="123 Main St, Rockford MI"
  value={newProject.address || ''}
  onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
  style={{
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '16px',
    minWidth: '300px'
  }}
/>
          <select
            value={newProject.status}
            onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          >
            <option>Active</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <button
            onClick={addProject}
            disabled={!newProject.title.trim()}
            style={{
              padding: '12px 24px',
              background: newProject.title.trim() ? '#3B82F6' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: newProject.title.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Add Project
          </button>
        </div>
      </div>

      {/* MAP - NEW! */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
          Project Locations - Rockford, MI
        </h2>
        <iframe
          width="100%"
          height="500"
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAodLZjU2qN3sxua9fIy54Xc12tTwiVTD4&q=Rockford+MI&zoom=11"
          style={{ border: 0, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          allowFullScreen
          loading="lazy"
        />
      </div>

      {/* Projects List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {projects.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6B7280', fontSize: '18px' }}>
            No projects yet. Add your first project above!
          </p>
        ) : (
          projects.map(project => (
            <div key={project.id} style={{
              padding: '25px',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#1F2937', fontSize: '20px' }}>
                {project.title}
              </h3>
              <p style={{ margin: '0 0 20px 0', color: '#6B7280' }}>
                {project.description}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  padding: '4px 12px',
                  background: project.status === 'Active' ? '#10B981' : 
                             project.status === 'In Progress' ? '#F59E0B' : '#6B7280',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {project.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
