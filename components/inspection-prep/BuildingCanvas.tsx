import type { ProjectArea } from './types';

const pinColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ec4899'];

export function BuildingCanvas({ imageUrl, quadrants, selectedQuadrantId, onCanvasClick, onSelectQuadrant, drawingEnabled, lines, onDrawStart, onDrawMove, onDrawEnd }: {
  imageUrl?: string | null;
  quadrants: ProjectArea[];
  selectedQuadrantId: string | null;
  onCanvasClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSelectQuadrant: (quadrant: ProjectArea) => void;
  drawingEnabled: boolean;
  lines: Array<Array<{ x: number; y: number }>>;
  onDrawStart: (event: React.PointerEvent<SVGSVGElement>) => void;
  onDrawMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onDrawEnd: () => void;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, background: '#fff', padding: 16, boxShadow: '0 1px 2px rgba(15,23,42,.06)' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b' }}>Building Workspace</h2>
      <div
        onClick={onCanvasClick}
        style={{
          position: 'relative',
          minHeight: 'clamp(360px, 60vh, 640px)',
          cursor: drawingEnabled ? 'crosshair' : 'pointer',
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

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: drawingEnabled ? 'auto' : 'none' }}
          onPointerDown={drawingEnabled ? onDrawStart : undefined}
          onPointerMove={drawingEnabled ? onDrawMove : undefined}
          onPointerUp={drawingEnabled ? onDrawEnd : undefined}
          onPointerLeave={drawingEnabled ? onDrawEnd : undefined}
        >
          {lines.map((line, i) => line.length > 1 ? <polyline key={i} points={line.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#22c55e" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" /> : null)}
        </svg>

        {quadrants.map((quadrant, index) => {
          const pinColor = pinColors[index % pinColors.length];
          return (
            <button
              key={quadrant.id || `${quadrant.name}-${index}`}
              type="button"
              onClick={(event) => { event.stopPropagation(); onSelectQuadrant(quadrant); }}
              style={{
                position: 'absolute', left: `${quadrant.x_percent}%`, top: `${quadrant.y_percent}%`, transform: 'translate(-50%, -50%)', borderRadius: 999,
                border: selectedQuadrantId === quadrant.id ? '3px solid #ffffff' : '2px solid #fff',
                background: selectedQuadrantId === quadrant.id ? '#facc15' : pinColor,
                color: '#fff', padding: '7px 11px', fontWeight: 800, fontSize: 12, boxShadow: '0 2px 10px rgba(2,6,23,.28)',
              }}
            >{quadrant.name}</button>
          );
        })}
      </div>
      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: '#64748b' }}>Click image to create quadrants. Enable drawing in Quadrant Details to annotate.</p>
    </div>
  );
}
