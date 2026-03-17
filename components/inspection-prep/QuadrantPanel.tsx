import Link from 'next/link';
import type { AreaPhoto, ProjectArea, ZoneState } from './types';

export function QuadrantPanel({
  quadrants,
  selected,
  zoneState,
  photos,
  onSelect,
  onPrev,
  onNext,
  onStatusChange,
  onNotesChange,
  onUpload,
  uploading,
  projectId,
}: {
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
}) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quadrant Details</h2>

      {selected ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs text-slate-500">Quadrant</p>
            <p className="font-semibold text-slate-900">{selected.name}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onPrev} className="rounded-md border px-3 py-1.5 text-xs">Previous</button>
            <button onClick={onNext} className="rounded-md border px-3 py-1.5 text-xs">Next</button>
          </div>

          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select className="mt-1 w-full rounded-md border p-2 text-sm" value={zoneState.status} onChange={(e) => onStatusChange(e.target.value as ZoneState['status'])}>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Complete</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500">Notes</label>
            <textarea className="mt-1 w-full rounded-md border p-2 text-sm" rows={4} value={zoneState.notes} onChange={(e) => onNotesChange(e.target.value)} />
          </div>

          <div>
            <label className="text-xs text-slate-500">Upload photos</label>
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
            {uploading && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
          </div>

          <div>
            <p className="mb-1 text-xs text-slate-500">Photo gallery</p>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => (
                <img key={photo.id} src={photo.photo_url} alt="Quadrant" className="h-20 w-full rounded-md object-cover" />
              ))}
              {photos.length === 0 && <p className="col-span-2 text-xs text-slate-500">No photos yet.</p>}
            </div>
          </div>

          <Link
            href={`/checklist?projectId=${projectId}&quadrantId=${selected.id}`}
            className="block rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white"
          >
            Start Checklist
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Select a quadrant on the image to begin inspection details.</p>
      )}

      <div className="mt-4 border-t pt-3">
        <p className="mb-2 text-xs text-slate-500">All quadrants</p>
        <div className="flex flex-wrap gap-2">
          {quadrants.map((quadrant) => (
            <button key={quadrant.id} onClick={() => onSelect(quadrant.id)} className="rounded-full border px-2.5 py-1 text-xs">
              {quadrant.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
