import { Dispatch, SetStateAction } from 'react';

type DraftProject = {
  title: string;
  address: string;
  description: string;
  inspectors: string;
  inspectionDate: string;
  status: string;
};

export function NewProjectModal({
  open,
  draft,
  onClose,
  setDraft,
  onSave,
}: {
  open: boolean;
  draft: DraftProject;
  onClose: () => void;
  setDraft: Dispatch<SetStateAction<DraftProject>>;
  onSave: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className="rounded-md border p-2" placeholder="Project name" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} />
          <input className="rounded-md border p-2" placeholder="Inspector" value={draft.inspectors} onChange={(e) => setDraft((p) => ({ ...p, inspectors: e.target.value }))} />
          <input className="rounded-md border p-2 sm:col-span-2" placeholder="Address" value={draft.address} onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))} />
          <textarea className="rounded-md border p-2 sm:col-span-2" rows={3} placeholder="Description" value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
          <input type="date" className="rounded-md border p-2" value={draft.inspectionDate} onChange={(e) => setDraft((p) => ({ ...p, inspectionDate: e.target.value }))} />
          <select className="rounded-md border p-2" value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}>
            <option>Draft</option>
            <option>Inspection In Progress</option>
            <option>Ready for Review</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Cancel</button>
          <button onClick={onSave} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Save Project</button>
        </div>
      </div>
    </div>
  );
}
