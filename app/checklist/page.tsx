'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  checklist_data: Record<string, string>;
  overall_notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type ChecklistItem = {
  key: string;
  label: string;
  help?: string;
};

type ChecklistSection = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

const sections: ChecklistSection[] = [
  {
    id: 'roof',
    title: 'Roof / Structure Condition',
    items: [
      { key: 'roof_access_safe', label: 'Roof access is safe and unobstructed' },
      { key: 'roof_condition', label: 'Roof membrane/deck condition acceptable' },
      { key: 'visible_damage', label: 'No visible lightning-related structural damage' },
    ],
  },
  {
    id: 'terminals',
    title: 'Air Terminal Network',
    items: [
      { key: 'air_terminals_present', label: 'Air terminals present at required intervals' },
      { key: 'air_terminal_height', label: 'Air terminal heights appear compliant' },
      { key: 'air_terminal_secure', label: 'Air terminals are mechanically secure' },
    ],
  },
  {
    id: 'conductors',
    title: 'Main / Down Conductors',
    items: [
      { key: 'main_conductor_continuity', label: 'Main conductor path appears continuous' },
      { key: 'down_conductor_routes', label: 'Down conductor routes protected and accessible' },
      { key: 'corrosion_or_damage', label: 'No corrosion, breaks, or loose terminations found' },
    ],
  },
  {
    id: 'bonding_grounding',
    title: 'Bonding / Grounding',
    items: [
      { key: 'bonding_equipment', label: 'Mechanical equipment and metal bodies bonded' },
      { key: 'ground_points_accessible', label: 'Grounding points identified and accessible' },
      { key: 'bonding_quality', label: 'Bonding connections appear clean/tight' },
    ],
  },
  {
    id: 'service',
    title: 'Service / Protection Components',
    items: [
      { key: 'spd_present', label: 'Surge protection devices present where expected' },
      { key: 'labels_present', label: 'Critical labels/documentation points present' },
      { key: 'maintenance_recommended', label: 'Maintenance recommended based on findings' },
    ],
  },
];

