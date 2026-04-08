import type { MaterialRow } from './types';

export function MaterialsTable({ rows, onChange, onAdd, onRemove }: {
  rows: MaterialRow[];
  onChange: (index: number, patch: Partial<MaterialRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Qty', 'Unit', 'Description', 'Notes', ''].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: 8, fontSize: 13, color: '#64748b' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td style={{ padding: 6 }}><input type="number" min={0} step="0.01" value={row.qty} onChange={(e) => onChange(index, { qty: Number(e.target.value) || 0 })} style={{ width: 90 }} /></td>
              <td style={{ padding: 6 }}><input value={row.unit} onChange={(e) => onChange(index, { unit: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><input value={row.description} onChange={(e) => onChange(index, { description: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><input value={row.notes} onChange={(e) => onChange(index, { notes: e.target.value })} style={{ width: '100%' }} /></td>
              <td style={{ padding: 6 }}><button onClick={() => onRemove(index)} style={{ color: '#dc2626' }}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onAdd} style={{ marginTop: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px' }}>+ Add Material Row</button>
    </div>
  );
}
