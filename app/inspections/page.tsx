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
    const { data } = await supabase
      .from('projects')
      .select('*, project_areas(name, x_percent, y_percent), photo_url');
    setProjects(data || []);
    setLoading(false);
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    const zoneName = prompt('Lighting zone name?\nExamples: Parking Pole #3, Entry Signage, Wall Pack #7') || '';
    if (!zoneName) return;
    
    const newPin = { x, y, name: zoneName };
    setPins([...pins, newPin]);
    
    const supabase = createClient();
    const { error } = await supabase.from('project_areas').insert([{
      project_id: selectedProject.id,
      name: zoneName,
      x_percent: x,
      y_percent: y
    }]);
    
    if (error) {
      alert('Save failed: ' + error.message);
      setPins(pins);
    }
  };

  if (loading) return <div className="p-8 text-center text-2xl font-bold text-gray-500">Loading inspections...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
      <h1 style={{ 
  fontSize: '3rem', 
  fontWeight: 'bold', 
  textAlign: 'center', 
  background: 'linear-gradient(90deg, #1e293b, #475569, #334155)', 
  WebkitBackgroundClip: 'text', 
  WebkitTextFillColor: 'transparent',
  marginBottom: '3rem'
}}>
  Guardian Lightning Inspection
</h1>


        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 p-8 bg-white rounded-3xl shadow-xl">
  {projects.map((project) => (
    <div key={project.id} className="bg-gradient-to-b from-white to-blue-50 border-2 border-blue-100 rounded-2xl p-8 hover:shadow-2xl cursor-pointer hover:bg-white transition-all hover:scale-105">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">{project.title}</h2>
      <p className="text-lg text-gray-600 mb-6">{project.address}</p>
      <div className="flex justify-between items-center">
        <span className="px-4 py-2 bg-green-400 text-white rounded-xl font-bold text-lg">
          {project.status || 'ACTIVE'}
        </span>
        <div className="text-3xl font-black text-blue-600">
          {project.project_areas?.length || 0}
        </div>
      </div>
    </div>
  ))}
</div>

        
        {/* Aerial Map View */}
        {selectedProject && (
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-3xl border border-white/50 p-8 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center mb-12">
              <div className="flex-1">
                <h2 className="text-4xl font-black mb-2 text-gray-900">{selectedProject.title}</h2>
                <p className="text-xl text-gray-700">{selectedProject.address}</p>
              </div>
              <button 
                onClick={() => {setSelectedProject(null); setPins([]);}}
                className="px-8 py-3 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              >
                ← All Inspections
              </button>
            </div>
            
            <div className="relative mb-12 w-full h-[90vh] flex items-center justify-center">
              <div 
                className="!h-[90vh] w-full max-w-6xl mx-auto bg-cover bg-center bg-no-repeat rounded-3xl border-8 border-dashed border-blue-300/50 shadow-3xl relative overflow-hidden cursor-crosshair hover:border-blue-400/80 transition-all duration-300 hover:shadow-4xl group/map"
                style={{ 
                  backgroundImage: `url(${selectedProject?.photo_url || 'https://via.placeholder.com/1200x800/4F46E5/FFFFFF?text=Aerial+Site+Photo'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '90vh',
                  minHeight: '600px'
                }}
                onClick={handleImageClick}
              >
                {/* Pins */}
               {pins.map((pin, index) => (
  <div
    key={index}
    className="absolute w-20 h-20 bg-red-500 border-8 border-white rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg z-[999] pointer-events-none"
    style={{
      left: `${pin.x}%`,
      top: `${pin.y}%`,
      transform: 'translate(-50%, -50%)'
    }}
  >
    {pin.name.slice(0, 3)}
  </div>
))}

                
                {/* Hover text */}
                <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/20 transition-all flex items-center justify-center pointer-events-none rounded-3xl">
                  <div className="text-white text-2xl font-black drop-shadow-2xl opacity-0 group-hover/map:opacity-100">
                    👆 Click to add lighting zone pin
                  </div>
                </div>
              </div>
              <p className="text-center mt-6 text-lg font-semibold text-gray-700">
                📍 Click building areas (parking lot, signage, walls) to create lighting zone pins
              </p>
            </div>

            {/* Active Pins List */}
            {pins.length > 0 && (
              <div>
                <h3 className="text-2xl font-black mb-6 flex items-center">
                  📋 Active Lighting Zones ({pins.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pins.map((pin, i) => (
                    <div key={i} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 mx-auto shadow-2xl">
                        {pin.name.slice(0,3)}
                      </div>
                      <h4 className="font-black text-xl mb-2 text-gray-900 text-center">{pin.name}</h4>
                      <div className="flex justify-center gap-4 text-sm text-blue-700 font-mono bg-white/50 px-4 py-2 rounded-xl">
                        <span>X: {pin.x}%</span>
                        <span>Y: {pin.y}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedProject && projects.length === 0 && (
          <div className="text-center py-32">
            <h2 className="text-3xl font-black mb-4 text-gray-600">No inspections</h2>
            <p className="text-xl text-gray-500 mb-8">Create first inspection in Supabase</p>
          </div>
        )}
      </div>
    </div>
  );
}
