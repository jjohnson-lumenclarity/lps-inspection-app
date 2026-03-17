import Link from 'next/link';
import type { Project, ProjectMeta } from './types';

const badgeClasses: Record<string, string> = {
  Draft: 'bg-slate-200 text-slate-700',
  'Inspection In Progress': 'bg-blue-100 text-blue-700',
  'Ready for Review': 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

export function ProjectCard({ project, meta }: { project: Project; meta: ProjectMeta }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{project.title || 'Untitled Project'}</h3>
          <p className="text-sm text-slate-600">{project.address || 'No address'}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[project.status] || badgeClasses.Draft}`}>
          {project.status || 'Draft'}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-slate-500">Inspector</dt>
          <dd className="font-medium text-slate-800">{meta.inspectors || 'Unassigned'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Inspection date</dt>
          <dd className="font-medium text-slate-800">{meta.inspectionDate || 'Not scheduled'}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link href={`/inspections?projectId=${project.id}`} className="rounded-md bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white">
          Continue Inspection
        </Link>
        <Link href={`/checklist?projectId=${project.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700">
          Open Checklist
        </Link>
        <Link href={`/quote-summary?projectId=${project.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700">
          View Summary
        </Link>
      </div>
    </article>
  );
}
