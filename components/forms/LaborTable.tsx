import type { LaborRow } from './types';

export function LaborTable({ rows, onChange, onAdd, onRemove }: {
  rows: LaborRow[];
  onChange: (index: number, patch: Partial<LaborRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Name', 'Role/Class', 'ST', 'OT', 'Notes', ''].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: 8, fontSize: 13, color: '#64748b' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={{ padding: 6 }}><input value={row.worker_name} onChange={(e) => onChange(index, { worker_name: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><input value={row.role_class} onChange={(e) => onChange(index, { role_class: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><input type="number" min={0} step="0.25" value={row.st_hours} onChange={(e) => onChange(index, { st_hours: Number(e.target.value) || 0 })} style={{ width: 90 }} /></td>
              <td style={{ padding: 6 }}><input type="number" min={0} step="0.25" value={row.ot_hours} onChange={(e) => onChange(index, { ot_hours: Number(e.target.value) || 0 })} style={{ width: 90 }} /></td>
              <td style={{ padding: 6 }}><input value={row.notes} onChange={(e) => onChange(index, { notes: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><button onClick={() => onRemove(index)} style={{ color: '#dc2626' }}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onAdd} style={{ marginTop: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px' }}>+ Add Labor Row</button>
    </div>
  );
}
