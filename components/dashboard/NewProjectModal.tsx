import { Dispatch, SetStateAction } from 'react';

type DraftProject = {
  title: string;
  address: string;
  description: string;
  inspectors: string;
  inspectionDate: string;
  status: string;
};

export function NewProjectModal({ open, draft, onClose, setDraft, onSave }: {
  open: boolean;
  draft: DraftProject;
  onClose: () => void;
  setDraft: Dispatch<SetStateAction<DraftProject>>;
  onSave: () => void;
}) {
  if (!open) return null;

  const inputStyle: React.CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, width: '100%' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 760, borderRadius: 16, background: '#fff', padding: 20, boxShadow: '0 16px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>Create New Project</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input style={inputStyle} placeholder="Project name" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} />
          <input style={inputStyle} placeholder="Inspector" value={draft.inspectors} onChange={(e) => setDraft((p) => ({ ...p, inspectors: e.target.value }))} />
          <input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Address" value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} />
          <textarea style={{ ...inputStyle, gridColumn: '1 / -1' }} rows={3} placeholder="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
          <input type="date" style={inputStyle} value={draft.inspectionDate} onChange={(e) => setDraft((p) => ({ ...p, inspectionDate: e.target.value }))} />
          <select style={inputStyle} value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
            <option>Draft</option><option>Inspection In Progress</option><option>Ready for Review</option><option>Completed</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff' }}>Cancel</button>
          <button onClick={onSave} style={{ border: 'none', borderRadius: 8, padding: '8px 12px', background: '#0f172a', color: '#fff', fontWeight: 700 }}>Save Project</button>
        </div>
      </div>
    </div>
  );
}
