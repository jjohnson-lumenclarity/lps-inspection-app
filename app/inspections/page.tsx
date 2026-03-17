'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BuildingCanvas } from '@/components/inspection-prep/BuildingCanvas';
import { QuadrantPanel } from '@/components/inspection-prep/QuadrantPanel';
import type { AreaPhoto, ProjectArea, ZoneState } from '@/components/inspection-prep/types';

type Project = { id: string; title: string; address: string; status: string; photo_url?: string | null };
const defaultZoneState: ZoneState = { notes: '', status: 'Not Started' };

export default function InspectionPrepPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [quadrants, setQuadrants] = useState<ProjectArea[]>([]);
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string | null>(null);
  const [photosByQuadrant, setPhotosByQuadrant] = useState<Record<string, AreaPhoto[]>>({});
  const [zoneStateByQuadrant, setZoneStateByQuadrant] = useState<Record<string, ZoneState>>({});
  const [projectSearch, setProjectSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const selectedQuadrant = quadrants.find((quadrant) => quadrant.id === selectedQuadrantId) || null;

  useEffect(() => {
    const loadProjects = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('id,title,address,status,photo_url').order('created_at', { ascending: false });
      setProjects((data as Project[]) || []);
      const projectId = new URLSearchParams(window.location.search).get('projectId') || '';
      if (projectId) setSelectedProjectId(projectId);
    };
    void loadProjects();
  }, []);

  useEffect(() => {
    const loadQuadrants = async () => {
      if (!selectedProjectId) { setQuadrants([]); setSelectedQuadrantId(null); return; }
      const supabase = createClient();
      const { data } = await supabase.from('project_areas').select('id,name,x_percent,y_percent').eq('project_id', selectedProjectId).order('created_at', { ascending: true });
      const list = ((data as ProjectArea[]) || []).filter((item) => item.id);
      setQuadrants(list);
      if (list.length > 0) setSelectedQuadrantId((current) => current || list[0].id);
      const zoneState: Record<string, ZoneState> = {};
      list.forEach((item) => {
        const raw = window.localStorage.getItem(`zone-state:${selectedProjectId}:${item.id}`);
        zoneState[item.id] = raw ? { ...defaultZoneState, ...JSON.parse(raw) } : defaultZoneState;
      });
      setZoneStateByQuadrant(zoneState);
      const ids = list.map((item) => item.id);
      if (ids.length > 0) {
        const { data: photoRows } = await supabase.from('area_photos').select('id,area_id,photo_url').in('area_id', ids);
        const grouped: Record<string, AreaPhoto[]> = {};
        ((photoRows as AreaPhoto[]) || []).forEach((photo) => { grouped[photo.area_id] = [...(grouped[photo.area_id] || []), photo]; });
        setPhotosByQuadrant(grouped);
      } else setPhotosByQuadrant({});
    };
    void loadQuadrants();
  }, [selectedProjectId]);

  const filteredProjects = useMemo(() => projects.filter((project) => `${project.title} ${project.address}`.toLowerCase().includes(projectSearch.toLowerCase())), [projectSearch, projects]);

  const createQuadrant = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedProjectId) return;
    const name = window.prompt('Quadrant name');
    if (!name) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    const supabase = createClient();
    const { data } = await supabase.from('project_areas').insert([{ project_id: selectedProjectId, name, x_percent: x, y_percent: y }]).select('id,name,x_percent,y_percent').single();
    if (!data) return;
    const newQuadrant = data as ProjectArea;
    setQuadrants((prev) => [...prev, newQuadrant]);
    setSelectedQuadrantId(newQuadrant.id);
    setZoneStateByQuadrant((prev) => ({ ...prev, [newQuadrant.id]: defaultZoneState }));
  };

  const saveZoneState = (quadrantId: string, nextState: ZoneState) => {
    setZoneStateByQuadrant((prev) => ({ ...prev, [quadrantId]: nextState }));
    if (!selectedProjectId) return;
    window.localStorage.setItem(`zone-state:${selectedProjectId}:${quadrantId}`, JSON.stringify(nextState));
  };

  const uploadPhoto = async (file: File | null) => {
    if (!selectedQuadrantId || !file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `zone-photos/${selectedQuadrantId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('project-media').upload(path, file, { upsert: true });
    if (uploadError) {
      const localPhoto = { id: `local-${Date.now()}`, area_id: selectedQuadrantId, photo_url: URL.createObjectURL(file) };
      setPhotosByQuadrant((prev) => ({ ...prev, [selectedQuadrantId]: [localPhoto, ...(prev[selectedQuadrantId] || [])] }));
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('project-media').getPublicUrl(uploadData.path);
    const { data: row } = await supabase.from('area_photos').insert([{ area_id: selectedQuadrantId, photo_url: urlData.publicUrl }]).select('id,area_id,photo_url').single();
    if (row) {
      const saved = row as AreaPhoto;
      setPhotosByQuadrant((prev) => ({ ...prev, [selectedQuadrantId]: [saved, ...(prev[selectedQuadrantId] || [])] }));
    }
    setUploading(false);
  };

  const moveQuadrant = (direction: -1 | 1) => {
    if (!selectedQuadrantId || quadrants.length === 0) return;
    const index = quadrants.findIndex((item) => item.id === selectedQuadrantId);
    if (index === -1) return;
    setSelectedQuadrantId(quadrants[(index + direction + quadrants.length) % quadrants.length].id);
  };

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%', background: '#fff' };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 20, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: '#0f172a' }}>Inspection Prep Workspace</h1>
        <p style={{ margin: '8px 0 0', color: '#475569' }}>Select a project, click the building image to place quadrants, and work one area at a time.</p>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <input style={inputStyle} placeholder="Search project by name or address" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
          <select style={inputStyle} value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}><option value="">Select a project</option>{filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.title} — {project.address}</option>)}</select>
        </div>
      </header>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        <BuildingCanvas imageUrl={selectedProject?.photo_url} quadrants={quadrants} selectedQuadrantId={selectedQuadrantId} onCanvasClick={createQuadrant} onSelectQuadrant={(quadrant) => setSelectedQuadrantId(quadrant.id)} />
        <QuadrantPanel
          quadrants={quadrants}
          selected={selectedQuadrant}
          zoneState={selectedQuadrant ? zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState : defaultZoneState}
          photos={selectedQuadrant ? photosByQuadrant[selectedQuadrant.id] || [] : []}
          onSelect={setSelectedQuadrantId}
          onPrev={() => moveQuadrant(-1)}
          onNext={() => moveQuadrant(1)}
          onStatusChange={(status) => selectedQuadrant && saveZoneState(selectedQuadrant.id, { ...(zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState), status })}
          onNotesChange={(notes) => selectedQuadrant && saveZoneState(selectedQuadrant.id, { ...(zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState), notes })}
          onUpload={uploadPhoto}
          uploading={uploading}
          projectId={selectedProjectId}
        />
      </div>
    </div>
  );
}
