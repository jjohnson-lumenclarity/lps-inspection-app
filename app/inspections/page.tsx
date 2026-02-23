'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Inspections() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        project_areas (
          name,
          x_percent,
          y_percent,
          area_media(url, notes)
        )
      `);
    
    setProjects(data || []);
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Loading inspections...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Inspections</h1>
      
      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No inspections yet - check Supabase data
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <div key={project.id} className="border rounded-xl p-6 shadow-md hover:shadow-xl transition-all">
              <h2 className="text-2xl font-bold mb-2 truncate">{project.title}</h2>
              <p className="text-gray-600 mb-3">{project.address}</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {project.status}
              </span>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold mb-3 text-lg">Areas ({project.project_areas?.length || 0})</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {project.project_areas?.map((area: any) => (
                    <div key={area.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <span className="font-medium">{area.name}</span>
                      <span className="text-sm text-gray-500 px-2 py-1 bg-white rounded">
                        {area.x_percent}%, {area.y_percent}%
                      </span>
                    </div>
                  )) || <p className="text-gray-400 text-sm italic">No areas added</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
