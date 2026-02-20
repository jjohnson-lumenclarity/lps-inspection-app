'use client'

import { useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Active' });

  const addProject = () => {
    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
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
      background: 'white', padding: '24px', borderRadius: '12px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '32px'
    }}>
      {/* ... your existing form code ... */}
    </div>

    {/* MAP - NEW! */}
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '24px', color: '#1F2937', marginBottom: '16px' }}>
        Project Locations
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
      {/* ... your existing projects.map ... */}
    </div>
  </main>
);
