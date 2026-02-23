'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Inspections() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [pins, setPins] = useState<{x: number, y: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('projects').select('*');
    setProjects(data || []);
    setLoading(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const zoneName = prompt('Zone name? (Parking Lot, Entry...)') || 'New Zone';
    const newPin = { x: Math.round(x), y: Math.round(y), name: zoneName };
    setPins([...pins, newPin]);
    
    // Save to Supabase
    const supabase = createClient();
    supabase.from('project_areas').insert([{
      project_id: selectedProject.id,
      name: zoneName,
      x_percent: newPin.x,
      y_percent: newPin.y
    }]);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🏢 Lighting Inspection
        </h1>

        {/* Project List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {projects.map((project: any) => (
            <div 
              key={project.id}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all"
              onClick={() => {
                setSelectedProject(project);
                setPins(project.project_areas?.map((a: any) => ({x: a.x_percent, y: a.y_percent, name: a.name})) || []);
              }}
            >
              <h2 className="text-xl font-bold mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-4">{project.address}</p>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                  {project.status}
                </span>
                <span className="text-sm text-gray-500">
                  {project.project_areas?.length || 0} zones
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Map View */}
        {selectedProject && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">{selectedProject.title}</h2>
              <button 
                onClick={() => {setSelectedProject(null); setPins([]);}}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold"
              >
                ← Back
              </button>
            </div>
            
            <div className="relative mb-8">
              {/* Replace with real Google aerial when API ready */}
              <div 
                className="w-full h-[500px] bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl cursor-crosshair border-4 border-dashed border-blue-300 shadow-2xl relative overflow-hidden"
                onClick={handleImageClick}
                style={{backgroundImage: 'url("https://via.placeholder.com/1200x500/8B4513/FFFFFF?text=Google+Aerial+View+-+Click+to+Pin")'}}
              >
                {pins.map((pin, i) => (
                  <div
                    key={i}
                    className="absolute w-12 h-12 bg-red-500 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs border-4 border-white"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {pin.name.slice(0,2)}
                  </div>
                ))}
              </div>
              <p className="text-center mt-4 text-gray-600 text-sm">
                👆 Click anywhere on building to create lighting zone pin (X%, Y%)
              </p>
            </div>

            {/* Pins List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pins.map((pin, i) => (
                <div key={i} className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                  <h3 className="font-bold text-lg">{pin.name}</h3>
                  <p className="text-blue-700">X: {pin.x}% | Y: {pin.y}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
