'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

type AreaPhoto = {
  id: string;
  area_id: string;
  photo_url: string;
  created_at?: string;
};

export default function InspectionDetail() {
  const params = useParams();
  const projectId = useMemo(() => {
    const idParam = params.id;
    return Array.isArray(idParam) ? idParam[0] : idParam;
  }, [params.id]);
  const [project, setProject] = useState<Project | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonePhotos, setZonePhotos] = useState<Record<string, AreaPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setErrorMessage('Project id is missing from the URL.');
      setLoading(false);
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, address, status, project_areas(id, name, x_percent, y_percent)')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Failed to load project:', error);
      setErrorMessage('Could not load this inspection summary right now.');
      setLoading(false);
      return;
    }

    const nextZones = (data.project_areas as Zone[]) || [];
    setProject({
      id: data.id,
      title: data.title,
      address: data.address,
      status: data.status,
    });
    setZones(nextZones);

    if (nextZones.length > 0) {
      const { data: photoData, error: photoError } = await supabase
        .from('area_photos')
        .select('id, area_id, photo_url, created_at')
        .in('area_id', nextZones.map((zone) => zone.id));

      if (!photoError) {
        const grouped = (photoData as AreaPhoto[]).reduce<Record<string, AreaPhoto[]>>((acc, photo) => {
          acc[photo.area_id] = [...(acc[photo.area_id] || []), photo];
          return acc;
        }, {});
        setZonePhotos(grouped);
      } else {
        console.warn('Unable to load area photos:', photoError.message);
      }
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 print:bg-white print:p-2" style={{ paddingTop: "88px" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <Link href="/inspections" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            ← Back to Inspections
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm print:shadow-none">
          <h1 className="text-3xl font-bold text-gray-800">Quote Summary: {project?.title}</h1>
          <p className="mt-2 text-gray-600">{project?.address}</p>
          <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            {project?.status}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Total zones: <strong>{zones.length}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid">
              <h3 className="text-lg font-semibold text-slate-900">{zone.name}</h3>
              {(zonePhotos[zone.id] || []).length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(zonePhotos[zone.id] || []).map((photo) => (
                    <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer">
                      <Image
                        src={photo.photo_url}
                        alt={`${zone.name} evidence`}
                        width={160}
                        height={110}
                        unoptimized
                        className="h-24 w-full rounded object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No photos attached yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
