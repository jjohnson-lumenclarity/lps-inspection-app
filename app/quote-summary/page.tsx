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
  checklist_data: Record<string, unknown>;
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
  aerialImages?: string[];
};

type ChecklistRollupItem = {
  id: string;
  label: string;
  response: '' | 'yes' | 'no' | 'na';
  notes: string;
  affectedQuantity: string;
  severity: string;
  recommendedAction: string;
  selectedQuadrantId: string;
  attachedPhotoIds: string[];
  quoteImpacting: boolean;
  repairRequired: boolean;
};

type QuoteTemplateSettings = {
  defaultQuoteTemplate?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  logoDataUrl?: string;
};

type QuoteDraft = {
  templateId: string;
  executiveSummary: string;
  scopeOfWork: string;
  scheduleEstimate: string;
  costGuidance: string;
  exclusions: string;
  nextSteps: string;
};

const questionLabels: Record<string, string> = {
  ground_rods_depth_distance: 'Ground rods depth/distance',
  ground_plates_depth_distance: 'Ground plates/fans depth/distance',
  ground_ring_install: 'Ground ring installation',
  chemical_rods_serviceable: 'Chemical rods serviceability',
  air_terminals_height: 'Air terminal height compliance',
  air_terminals_support: 'Air terminal support compliance',
  air_terminals_straight_secure: 'Air terminals straight/secure',
  air_terminals_loose_broken: 'Air terminals loose/broken',
  air_terminals_roof_compatible: 'Air terminals roofing compatibility',
  air_terminals_classification: 'Air terminal classification',
  air_terminals_spacing: 'Air terminal spacing',
  bases_roof_compatible: 'Air terminal base roofing compatibility',
  bases_properly_fastened: 'Air terminal bases properly fastened',
  bases_working_condition: 'Air terminal base condition',
  bases_secure_attachment: 'Air terminal base secure attachment',
  fasteners_36in: 'Conductor fastener interval <= 36 in',
  fasteners_condition: 'Fastener condition',
  fasteners_ul96: 'Fastener UL96 approval',
  fasteners_mortar_joints: 'Fasteners in mortar joints',
  connectors_parallel_proper: 'Parallel connector installation',
  connectors_material_compatible: 'Connector material compatibility',
  connectors_rated: 'Connector rating',
  connectors_condition: 'Connector condition',
  connectors_cable_length: 'Conductor protrusion <= 1 in',
  bonding_metal_bodies: 'Bonding of metal bodies within 6 ft',
  bonding_roof_drains: 'Bonding of roof drains',
  bonding_surface_prep: 'Bonding connection surface prep',
  down_conductors_count: 'Down conductor count',
  down_conductors_structural_steel: 'Structural steel substitution',
  down_conductors_protected: 'Down conductor protection',
  down_conductors_routing: 'Down conductor routing',
  conductors_clean_straight: 'Conductor run quality',
  conductors_bend_radius: 'Conductor bend radius',
  conductors_main_connection: 'Main cable connection orientation',
  conductors_two_paths_ground: 'Two paths to ground',
  conductors_physical_damage: 'Conductor physical damage',
  conductors_contamination_free: 'Conductor contamination free',
};

const responseLabel: Record<string, string> = {
  yes: 'Issue found',
  no: 'Compliant',
  na: 'N/A',
  pass: 'Pass',
  fail: 'Fail',
};

const defaultQuoteDraft: QuoteDraft = {
  templateId: 'modern-blue',
  executiveSummary: '',
  scopeOfWork: '',
  scheduleEstimate: '',
  costGuidance: '',
  exclusions: '',
  nextSteps: '',
};

