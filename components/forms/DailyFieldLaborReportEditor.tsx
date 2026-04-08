'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { LaborTable } from './LaborTable';
import { MaterialsTable } from './MaterialsTable';
import type { DailyFieldReportForm, LaborRow, MaterialRow, PhotoRow, ReportStatus } from './types';

const emptyForm = (): DailyFieldReportForm => ({
  project_id: '', report_date: new Date().toISOString().slice(0, 10), job_number: '', project_name_snapshot: '', customer_gc_snapshot: '', lead_foreman_name: '',
  scope_of_work: '', daily_notes: '', status: 'draft', pm_review_required: true, client_not_available: false,
  guardian_signature_url: '', guardian_signed_at: '', customer_signature_url: '', customer_signed_at: '', pm_recipient_email: '', client_recipient_email: '', accounting_recipient_email: '',
});

export function DailyFieldLaborReportEditor({ reportId }: { reportId?: string }) {
  const [form, setForm] = useState<DailyFieldReportForm>(emptyForm());
  const [laborRows, setLaborRows] = useState<LaborRow[]>([{ worker_name: '', role_class: '', st_hours: 0, ot_hours: 0, notes: '', sort_order: 0 }]);
  const [materialsRows, setMaterialsRows] = useState<MaterialRow[]>([{ qty: 0, unit: '', description: '', notes: '', sort_order: 0 }]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; title: string; address: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');

  const stTotal = laborRows.reduce((sum, row) => sum + (Number(row.st_hours) || 0), 0);
  const otTotal = laborRows.reduce((sum, row) => sum + (Number(row.ot_hours) || 0), 0);
  const totalHours = stTotal + otTotal;

  const sectionCompletion = [
    Boolean(form.project_name_snapshot || form.project_id),
    Boolean(form.scope_of_work.trim()),
    laborRows.some((row) => row.worker_name.trim()),
    materialsRows.some((row) => row.description.trim()),
    Boolean(form.daily_notes.trim()),
    true,
    Boolean(form.guardian_signature_url),
  ].filter(Boolean).length;

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: projectsData } = await supabase.from('projects').select('id,title,address').order('created_at', { ascending: false });
      setProjects((projectsData as Array<{ id: string; title: string; address: string }>) || []);

      if (!reportId) return;
      const { data: report } = await supabase.from('forms_daily_field_reports').select('*').eq('id', reportId).single();
      if (report) setForm((prev) => ({ ...prev, ...(report as DailyFieldReportForm) }));
      const { data: labor } = await supabase.from('forms_daily_field_report_labor').select('*').eq('report_id', reportId).order('sort_order', { ascending: true });
      if (labor && labor.length > 0) setLaborRows(labor as LaborRow[]);
      const { data: materials } = await supabase.from('forms_daily_field_report_materials').select('*').eq('report_id', reportId).order('sort_order', { ascending: true });
      if (materials && materials.length > 0) setMaterialsRows(materials as MaterialRow[]);
      const { data: photosData } = await supabase.from('forms_daily_field_report_photos').select('*').eq('report_id', reportId).order('created_at', { ascending: false });
      setPhotos((photosData as PhotoRow[]) || []);
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
    if (!form.report_date) {
      window.alert('Report date is required.');
      return;
    }
    if (nextStatus === 'submitted' && !form.scope_of_work.trim()) {
      window.alert('Scope of work is required before submit.');
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
        window.alert(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from('forms_daily_field_reports').insert([payload]).select('id').single();
      if (error || !data) {
        setSaving(false);
        window.alert(error?.message || 'Unable to create report');
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
    if (!silent) window.alert(nextStatus === 'submitted' ? 'Report submitted.' : 'Draft saved.');
  }, [form, laborRows, materialsRows, reportId]);

  useEffect(() => {
    if (!reportId) return;
    const timer = setTimeout(() => {
      void save('draft', true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [form, laborRows, materialsRows, reportId, save]);

  const uploadPhoto = async (file: File | null, caption: string) => {
    if (!file) return;
    const idForPath = reportId || 'new';
    const path = `daily-field-labor/${idForPath}/photos/${Date.now()}-${file.name}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('project-media').upload(path, file, { upsert: true });
    if (error) {
      window.alert(error.message);
      return;
    }
    if (!reportId) {
      window.alert('Save draft once before attaching persisted photos.');
      return;
    }
    const { data: urlData } = supabase.storage.from('project-media').getPublicUrl(path);
    await supabase.from('forms_daily_field_report_photos').insert([{ report_id: reportId, storage_path: urlData.publicUrl, caption }]);
    setPhotos((prev) => [{ storage_path: urlData.publicUrl, caption }, ...prev]);
  };

  const uploadSignature = async (file: File | null, kind: 'guardian' | 'customer') => {
    if (!file) return;
    const idForPath = reportId || 'new';
    const path = `daily-field-labor/${idForPath}/signatures/${kind}-${Date.now()}-${file.name}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('project-media').upload(path, file, { upsert: true });
    if (error) {
      window.alert(error.message);
      return;
    }
    const { data } = supabase.storage.from('project-media').getPublicUrl(path);
    if (kind === 'guardian') {
      setForm((prev) => ({ ...prev, guardian_signature_url: data.publicUrl, guardian_signed_at: new Date().toISOString() }));
    } else {
      setForm((prev) => ({ ...prev, customer_signature_url: data.publicUrl, customer_signed_at: new Date().toISOString() }));
    }
  };

  const cardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: 16, marginBottom: 14 };
  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 16, width: '100%' };

  return (
    <div style={{ padding: 20, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ position: 'sticky', top: 8, zIndex: 20, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <strong>Daily Field Labor Report</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>Progress: {sectionCompletion}/7 sections • ST {stTotal.toFixed(2)} • OT {otTotal.toFixed(2)} • Total {totalHours.toFixed(2)} {lastSavedAt && `• Saved ${lastSavedAt}`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => void save('draft')} disabled={saving} style={{ borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '8px 12px' }}>Save Draft</button>
          <button onClick={() => void save('submitted')} disabled={saving} style={{ borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', padding: '8px 12px', fontWeight: 700 }}>Submit</button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Project Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <select style={inputStyle} value={form.project_id} onChange={(e) => onProjectChange(e.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </select>
          <input style={inputStyle} value={form.project_name_snapshot} onChange={(e) => setForm((prev) => ({ ...prev, project_name_snapshot: e.target.value }))} placeholder="Project name" />
          <input style={inputStyle} value={form.job_number} onChange={(e) => setForm((prev) => ({ ...prev, job_number: e.target.value }))} placeholder="Job number" />
          <input style={inputStyle} value={form.lead_foreman_name} onChange={(e) => setForm((prev) => ({ ...prev, lead_foreman_name: e.target.value }))} placeholder="Lead / foreman" />
          <input type="date" style={inputStyle} value={form.report_date} onChange={(e) => setForm((prev) => ({ ...prev, report_date: e.target.value }))} />
          <input style={inputStyle} value={form.customer_gc_snapshot} onChange={(e) => setForm((prev) => ({ ...prev, customer_gc_snapshot: e.target.value }))} placeholder="Customer / GC" />
        </div>
      </div>

      <div style={cardStyle}><h3>Work Performed / Scope</h3><textarea style={{ ...inputStyle, minHeight: 90 }} value={form.scope_of_work} onChange={(e) => setForm((prev) => ({ ...prev, scope_of_work: e.target.value }))} /></div>

      <div style={cardStyle}><h3>Labor</h3><LaborTable rows={laborRows} onAdd={() => setLaborRows((prev) => [...prev, { worker_name: '', role_class: '', st_hours: 0, ot_hours: 0, notes: '', sort_order: prev.length }])} onRemove={(idx) => setLaborRows((prev) => prev.filter((_, i) => i !== idx))} onChange={(idx, patch) => setLaborRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))} /></div>

      <div style={cardStyle}><h3>Materials</h3><MaterialsTable rows={materialsRows} onAdd={() => setMaterialsRows((prev) => [...prev, { qty: 0, unit: '', description: '', notes: '', sort_order: prev.length }])} onRemove={(idx) => setMaterialsRows((prev) => prev.filter((_, i) => i !== idx))} onChange={(idx, patch) => setMaterialsRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))} /></div>

      <div style={cardStyle}><h3>Daily Notes / Issues / Conditions</h3><textarea style={{ ...inputStyle, minHeight: 90 }} value={form.daily_notes} onChange={(e) => setForm((prev) => ({ ...prev, daily_notes: e.target.value }))} /></div>

      <div style={cardStyle}>
        <h3>Photos</h3>
        <PhotoUploader onUpload={uploadPhoto} />
        <p style={{ fontSize: 13, color: '#64748b' }}>Photo count: {photos.length}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {photos.map((photo, idx) => (
            <PhotoThumb key={`${photo.storage_path}-${idx}`} path={photo.storage_path} caption={photo.caption} />
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Signatures</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label>Guardian Lead / Foreman Signature</label>
            <input type="file" accept="image/*" onChange={(e) => void uploadSignature(e.target.files?.[0] || null, 'guardian')} />
            {form.guardian_signature_url && <img src={form.guardian_signature_url} alt="Guardian signature" style={{ marginTop: 6, width: 220, border: '1px solid #cbd5e1', borderRadius: 8 }} />}
          </div>
          <div>
            <label><input type="checkbox" checked={form.client_not_available} onChange={(e) => setForm((prev) => ({ ...prev, client_not_available: e.target.checked }))} /> Client / GC not available on site</label>
            {!form.client_not_available && (
              <>
                <input type="file" accept="image/*" onChange={(e) => void uploadSignature(e.target.files?.[0] || null, 'customer')} />
                {form.customer_signature_url && <img src={form.customer_signature_url} alt="Customer signature" style={{ marginTop: 6, width: 220, border: '1px solid #cbd5e1', borderRadius: 8 }} />}
              </>
            )}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Review & Submit</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Project: {form.project_name_snapshot || '—'}</li>
          <li>Scope: {form.scope_of_work ? 'Provided' : 'Missing'}</li>
          <li>Labor total: ST {stTotal.toFixed(2)} / OT {otTotal.toFixed(2)} / Total {totalHours.toFixed(2)}</li>
          <li>Materials rows: {materialsRows.length}</li>
          <li>Notes: {form.daily_notes ? 'Provided' : 'Missing'}</li>
          <li>Photos: {photos.length}</li>
          <li>Guardian signature: {form.guardian_signature_url ? 'Captured' : 'Missing'}</li>
          <li>Client state: {form.client_not_available ? 'Not available on site' : form.customer_signature_url ? 'Signed' : 'Not signed yet'}</li>
        </ul>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => void save('draft')} style={{ borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '8px 12px' }}>Save Draft</button>
          <button onClick={() => void save('submitted')} style={{ borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', padding: '8px 12px', fontWeight: 700 }}>Submit Report</button>
          <Link href="/forms/daily-field-labor" style={{ borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', padding: '8px 12px', textDecoration: 'none', color: '#0f172a' }}>Back to Reports</Link>
        </div>
      </div>
    </div>
  );
}

function PhotoUploader({ onUpload }: { onUpload: (file: File | null, caption: string) => Promise<void> }) {
  const [caption, setCaption] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <input type="file" accept="image/*" onChange={(e) => void onUpload(e.target.files?.[0] || null, caption)} />
      <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }} />
    </div>
  );
}

function PhotoThumb({ path, caption }: { path: string; caption: string }) {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 6, width: 130 }}>
      <img src={path} alt={caption || 'Report photo'} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{caption || 'No caption'}</div>
    </div>
  );
}
