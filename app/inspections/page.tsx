'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BuildingCanvas } from '@/components/inspection-prep/BuildingCanvas';
import { QuadrantPanel } from '@/components/inspection-prep/QuadrantPanel';
import type { AreaPhoto, ProjectArea, ZoneState } from '@/components/inspection-prep/types';
import type { ProjectMeta } from '@/components/dashboard/types';

type Project = { id: string; title: string; address: string; status: string; photo_url?: string | null };
const googleMapsApiKey = 'AIzaSyAodLZjU2qN3sxua9fIy54Xc12tTwiVTD4';
const defaultZoneState: ZoneState = { notes: '', status: 'Not Started', voiceNoteUrl: '' };
const defaultMeta = (): ProjectMeta => ({
  contactName: '', phone: '', email: '', inspectionDate: '', reportDate: '', dueDate: '', weather: 'Clear', temperature: '', contractorJobNumber: '', inspectors: '', certificationType: 'Recert', aerialImages: [],
});

const getStaticPreviewUrl = (address: string, zoom: number) => `https://maps.googleapis.com/maps/api/staticmap?size=1600x1200&maptype=satellite&zoom=${zoom}&center=${encodeURIComponent(address.trim() || 'United States')}&key=${googleMapsApiKey}`;
const getInteractiveEmbedUrl = (address: string, zoom: number) => `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address.trim() || 'United States')}&maptype=satellite&zoom=${zoom}`;

