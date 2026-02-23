'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Inspections() {
  const [projects, setProjects] = useState([]);
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
          *,
          area_media (*)
        )
      `);
    setProjects(data || []);
    setLoading(false);
  };

  if (loading) return <div>Loading inspections...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Inspections Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: any) => (
          <div key={project.id} className="border rounded-lg p-6 hover:shadow-lg">
            <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
            <p className="text-gray-600 mb-4">{project.address}</p>
            <p className="text-sm bg-green-100 px-3 py-1 rounded-full w-fit">
              {project.status}
            </p>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Areas ({project.project_areas?.length || 0})</h3>
              <div className="space-y-2">
                {project.project_areas?.map((area: any) => (
                  <div key={area.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{area.name}</span>
                    <span className="text-sm text-gray-500">
                      {area.x_percent}%, {area.y_percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No inspections yet. Add via Supabase dashboard.
        </div>
      )}
    </div>
  );
}
