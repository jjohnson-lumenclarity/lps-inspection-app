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
    .select('*, project_areas(name, x_percent, y_percent), photo_url');  // ✅ Added photo_url
  setProjects(data || []);
  setLoading(false);
};


  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
  
  const zoneName = prompt(`Lighting zone name?\nExamples: Parking Pole #3, Entry Signage, Wall Pack #7`) || '';
  if (!zoneName) return;
  
  // OPTIMISTIC UI
  const newPin = { x, y, name: zoneName };
  setPins([...pins, newPin]);
  
  // SAVE TO SUPABASE
  const supabase = createClient();
  const { error } = await supabase.from('project_areas').insert([{
    project_id: selectedProject.id,
    name: zoneName,
    x_percent: x,
    y_percent: y
  }]);
  
  if (error) {
    alert('Save failed: ' + error.message);
    setPins(pins); // Revert
  }
};

  if (loading) return <div className="p-8 text-center text-2xl font-bold text-gray-500">Loading inspections...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-12 text-center bg-gradient-to-r from-gray-800 via-gray-600 to-slate-800 bg-clip-text text-transparent drop-shadow-2xl">
          Guardian Lightning Inspection - Current Projects
        </h1>

       {/* Project Cards - DASHBOARD STYLE */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
  {projects.map((project: any) => (
    <div 
      key={project.id}
      className="group bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 hover:border-blue-200/80 hover:bg-white/90 hover:-translate-y-3 transition-all duration-500 cursor-pointer overflow-hidden max-w-sm w-full mx-auto relative"
      onClick={() => {
        setSelectedProject(project);
        setPins(project.project_areas?.map((a: any) => ({
          x: a.x_percent, 
          y: a.y_percent, 
          name: a.name
        })) || []);
      }}
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-3xl z-10"></div>
      
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100 group-hover:brightness-105 transition-all duration-500">
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${project.photo_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format&fit=crop&q=80'})`
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
          <div className="text-white drop-shadow-2xl text-right">
            <div className="text-2xl font-black mb-1">{project.project_areas?.length || 0}</div>
            <div className="text-sm font-semibold opacity-90">lighting zones</div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-8 relative z-10">
        <h2 className="text-2xl font-black mb-3 text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
          {project.title}
        </h2>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed line-clamp-2">{project.address}</p>
        
        {/* Status & count */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-blue-100">
          <span className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all group-hover:scale-105">
            {project.status?.toUpperCase() || 'ACTIVE'}
          </span>
          <div className="text-2xl font-black text-blue-600 flex items-center gap-2">
            <span>{project.project_areas?.length || 0}</span>
            <span className="text-sm font-medium text-blue-500">zones</span>
          </div>
        </div>
        
        {/* Hover prompt */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-3xl flex items-center justify-center pointer-events-none backdrop-blur-sm">
          <div className="text-white/90 text-xl font-black text-center px-8 py-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl">
            🗺️ View Site + Pin Zones
          </div>
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
    backgroundImage: `url(${selectedProject.photo_url || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '90vh',
    minHeight: '600px'
  }}
  onClick={handleImageClick}
>
 {/* ADD THIS PIN LOOP */}
  {pins.map((pin, index) => (
    <div
      key={index}
      className="absolute w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 border-8 border-white/90 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-all z-20 group/pin"
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {pin.name.slice(0, 3).toUpperCase()}
    </div>
  ))}

  {/* Hover text */}
  <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/20 transition-all flex items-center justify-center pointer-events-none rounded-3xl">
    <div className="text-white text-2xl font-black drop-shadow-2xl opacity-0 group-hover/map:opacity-100">
      👆 Click to add lighting zone pin
    </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/10 transition-all flex items-center justify-center pointer-events-none">
                  <div className="text-white text-3xl font-black opacity-0 group-hover/map:opacity-100 transition-all drop-shadow-2xl">
                    👆 Click to Pin Lighting Zone
                  </div>
                </div>
                
                {/* Pins */}
                {pins.map((pin, i) => (
                  <div
                    key={i}
                    className="absolute w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 border-6 border-white/80 rounded-3xl shadow-2xl flex items-center justify-center text-white font-black text-xl drop-shadow-3xl hover:scale-125 hover:rotate-12 transition-all duration-300 z-20 group/pin"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {pin.name.slice(0,3)}
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-800 px-3 py-1 rounded-xl text-xs font-bold shadow-lg whitespace-nowrap min-w-[80px] text-center opacity-0 group-hover/pin:opacity-100 transition-all">
                      {pin.name}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 w-1 h-1 bg-white rounded-full shadow-lg transform -translate-x-1/2 scale-0 group-hover/pin:scale-100 transition-all"></div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-6 text-lg font-semibold text-gray-700">
                📍 Click building areas (parking lot, signage, walls) to create lighting zone pins
              </p>
            </div>

            {/* Active Pins */}
            {pins.length > 0 && (
              <div>
                <h3 className="text-2xl font-black mb-6 flex items-center">
                  📋 Active Lighting Zones ({pins.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pins.map((pin, i) => (
                    <div key={i} className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
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

