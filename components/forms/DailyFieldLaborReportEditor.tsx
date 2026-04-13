'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { LaborTable } from './LaborTable';
import { MaterialsTable } from './MaterialsTable';
import { SignaturePadField } from './SignaturePadField';
import type { DailyFieldReportForm, LaborRow, MaterialRow, PhotoRow, ReportStatus } from './types';

type SectionKey =
  | 'project'
  | 'scope'
  | 'labor'
  | 'materials'
  | 'notes'
  | 'photos'
  | 'signatures'
  | 'review';

const SECTION_ORDER: Array<{ key: SectionKey; title: string }> = [
  { key: 'project', title: 'Project Info' },
  { key: 'scope', title: 'Work Performed / Scope' },
  { key: 'labor', title: 'Labor' },
  { key: 'materials', title: 'Materials' },
  { key: 'notes', title: 'Daily Notes / Issues / Conditions' },
  { key: 'photos', title: 'Photos' },
  { key: 'signatures', title: 'Signatures' },
  { key: 'review', title: 'Review & Submit' },
];

const emptyForm = (): DailyFieldReportForm => ({
  project_id: '',
  report_date: new Date().toISOString().slice(0, 10),
  job_number: '',
  project_name_snapshot: '',
  customer_gc_snapshot: '',
  lead_foreman_name: '',
  scope_of_work: '',
  daily_notes: '',
  status: 'draft',
  pm_review_required: true,
  client_not_available: false,
  guardian_signature_url: '',
  guardian_signed_at: '',
  customer_signature_url: '',
  customer_signed_at: '',
  pm_recipient_email: '',
  client_recipient_email: '',
  accounting_recipient_email: '',
});

const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  background: '#fff',
  overflow: 'hidden',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '11px 12px',
  fontSize: 15,
  width: '100%',
  minWidth: 0,
  minHeight: 44,
};

