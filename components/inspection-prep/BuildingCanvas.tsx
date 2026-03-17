import type { ProjectArea } from './types';

export function BuildingCanvas({
  imageUrl,
  quadrants,
  selectedQuadrantId,
  onCanvasClick,
  onSelectQuadrant,
}: {
  imageUrl?: string | null;
  quadrants: ProjectArea[];
  selectedQuadrantId: string | null;
  onCanvasClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onSelectQuadrant: (quadrant: ProjectArea) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Building Workspace</h2>
      <div
        onClick={onCanvasClick}
        className="relative min-h-[560px] cursor-crosshair overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!imageUrl && (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">
            No building image available. Upload a project image from project details.
          </div>
        )}

        {quadrants.map((quadrant, index) => (
          <button
            key={quadrant.id || `${quadrant.name}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectQuadrant(quadrant);
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2 py-1 text-xs font-semibold ${
              selectedQuadrantId === quadrant.id ? 'border-slate-900 bg-amber-200 text-slate-900' : 'border-white bg-slate-900 text-white'
            }`}
            style={{ left: `${quadrant.x_percent}%`, top: `${quadrant.y_percent}%` }}
          >
            {quadrant.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Click anywhere on the image to create a quadrant.</p>
    </div>
  );
}
