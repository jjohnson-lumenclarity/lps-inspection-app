'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = { id: string; title: string; address: string; status: string };
type Quadrant = { id: string; name: string; x_percent: number; y_percent: number };
type AreaPhoto = { id: string; area_id: string; photo_url: string; created_at?: string };
type Answer = '' | 'yes' | 'no' | 'na';
type Severity = '' | 'low' | 'medium' | 'high' | 'critical';

type ChecklistItem = { id: string; question: string };
type ChecklistCategory = { id: string; title: string; items: ChecklistItem[] };

type ItemResponse = {
  response: Answer;
  notes: string;
  affectedQuantity: string;
  severity: Severity;
  recommendedAction: string;
  selectedQuadrantId: string;
  attachedPhotoIds: string[];
  photoCaptions: Record<string, string>;
  quoteImpacting: boolean;
  repairRequired: boolean;
};

type ChecklistRecord = {
  id: string;
  project_id: string;
  checklist_data: {
    version?: string;
    responses?: Record<string, Partial<ItemResponse>>;
    activeCategoryId?: string;
  };
  overall_notes: string | null;
};

const categories: ChecklistCategory[] = [
  {
    id: 'grounding',
    title: 'Grounding',
    items: [
      { id: 'ground_rods_depth_distance', question: 'Are ground rods at least 10 ft deep and installed at least 2 ft from the structure foundation?' },
      { id: 'ground_plates_depth_distance', question: 'Are ground plates or fans buried at least 2 ft from the structure and 18 in deep?' },
      { id: 'ground_ring_install', question: 'Is the ground ring (counterpoise) installed at least 2 ft below finished grade and 2 ft from the foundation?' },
      { id: 'chemical_rods_serviceable', question: 'Are chemical ground rods, if used, in good serviceable condition?' },
    ],
  },
  {
    id: 'air_terminals',
    title: 'Air Terminals',
    items: [
      { id: 'air_terminals_height', question: 'Are air terminals at least 10 inches taller than the objects they protect?' },
      { id: 'air_terminals_support', question: 'Are air terminals over 24 inches tall supported at midpoint or higher?' },
      { id: 'air_terminals_straight_secure', question: 'Are air terminals installed straight and securely tightened?' },
      { id: 'air_terminals_loose_broken', question: 'Are any air terminals loose or broken from their bases?' },
      { id: 'air_terminals_roof_compatible', question: 'Are air terminals compatible with the roofing material?' },
      { id: 'air_terminals_classification', question: 'Are air terminals the proper classification for the structure?' },
      { id: 'air_terminals_spacing', question: 'Is the spacing between air terminals correct according to protection standards?' },
    ],
  },
  {
    id: 'air_terminal_bases',
    title: 'Air Terminal Bases',
    items: [
      { id: 'bases_roof_compatible', question: 'Are air terminal bases compatible with the roofing material?' },
      { id: 'bases_properly_fastened', question: 'Are air terminal bases properly fastened?' },
      { id: 'bases_working_condition', question: 'Are air terminal bases in good working condition?' },
      { id: 'bases_secure_attachment', question: 'Are air terminal bases securely attached (not improperly floating or loose)?' },
    ],
  },
  {
    id: 'fasteners',
    title: 'Fasteners',
    items: [
      { id: 'fasteners_36in', question: 'Are lightning conductors fastened at intervals not exceeding 36 inches?' },
      { id: 'fasteners_condition', question: 'Are fasteners in good working condition?' },
      { id: 'fasteners_ul96', question: 'Are fasteners UL96 approved for the application?' },
      { id: 'fasteners_mortar_joints', question: 'Are fasteners installed correctly in mortar joints where applicable?' },
    ],
  },
  {
    id: 'connectors',
    title: 'Connectors',
    items: [
      { id: 'connectors_parallel_proper', question: 'Are parallel connectors installed properly to prevent bolts from scratching or penetrating roofing material?' },
      { id: 'connectors_material_compatible', question: 'Are connectors made from materials compatible with the conductors?' },
      { id: 'connectors_rated', question: 'Are connectors properly rated for the intended purpose?' },
      { id: 'connectors_condition', question: 'Are connectors in good working condition?' },
      { id: 'connectors_cable_length', question: 'Are conductors cut and installed correctly so no cable protrudes more than 1 inch from the connector?' },
    ],
  },
  {
    id: 'bonding',
    title: 'Bonding',
    items: [
      { id: 'bonding_metal_bodies', question: 'Are grounded metal bodies within 6 ft of the main conductor properly bonded?' },
      { id: 'bonding_roof_drains', question: 'Are roof drains with grounding potential properly bonded?' },
      { id: 'bonding_surface_prep', question: 'Has paint, corrosion, or debris been removed before bonding connections were installed?' },
    ],
  },
  {
    id: 'down_conductors',
    title: 'Down Conductors / Transitions',
    items: [
      { id: 'down_conductors_count', question: 'Is the correct number of down conductors installed for the protected perimeter?' },
      { id: 'down_conductors_structural_steel', question: 'Is structural steel used in place of conductors where applicable?' },
      { id: 'down_conductors_protected', question: 'Are down conductors securely attached and protected from mechanical damage?' },
      { id: 'down_conductors_routing', question: 'Are down conductors run as straight and inconspicuously as possible?' },
    ],
  },
  {
    id: 'conductors',
    title: 'Conductors',
    items: [
      { id: 'conductors_clean_straight', question: 'Are lightning protection conductors run cleanly and straight?' },
      { id: 'conductors_bend_radius', question: 'Do conductor bends have a radius greater than 8 inches?' },
      { id: 'conductors_main_connection', question: 'Are connections to the main cable facing the nearest downlead or routed through the roof properly?' },
      { id: 'conductors_two_paths_ground', question: 'Are main conductors configured to provide two paths to ground?' },
      { id: 'conductors_physical_damage', question: 'Are there any signs of physical damage to conductors?' },
      { id: 'conductors_contamination_free', question: 'Are conductors free of tar, paint, roofing sealant, or contamination?' },
    ],
  },
  {
    id: 'afman_compliance',
    title: 'AFMAN 32-1065 Compliance',
    items: [
      { id: 'afman_overall_repair', question: 'Is the lightning protection system in good overall repair according to AFMAN 32-1065 and NFPA 780?' },
      { id: 'afman_loose_connections', question: 'Are there loose connections that could cause high-resistance joints?' },
      { id: 'afman_corrosion_vibration', question: 'Has corrosion or vibration weakened any system component?' },
      { id: 'afman_components_intact', question: 'Are down conductors, roof conductors, and ground terminals intact?' },
      { id: 'afman_bonding_frayed', question: 'Are braided bonding wires excessively frayed?' },
      { id: 'afman_damage_system', question: 'Are ground wires, down conductors, or air terminals damaged?' },
      { id: 'afman_fastened', question: 'Are system components securely fastened to mounting surfaces?' },
      { id: 'afman_alterations', question: 'Have building additions or alterations introduced new protection requirements?' },
      { id: 'afman_spd_function', question: 'Are surge suppression devices functioning and not damaged?' },
      { id: 'afman_code_compliance', question: 'Does the system comply with NFPA 780 and AFMAN 32-1065 requirements?' },
      { id: 'afman_adhesive_bases', question: 'Are adhesive bases used to fasten conductors?' },
    ],
  },
  {
    id: 'testing_requirements',
    title: 'Testing Requirements',
    items: [
      { id: 'testing_continuity', question: 'Is continuity testing required?' },
      { id: 'testing_ground', question: 'Is ground testing required?' },
    ],
  },
  {
    id: 'typical_deviations',
    title: 'Typical Deviations',
    items: [
      { id: 'flag_missing_air_terminals', question: 'Missing air terminals on protected objects' },
      { id: 'flag_air_terminal_height', question: 'Air terminal height below required clearance' },
      { id: 'flag_air_terminal_support', question: 'Air terminal exceeding height without midpoint support' },
      { id: 'flag_dissimilar_metals', question: 'Dissimilar metals in contact (copper vs aluminum)' },
      { id: 'flag_sharp_bends', question: 'Conductor bends sharper than 90 degrees or radius less than 8 inches' },
      { id: 'flag_fastener_interval', question: 'Conductors fastened at intervals greater than 3 ft' },
      { id: 'flag_missing_bonding', question: 'Missing bonding on grounded metal bodies' },
      { id: 'flag_adhesive_fasteners', question: 'Adhesive fasteners used where not allowed' },
    ],
  },
];

