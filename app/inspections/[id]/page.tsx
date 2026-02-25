'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = {
  id: string;
  title: string;
  address: string;
  status: string;
};

type Zone = {
  id: string;
  name: string;
  x_percent: number;
  y_percent: number;
};

export default function InspectionDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [newZone, setNewZone] = useState({ name: '', x_percent: 50, y_percent: 50 });
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, address, status, project_areas(id, name, x_percent, y_percent)')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Failed to load project:', error);
      setLoading(false);
      return;
    }

    setProject({
      id: data.id,
      title: data.title,
      address: data.address,
      status: data.status,
    });
    setZones((data.project_areas as Zone[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();
    const { data, error } = await supabase
      .from('project_areas')
      .insert([{ project_id: projectId, ...newZone }])
      .select('id, name, x_percent, y_percent')
      .single();

    if (error) {
      console.error('Failed to add zone:', error);
      return;
    }

    setZones((prev) => [...prev, data as Zone]);
    setNewZone({ name: '', x_percent: 50, y_percent: 50 });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/inspections" className="mb-8 inline-flex items-center text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>

        <div className="mb-12 rounded-3xl bg-white p-12 shadow-2xl">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">{project?.title}</h1>
          <p className="mb-6 text-xl text-gray-600">{project?.address}</p>
          <div className="inline-flex rounded-2xl bg-emerald-100 px-6 py-3 text-lg font-semibold text-emerald-800">
            {project?.status}
          </div>
        </div>

        <div className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold">➕ Add Lighting Zone</h2>
          <form onSubmit={addZone} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <input
              placeholder="Zone Name (Parking Lot, Entry...)"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              className="rounded-2xl border p-4 text-lg focus:ring-4 focus:ring-blue-200"
              required
            />
            <input
              type="number"
              placeholder="X % (0-100)"
              value={newZone.x_percent}
              onChange={(e) => setNewZone({ ...newZone, x_percent: Number(e.target.value) })}
              min="0"
              max="100"
              className="rounded-2xl border p-4 text-lg focus:ring-4 focus:ring-green-200"
              required
            />
            <input
              type="number"
              placeholder="Y % (0-100)"
              value={newZone.y_percent}
              onChange={(e) => setNewZone({ ...newZone, y_percent: Number(e.target.value) })}
              min="0"
              max="100"
              className="rounded-2xl border p-4 text-lg focus:ring-4 focus:ring-green-200"
              required
            />
            <button
              type="submit"
              className="md:col-span-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-lg font-bold text-white hover:shadow-xl"
            >
              Add Zone
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-2xl transition-all hover:scale-105"
            >
              <h3 className="mb-4 text-2xl font-bold">{zone.name}</h3>
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
