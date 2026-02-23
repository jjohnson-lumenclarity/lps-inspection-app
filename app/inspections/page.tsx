'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Inspections() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('*, project_areas(name, x_percent, y_percent)');
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .insert([formData]);
    if (!error) {
      setShowForm(false);
      setFormData({ title: '', address: '', description: '' });
      fetchProjects();
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Lighting Inspections</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-semibold shadow-lg transition-all"
        >
          + New Inspection
        </button>
      </div>
      
      {/* NEW INSPECTION FORM */}
      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-blue-100 max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">New Lighting Inspection</h2>
          <form onSubmit={addInspection} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Commercial Building Name *"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Full Street Address *"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Description (building type, purpose)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:shadow-xl transition-all">
                💡 Save Inspection
              </button>
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INSPECTION LIST */}
      {projects.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <h2 className="text-2xl font-semibold mb-4">No inspections yet</h2>
          <p>Click <strong>+ New Inspection</strong> to get started</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <div key={project.id} className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
              <div className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl -mx-2 mb-6"></div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800 line-clamp-2 group-hover:text-blue-600">
                {project.title}
              </h2>
              <p className="text-lg text-gray-600 mb-4 mb-2">{project.address}</p>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-full text-sm font-semibold mb-6">
                {project.status?.toUpperCase() || 'ACTIVE'}
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-xl flex items-center mb-4">
                  💡 Lighting Zones
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {project.project_areas?.length || 0}
                  </span>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {project.project_areas?.map((area: any) => (
                    <div key={area.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl hover:shadow-md transition-all group/area">
                      <span className="font-semibold text-gray-800">{area.name}</span>
                      <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg font-mono shadow-sm">
                        {area.x_percent}% | {area.y_percent}%
                      </span>
                    </div>
                  )) || (
                    <div className="p-6 text-center text-gray-400 rounded-xl bg-gray-50 italic">
                      No lighting zones added
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
