'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Project = {
  id: string;
  title: string;
  address: string;
  status: string;
};

type ChecklistRecord = {
  id: string;
  project_id: string;
  checklist_data: Record<string, unknown>;
  overall_notes: string | null;
  updated_at?: string;
};

type Answer = '' | 'yes' | 'no' | 'na';

type ItemState = {
  answer: Answer;
  notes: string;
  photos: string[];
};

type ChecklistItem = {
  id: string;
  question: string;
};

type ChecklistCategory = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

const categories: ChecklistCategory[] = [
  {
    id: 'grounding',
    title: '1. Grounding',
    items: [
      { id: 'ground_rods_depth_distance', question: 'Are ground rods at least 10 ft deep and installed at least 2 ft from the structure foundation?' },
      { id: 'ground_plates_depth_distance', question: 'Are ground plates or fans buried at least 2 ft from the structure and 18 in deep?' },
      { id: 'ground_ring_install', question: 'Is the ground ring (counterpoise) installed at least 2 ft below finished grade and 2 ft from the foundation?' },
      { id: 'chemical_rods_serviceable', question: 'Are chemical ground rods, if used, in good serviceable condition?' },
    ],
  },
  {
    id: 'air_terminals',
    title: '2. Air Terminals',
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
    title: '3. Air Terminal Bases',
    items: [
      { id: 'bases_roof_compatible', question: 'Are air terminal bases compatible with the roofing material?' },
      { id: 'bases_properly_fastened', question: 'Are air terminal bases properly fastened?' },
      { id: 'bases_working_condition', question: 'Are air terminal bases in good working condition?' },
      { id: 'bases_secure_attachment', question: 'Are air terminal bases securely attached (not improperly floating or loose)?' },
    ],
  },
  {
    id: 'fasteners',
    title: '4. Fasteners',
    items: [
      { id: 'fasteners_36in', question: 'Are lightning conductors fastened at intervals not exceeding 36 inches?' },
      { id: 'fasteners_condition', question: 'Are fasteners in good working condition?' },
      { id: 'fasteners_ul96', question: 'Are fasteners UL96 approved for the application?' },
      { id: 'fasteners_mortar_joints', question: 'Are fasteners installed correctly in mortar joints where applicable?' },
    ],
  },
  {
    id: 'connectors',
    title: '5. Connectors',
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
    title: '6. Bonding',
    items: [
      { id: 'bonding_metal_bodies', question: 'Are grounded metal bodies within 6 ft of the main conductor properly bonded?' },
      { id: 'bonding_roof_drains', question: 'Are roof drains with grounding potential properly bonded?' },
      { id: 'bonding_surface_prep', question: 'Has paint, corrosion, or debris been removed before bonding connections were installed?' },
    ],
  },
  {
    id: 'down_conductors',
    title: '7. Down Conductors / Transitions',
    items: [
      { id: 'down_conductors_count', question: 'Is the correct number of down conductors installed for the protected perimeter?' },
      { id: 'down_conductors_structural_steel', question: 'Is structural steel used in place of conductors where applicable?' },
      { id: 'down_conductors_protected', question: 'Are down conductors securely attached and protected from mechanical damage?' },
      { id: 'down_conductors_routing', question: 'Are down conductors run as straight and inconspicuously as possible?' },
    ],
  },
  {
    id: 'conductors',
    title: '8. Conductors',
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
    title: '9. AFMAN 32-1065 Compliance',
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
    title: '10. Testing Requirements',
    items: [
      { id: 'testing_continuity', question: 'Is continuity testing required?' },
      { id: 'testing_ground', question: 'Is ground testing required?' },
    ],
  },
  {
    id: 'inspection_flags',
    title: '11. Typical Deviations From Standard (Inspection Flags)',
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

const finalReviewItems = [
  { id: 'review_major_areas', question: 'all major areas covered?' },
  { id: 'review_enough_photos', question: 'enough photos?' },
  { id: 'review_blocked_access', question: 'any blocked access?' },
  { id: 'review_missing_dimensions', question: 'any missing dimensions?' },
  { id: 'review_special_equipment', question: 'any special equipment needed?' },
  { id: 'review_safety_issues', question: 'any safety issues?' },
];

const allItems = categories.flatMap((category) => category.items);

const buildEmptyState = (): Record<string, ItemState> => {
  const next: Record<string, ItemState> = {};
  for (const item of allItems) {
    next[item.id] = { answer: '', notes: '', photos: [] };
  }
  for (const item of finalReviewItems) {
    next[item.id] = { answer: '', notes: '', photos: [] };
  }
  return next;
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChecklistPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadedChecklistId, setLoadedChecklistId] = useState<string | null>(null);
  const [overallNotes, setOverallNotes] = useState('');
  const [items, setItems] = useState<Record<string, ItemState>>(buildEmptyState());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(categories.map((category, index) => [category.id, index === 0])),
  );

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) || null, [projects, selectedProjectId]);

  const answeredCount = useMemo(() => allItems.filter((item) => items[item.id]?.answer).length, [items]);
  const progress = Math.round((answeredCount / allItems.length) * 100);

  const saveDraftLocal = (projectId: string, state: { checklistItems: Record<string, ItemState>; overallNotes: string }) => {
    try {
      window.localStorage.setItem(`lps-checklist-draft:${projectId}`, JSON.stringify(state));
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (selectedProjectId) {
      timer = setTimeout(() => {
        saveDraftLocal(selectedProjectId, { checklistItems: items, overallNotes });
      }, 600);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [items, overallNotes, selectedProjectId]);

  const hydrateFromRecord = (record: ChecklistRecord | null, projectId: string) => {
    const base = buildEmptyState();
    const checklistData = record?.checklist_data || {};
    const incomingItems = (checklistData as { items?: Record<string, ItemState> }).items;

    if (incomingItems) {
      for (const [key, value] of Object.entries(incomingItems)) {
        base[key] = {
          answer: (value.answer || '') as Answer,
          notes: value.notes || '',
          photos: value.photos || [],
        };
      }
    } else {
      for (const item of allItems) {
        const legacyAnswer = (checklistData as Record<string, string>)[item.id] || '';
        if (legacyAnswer) base[item.id].answer = legacyAnswer as Answer;
      }
      for (const review of finalReviewItems) {
        const legacyAnswer = (checklistData as Record<string, string>)[review.id] || '';
        if (legacyAnswer) base[review.id].answer = legacyAnswer as Answer;
      }
    }

    setItems(base);
    setOverallNotes(record?.overall_notes || '');

    if (!record) {
      try {
        const rawDraft = window.localStorage.getItem(`lps-checklist-draft:${projectId}`);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft) as { checklistItems: Record<string, ItemState>; overallNotes: string };
          setItems({ ...base, ...draft.checklistItems });
          setOverallNotes(draft.overallNotes || '');
          setStatusMessage('Loaded autosaved draft.');
        }
      } catch {
        // no-op
      }
    }
  };

  const loadChecklist = async (projectId: string) => {
    setStatusMessage(null);
    setLoadedChecklistId(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('inspection_checklists')
      .select('id, project_id, checklist_data, overall_notes, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      hydrateFromRecord(null, projectId);
      setStatusMessage('Cloud checklist unavailable. Working in local autosave mode.');
      return;
    }

    const record = (data as ChecklistRecord) || null;
    if (record?.id) setLoadedChecklistId(record.id);
    hydrateFromRecord(record, projectId);
  };

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from('projects').select('id, title, address, status').order('created_at', { ascending: false });
      const list = (data as Project[]) || [];
      setProjects(list);
      const preselected = new URLSearchParams(window.location.search).get('projectId') || list[0]?.id || '';
      setSelectedProjectId(preselected);
      if (preselected) await loadChecklist(preselected);
      setLoading(false);
    };
    void boot();
  }, []);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const setAnswer = (itemId: string, answer: Answer) => {
    setItems((prev) => ({ ...prev, [itemId]: { ...prev[itemId], answer } }));
  };

  const setNotes = (itemId: string, notes: string) => {
    setItems((prev) => ({ ...prev, [itemId]: { ...prev[itemId], notes } }));
  };

  const addPhoto = async (itemId: string, file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: [...prev[itemId].photos, dataUrl],
      },
    }));
  };

  const removePhoto = (itemId: string, index: number) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: prev[itemId].photos.filter((_, photoIndex) => photoIndex !== index),
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;

    const reviewComplete = finalReviewItems.every((reviewItem) => items[reviewItem.id]?.answer);
    if (!reviewComplete) {
      setStatusMessage('Complete the final review checklist before saving.');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const payload = {
      project_id: selectedProjectId,
      checklist_data: {
        version: 'lps-v1',
        items,
      },
      overall_notes: overallNotes,
    };

    const supabase = createClient();
    let errorMessage: string | null = null;

    if (loadedChecklistId) {
      const { error } = await supabase.from('inspection_checklists').update(payload).eq('id', loadedChecklistId);
      if (error) errorMessage = error.message;
    } else {
      const { data, error } = await supabase.from('inspection_checklists').insert([payload]).select('id').single();
      if (error) errorMessage = error.message;
      else setLoadedChecklistId((data as { id: string }).id);
    }

    if (errorMessage) {
      saveDraftLocal(selectedProjectId, { checklistItems: items, overallNotes });
      setStatusMessage('Saved in local autosave mode (cloud table unavailable).');
      setSaving(false);
      return;
    }

    setStatusMessage('LPS checklist saved successfully.');
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '100px 24px', fontFamily: 'Inter, sans-serif' }}>Loading LPS checklist…</div>;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '96px 12px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Lightning Protection System Inspection Checklist</h1>
          <p style={{ marginTop: 8, marginBottom: 0, color: '#64748b' }}>Use YES / NO / N/A for each item, with optional notes and photo evidence.</p>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            <label style={{ fontWeight: 600, color: '#334155' }}>Project
              <select
                value={selectedProjectId}
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  void loadChecklist(event.target.value);
                }}
                style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px' }}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title} — {project.address}</option>
                ))}
              </select>
            </label>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px', background: '#f8fafc' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>Progress: <strong>{answeredCount}</strong> / {allItems.length} ({progress}%)</p>
              <div style={{ marginTop: 8, height: 8, background: '#e2e8f0', borderRadius: 999 }}>
                <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: '#2563eb' }} />
              </div>
              <p style={{ marginTop: 8, marginBottom: 0, color: '#475569', fontSize: 13 }}>Status: {selectedProject?.status || 'N/A'}</p>
            </div>
          </div>
          {statusMessage && <p style={{ marginTop: 10, marginBottom: 0, color: '#334155' }}>{statusMessage}</p>}
        </section>

        {categories.map((category) => (
          <section key={category.id} style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => toggleSection(category.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: '#fff',
                padding: '14px 16px',
                fontSize: 18,
                fontWeight: 700,
                color: '#0f172a',
                borderBottom: openSections[category.id] ? '1px solid #e2e8f0' : 'none',
                cursor: 'pointer',
              }}
            >
              {category.title} {openSections[category.id] ? '▾' : '▸'}
            </button>

            {openSections[category.id] && (
              <div style={{ display: 'grid', gap: '10px', padding: '12px' }}>
                {category.items.map((item) => (
                  <article key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                    <p style={{ marginTop: 0, marginBottom: 10, color: '#1e293b', fontWeight: 600 }}>{item.question}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { value: 'yes' as const, label: 'YES', color: '#059669' },
                        { value: 'no' as const, label: 'NO', color: '#dc2626' },
                        { value: 'na' as const, label: 'N/A', color: '#64748b' },
                      ].map((option) => {
                        const selected = items[item.id]?.answer === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAnswer(item.id, option.value)}
                            style={{
                              border: selected ? `1px solid ${option.color}` : '1px solid #cbd5e1',
                              borderRadius: 999,
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              background: selected ? option.color : '#fff',
                              color: selected ? '#fff' : '#334155',
                            }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      placeholder="Optional notes..."
                      value={items[item.id]?.notes || ''}
                      onChange={(event) => setNotes(item.id, event.target.value)}
                      style={{ width: '100%', marginTop: 10, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px', minHeight: 64, fontSize: 13 }}
                    />

                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => void addPhoto(item.id, event.target.files?.[0] || null)}
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    {(items[item.id]?.photos || []).length > 0 && (
                      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8 }}>
                        {items[item.id].photos.map((photo, index) => (
                          <div key={`${item.id}-${index}`} style={{ position: 'relative' }}>
                            <img src={photo} alt="Checklist evidence" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                            <button
                              type="button"
                              onClick={() => removePhoto(item.id, index)}
                              style={{ position: 'absolute', top: 4, right: 4, border: 'none', borderRadius: 999, width: 20, height: 20, background: 'rgba(15,23,42,0.72)', color: '#fff', cursor: 'pointer' }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '16px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Complete review checklist</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {finalReviewItems.map((reviewItem) => (
              <div key={reviewItem.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px' }}>
                <p style={{ marginTop: 0, marginBottom: 8, color: '#334155', fontWeight: 600 }}>{reviewItem.question}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['yes', 'no'].map((value) => {
                    const selected = items[reviewItem.id]?.answer === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAnswer(reviewItem.id, value as Answer)}
                        style={{
                          border: selected ? '1px solid transparent' : '1px solid #cbd5e1',
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          background: selected ? (value === 'yes' ? '#059669' : '#dc2626') : '#fff',
                          color: selected ? '#fff' : '#334155',
                        }}
                      >
                        {value.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '16px' }}>
          <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Inspector Notes / Summary</label>
          <textarea
            value={overallNotes}
            onChange={(event) => setOverallNotes(event.target.value)}
            placeholder="Optional overall notes..."
            style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, minHeight: 120, padding: '10px' }}
          />

          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedProjectId || saving}
              style={{ border: 'none', borderRadius: 8, padding: '10px 14px', background: '#2563eb', color: '#fff', fontWeight: 700 }}
            >
              {saving ? 'Saving…' : 'Save Checklist'}
            </button>
            {selectedProjectId && (
              <Link href={`/quote-summary?projectId=${selectedProjectId}`} style={{ textDecoration: 'none', borderRadius: 8, padding: '10px 14px', background: '#1e293b', color: '#fff', fontWeight: 700 }}>
                Open Quote Summary
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
