'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function InspectionDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [newZone, setNewZone] = useState({ name: '', x_percent: 50, y_percent: 50 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('*, project_areas(*)')
      .eq('id', projectId)
      .single();
    setProject(data);
    setZones(data?.project_areas || []);
    setLoading(false);
  };

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data } = await supabase
      .from('project_areas')
      .insert([{ project_id: projectId, ...newZone }])
      .select()
      .single();
    if (data) {
      setZones([...zones, data]);
      setNewZone({ name: '', x_percent: 50, y_percent: 50 });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back + Header */}
        <a href="/inspections" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          ← Back to Dashboard
        </a>
        
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{project?.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{project?.address}</p>
          <div className="inline-flex px-6 py-3 bg-emerald-100 text-emerald-800 rounded-2xl font-semibold text-lg">
            {project?.status}
          </div>
        </div>

        {/* Add Zone Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">➕ Add Lighting Zone</h2>
          <form onSubmit={addZone} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              placeholder="Zone Name (Parking Lot, Entry...)"
              value={newZone.name}
              onChange={(e) => setNewZone({...newZone, name: e.target.value})}
              className="p-4 border rounded-2xl focus:ring-4 focus:ring-blue-200 text-lg"
              required
            />
            <input
              type="number"
              placeholder="X % (0-100)"
              value={newZone.x_percent}
              onChange={(e) => setNewZone({...newZone, x_percent: Number(e.target.value)})}
              min="0" max="100"
              className="p-4 border rounded-2xl focus:ring-4 focus:ring-green-200 text-lg"
              required
            />
            <input
              type="number"
              placeholder="Y % (0-100)"
              value={newZone.y_percent}
              onChange={(e) => setNewZone({...newZone, y_percent: Number(e.target.value)})}
              min="0" max="100"
              className="p-4 border rounded-2xl focus:ring-4 focus:ring-green-200 text-lg"
              required
            />
            <button type="submit" className="md:col-span-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:shadow-xl">
              Add Zone
            </button>
          </form>
        </div>

        {/* Zones List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-2xl shadow-2xl hover:scale-105 transition-all">
              <h3 className="text-2xl font-bold mb-4">{zone.name}</h3>
              <div className="space-y-2 text-xl opacity-90">
                <div>X: {zone.x_percent}%</div>
                <div>Y: {zone.y_percent}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
