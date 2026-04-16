import type { MaterialRow } from './types';

const fieldStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  minHeight: 42,
  padding: '10px 12px',
  fontSize: 15,
  width: '100%',
};

export function MaterialsTable({ rows, onChange, onAdd, onRemove }: {
  rows: MaterialRow[];
  onChange: (index: number, patch: Partial<MaterialRow>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map((row, index) => (
        <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: 12 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Qty</span>
              <input type="number" min={0} step="1" value={row.qty} onChange={(e) => onChange(index, { qty: Number.parseInt(e.target.value, 10) || 0 })} style={fieldStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Unit</span>
              <input value={row.unit} onChange={(e) => onChange(index, { unit: e.target.value })} style={fieldStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6, gridColumn: 'span 2' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Description</span>
              <input value={row.description} onChange={(e) => onChange(index, { description: e.target.value })} style={fieldStyle} />
            </label>
            <label style={{ display: 'grid', gap: 6, gridColumn: 'span 2' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Notes</span>
              <input value={row.notes} onChange={(e) => onChange(index, { notes: e.target.value })} style={fieldStyle} />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={() => onRemove(index)} style={{ borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', padding: '8px 12px', fontWeight: 600 }}>
              Remove row
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={onAdd} style={{ justifySelf: 'start', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', padding: '10px 14px', fontWeight: 600 }}>
        + Add material row
      </button>
    </div>
  );
}
