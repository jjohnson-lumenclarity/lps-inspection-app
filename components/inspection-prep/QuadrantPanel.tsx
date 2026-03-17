import Link from 'next/link';
import type { AreaPhoto, ProjectArea, ZoneState } from './types';

export function QuadrantPanel({ quadrants, selected, zoneState, photos, onSelect, onPrev, onNext, onStatusChange, onNotesChange, onUpload, uploading, projectId, onStartRecording, onStopRecording, recording }: {
  quadrants: ProjectArea[];
  selected: ProjectArea | null;
  zoneState: ZoneState;
  photos: AreaPhoto[];
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onStatusChange: (value: ZoneState['status']) => void;
  onNotesChange: (value: string) => void;
  onUpload: (file: File | null) => void;
  uploading: boolean;
  projectId: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recording: boolean;
}) {
  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, background: '#fff' };
  return (
    <aside style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 16, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
      <h2 style={{ margin: 0, fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b' }}>Quadrant Details</h2>
      {selected ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          <div><div style={{ fontSize: 12, color: '#64748b' }}>Quadrant</div><div style={{ fontWeight: 700, color: '#0f172a' }}>{selected.name}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onPrev} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>Previous</button>
            <button onClick={onNext} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>Next</button>
          </div>
          <div><label style={{ fontSize: 12, color: '#64748b' }}>Status</label><select style={inputStyle} value={zoneState.status} onChange={(e) => onStatusChange(e.target.value as ZoneState['status'])}><option>Not Started</option><option>In Progress</option><option>Complete</option></select></div>
          <div><label style={{ fontSize: 12, color: '#64748b' }}>Notes</label><textarea style={inputStyle} rows={4} value={zoneState.notes} onChange={(e) => onNotesChange(e.target.value)} /></div>

          <div>
            <label style={{ fontSize: 12, color: '#64748b' }}>Voice note</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onStartRecording} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', background: recording ? '#fee2e2' : '#fff' }}>{recording ? 'Recording…' : 'Start Recording'}</button>
              <button onClick={onStopRecording} style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>Stop</button>
            </div>
            {zoneState.voiceNoteUrl && <audio controls style={{ marginTop: 8, width: '100%' }} src={zoneState.voiceNoteUrl} />}
          </div>

          <div><label style={{ fontSize: 12, color: '#64748b' }}>Upload photos</label><input type="file" accept="image/*" style={{ ...inputStyle, padding: 8 }} onChange={(e) => onUpload(e.target.files?.[0] || null)} />{uploading && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Uploading...</p>}</div>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>Photo gallery</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {photos.map((photo) => <img key={photo.id} src={photo.photo_url} alt="Quadrant" style={{ width: '100%', height: 100, borderRadius: 8, objectFit: 'cover' }} />)}
              {photos.length === 0 && <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 12, color: '#64748b' }}>No photos yet.</p>}
            </div>
          </div>
          <Link href={`/checklist?projectId=${projectId}&quadrantId=${selected.id}`} style={{ display: 'block', borderRadius: 8, background: '#0f172a', color: '#fff', textDecoration: 'none', textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>Start Checklist</Link>
        </div>
      ) : <p style={{ marginTop: 12, color: '#64748b' }}>Select a quadrant on the image to begin inspection details.</p>}
      <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>All quadrants</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{quadrants.map((quadrant) => <button key={quadrant.id} onClick={() => onSelect(quadrant.id)} style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 10px', background: '#fff' }}>{quadrant.name}</button>)}</div>
      </div>
    </aside>
  );
}
