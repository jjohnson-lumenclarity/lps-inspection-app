'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Inspections() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_areas(name, x_percent, y_percent)');
      
      if (error) throw error;
      console.log('Data:', data); // Debug
      setProjects(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Lighting Inspections</h1>
      
      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-xl">
          No inspections yet
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <div key={project.id} className="border rounded-xl p-6 shadow-md hover:shadow-xl transition-all bg-white">
              <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-3">{project.address}</p>
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {project.status?.toUpperCase()}
              </span>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h3 className="font-semibold mb-4 text-lg flex items-center">
                  Lighting Zones <span className="ml-2 text-sm text-gray-500">({project.project_areas?.length || 0})</span>
                </h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {project.project_areas?.map((area: any) => (
                    <div key={area.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-inner">
                      <span className="font-semibold text-gray-800">{area.name}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{area.x_percent}% X | {area.y_percent}% Y</div>
                      </div>
                    </div>
                  )) || <div className="p-4 text-gray-400 italic rounded-lg bg-gray-50">No lighting zones</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