export default function InspectionPrepPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [quadrants, setQuadrants] = useState<ProjectArea[]>([]);
  const [selectedQuadrantId, setSelectedQuadrantId] = useState<string | null>(null);
  const [photosByQuadrant, setPhotosByQuadrant] = useState<Record<string, AreaPhoto[]>>({});
  const [zoneStateByQuadrant, setZoneStateByQuadrant] = useState<Record<string, ZoneState>>({});
  const [projectSearch, setProjectSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [mapAddress, setMapAddress] = useState('');
  const [mapZoom, setMapZoom] = useState(19);
  const [activeAerialImage, setActiveAerialImage] = useState('');
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [drawingLines, setDrawingLines] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const drawingRef = useRef(false);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const selectedQuadrant = quadrants.find((quadrant) => quadrant.id === selectedQuadrantId) || null;

  useEffect(() => {
    const loadProjects = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('id,title,address,status,photo_url').order('created_at', { ascending: false });
      const projectList = (data as Project[]) || [];
      setProjects(projectList);
      const metaByProject: Record<string, ProjectMeta> = {};
      projectList.forEach((project) => {
        try {
          const raw = window.localStorage.getItem(`project-meta:${project.id}`);
          metaByProject[project.id] = raw ? { ...defaultMeta(), ...JSON.parse(raw) } : defaultMeta();
        } catch { metaByProject[project.id] = defaultMeta(); }
      });
      setProjectMeta(metaByProject);
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

  useEffect(() => {
    if (!selectedProject) return;
    setMapAddress(selectedProject.address || '');
    const firstImage = selectedProject.photo_url || projectMeta[selectedProject.id]?.aerialImages?.[0] || '';
    setActiveAerialImage(firstImage);
    try {
      const raw = window.localStorage.getItem(`map-draw:${selectedProject.id}`);
      setDrawingLines(raw ? JSON.parse(raw) : []);
    } catch {
      setDrawingLines([]);
    }
  }, [projectMeta, selectedProject]);

  const filteredProjects = useMemo(() => projects.filter((project) => `${project.title} ${project.address}`.toLowerCase().includes(projectSearch.toLowerCase())), [projectSearch, projects]);
  const mapPreview = mapAddress ? getStaticPreviewUrl(mapAddress, mapZoom) : '';
  const mapEmbed = mapAddress ? getInteractiveEmbedUrl(mapAddress, mapZoom) : '';

  const persistMeta = (projectId: string, updater: (prev: ProjectMeta) => ProjectMeta) => {
    const next = updater(projectMeta[projectId] || defaultMeta());
    setProjectMeta((prev) => ({ ...prev, [projectId]: next }));
    window.localStorage.setItem(`project-meta:${projectId}`, JSON.stringify(next));
  };

  const saveAerialFrameToProject = () => {
    if (!selectedProjectId || !mapPreview) return;
    persistMeta(selectedProjectId, (prev) => ({ ...prev, aerialImages: [mapPreview, ...(prev.aerialImages || []).filter((img) => img !== mapPreview)] }));
    setActiveAerialImage(mapPreview);
  };

  const createQuadrant = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedProjectId || drawingEnabled) return;
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

  const startRecording = async () => {
    if (!selectedQuadrant) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      setRecording(true);
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          saveZoneState(selectedQuadrant.id, { ...(zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState), voiceNoteUrl: result });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      rec.start();
    } catch {
      setRecording(false);
      window.alert('Microphone is unavailable in this browser/session.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setRecording(false);
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

  const getPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onDrawStart = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingEnabled) return;
    drawingRef.current = true;
    const p = getPoint(event);
    setDrawingLines((prev) => [...prev, [p]]);
  };

  const onDrawMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingEnabled || !drawingRef.current) return;
    const p = getPoint(event);
    setDrawingLines((prev) => {
      const next = [...prev];
      if (next.length === 0) return next;
      next[next.length - 1] = [...next[next.length - 1], p];
      return next;
    });
  };

  const onDrawEnd = () => {
    drawingRef.current = false;
    if (selectedProjectId) window.localStorage.setItem(`map-draw:${selectedProjectId}`, JSON.stringify(drawingLines));
  };

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 16, width: '100%', background: '#fff' };

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 24, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
        <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: '#0f172a' }}>Inspection Prep Workspace</h1>
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 18 }}>Select a project, capture overhead images, place quadrants, and work one area at a time.</p>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
          <input style={inputStyle} placeholder="Search project by name or address" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} />
          <select style={inputStyle} value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}><option value="">Select a project</option>{filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.title} — {project.address}</option>)}</select>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1.3fr auto auto auto', gap: 10, alignItems: 'center' }}>
          <input style={inputStyle} placeholder="Address search for overhead image" value={mapAddress} onChange={(e) => setMapAddress(e.target.value)} />
          <button onClick={() => setMapZoom((z) => Math.max(16, z - 1))} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', padding: '10px 12px' }}>-</button>
          <div style={{ ...inputStyle, textAlign: 'center', width: 70 }}>{mapZoom}</div>
          <button onClick={() => setMapZoom((z) => Math.min(22, z + 1))} style={{ border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', padding: '10px 12px' }}>+</button>
        </div>

        {mapEmbed && <iframe title="Interactive satellite map" src={mapEmbed} style={{ marginTop: 12, width: '100%', height: 260, border: '1px solid #cbd5e1', borderRadius: 10 }} loading="lazy" />}

        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {mapPreview && <img src={mapPreview} alt="Map preview" style={{ width: 230, height: 130, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }} />}
          <button onClick={saveAerialFrameToProject} style={{ borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', padding: '10px 14px', fontWeight: 800 }}>Save current frame to project</button>
          {(projectMeta[selectedProjectId]?.aerialImages || []).slice(0, 6).map((img) => (
            <button key={img} onClick={() => setActiveAerialImage(img)} style={{ border: activeAerialImage === img ? '2px solid #0f172a' : '1px solid #cbd5e1', borderRadius: 8, padding: 0, background: '#fff' }}>
              <img src={img} alt="Saved aerial" style={{ width: 110, height: 70, objectFit: 'cover', borderRadius: 6 }} />
            </button>
          ))}
        </div>
      </header>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        <BuildingCanvas
          imageUrl={activeAerialImage || selectedProject?.photo_url}
          quadrants={quadrants}
          selectedQuadrantId={selectedQuadrantId}
          onCanvasClick={createQuadrant}
          onSelectQuadrant={(quadrant) => setSelectedQuadrantId(quadrant.id)}
          drawingEnabled={drawingEnabled}
          lines={drawingLines}
          onDrawStart={onDrawStart}
          onDrawMove={onDrawMove}
          onDrawEnd={onDrawEnd}
        />
        <QuadrantPanel
          quadrants={quadrants}
          selected={selectedQuadrant}
          zoneState={selectedQuadrant ? zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState : defaultZoneState}
          photos={selectedQuadrant ? photosByQuadrant[selectedQuadrant.id] || [] : []}
          onSelect={setSelectedQuadrantId}
          onPrev={() => moveQuadrant(-1)}
          onNext={() => moveQuadrant(1)}
          onNotesChange={(notes) => selectedQuadrant && saveZoneState(selectedQuadrant.id, { ...(zoneStateByQuadrant[selectedQuadrant.id] || defaultZoneState), notes })}
          onUpload={uploadPhoto}
          uploading={uploading}
          projectId={selectedProjectId}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          recording={recording}
          drawingEnabled={drawingEnabled}
          onToggleDrawing={() => setDrawingEnabled((v) => !v)}
        />
      </div>
    </div>
  );
}
