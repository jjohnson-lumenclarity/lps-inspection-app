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
            onChange={(e) => setNewProject({ ...newProject,
