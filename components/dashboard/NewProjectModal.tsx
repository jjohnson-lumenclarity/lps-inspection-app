import { Dispatch, SetStateAction } from 'react';
import type { ProjectMeta } from './types';

type DraftProject = {
  title: string;
  address: string;
  description: string;
  status: string;
} & ProjectMeta;

export function NewProjectModal({ open, draft, onClose, setDraft, onSave }: {
  open: boolean;
  draft: DraftProject;
  onClose: () => void;
  setDraft: Dispatch<SetStateAction<DraftProject>>;
  onSave: () => void;
}) {
  if (!open) return null;

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, fontSize: 16, width: '100%' };
  const labelStyle: React.CSSProperties = { fontSize: 14, color: '#334155', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 1220, borderRadius: 16, background: '#fff', padding: 20, boxShadow: '0 16px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 44, color: '#0f172a' }}>Add New Project</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <input style={inputStyle} placeholder="Client/ Facility Name (required)" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} />
          <input style={inputStyle} placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
          <input style={inputStyle} placeholder="Street Address (required)" value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} />
          <input style={inputStyle} placeholder="Owner/ Contact" value={draft.contactName} onChange={(e) => setDraft((p) => ({ ...p, contactName: e.target.value }))} />

          <input style={inputStyle} placeholder="Phone Number" value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} />
          <input style={inputStyle} placeholder="Email Address" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
          <input style={inputStyle} placeholder="Contractor Project/ Job #" value={draft.contractorJobNumber} onChange={(e) => setDraft((p) => ({ ...p, contractorJobNumber: e.target.value }))} />
          <input style={inputStyle} placeholder="Inspector(s)" value={draft.inspectors} onChange={(e) => setDraft((p) => ({ ...p, inspectors: e.target.value }))} />

          <div><label style={labelStyle}>Inspection Date</label><input type="date" style={inputStyle} value={draft.inspectionDate} onChange={(e) => setDraft((p) => ({ ...p, inspectionDate: e.target.value }))} /></div>
          <div><label style={labelStyle}>Report Date</label><input type="date" style={inputStyle} value={draft.reportDate} onChange={(e) => setDraft((p) => ({ ...p, reportDate: e.target.value }))} /></div>
          <div><label style={labelStyle}>Due Date</label><input type="date" style={inputStyle} value={draft.dueDate} onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))} /></div>
          <div><label style={labelStyle}>Weather</label><select style={inputStyle} value={draft.weather} onChange={(e) => setDraft((p) => ({ ...p, weather: e.target.value }))}><option>Clear</option><option>Cloudy</option><option>Rain</option><option>Snow</option></select></div>

          <input style={inputStyle} placeholder="Temperature (°F or °C)" value={draft.temperature} onChange={(e) => setDraft((p) => ({ ...p, temperature: e.target.value }))} />
          <div><label style={labelStyle}>Certification Type</label><select style={inputStyle} value={draft.certificationType} onChange={(e) => setDraft((p) => ({ ...p, certificationType: e.target.value }))}><option>Recert</option><option>Initial</option></select></div>
          <div><label style={labelStyle}>Project Status</label><select style={inputStyle} value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}><option>Draft</option><option>Inspection In Progress</option><option>Ready for Review</option><option>Completed</option></select></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 14 }}>
          <button onClick={onSave} style={{ border: 'none', borderRadius: 10, padding: '12px 22px', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: 28 }}>Add Project</button>
          <button onClick={onClose} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