export function DailyFieldLaborReportEditor({ reportId }: { reportId?: string }) {
  const [form, setForm] = useState<DailyFieldReportForm>(emptyForm());
  const [laborRows, setLaborRows] = useState<LaborRow[]>([{ worker_name: '', role_class: '', st_hours: 0, ot_hours: 0, notes: '', sort_order: 0 }]);
  const [materialsRows, setMaterialsRows] = useState<MaterialRow[]>([{ qty: 0, unit: '', description: '', notes: '', sort_order: 0 }]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; title: string; address: string }>>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>('project');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const stTotal = laborRows.reduce((sum, row) => sum + (Number(row.st_hours) || 0), 0);
  const otTotal = laborRows.reduce((sum, row) => sum + (Number(row.ot_hours) || 0), 0);
  const totalHours = stTotal + otTotal;

  const completion = useMemo(() => ({
    project: Boolean(form.project_name_snapshot.trim() && form.report_date && form.lead_foreman_name.trim()),
    scope: Boolean(form.scope_of_work.trim()),
    labor: laborRows.some((row) => row.worker_name.trim()),
    materials: materialsRows.some((row) => row.description.trim()),
    notes: Boolean(form.daily_notes.trim()),
    photos: true,
    signatures: Boolean(form.guardian_signature_url && (form.client_not_available || form.customer_signature_url)),
    review: false,
  }), [form, laborRows, materialsRows]);

  const completedSections = Object.values(completion).filter(Boolean).length;

  const validationErrors = useMemo(() => ({
    project_name_snapshot: !form.project_name_snapshot.trim() ? 'Project name is required.' : '',
    report_date: !form.report_date ? 'Report date is required.' : '',
    lead_foreman_name: !form.lead_foreman_name.trim() ? 'Lead / foreman is required.' : '',
    scope_of_work: !form.scope_of_work.trim() ? 'Work performed / scope is required before submit.' : '',
    guardian_signature_url: !form.guardian_signature_url ? 'Guardian signature is required before submit.' : '',
    customer_signature_url: !form.client_not_available && !form.customer_signature_url ? 'Customer / GC signature is required unless marked unavailable.' : '',
  }), [form]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: projectsData } = await supabase.from('projects').select('id,title,address').order('created_at', { ascending: false });
      setProjects((projectsData as Array<{ id: string; title: string; address: string }>) || []);

      if (reportId) {
        const { data: report } = await supabase.from('forms_daily_field_reports').select('*').eq('id', reportId).single();
        if (report) setForm((prev) => ({ ...prev, ...(report as DailyFieldReportForm) }));

        const { data: labor } = await supabase.from('forms_daily_field_report_labor').select('*').eq('report_id', reportId).order('sort_order', { ascending: true });
        if (labor && labor.length > 0) setLaborRows(labor as LaborRow[]);

        const { data: materials } = await supabase.from('forms_daily_field_report_materials').select('*').eq('report_id', reportId).order('sort_order', { ascending: true });
        if (materials && materials.length > 0) setMaterialsRows(materials as MaterialRow[]);

        const { data: photosData } = await supabase.from('forms_daily_field_report_photos').select('*').eq('report_id', reportId).order('created_at', { ascending: false });
        setPhotos((photosData as PhotoRow[]) || []);
      }
      setLoading(false);
    };
    void load();
  }, [reportId]);

  const onProjectChange = (projectId: string) => {
    const selected = projects.find((project) => project.id === projectId);
    setForm((prev) => ({
      ...prev,
      project_id: projectId,
      project_name_snapshot: selected?.title || prev.project_name_snapshot,
      customer_gc_snapshot: selected?.address || prev.customer_gc_snapshot,
    }));
  };

  const save = useCallback(async (nextStatus: ReportStatus, silent = false) => {
    setErrorMessage('');
    setSuccessMessage('');

    const hasSubmitErrors = Object.values(validationErrors).some(Boolean);
    if (nextStatus === 'submitted' && hasSubmitErrors) {
      setHasAttemptedSubmit(true);
      setErrorMessage('Please complete all required fields and signatures before submitting.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id || null;
    const payload = {
      ...form,
      status: nextStatus,
      submitted_at: nextStatus === 'submitted' ? new Date().toISOString() : null,
      submitted_by: nextStatus === 'submitted' ? userId : null,
      guardian_signed_at: form.guardian_signature_url ? form.guardian_signed_at || new Date().toISOString() : null,
      customer_signed_at: form.customer_signature_url ? form.customer_signed_at || new Date().toISOString() : null,
    };

    let reportIdToUse = reportId;
    if (reportId) {
      const { error } = await supabase.from('forms_daily_field_reports').update(payload).eq('id', reportId);
      if (error) {
        setSaving(false);
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from('forms_daily_field_reports').insert([payload]).select('id').single();
      if (error || !data) {
        setSaving(false);
        setErrorMessage(error?.message || 'Unable to create report');
        return;
      }
      reportIdToUse = data.id as string;
      window.history.replaceState({}, '', `/forms/daily-field-labor/${reportIdToUse}`);
    }

    if (!reportIdToUse) {
      setSaving(false);
      return;
    }

    await supabase.from('forms_daily_field_report_labor').delete().eq('report_id', reportIdToUse);
    if (laborRows.length > 0) {
      await supabase.from('forms_daily_field_report_labor').insert(laborRows.map((row, i) => ({ ...row, report_id: reportIdToUse, sort_order: i })));
    }

    await supabase.from('forms_daily_field_report_materials').delete().eq('report_id', reportIdToUse);
    if (materialsRows.length > 0) {
      await supabase.from('forms_daily_field_report_materials').insert(materialsRows.map((row, i) => ({ ...row, report_id: reportIdToUse, sort_order: i })));
    }

    setSaving(false);
    setLastSavedAt(new Date().toLocaleTimeString());
    if (!silent) {
      setSuccessMessage(nextStatus === 'submitted' ? 'Report submitted successfully.' : 'Draft saved.');
    }
  }, [form, laborRows, materialsRows, reportId, validationErrors]);

  useEffect(() => {
    if (!reportId) return;
    const timer = setTimeout(() => {
      void save('draft', true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [form, laborRows, materialsRows, reportId, save]);

  const uploadPhoto = async (file: File | null, caption: string) => {
    if (!file) return;
    const idForPath = reportId || 'new';
    const path = `daily-field-labor/${idForPath}/photos/${Date.now()}-${file.name}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('project-media').upload(path, file, { upsert: true });
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!reportId) {
      setErrorMessage('Save draft once before attaching persisted photos.');
      return;
    }
    const { data: urlData } = supabase.storage.from('project-media').getPublicUrl(path);
    await supabase.from('forms_daily_field_report_photos').insert([{ report_id: reportId, storage_path: urlData.publicUrl, caption }]);
    setPhotos((prev) => [{ storage_path: urlData.publicUrl, caption }, ...prev]);
  };

  return (
    <div style={{ padding: 20, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ position: 'sticky', top: 8, zIndex: 20, ...cardStyle, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 18 }}>Daily Field Labor Report</strong>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {form.status.toUpperCase()} • {form.project_name_snapshot || 'No project selected'} • {form.report_date || 'No date'}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#334155' }}>
            Progress: <strong>{completedSections}/{SECTION_ORDER.length - 1} sections</strong>
            <br />
            ST {stTotal.toFixed(2)} • OT {otTotal.toFixed(2)} • Total {totalHours.toFixed(2)}
            <br />
            {lastSavedAt ? `Last saved ${lastSavedAt}` : 'Not yet saved'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => void save('draft')} disabled={saving} style={{ borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '10px 14px', fontWeight: 600 }}>Save Draft</button>
            <button type="button" onClick={() => void save('submitted')} disabled={saving} style={{ borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', padding: '10px 14px', fontWeight: 700 }}>Submit</button>
          </div>
        </div>
        {errorMessage ? <p style={{ margin: '10px 0 0', color: '#b91c1c' }}>{errorMessage}</p> : null}
        {successMessage ? <p style={{ margin: '10px 0 0', color: '#0369a1' }}>{successMessage}</p> : null}
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading report...</p> : null}

      {SECTION_ORDER.map((section, index) => (
        <section key={section.key} style={{ ...cardStyle, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setActiveSection(section.key)}
            style={{ width: '100%', border: 'none', background: '#fff', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}
          >
            <span style={{ fontWeight: 700 }}>{index + 1}. {section.title}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{completion[section.key as keyof typeof completion] ? 'Complete' : 'In progress'}</span>
          </button>

          {activeSection === section.key && (
            <div style={{ borderTop: '1px solid #e2e8f0', padding: 14 }}>
              {section.key === 'project' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="project-info-grid-row">
                    <Field label="Project selector">
                      <select style={inputStyle} value={form.project_id} onChange={(e) => onProjectChange(e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                      </select>
                    </Field>
                    <Field label="Project name" error={hasAttemptedSubmit ? validationErrors.project_name_snapshot : ''}>
                      <input style={inputStyle} value={form.project_name_snapshot} onChange={(e) => setForm((prev) => ({ ...prev, project_name_snapshot: e.target.value }))} />
                    </Field>
                    <Field label="Job number">
                      <input style={inputStyle} value={form.job_number} onChange={(e) => setForm((prev) => ({ ...prev, job_number: e.target.value }))} />
                    </Field>
                  </div>

                  <div className="project-info-grid-row">
                    <Field label="Lead / foreman" error={hasAttemptedSubmit ? validationErrors.lead_foreman_name : ''}>
                      <input style={inputStyle} value={form.lead_foreman_name} onChange={(e) => setForm((prev) => ({ ...prev, lead_foreman_name: e.target.value }))} />
                    </Field>
                    <Field label="Date" error={hasAttemptedSubmit ? validationErrors.report_date : ''}>
                      <input type="date" style={inputStyle} value={form.report_date} onChange={(e) => setForm((prev) => ({ ...prev, report_date: e.target.value }))} />
                    </Field>
                    <Field label="Customer / GC">
                      <input style={inputStyle} value={form.customer_gc_snapshot} onChange={(e) => setForm((prev) => ({ ...prev, customer_gc_snapshot: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              )}

              {section.key === 'scope' && (
                <Field label="Work performed / scope" error={hasAttemptedSubmit ? validationErrors.scope_of_work : ''}>
                  <textarea style={{ ...inputStyle, minHeight: 130 }} value={form.scope_of_work} onChange={(e) => setForm((prev) => ({ ...prev, scope_of_work: e.target.value }))} />
                </Field>
              )}

              {section.key === 'labor' && (
                <>
                  <div style={{ marginBottom: 12, border: '1px solid #dbeafe', background: '#f8fbff', borderRadius: 12, padding: 12 }}>
                    <strong style={{ display: 'block', marginBottom: 4 }}>Labor Totals</strong>
                    <span style={{ fontSize: 14, color: '#334155' }}>Straight Time: {stTotal.toFixed(2)} hrs • Overtime: {otTotal.toFixed(2)} hrs • Total: {totalHours.toFixed(2)} hrs</span>
                  </div>
                  <LaborTable rows={laborRows} onAdd={() => setLaborRows((prev) => [...prev, { worker_name: '', role_class: '', st_hours: 0, ot_hours: 0, notes: '', sort_order: prev.length }])} onRemove={(idx) => setLaborRows((prev) => prev.filter((_, i) => i !== idx))} onChange={(idx, patch) => setLaborRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))} />
                </>
              )}

              {section.key === 'materials' && (
                <MaterialsTable rows={materialsRows} onAdd={() => setMaterialsRows((prev) => [...prev, { qty: 0, unit: '', description: '', notes: '', sort_order: prev.length }])} onRemove={(idx) => setMaterialsRows((prev) => prev.filter((_, i) => i !== idx))} onChange={(idx, patch) => setMaterialsRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))} />
              )}

              {section.key === 'notes' && (
                <Field label="Daily notes / issues / site conditions">
                  <textarea style={{ ...inputStyle, minHeight: 130 }} value={form.daily_notes} onChange={(e) => setForm((prev) => ({ ...prev, daily_notes: e.target.value }))} />
                </Field>
              )}

              {section.key === 'photos' && (
                <>
                  <PhotoUploader onUpload={uploadPhoto} />
                  <p style={{ fontSize: 13, color: '#64748b' }}>Photo count: {photos.length}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {photos.map((photo, idx) => (
                      <PhotoThumb key={`${photo.storage_path}-${idx}`} path={photo.storage_path} caption={photo.caption} />
                    ))}
                    {photos.length === 0 ? <p style={{ color: '#64748b' }}>No photos added yet.</p> : null}
                  </div>
                </>
              )}

              {section.key === 'signatures' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <SignaturePadField
                    label="Guardian Lead / Foreman signature"
                    required
                    value={form.guardian_signature_url}
                    signedAt={form.guardian_signed_at}
                    error={hasAttemptedSubmit ? validationErrors.guardian_signature_url : ''}
                    onChange={({ value, signedAt }) => setForm((prev) => ({ ...prev, guardian_signature_url: value, guardian_signed_at: signedAt }))}
                  />

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#fff' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                      <input type="checkbox" checked={form.client_not_available} onChange={(e) => setForm((prev) => ({ ...prev, client_not_available: e.target.checked, customer_signature_url: e.target.checked ? '' : prev.customer_signature_url, customer_signed_at: e.target.checked ? '' : prev.customer_signed_at }))} />
                      Client / GC not available on site
                    </label>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
                      When enabled, customer signature becomes optional and is clearly reflected in review.
                    </p>
                  </div>

                  <SignaturePadField
                    label="Customer / GC signature"
                    required={!form.client_not_available}
                    disabled={form.client_not_available}
                    helperText={form.client_not_available ? 'Disabled because client / GC is marked not available.' : undefined}
                    value={form.customer_signature_url}
                    signedAt={form.customer_signed_at}
                    error={hasAttemptedSubmit ? validationErrors.customer_signature_url : ''}
                    onChange={({ value, signedAt }) => setForm((prev) => ({ ...prev, customer_signature_url: value, customer_signed_at: signedAt }))}
                  />
                </div>
              )}

              {section.key === 'review' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <ReviewLine label="Project" value={form.project_name_snapshot || 'Missing'} />
                  <ReviewLine label="Job number" value={form.job_number || '—'} />
                  <ReviewLine label="Lead / foreman" value={form.lead_foreman_name || 'Missing'} />
                  <ReviewLine label="Work summary" value={form.scope_of_work ? 'Provided' : 'Missing'} />
                  <ReviewLine label="Labor totals" value={`ST ${stTotal.toFixed(2)} / OT ${otTotal.toFixed(2)} / Total ${totalHours.toFixed(2)}`} />
                  <ReviewLine label="Labor rows" value={`${laborRows.length}`} />
                  <ReviewLine label="Materials rows" value={`${materialsRows.length}`} />
                  <ReviewLine label="Notes" value={form.daily_notes ? 'Provided' : 'Missing'} />
                  <ReviewLine label="Photo count" value={`${photos.length}`} />
                  <ReviewLine label="Guardian signature" value={form.guardian_signature_url ? 'Captured' : 'Missing'} />
                  <ReviewLine label="Client availability" value={form.client_not_available ? 'Client / GC not available on site' : 'Client available'} />
                  <ReviewLine label="Customer signature" value={form.client_not_available ? 'Not required' : form.customer_signature_url ? 'Captured' : 'Missing'} />

                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void save('draft')} disabled={saving} style={{ borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '10px 14px' }}>Save Draft</button>
                    <button type="button" onClick={() => void save('submitted')} disabled={saving} style={{ borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', padding: '10px 14px', fontWeight: 700 }}>Submit Report</button>
                    <Link href="/forms/daily-field-labor" style={{ borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '10px 14px', textDecoration: 'none', color: '#0f172a' }}>Back to Reports</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ))}

      <style jsx>{`
        .project-info-grid-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .project-info-grid-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .project-info-grid-row {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{label}</span>
      {children}
      {error ? <span style={{ color: '#b91c1c', fontSize: 12 }}>{error}</span> : null}
    </label>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 220px) minmax(0, 1fr)', gap: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 6, alignItems: 'start' }}>
      <strong style={{ fontSize: 14 }}>{label}</strong>
      <span style={{ color: '#334155' }}>{value}</span>
    </div>
  );
}

function PhotoUploader({ onUpload }: { onUpload: (file: File | null, caption: string) => Promise<void> }) {
  const [caption, setCaption] = useState('');
  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 8 }}>
      <input type="file" accept="image/*" onChange={(e) => void onUpload(e.target.files?.[0] || null, caption)} style={{ ...inputStyle, paddingTop: 9 }} />
      <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} style={inputStyle} />
    </div>
  );
}

function PhotoThumb({ path, caption }: { path: string; caption: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 6, background: '#fff' }}>
      <img src={path} alt={caption || 'Report photo'} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} />
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{caption || 'No caption'}</div>
    </div>
  );
}
