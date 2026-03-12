'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  status: string;
  photo_url?: string | null;
  project_areas?: Zone[];
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

type ChecklistRecord = {
  id: string;
  project_id: string;
  checklist_data: Record<string, string>;
  overall_notes: string | null;
};

type ProjectMeta = {
  contactName: string;
  phone: string;
  email: string;
  inspectionDate: string;
  dueDate: string;
  weather: string;
  temperature: string;
};

const checklistLabels: Record<string, string> = {
  roof_access_safe: 'Roof access is safe and unobstructed',
  roof_condition: 'Roof membrane/deck condition acceptable',
  visible_damage: 'No visible lightning-related structural damage',
  air_terminals_present: 'Air terminals present at required intervals',
  air_terminal_height: 'Air terminal heights appear compliant',
  air_terminal_secure: 'Air terminals are mechanically secure',
  main_conductor_continuity: 'Main conductor path appears continuous',
  down_conductor_routes: 'Down conductor routes protected and accessible',
  corrosion_or_damage: 'No corrosion, breaks, or loose terminations found',
  bonding_equipment: 'Mechanical equipment and metal bodies bonded',
  ground_points_accessible: 'Grounding points identified and accessible',
  bonding_quality: 'Bonding connections appear clean/tight',
  spd_present: 'Surge protection devices present where expected',
  labels_present: 'Critical labels/documentation points present',
  maintenance_recommended: 'Maintenance recommended based on findings',
};

const valueLabel: Record<string, string> = {
  pass: 'Pass',
  fail: 'Fail',
  na: 'N/A',
};

