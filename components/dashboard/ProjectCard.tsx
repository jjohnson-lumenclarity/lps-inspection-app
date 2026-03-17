import Link from 'next/link';
import type { Project, ProjectMeta } from './types';

const badgeStyles: Record<string, React.CSSProperties> = {
  Draft: { background: '#e2e8f0', color: '#334155' },
  'Inspection In Progress': { background: '#dbeafe', color: '#1d4ed8' },
  'Ready for Review': { background: '#fef3c7', color: '#b45309' },
  Completed: { background: '#d1fae5', color: '#047857' },
};

const actionStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: '8px 10px',
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 700,
};

export function ProjectCard({ project, meta }: { project: Project; meta: ProjectMeta }) {
  return (
    <article style={{ border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: 16, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>{project.title || 'Untitled Project'}</h3>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#475569' }}>{project.address || 'No address'}</p>
        </div>
        <span style={{ borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', ...(badgeStyles[project.status] || badgeStyles.Draft) }}>
          {project.status || 'Draft'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
        <div>
          <div style={{ color: '#64748b' }}>Inspector</div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{meta.inspectors || 'Unassigned'}</div>
        </div>
        <div>
          <div style={{ color: '#64748b' }}>Inspection date</div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{meta.inspectionDate || 'Not scheduled'}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Link href={`/inspections?projectId=${project.id}`} style={{ ...actionStyle, background: '#0f172a', color: '#fff' }}>Continue Inspection</Link>
        <Link href={`/checklist?projectId=${project.id}`} style={{ ...actionStyle, border: '1px solid #cbd5e1', color: '#334155' }}>Open Checklist</Link>
        <Link href={`/quote-summary?projectId=${project.id}`} style={{ ...actionStyle, border: '1px solid #cbd5e1', color: '#334155' }}>View Summary</Link>
      </div>
    </article>
  );
}