const defaultItemResponse = (): ItemResponse => ({
  response: '',
  notes: '',
  affectedQuantity: '',
  severity: '',
  recommendedAction: '',
  selectedQuadrantId: '',
  attachedPhotoIds: [],
  photoCaptions: {},
  quoteImpacting: false,
  repairRequired: false,
});

const buildEmptyResponses = (): Record<string, ItemResponse> => {
  const all = categories.flatMap((category) => category.items);
  return Object.fromEntries(all.map((item) => [item.id, defaultItemResponse()]));
};

export default function ChecklistPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [quadrants, setQuadrants] = useState<Quadrant[]>([]);
  const [photosByQuadrant, setPhotosByQuadrant] = useState<Record<string, AreaPhoto[]>>({});
  const [responses, setResponses] = useState<Record<string, ItemResponse>>(buildEmptyResponses());
  const [overallNotes, setOverallNotes] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [activeQuestionId, setActiveQuestionId] = useState(categories[0].items[0].id);
  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<AreaPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'categories' | 'questions' | 'photos'>('questions');

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) ?? null, [projects, selectedProjectId]);
  const activeCategory = useMemo(() => categories.find((category) => category.id === activeCategoryId) ?? categories[0], [activeCategoryId]);
  const activeQuestion = useMemo(() => activeCategory.items.find((item) => item.id === activeQuestionId) ?? activeCategory.items[0], [activeCategory, activeQuestionId]);

  const allQuestions = useMemo(() => categories.flatMap((category) => category.items), []);
  const overallProgress = useMemo(() => {
    const answered = allQuestions.filter((item) => responses[item.id]?.response).length;
    return Math.round((answered / allQuestions.length) * 100);
  }, [allQuestions, responses]);
  const totalIssues = useMemo(() => allQuestions.filter((item) => responses[item.id]?.response === 'yes').length, [allQuestions, responses]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { answered: number; total: number; issues: number; linkedPhotos: number; completion: number }> = {};
    for (const category of categories) {
      const answered = category.items.filter((item) => responses[item.id]?.response).length;
      const issues = category.items.filter((item) => responses[item.id]?.response === 'yes').length;
      const linkedPhotos = category.items.reduce((count, item) => count + (responses[item.id]?.attachedPhotoIds.length || 0), 0);
      stats[category.id] = {
        answered,
        total: category.items.length,
        issues,
        linkedPhotos,
        completion: Math.round((answered / category.items.length) * 100),
      };
    }
    return stats;
  }, [responses]);

  const availablePhotos = useMemo(() => {
    const qId = activeQuadrantFilter || responses[activeQuestion.id]?.selectedQuadrantId || '';
    if (qId) return photosByQuadrant[qId] || [];
    return quadrants.flatMap((quad) => photosByQuadrant[quad.id] || []);
  }, [activeQuadrantFilter, responses, activeQuestion.id, photosByQuadrant, quadrants]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from('projects').select('id,title,address,status').order('created_at', { ascending: false });
      if (error) {
        console.error(error);
        setProjects([]);
      } else {
        setProjects((data as Project[]) || []);
      }
      setLoading(false);
    };
    void fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const loadProjectChecklistContext = async () => {
      const supabase = createClient();
      const { data: projectAreas, error: areaError } = await supabase
        .from('project_areas')
        .select('id,name,x_percent,y_percent')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: true });

      if (areaError) {
        console.warn(areaError.message);
        setQuadrants([]);
        setPhotosByQuadrant({});
      } else {
        const areas = (projectAreas as Quadrant[]) || [];
        setQuadrants(areas);
        const ids = areas.map((area) => area.id);
        if (ids.length) {
          const { data: areaPhotos } = await supabase
            .from('area_photos')
            .select('id,area_id,photo_url,created_at')
            .in('area_id', ids)
            .order('created_at', { ascending: false });
          const grouped = ((areaPhotos as AreaPhoto[]) || []).reduce<Record<string, AreaPhoto[]>>((acc, photo) => {
            acc[photo.area_id] = [...(acc[photo.area_id] || []), photo];
            return acc;
          }, {});
          setPhotosByQuadrant(grouped);
        } else {
          setPhotosByQuadrant({});
        }
      }

      const { data: record } = await supabase
        .from('inspection_checklists')
        .select('id, project_id, checklist_data, overall_notes')
        .eq('project_id', selectedProjectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (record) {
        const typed = record as ChecklistRecord;
        setRecordId(typed.id);
        const incoming = typed.checklist_data?.responses || {};
        const merged = buildEmptyResponses();
        for (const question of allQuestions) {
          const value = incoming[question.id];
          if (!value) continue;
          merged[question.id] = { ...defaultItemResponse(), ...value } as ItemResponse;
        }
        setResponses(merged);
        setOverallNotes(typed.overall_notes || '');
        setActiveCategoryId(typed.checklist_data?.activeCategoryId || categories[0].id);
      } else {
        const localKey = `lps-guided-checklist:${selectedProjectId}`;
        const localDraft = window.localStorage.getItem(localKey);
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft) as { responses?: Record<string, ItemResponse>; overallNotes?: string; activeCategoryId?: string };
            setResponses({ ...buildEmptyResponses(), ...(parsed.responses || {}) });
            setOverallNotes(parsed.overallNotes || '');
            setActiveCategoryId(parsed.activeCategoryId || categories[0].id);
          } catch {
            setResponses(buildEmptyResponses());
            setOverallNotes('');
          }
        } else {
          setResponses(buildEmptyResponses());
          setOverallNotes('');
        }
        setRecordId(null);
      }
      setStatus(null);
    };

    void loadProjectChecklistContext();
  }, [allQuestions, selectedProjectId]);

  const persistChecklist = async (nextResponses: Record<string, ItemResponse>, nextOverallNotes: string, showSavedMessage = false) => {
    if (!selectedProjectId) return;

    window.localStorage.setItem(
      `lps-guided-checklist:${selectedProjectId}`,
      JSON.stringify({ responses: nextResponses, overallNotes: nextOverallNotes, activeCategoryId }),
    );

    const supabase = createClient();
    setSaving(true);
    const payload = {
      project_id: selectedProjectId,
      checklist_data: {
        version: 'lps-guided-v2',
        activeCategoryId,
        responses: nextResponses,
      },
      overall_notes: nextOverallNotes,
      updated_at: new Date().toISOString(),
    };

    const query = recordId
      ? supabase.from('inspection_checklists').update(payload).eq('id', recordId).select('id').single()
      : supabase.from('inspection_checklists').insert(payload).select('id').single();

    const { data, error } = await query;
    if (error) {
      console.warn('Autosave cloud failed; kept locally.', error.message);
      setStatus('Saved locally (cloud unavailable).');
    } else {
      if (!recordId && data?.id) setRecordId(data.id as string);
      if (showSavedMessage) setStatus('Checklist saved.');
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!selectedProjectId) return;
    const timer = setTimeout(() => {
      void persistChecklist(responses, overallNotes, false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [responses, overallNotes, selectedProjectId, activeCategoryId]);

  const updateItem = (itemId: string, patch: Partial<ItemResponse>) => {
    setResponses((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  };

  const nextUnanswered = () => {
    const inCategory = activeCategory.items.find((item) => !responses[item.id]?.response);
    if (inCategory) {
      setActiveQuestionId(inCategory.id);
      return;
    }
    const any = allQuestions.find((item) => !responses[item.id]?.response);
    if (any) {
      const category = categories.find((cat) => cat.items.some((item) => item.id === any.id));
      if (category) setActiveCategoryId(category.id);
      setActiveQuestionId(any.id);
    }
  };

  const nextCategory = () => {
    const idx = categories.findIndex((cat) => cat.id === activeCategory.id);
    const next = categories[idx + 1];
    if (!next) return;
    setActiveCategoryId(next.id);
    setActiveQuestionId(next.items[0].id);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading guided checklist workspace…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6" style={{ paddingTop: '88px' }}>
      <div className="mx-auto max-w-[1700px] space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Guided LPS Checklist Workspace</h1>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Overall completion: {overallProgress}%</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Issues found: {totalIssues}</span>
            {saving && <span className="text-xs text-slate-500">Autosaving…</span>}
            {status && <span className="text-xs text-emerald-700">{status}</span>}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              <option value="">Select project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={activeQuadrantFilter}
              onChange={(event) => setActiveQuadrantFilter(event.target.value)}
            >
              <option value="">Filter by quadrant (all)</option>
              {quadrants.map((quadrant) => (
                <option key={quadrant.id} value={quadrant.id}>{quadrant.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button type="button" onClick={nextUnanswered} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Next unanswered</button>
              <button type="button" onClick={nextCategory} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Next category</button>
              <button type="button" onClick={() => void persistChecklist(responses, overallNotes, true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Save now</button>
            </div>
          </div>
          {selectedProject && <p className="mt-2 text-xs text-slate-600">{selectedProject.address} • {selectedProject.status}</p>}
        </div>

        {!selectedProjectId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Select a project to start guided checklist entry.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-2 lg:hidden">
              {(['categories', 'questions', 'photos'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileTab(tab)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${mobileTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:hidden">
              {mobileTab === 'categories' && (
                <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-slate-700">Checklist categories</h2>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const stats = categoryStats[category.id];
                      const active = category.id === activeCategory.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setActiveCategoryId(category.id);
                            setActiveQuestionId(category.items[0].id);
                          }}
                          className={`w-full rounded-xl border p-3 text-left ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                        >
                          <p className="text-sm font-semibold text-slate-800">{category.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{stats.answered}/{stats.total} answered • {stats.completion}% complete</p>
                          <p className="mt-1 text-xs text-amber-700">Issues: {stats.issues} • Linked photos: {stats.linkedPhotos}</p>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              )}

              {mobileTab === 'questions' && (
                <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="sticky top-[76px] z-10 mb-3 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Active category</p>
                    <h2 className="text-lg font-semibold text-slate-900">{activeCategory.title}</h2>
                    <p className="text-xs text-slate-600">Question {activeCategory.items.findIndex((item) => item.id === activeQuestion.id) + 1} of {activeCategory.items.length}</p>
                  </div>

                  <div className="space-y-3">
                    {activeCategory.items.map((item) => {
                      const row = responses[item.id] || defaultItemResponse();
                      const expanded = row.response === 'yes';
                      const compact = row.response === 'no';
                      return (
                        <article
                          key={item.id}
                          className={`rounded-xl border p-3 transition ${activeQuestion.id === item.id ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
                          onClick={() => setActiveQuestionId(item.id)}
                        >
                          <p className="text-sm font-medium text-slate-900">{item.question}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {([
                              { value: 'yes', label: 'YES', cls: 'bg-red-100 text-red-700' },
                              { value: 'no', label: 'NO', cls: 'bg-emerald-100 text-emerald-700' },
                              { value: 'na', label: 'N/A', cls: 'bg-slate-200 text-slate-700' },
                            ] as const).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateItem(item.id, { response: opt.value });
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${row.response === opt.value ? opt.cls : 'bg-slate-100 text-slate-500'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {(expanded || row.response === 'na' || activeQuestion.id === item.id) && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {expanded && (
                                <>
                                  <input
                                    value={row.affectedQuantity}
                                    onChange={(event) => updateItem(item.id, { affectedQuantity: event.target.value })}
                                    placeholder="Affected quantity / count"
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  />
                                  <select
                                    value={row.severity}
                                    onChange={(event) => updateItem(item.id, { severity: event.target.value as Severity })}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  >
                                    <option value="">Severity / priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                  <input
                                    value={row.recommendedAction}
                                    onChange={(event) => updateItem(item.id, { recommendedAction: event.target.value })}
                                    placeholder="Recommended action (optional)"
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                                  />
                                  <select
                                    value={row.selectedQuadrantId}
                                    onChange={(event) => updateItem(item.id, { selectedQuadrantId: event.target.value })}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  >
                                    <option value="">Select quadrant</option>
                                    {quadrants.map((quad) => (
                                      <option key={quad.id} value={quad.id}>{quad.name}</option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-3 text-xs text-slate-700">
                                    <label className="inline-flex items-center gap-1"><input type="checkbox" checked={row.quoteImpacting} onChange={(e) => updateItem(item.id, { quoteImpacting: e.target.checked })} /> Quote-impacting</label>
                                    <label className="inline-flex items-center gap-1"><input type="checkbox" checked={row.repairRequired} onChange={(e) => updateItem(item.id, { repairRequired: e.target.checked })} /> Repair-required</label>
                                  </div>
                                </>
                              )}

                              {!compact && (
                                <textarea
                                  value={row.notes}
                                  onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                                  placeholder="Notes"
                                  className="min-h-[72px] rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                                />
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Overall notes</p>
                    <textarea
                      value={overallNotes}
                      onChange={(event) => setOverallNotes(event.target.value)}
                      className="mt-2 min-h-[86px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="General notes across all categories/quadrants…"
                    />
                  </div>
                </main>
              )}

              {mobileTab === 'photos' && (
                <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-800">Quadrant evidence</h2>
                  <p className="mt-1 text-xs text-slate-600">Attach existing inspection photos to: <span className="font-semibold">{activeQuestion.question}</span></p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {quadrants.map((quad) => (
                      <button
                        key={quad.id}
                        type="button"
                        onClick={() => updateItem(activeQuestion.id, { selectedQuadrantId: quad.id })}
                        className={`rounded-full border px-3 py-1 text-xs ${responses[activeQuestion.id]?.selectedQuadrantId === quad.id ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-slate-300 text-slate-600'}`}
                      >
                        {quad.name}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    {availablePhotos.length === 0 ? (
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No photos found for the selected quadrant/filter.</p>
                    ) : (
                      availablePhotos.map((photo) => {
                        const attached = responses[activeQuestion.id]?.attachedPhotoIds.includes(photo.id);
                        return (
                          <div key={photo.id} className="rounded-lg border border-slate-200 p-2">
                            <div className="relative h-24 overflow-hidden rounded-md bg-slate-100">
                              <img src={photo.photo_url} alt="Quadrant evidence" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto(photo)}
                                className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700"
                              >
                                Preview
                              </button>
                            </div>
                            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={attached}
                                onChange={(event) => {
                                  const existing = responses[activeQuestion.id]?.attachedPhotoIds || [];
                                  updateItem(activeQuestion.id, {
                                    attachedPhotoIds: event.target.checked
                                      ? [...new Set([...existing, photo.id])]
                                      : existing.filter((id) => id !== photo.id),
                                  });
                                }}
                              />
                              Attach to active checklist item
                            </label>
                            {attached && (
                              <input
                                value={responses[activeQuestion.id]?.photoCaptions?.[photo.id] || ''}
                                onChange={(event) => {
                                  const existing = responses[activeQuestion.id]?.photoCaptions || {};
                                  updateItem(activeQuestion.id, { photoCaptions: { ...existing, [photo.id]: event.target.value } });
                                }}
                                placeholder="Optional caption"
                                className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </aside>
              )}
            </div>

            <div className="hidden lg:grid lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:gap-4">
              <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">Checklist categories</h2>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const stats = categoryStats[category.id];
                    const active = category.id === activeCategory.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setActiveCategoryId(category.id);
                          setActiveQuestionId(category.items[0].id);
                        }}
                        className={`w-full rounded-xl border p-3 text-left ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{category.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{stats.answered}/{stats.total} answered • {stats.completion}% complete</p>
                        <p className="mt-1 text-xs text-amber-700">Issues: {stats.issues} • Linked photos: {stats.linkedPhotos}</p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="sticky top-[76px] z-10 mb-3 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active category</p>
                  <h2 className="text-lg font-semibold text-slate-900">{activeCategory.title}</h2>
                  <p className="text-xs text-slate-600">Question {activeCategory.items.findIndex((item) => item.id === activeQuestion.id) + 1} of {activeCategory.items.length}</p>
                </div>
                <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                  {activeCategory.items.map((item) => {
                    const row = responses[item.id] || defaultItemResponse();
                    const expanded = row.response === 'yes';
                    const compact = row.response === 'no';
                    return (
                      <article
                        key={item.id}
                        className={`rounded-xl border p-3 transition ${activeQuestion.id === item.id ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'}`}
                        onClick={() => setActiveQuestionId(item.id)}
                      >
                        <p className="text-sm font-medium text-slate-900">{item.question}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {([
                            { value: 'yes', label: 'YES', cls: 'bg-red-100 text-red-700' },
                            { value: 'no', label: 'NO', cls: 'bg-emerald-100 text-emerald-700' },
                            { value: 'na', label: 'N/A', cls: 'bg-slate-200 text-slate-700' },
                          ] as const).map((opt) => (
                            <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); updateItem(item.id, { response: opt.value }); }} className={`rounded-full px-3 py-1 text-xs font-semibold ${row.response === opt.value ? opt.cls : 'bg-slate-100 text-slate-500'}`}>{opt.label}</button>
                          ))}
                        </div>
                        {(expanded || row.response === 'na' || activeQuestion.id === item.id) && (
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {expanded && (
                              <>
                                <input value={row.affectedQuantity} onChange={(e) => updateItem(item.id, { affectedQuantity: e.target.value })} placeholder="Affected quantity / count" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                                <select value={row.severity} onChange={(e) => updateItem(item.id, { severity: e.target.value as Severity })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Severity / priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
                                <input value={row.recommendedAction} onChange={(e) => updateItem(item.id, { recommendedAction: e.target.value })} placeholder="Recommended action (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                                <select value={row.selectedQuadrantId} onChange={(e) => updateItem(item.id, { selectedQuadrantId: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select quadrant</option>{quadrants.map((quad) => (<option key={quad.id} value={quad.id}>{quad.name}</option>))}</select>
                                <div className="flex items-center gap-3 text-xs text-slate-700"><label className="inline-flex items-center gap-1"><input type="checkbox" checked={row.quoteImpacting} onChange={(e) => updateItem(item.id, { quoteImpacting: e.target.checked })} /> Quote-impacting</label><label className="inline-flex items-center gap-1"><input type="checkbox" checked={row.repairRequired} onChange={(e) => updateItem(item.id, { repairRequired: e.target.checked })} /> Repair-required</label></div>
                              </>
                            )}
                            {!compact && (
                              <textarea value={row.notes} onChange={(e) => updateItem(item.id, { notes: e.target.value })} placeholder="Notes" className="min-h-[72px] rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">Overall notes</p>
                  <textarea value={overallNotes} onChange={(e) => setOverallNotes(e.target.value)} className="mt-2 min-h-[86px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="General notes across all categories/quadrants…" />
                </div>
              </main>

              <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">Quadrant evidence</h2>
                <p className="mt-1 text-xs text-slate-600">Attach existing inspection photos to: <span className="font-semibold">{activeQuestion.question}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quadrants.map((quad) => (
                    <button key={quad.id} type="button" onClick={() => updateItem(activeQuestion.id, { selectedQuadrantId: quad.id })} className={`rounded-full border px-3 py-1 text-xs ${responses[activeQuestion.id]?.selectedQuadrantId === quad.id ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-slate-300 text-slate-600'}`}>{quad.name}</button>
                  ))}
                </div>
                <div className="mt-3 max-h-[65vh] space-y-2 overflow-y-auto pr-1">
                  {availablePhotos.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No photos found for the selected quadrant/filter.</p> : availablePhotos.map((photo) => {
                    const attached = responses[activeQuestion.id]?.attachedPhotoIds.includes(photo.id);
                    return (
                      <div key={photo.id} className="rounded-lg border border-slate-200 p-2">
                        <div className="relative h-24 overflow-hidden rounded-md bg-slate-100"><img src={photo.photo_url} alt="Quadrant evidence" className="h-full w-full object-cover" /><button type="button" onClick={() => setPreviewPhoto(photo)} className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700">Preview</button></div>
                        <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={attached} onChange={(e) => { const existing = responses[activeQuestion.id]?.attachedPhotoIds || []; updateItem(activeQuestion.id, { attachedPhotoIds: e.target.checked ? [...new Set([...existing, photo.id])] : existing.filter((id) => id !== photo.id) }); }} /> Attach to active checklist item</label>
                        {attached && <input value={responses[activeQuestion.id]?.photoCaptions?.[photo.id] || ''} onChange={(e) => { const existing = responses[activeQuestion.id]?.photoCaptions || {}; updateItem(activeQuestion.id, { photoCaptions: { ...existing, [photo.id]: e.target.value } }); }} placeholder="Optional caption" className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs" />}
                      </div>
                    );
                  })}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {previewPhoto && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="max-w-4xl rounded-xl bg-white p-3" onClick={(event) => event.stopPropagation()}>
            <img src={previewPhoto.photo_url} alt="Evidence preview" className="max-h-[80vh] w-full rounded-lg object-contain" />
            <button type="button" onClick={() => setPreviewPhoto(null)} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm">Close preview</button>
          </div>
        </div>
      )}
    </div>
  );
}