function readLocalFallback(projectId: string): ChecklistRecord | null {
  try {
    const raw = window.localStorage.getItem(`checklist:${projectId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ChecklistRecord;
  } catch {
    return null;
  }
}

function writeLocalFallback(record: ChecklistRecord) {
  try {
    window.localStorage.setItem(`checklist:${record.project_id}`, JSON.stringify(record));
  } catch {
    // no-op
  }
}

export default function ChecklistPage() {
  const [projectIdFromQuery, setProjectIdFromQuery] = useState<string>('');

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId') || '';
    setProjectIdFromQuery(projectId);
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [overallNotes, setOverallNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadedChecklistId, setLoadedChecklistId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const setDefaultAnswers = useCallback(() => {
    const next: Record<string, string> = {};
    for (const section of sections) {
      for (const item of section.items) {
        next[item.key] = 'na';
      }
    }
    setAnswers(next);
  }, []);

  const loadChecklist = useCallback(
    async (projectId: string) => {
      setStatusMessage(null);
      setLoadedChecklistId(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('inspection_checklists')
        .select('id, project_id, checklist_data, overall_notes, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        const local = readLocalFallback(projectId);
        if (local) {
          setAnswers(local.checklist_data || {});
          setOverallNotes(local.overall_notes || '');
          setLoadedChecklistId(local.id);
          setStatusMessage('Loaded local checklist (cloud table unavailable).');
          return;
        }

        setDefaultAnswers();
        setOverallNotes('');
        setStatusMessage('Checklist table not available yet. Working in local mode until table is created.');
        return;
      }

      if (data) {
        const record = data as ChecklistRecord;
        setAnswers(record.checklist_data || {});
        setOverallNotes(record.overall_notes || '');
        setLoadedChecklistId(record.id);
      } else {
        setDefaultAnswers();
        setOverallNotes('');
      }
    },
    [setDefaultAnswers],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      setLoading(true);
      setStatusMessage(null);

      try {
        const supabase = createClient();
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Project fetch timeout')), 10000);
        });

        const query = supabase
          .from('projects')
          .select('id, title, address, status')
          .order('created_at', { ascending: false });

        const { data, error } = await Promise.race([query, timeout]);

        if (cancelled) return;

        if (error) {
          setStatusMessage('Could not load projects from cloud. Please refresh and try again.');
          setProjects([]);
          setDefaultAnswers();
          return;
        }

        const nextProjects = (data as Project[]) || [];
        setProjects(nextProjects);

        const preselect =
          (projectIdFromQuery && nextProjects.some((project) => project.id === projectIdFromQuery)
            ? projectIdFromQuery
            : nextProjects[0]?.id) || '';

        setSelectedProjectId(preselect);
        if (preselect) {
          await loadChecklist(preselect);
        } else {
          setDefaultAnswers();
          setStatusMessage('No projects found yet. Create a project first, then return to Checklist.');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Checklist bootstrap failed:', error);
        setProjects([]);
        setDefaultAnswers();
        setStatusMessage('Checklist failed to load cloud data. You can still use local demo mode after selecting a project.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchProjects();

    return () => {
      cancelled = true;
    };
  }, [loadChecklist, projectIdFromQuery, setDefaultAnswers]);

  const handleSave = async () => {
    if (!selectedProjectId) return;

    setSaving(true);
    setStatusMessage(null);
    const payload = {
      project_id: selectedProjectId,
      checklist_data: answers,
      overall_notes: overallNotes,
    };

    const supabase = createClient();
    let errorMessage: string | null = null;

    if (loadedChecklistId) {
      const { error } = await supabase.from('inspection_checklists').update(payload).eq('id', loadedChecklistId);
      if (error) errorMessage = error.message;
    } else {
      const { data, error } = await supabase
        .from('inspection_checklists')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        errorMessage = error.message;
      } else {
        setLoadedChecklistId((data as { id: string }).id);
      }
    }

    if (errorMessage) {
      const localRecord: ChecklistRecord = {
        id: loadedChecklistId || `local-${Date.now()}`,
        project_id: selectedProjectId,
        checklist_data: answers,
        overall_notes: overallNotes,
      };
      writeLocalFallback(localRecord);
      setLoadedChecklistId(localRecord.id);
      setStatusMessage('Saved locally for demo mode (cloud table unavailable).');
      setSaving(false);
      return;
    }

    setStatusMessage('Checklist saved to project successfully.');
    setSaving(false);
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    await loadChecklist(projectId);
  };

  if (loading) {
    return <div className="p-8 text-center text-lg font-semibold text-slate-500">Loading checklist...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inspection Checklist</h1>
              <p className="mt-1 text-sm text-slate-600">Fill this checklist during field inspection and save it to the selected project.</p>
            </div>
            <Link href="/inspections" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Back to Inspections
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div>
              <label htmlFor="project-picker" className="mb-2 block text-sm font-medium text-slate-700">
                Project
              </label>
              <select
                id="project-picker"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={selectedProjectId}
                onChange={(event) => void handleProjectChange(event.target.value)}
                disabled={projects.length === 0}
              >
                {projects.length === 0 && <option value="">No projects available</option>}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} — {project.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <p className="font-semibold text-slate-800">Status</p>
              <p className="text-slate-700">{selectedProject?.status || 'N/A'}</p>
            </div>
          </div>

          {statusMessage && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{statusMessage}</p>
          )}
        </div>

        {sections.map((section) => (
          <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.items.map((item) => (
                <div key={item.key} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  {item.help && <p className="mt-1 text-xs text-slate-500">{item.help}</p>}

                  <div className="mt-3 flex flex-wrap gap-3">
                    {[
                      { value: 'pass', label: 'Pass', color: '#10b981' },
                      { value: 'fail', label: 'Fail', color: '#ef4444' },
                      { value: 'na', label: 'N/A', color: '#64748b' },
                    ].map((option) => {
                      const selected = answers[item.key] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [item.key]: option.value,
                            }))
                          }
                          className="rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{
                            backgroundColor: selected ? option.color : '#cbd5e1',
                            opacity: selected ? 1 : 0.85,
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="overall-notes" className="mb-2 block text-sm font-semibold text-slate-800">
            Inspector Notes / Deviations / Recommended Work
          </label>
          <textarea
            id="overall-notes"
            className="h-40 w-full rounded-lg border border-slate-300 p-3 text-sm"
            placeholder="Enter notable deficiencies, recommended corrections, and quoting notes..."
            value={overallNotes}
            onChange={(event) => setOverallNotes(event.target.value)}
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedProjectId || saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {saving ? 'Saving…' : 'Save Checklist'}
            </button>
            {selectedProjectId && (
              <Link href={`/inspections/${selectedProjectId}`} className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                Open Quote Summary
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