function readLocalProjectMeta(projectId: string): ProjectMeta {
  try {
    const raw = window.localStorage.getItem(`project-meta:${projectId}`);
    return raw
      ? ({ contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', ...JSON.parse(raw) } as ProjectMeta)
      : { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '' };
  } catch {
    return { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '' };
  }
}

function readLocalZoneNote(projectId: string, zoneId: string): string {
  try {
    return window.localStorage.getItem(`zone-note:${projectId}:${zoneId}`) || '';
  } catch {
    return '';
  }
}

export default function QuoteSummaryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [zonePhotos, setZonePhotos] = useState<Record<string, AreaPhoto[]>>({});
  const [zoneNotes, setZoneNotes] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<ChecklistRecord | null>(null);
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>({ contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '' });
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checklistItems = useMemo(() => {
    const entries = Object.entries(checklist?.checklist_data || {});
    if (entries.length === 0) return [];
    return entries.map(([key, value]) => ({
      key,
      label: checklistLabels[key] || key,
      value: valueLabel[value] || value,
    }));
  }, [checklist]);

  const loadProjectList = useCallback(async (projectIdFromQuery: string) => {
    const supabase = createClient();
    const { data } = await supabase.from('projects').select('id, title, address, status').order('created_at', { ascending: false });
    const list = (data as Project[]) || [];
    setProjects(list);

    const initial = (projectIdFromQuery && list.find((p) => p.id === projectIdFromQuery)?.id) || list[0]?.id || '';
    setSelectedProjectId(initial);
  }, []);

  const loadSummary = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setLoadingSummary(true);
    setStatusMessage(null);

    const supabase = createClient();

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, address, status, photo_url, project_areas(id, name, x_percent, y_percent)')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      setStatusMessage('Unable to load this project summary right now.');
      setLoadingSummary(false);
      return;
    }

    const nextProject = projectData as Project;
    setProject(nextProject);
    const areas = nextProject.project_areas || [];

    const noteMap: Record<string, string> = {};
    for (const zone of areas) {
      noteMap[zone.id] = readLocalZoneNote(projectId, zone.id);
    }
    setZoneNotes(noteMap);

    const { data: photoData } = await supabase
      .from('area_photos')
      .select('id, area_id, photo_url, created_at')
      .in('area_id', areas.map((zone) => zone.id));

    const grouped = ((photoData as AreaPhoto[]) || []).reduce<Record<string, AreaPhoto[]>>((acc, photo) => {
      acc[photo.area_id] = [...(acc[photo.area_id] || []), photo];
      return acc;
    }, {});
    setZonePhotos(grouped);

    const { data: checklistData, error: checklistError } = await supabase
      .from('inspection_checklists')
      .select('id, project_id, checklist_data, overall_notes')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checklistError) {
      try {
        const raw = window.localStorage.getItem(`checklist:${projectId}`);
        setChecklist(raw ? (JSON.parse(raw) as ChecklistRecord) : null);
      } catch {
        setChecklist(null);
      }
      setStatusMessage('Checklist cloud data unavailable; using local data when present.');
    } else {
      setChecklist((checklistData as ChecklistRecord) || null);
    }

    setProjectMeta(readLocalProjectMeta(projectId));
    setLoadingSummary(false);
  }, []);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      const projectIdFromQuery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('projectId') || '' : '';
      await loadProjectList(projectIdFromQuery);
      setLoading(false);
    };
    void boot();
  }, [loadProjectList]);

  useEffect(() => {
    if (!selectedProjectId) return;
    router.replace(`/quote-summary?projectId=${selectedProjectId}`);
    void loadSummary(selectedProjectId);
  }, [selectedProjectId, loadSummary, router]);

  const saveProjectEdits = async () => {
    if (!project) return;
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from('projects')
      .update({
        title: project.title,
        description: project.description,
        address: project.address,
        status: project.status,
      })
      .eq('id', project.id);

    if (checklist?.id) {
      await supabase
        .from('inspection_checklists')
        .update({ overall_notes: checklist.overall_notes || '' })
        .eq('id', checklist.id);
    }

    try {
      window.localStorage.setItem(`project-meta:${project.id}`, JSON.stringify(projectMeta));
      for (const [zoneId, note] of Object.entries(zoneNotes)) {
        window.localStorage.setItem(`zone-note:${project.id}:${zoneId}`, note);
      }
    } catch {
      // ignore
    }

    setSaving(false);
    setStatusMessage('Summary edits saved.');
    await loadProjectList(selectedProjectId);
  };

  if (loading) {
    return <main style={{ minHeight: '100vh', padding: '96px 24px', fontFamily: 'Inter, sans-serif' }}>Loading quote summary…</main>;
  }

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px 16px', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <style>{`
      .quote-action-grid { display: grid; grid-template-columns: 1fr; gap: 10px; align-items: end; }
      .overview-grid { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
      .field-input { display: block; width: 100%; box-sizing: border-box; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 10px; }
      .two-col { display:grid; grid-template-columns: 1fr; gap:8px; }
      .zone-photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
      @media (min-width: 880px) { .quote-action-grid { grid-template-columns: minmax(260px, 1fr) auto auto; } }
      @media (min-width: 1024px) { .overview-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); } .two-col { grid-template-columns: 1fr 1fr; } }
      @media print { aside, nav, button, .hide-print, img[alt="Inspection company logo"] { display: none !important; } main { padding: 0 !important; margin: 0 !important; background: #fff !important; } .print-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; } }
      `}</style>
      <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, fontSize: '30px', color: '#0f172a' }}>Quote Summary</h1>
          <p style={{ margin: '8px 0 16px', color: '#64748b' }}>Select the project, review all details, update anything needed, then print a clean PDF for quoting.</p>
          <div className="quote-action-grid">
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>Project</label>
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="field-input" style={{ marginTop: 0 }}>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>{item.title} — {item.address}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => window.print()} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px', background: '#fff', color: '#0f172a', fontWeight: 600 }}>Print PDF</button>
            <button type="button" onClick={() => void saveProjectEdits()} disabled={saving || !project} style={{ border: 'none', borderRadius: '8px', padding: '10px 14px', background: '#2563eb', color: '#fff', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save edits'}</button>
          </div>
          {statusMessage && <p style={{ marginTop: '10px', marginBottom: 0, color: '#334155' }}>{statusMessage}</p>}
        </section>

        {loadingSummary && <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px' }}>Loading project details…</section>}

        {project && !loadingSummary && (
          <>
            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <h2 style={{ marginTop: 0, color: '#0f172a' }}>Project Overview</h2>
              <div className="overview-grid">
                <div style={{ display: 'grid', gap: '10px' }}>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Company Name
                    <input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} className="field-input" />
                  </label>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Address
                    <input value={project.address} onChange={(e) => setProject({ ...project, address: e.target.value })} className="field-input" />
                  </label>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Description
                    <textarea value={project.description || ''} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={3} className="field-input" />
                  </label>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Project Status
                    <select value={project.status} onChange={(e) => setProject({ ...project, status: e.target.value })} className="field-input">
                      <option value="Draft">Draft</option>
                      <option value="Ready for review">Ready for review</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Quoted">Quoted</option>
                    </select>
                  </label>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Contact Name
                    <input value={projectMeta.contactName} onChange={(e) => setProjectMeta({ ...projectMeta, contactName: e.target.value })} className="field-input" />
                  </label>
                  <div className="two-col">
                    <label style={{ fontWeight: 600, color: '#334155' }}>Phone
                      <input value={projectMeta.phone} onChange={(e) => setProjectMeta({ ...projectMeta, phone: e.target.value })} className="field-input" />
                    </label>
                    <label style={{ fontWeight: 600, color: '#334155' }}>Email
                      <input value={projectMeta.email} onChange={(e) => setProjectMeta({ ...projectMeta, email: e.target.value })} className="field-input" />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Checklist & Overall Notes</h2>
                <Link href={`/checklist?projectId=${selectedProjectId}`} className="hide-print" style={{ textDecoration: 'none', background: '#2563eb', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, fontSize: '14px' }}>
                  Edit Checklist
                </Link>
              </div>
              {checklistItems.length === 0 ? (
                <p style={{ margin: '12px 0 0', color: '#64748b' }}>No checklist saved yet for this project.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                  {checklistItems.map((item) => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                      <span style={{ color: '#334155' }}>{item.label}</span>
                      <strong style={{ color: '#0f172a', whiteSpace: 'nowrap' }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Overall Notes
                  <textarea
                    value={checklist?.overall_notes || ''}
                    onChange={(e) => setChecklist((prev) => prev ? ({ ...prev, overall_notes: e.target.value }) : prev)}
                    rows={4}
                    className="field-input"
                  />
                </label>
              </div>
            </section>

            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Zones, Notes & Photos</h2>
                <Link href={`/inspections?projectId=${selectedProjectId}`} className="hide-print" style={{ textDecoration: 'none', background: '#0f766e', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, fontSize: '14px' }}>
                  Edit Inspection
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {(project.project_areas || []).map((zone) => (
                  <article key={zone.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px' }}>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>{zone.name}</h3>
                    <label style={{ fontWeight: 600, color: '#334155' }}>Zone Notes
                      <textarea
                        value={zoneNotes[zone.id] || ''}
                        onChange={(e) => setZoneNotes((prev) => ({ ...prev, [zone.id]: e.target.value }))}
                        rows={3}
                        className="field-input"
                      />
                    </label>
                    {(zonePhotos[zone.id] || []).length > 0 ? (
                      <div className="zone-photo-grid" style={{ marginTop: '10px' }}>
                        {(zonePhotos[zone.id] || []).map((photo) => (
                          <a key={photo.id} href={photo.photo_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#334155' }}>
                            <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                              <Image src={photo.photo_url} alt={zone.name} fill unoptimized style={{ objectFit: 'cover' }} />
                            </div>
                            <span style={{ display: 'block', marginTop: '4px', fontSize: '11px' }}>{new Date(photo.created_at || Date.now()).toLocaleString()}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ marginTop: '8px', marginBottom: 0, color: '#64748b', fontSize: '13px' }}>No zone photos yet.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