function readLocalProjectMeta(projectId: string): ProjectMeta {
  try {
    const raw = window.localStorage.getItem(`project-meta:${projectId}`);
    return raw
      ? ({ contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', aerialImages: [], ...JSON.parse(raw) } as ProjectMeta)
      : { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', aerialImages: [] };
  } catch {
    return { contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', aerialImages: [] };
  }
}

function readLocalZoneNote(projectId: string, zoneId: string): string {
  try {
    return window.localStorage.getItem(`zone-note:${projectId}:${zoneId}`) || '';
  } catch {
    return '';
  }
}

function normalizeChecklist(data: Record<string, unknown>): ChecklistRollupItem[] {
  const rows: ChecklistRollupItem[] = [];

  const guided = (data?.responses || null) as Record<string, Record<string, unknown>> | null;
  if (guided && typeof guided === 'object') {
    for (const [id, value] of Object.entries(guided)) {
      rows.push({
        id,
        label: questionLabels[id] || id.replaceAll('_', ' '),
        response: (value?.response as '' | 'yes' | 'no' | 'na') || '',
        notes: String(value?.notes || ''),
        affectedQuantity: String(value?.affectedQuantity || ''),
        severity: String(value?.severity || ''),
        recommendedAction: String(value?.recommendedAction || ''),
        selectedQuadrantId: String(value?.selectedQuadrantId || ''),
        attachedPhotoIds: Array.isArray(value?.attachedPhotoIds) ? (value.attachedPhotoIds as string[]) : [],
        quoteImpacting: Boolean(value?.quoteImpacting),
        repairRequired: Boolean(value?.repairRequired),
      });
    }
    return rows;
  }

  const legacyItems = (data?.items || null) as Record<string, Record<string, unknown>> | null;
  if (legacyItems && typeof legacyItems === 'object') {
    for (const [id, value] of Object.entries(legacyItems)) {
      rows.push({
        id,
        label: questionLabels[id] || id.replaceAll('_', ' '),
        response: (value?.answer as '' | 'yes' | 'no' | 'na') || '',
        notes: String(value?.notes || ''),
        affectedQuantity: '',
        severity: '',
        recommendedAction: '',
        selectedQuadrantId: '',
        attachedPhotoIds: Array.isArray(value?.photos) ? (value.photos as string[]) : [],
        quoteImpacting: false,
        repairRequired: false,
      });
    }
    return rows;
  }

  for (const [id, val] of Object.entries(data || {})) {
    if (typeof val !== 'string') continue;
    rows.push({
      id,
      label: questionLabels[id] || id.replaceAll('_', ' '),
      response: val as '' | 'yes' | 'no' | 'na',
      notes: '',
      affectedQuantity: '',
      severity: '',
      recommendedAction: '',
      selectedQuadrantId: '',
      attachedPhotoIds: [],
      quoteImpacting: false,
      repairRequired: false,
    });
  }

  return rows;
}

export default function QuoteSummaryPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [zonePhotos, setZonePhotos] = useState<Record<string, AreaPhoto[]>>({});
  const [zoneNotes, setZoneNotes] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<ChecklistRecord | null>(null);
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>({ contactName: '', phone: '', email: '', inspectionDate: '', dueDate: '', weather: '', temperature: '', aerialImages: [] });
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>(defaultQuoteDraft);
  const [templateSettings, setTemplateSettings] = useState<QuoteTemplateSettings>({});
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checklistItems = useMemo(() => normalizeChecklist(checklist?.checklist_data || {}), [checklist]);
  const answeredCount = useMemo(() => checklistItems.filter((item) => item.response).length, [checklistItems]);
  const issueItems = useMemo(() => checklistItems.filter((item) => item.response === 'yes'), [checklistItems]);
  const reviewItems = useMemo(
    () => issueItems.filter((item) => item.quoteImpacting || item.repairRequired || item.severity === 'high' || item.severity === 'critical'),
    [issueItems],
  );

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
    for (const zone of areas) noteMap[zone.id] = readLocalZoneNote(projectId, zone.id);
    setZoneNotes(noteMap);

    if (areas.length) {
      const { data: photoData } = await supabase
        .from('area_photos')
        .select('id, area_id, photo_url, created_at')
        .in('area_id', areas.map((zone) => zone.id));

      const grouped = ((photoData as AreaPhoto[]) || []).reduce<Record<string, AreaPhoto[]>>((acc, photo) => {
        acc[photo.area_id] = [...(acc[photo.area_id] || []), photo];
        return acc;
      }, {});
      setZonePhotos(grouped);
    } else {
      setZonePhotos({});
    }

    const { data: checklistData } = await supabase
      .from('inspection_checklists')
      .select('id, project_id, checklist_data, overall_notes')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setChecklist((checklistData as ChecklistRecord) || null);
    setProjectMeta(readLocalProjectMeta(projectId));

    try {
      const rawSettings = window.localStorage.getItem('quote-template-settings');
      const parsedSettings = rawSettings ? (JSON.parse(rawSettings) as QuoteTemplateSettings) : {};
      setTemplateSettings(parsedSettings);

      const rawDraft = window.localStorage.getItem(`quote-draft:${projectId}`);
      const mergedDraft = rawDraft ? ({ ...defaultQuoteDraft, ...JSON.parse(rawDraft) } as QuoteDraft) : defaultQuoteDraft;
      if (!rawDraft && parsedSettings.defaultQuoteTemplate) {
        mergedDraft.templateId = parsedSettings.defaultQuoteTemplate;
      }
      setQuoteDraft(mergedDraft);
    } catch {
      setTemplateSettings({});
      setQuoteDraft(defaultQuoteDraft);
    }

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
      .update({ title: project.title, description: project.description, address: project.address, status: project.status })
      .eq('id', project.id);

    if (checklist?.id) {
      await supabase.from('inspection_checklists').update({ overall_notes: checklist.overall_notes || '' }).eq('id', checklist.id);
    }

    try {
      window.localStorage.setItem(`project-meta:${project.id}`, JSON.stringify(projectMeta));
      window.localStorage.setItem(`quote-draft:${project.id}`, JSON.stringify(quoteDraft));
      for (const [zoneId, note] of Object.entries(zoneNotes)) window.localStorage.setItem(`zone-note:${project.id}:${zoneId}`, note);
    } catch {
      // no-op
    }

    setSaving(false);
    setStatusMessage('Summary edits saved.');
    await loadProjectList(selectedProjectId);
  };

  if (loading) {
    return <main style={{ minHeight: '100vh', padding: '96px 24px 24px calc(var(--sidebar-width, 88px) + 24px)', fontFamily: 'Inter, sans-serif', color: '#64748b' }}>Loading quote summary…</main>;
  }

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px calc(var(--sidebar-width, 88px) + 16px)', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      <style>{`
      .quote-top-grid { display:grid; grid-template-columns: 1fr; gap: 10px; align-items: end; }
      .overview-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .two-col { display:grid; grid-template-columns: 1fr; gap:8px; }
      .three-col { display:grid; grid-template-columns: 1fr; gap:10px; }
      .field-input { display:block; width:100%; box-sizing:border-box; margin-top:5px; border:1px solid #cbd5e1; border-radius:8px; padding:9px 10px; }
      .zone-photo-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap:8px; }
      @media (min-width: 880px) { .quote-top-grid { grid-template-columns: minmax(260px,1fr) auto auto; } .three-col { grid-template-columns: repeat(3, minmax(0,1fr)); } }
      @media (min-width: 1024px) { .overview-grid { grid-template-columns: minmax(0,1.2fr) minmax(0,1fr); } .two-col { grid-template-columns: 1fr 1fr; } }
      @media print {
        aside, nav, button, .hide-print, img[alt="Inspection company logo"] { display:none !important; }
        main { padding:0 !important; margin:0 !important; background:#fff !important; }
        .print-card { box-shadow:none !important; border:1px solid #e2e8f0 !important; break-inside:avoid; }
      }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, fontSize: '30px', color: '#0f172a' }}>Quote Summary & Client Narrative</h1>
          <p style={{ margin: '8px 0 12px', color: '#64748b' }}>Roll-up of project details, quadrants, checklist issues, and quoter narrative fields for client-ready PDF output.</p>

          <div className="quote-top-grid">
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

          <div className="three-col" style={{ marginTop: '10px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#f8fafc' }}><strong style={{ color: '#0f172a' }}>Answered items:</strong> <span style={{ color: '#334155' }}>{answeredCount}</span></div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#fff7ed' }}><strong style={{ color: '#9a3412' }}>Issues found:</strong> <span style={{ color: '#b45309' }}>{issueItems.length}</span></div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#eff6ff' }}><strong style={{ color: '#1d4ed8' }}>Critical for quoter:</strong> <span style={{ color: '#1e40af' }}>{reviewItems.length}</span></div>
          </div>

          {statusMessage && <p style={{ marginTop: '10px', marginBottom: 0, color: '#334155' }}>{statusMessage}</p>}
        </section>

        <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            {templateSettings.logoDataUrl && <img src={templateSettings.logoDataUrl} alt="Quote logo" style={{ maxHeight: 62, border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, background: '#fff' }} />}
            <div>
              <h2 style={{ margin: 0, color: '#0f172a' }}>{templateSettings.companyName || 'Inspection Company'}</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{templateSettings.companyEmail || ''} {templateSettings.companyPhone ? `• ${templateSettings.companyPhone}` : ''}</p>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>{templateSettings.companyAddress || ''}</p>
            </div>
          </div>
          <p style={{ margin: '10px 0 0', color: '#334155', fontSize: 13 }}>Template: <strong>{quoteDraft.templateId}</strong></p>
        </section>

        {loadingSummary && <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px' }}>Loading project details…</section>}

        {project && !loadingSummary && (
          <>
            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <h2 style={{ marginTop: 0, color: '#0f172a' }}>Project Overview</h2>
              <div className="overview-grid">
                <div style={{ display: 'grid', gap: '10px' }}>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Client / Facility Name
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
                  <label style={{ fontWeight: 600, color: '#334155' }}>Owner / Contact
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

            {(project.photo_url || (projectMeta.aerialImages || [])[0]) && (
              <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
                <h2 style={{ marginTop: 0, color: '#0f172a' }}>Building Overview & Quadrants</h2>
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '340px', background: '#f8fafc' }}>
                  <Image src={project.photo_url || (projectMeta.aerialImages || [])[0] || ''} alt="Building overview" fill unoptimized style={{ objectFit: 'contain' }} />
                  {(project.project_areas || []).map((zone) => (
                    <div key={zone.id} style={{ position: 'absolute', left: `${zone.x_percent}%`, top: `${zone.y_percent}%`, transform: 'translate(-50%,-50%)', background: '#2563eb', color: '#fff', borderRadius: '999px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, border: '2px solid #fff' }} title={zone.name}>
                      {(zone.name || 'Q').slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Checklist Roll-up & Overall Notes</h2>
                <Link href={`/checklist?projectId=${selectedProjectId}`} className="hide-print" style={{ textDecoration: 'none', background: '#2563eb', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, fontSize: '14px' }}>Edit Checklist</Link>
              </div>

              {reviewItems.length > 0 && (
                <div style={{ marginTop: '10px', border: '1px solid #fecaca', borderRadius: '10px', background: '#fff1f2', padding: '10px' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#9f1239', fontSize: '14px' }}>Critical items for Ryan / Quoter</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {reviewItems.map((item) => (
                      <div key={`critical-${item.id}`} style={{ border: '1px solid #fda4af', borderRadius: '8px', padding: '8px' }}>
                        <strong style={{ color: '#881337', fontSize: '13px' }}>{item.label}</strong>
                        <p style={{ margin: '4px 0 0', color: '#9f1239', fontSize: '12px' }}>
                          Severity: {item.severity || 'n/a'} • Qty: {item.affectedQuantity || 'n/a'} • Quadrant: {item.selectedQuadrantId || 'n/a'}
                        </p>
                        {item.recommendedAction && <p style={{ margin: '4px 0 0', color: '#9f1239', fontSize: '12px' }}>Recommended action: {item.recommendedAction}</p>}
                        {item.notes && <p style={{ margin: '4px 0 0', color: '#9f1239', fontSize: '12px' }}>Inspector note: {item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checklistItems.length === 0 ? (
                <p style={{ margin: '12px 0 0', color: '#64748b' }}>No checklist saved yet for this project.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                  {checklistItems.map((item) => (
                    <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ color: '#334155', fontWeight: 600, fontSize: '13px' }}>{item.label}</span>
                        <strong style={{ color: '#0f172a', whiteSpace: 'nowrap', fontSize: '12px' }}>{responseLabel[item.response] || item.response || 'Unanswered'}</strong>
                      </div>
                      {(item.notes || item.affectedQuantity || item.severity) && (
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '12px' }}>
                          {item.severity ? `Severity: ${item.severity} • ` : ''}
                          {item.affectedQuantity ? `Qty: ${item.affectedQuantity} • ` : ''}
                          {item.notes || ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Overall Notes
                  <textarea value={checklist?.overall_notes || ''} onChange={(e) => setChecklist((prev) => (prev ? { ...prev, overall_notes: e.target.value } : prev))} rows={4} className="field-input" />
                </label>
              </div>
            </section>

            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ marginTop: 0, marginBottom: 0, color: '#0f172a' }}>Quadrants, Notes & Photos</h2>
                <Link href={`/inspections?projectId=${selectedProjectId}`} className="hide-print" style={{ textDecoration: 'none', background: '#0f766e', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontWeight: 600, fontSize: '14px' }}>Edit Inspection</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {(project.project_areas || []).map((zone) => (
                  <article key={zone.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px' }}>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>{zone.name}</h3>
                    <label style={{ fontWeight: 600, color: '#334155' }}>Quadrant Notes
                      <textarea value={zoneNotes[zone.id] || ''} onChange={(e) => setZoneNotes((prev) => ({ ...prev, [zone.id]: e.target.value }))} rows={3} className="field-input" />
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
                      <p style={{ marginTop: '8px', marginBottom: 0, color: '#64748b', fontSize: '13px' }}>No quadrant photos yet.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="print-card" style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
              <h2 style={{ marginTop: 0, color: '#0f172a' }}>Quoter Narrative & Client-ready Output</h2>
              <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: '13px' }}>This section is intentionally editable for Ryan to finalize scope/timeline/cost narrative before PDF export.</p>
              <div className="three-col">
                <label style={{ fontWeight: 600, color: '#334155' }}>Template Style
                  <select value={quoteDraft.templateId} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, templateId: e.target.value }))} className="field-input">
                    <option value="modern-blue">Modern Blue</option>
                    <option value="executive-gray">Executive Gray</option>
                    <option value="industrial-dark">Industrial Dark</option>
                    <option value="minimal-clean">Minimal Clean</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Executive Summary<textarea value={quoteDraft.executiveSummary} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, executiveSummary: e.target.value }))} rows={3} className="field-input" /></label>
                <label style={{ fontWeight: 600, color: '#334155' }}>Scope of Work<textarea value={quoteDraft.scopeOfWork} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, scopeOfWork: e.target.value }))} rows={3} className="field-input" /></label>
                <div className="two-col">
                  <label style={{ fontWeight: 600, color: '#334155' }}>Schedule Estimate<textarea value={quoteDraft.scheduleEstimate} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, scheduleEstimate: e.target.value }))} rows={2} className="field-input" /></label>
                  <label style={{ fontWeight: 600, color: '#334155' }}>Cost Guidance<textarea value={quoteDraft.costGuidance} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, costGuidance: e.target.value }))} rows={2} className="field-input" /></label>
                </div>
                <label style={{ fontWeight: 600, color: '#334155' }}>Exclusions / Assumptions<textarea value={quoteDraft.exclusions} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, exclusions: e.target.value }))} rows={2} className="field-input" /></label>
                <label style={{ fontWeight: 600, color: '#334155' }}>Next Steps<textarea value={quoteDraft.nextSteps} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, nextSteps: e.target.value }))} rows={2} className="field-input" /></label>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
