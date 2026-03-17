import type { ProjectArea } from './types';

export function BuildingCanvas({ imageUrl, quadrants, selectedQuadrantId, onCanvasClick, onSelectQuadrant }: {
  imageUrl?: string | null;
  quadrants: ProjectArea[];
  selectedQuadrantId: string | null;
  onCanvasClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSelectQuadrant: (quadrant: ProjectArea) => void;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 16, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b' }}>Building Workspace</h2>
      <div
        onClick={onCanvasClick}
        style={{
          position: 'relative',
          minHeight: 640,
          cursor: 'crosshair',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          backgroundColor: '#f1f5f9',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!imageUrl && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#64748b' }}>No building image available.</div>}
        {quadrants.map((quadrant, index) => (
          <button
            key={quadrant.id || `${quadrant.name}-${index}`}
            type="button"
            onClick={(event) => { event.stopPropagation(); onSelectQuadrant(quadrant); }}
            style={{
              position: 'absolute',
              left: `${quadrant.x_percent}%`,
              top: `${quadrant.y_percent}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: 999,
              border: selectedQuadrantId === quadrant.id ? '2px solid #0f172a' : '2px solid #fff',
              background: selectedQuadrantId === quadrant.id ? '#fde68a' : '#0f172a',
              color: selectedQuadrantId === quadrant.id ? '#0f172a' : '#fff',
              padding: '6px 10px',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {quadrant.name}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: '#64748b' }}>Click anywhere on the image to create a quadrant.</p>
    </div>
  );
}
