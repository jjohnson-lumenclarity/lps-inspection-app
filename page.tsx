'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { prisma } from '@/lib/prisma';

type Project = {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const mapContainerStyle = { width: '100%', height: '500px' };
  const center = { lat: 43.34, lng: -85.41 }; // Sparta, MI

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  const addProject = async () => {
    const name = prompt('Project name:');
    const address = prompt('Address:');
    if (name && address) {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      fetchProjects();
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">LPS Projects Map</h1>
        <button 
          onClick={addProject}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
        >
          + New Project
        </button>
      </div>

      {/* MAP WITH PINS */}
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={10}
        >
          {projects.map((project) => (
            <Marker 
              key={project.id}
              position={{ 
                lat: project.lat || 43.34, 
                lng: project.lng || -85.41 
              }}
              title={project.name}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* List */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Projects ({projects.length})</h2>
        <div className="grid gap-4">
          {projects.map((project) => (
            <a 
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
            >
              <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
              <p className="text-gray-600">{project.address}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
