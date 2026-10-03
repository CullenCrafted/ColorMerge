import { rgbString, type RemixState, type RemixObject } from "@shared/remix";
import "./arcade.css";

export interface ArcadeSceneProps {
  state: RemixState;
  onSelect: (id: string) => void;
}

function polygon(sides: number, radius: number) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides;
    return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
  }).join(" ");
}

function Shape({ shape, radius, fill }: { shape: RemixObject["shape"]; radius: number; fill: string }) {
  const shared = { fill, stroke: "rgba(0,0,0,.55)", strokeWidth: 0.55 };
  if (shape === "circle") return <circle r={radius} {...shared} />;
  if (shape === "square") return <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={0.7} {...shared} />;
  if (shape === "trapezoid") return <polygon points={`${-radius * .6},${-radius} ${radius * .6},${-radius} ${radius},${radius} ${-radius},${radius}`} {...shared} />;
  return <polygon points={polygon(shape === "triangle" ? 3 : shape === "octagon" ? 8 : 5, radius * 1.15)} {...shared} />;
}

/** Decorative scenery never alters the target or the exact pigment swatches. */
function TowerScenery({ height }: { height: number }) {
  const space = height >= 12;
  return <g aria-hidden="true" pointerEvents="none" opacity={0.65}>
    {space ? Array.from({ length: 12 }, (_, i) => (
      <path key={i} d="M -1 0 H 1 M 0 -1 V 1"
        transform={`translate(${i % 2 ? 82 + (i % 3) * 4 : 10 + (i % 3) * 4} ${8 + ((i * 17 + height * 2) % 78)})`}
        stroke="white" strokeWidth={0.55} />
    )) : [0, 1, 2, 3].map(i => (
      <g key={i} transform={`translate(${i % 2 ? 84 : 15} ${10 + ((i * 23 + height * 5) % 75)})`}>
        <ellipse rx={8} ry={2.4} fill="white" />
        <circle cx={-2} cy={-1.5} r={3} fill="white" />
        <circle cx={2} cy={-1} r={2.4} fill="white" />
      </g>
    ))}
  </g>;
}

export function ArcadeScene({ state, onSelect }: ArcadeSceneProps) {
  const mode = state.spec.style;
  const tower = mode === "tower";
  const swarm = mode === "swarm";
  const target = rgbString(state.target);
  // Queued, solved, and missed objects are never visible or selectable.
  const active = state.objects.filter(object => object.status === "active");
  // Selected object is painted last so its hit target follows visible stacking order.
  const ordered = [...active].sort((a, b) =>
    Number(a.id === state.selectedId) - Number(b.id === state.selectedId));
  const blocks = Math.min(state.solved + 1, 7);
  const firstBlock = Math.max(0, state.solved + 1 - blocks);
  const title = tower ? "Color Tower" : swarm ? "Bouncing shapes" : "Falling shapes";

  return (
    <div className="remix-arcade" data-mode={mode}>
      <div className="remix-arcade-caption">
        <span>{tower ? `${state.solved} sections built` : swarm ? "Tap a shape, then add colors" : "Mix the lowest shape before the floor"}</span>
        {tower && <span className="remix-arcade-target">
          <span style={{ backgroundColor: target }} aria-hidden="true" />Tower target
        </span>}
      </div>
      <svg className="remix-arcade-field" viewBox="0 0 100 100"
        role="group" aria-label={title}>
        <title>{title}</title>
        <desc>{tower
          ? "Mix the incoming cube to match the tower target. Completed sections form the tower."
          : swarm ? "Select a moving shape to mix it. The double outline marks your selected shape."
          : "The double outline marks the lowest shape. Match it before it reaches the floor."}</desc>
        {tower && <>
          <TowerScenery height={state.solved} />
          <g aria-hidden="true" pointerEvents="none">
            {Array.from({ length: blocks }, (_, i) => (
              <g key={firstBlock + i} className="remix-tower-section"
                transform={`translate(0 ${94 - i * 7})`}>
                <path d="M 36 0 L 40 -3 L 64 -3 L 60 0 Z" fill={target} stroke="rgba(0,0,0,.45)" strokeWidth={.5} />
                <rect x={36} y={0} width={24} height={7} fill={target} stroke="rgba(0,0,0,.55)" strokeWidth={.6} />
                <path d="M 60 0 L 64 -3 L 64 4 L 60 7 Z" fill={target} stroke="rgba(0,0,0,.55)" strokeWidth={.6} />
              </g>
            ))}
            <path d="M 50 35 V 42 M 47 39 L 50 42 L 53 39" fill="none" stroke="rgba(0,0,0,.6)" strokeWidth={.8} />
          </g>
        </>}
        {!tower && !swarm && <g aria-hidden="true" pointerEvents="none">
          <line x1={3} x2={97} y1={92} y2={92} stroke="white" strokeWidth={1.2} />
          <line x1={3} x2={97} y1={93} y2={93} stroke="rgba(0,0,0,.65)" strokeWidth={.6} />
          <text x={50} y={98} textAnchor="middle" className="remix-arcade-floor-label">FLOOR</text>
        </g>}
        {ordered.map((object) => {
          const selected = object.id === state.selectedId;
          const selectable = swarm || selected;
          const radius = tower ? 8 : Math.max(4, Math.min(6, object.width * 60));
          const ringRadius = tower || object.shape === "square" ? radius * 1.45 + 1 : radius + 2;
          const index = state.objects.findIndex(item => item.id === object.id) + 1;
          const label = `${tower ? "Cube section" : object.shape} ${index}${selected ? ", selected" : ""}`;
          return (
            <g key={object.id} transform={`translate(${object.x * 100} ${object.y * 100})`}
              className={`remix-arcade-object${selectable ? " is-selectable" : ""}`}
              role={selectable ? "button" : "img"}
              tabIndex={selectable ? 0 : undefined}
              aria-label={label}
              aria-pressed={selectable ? selected : undefined}
              onClick={selectable ? () => onSelect(object.id) : undefined}
              onKeyDown={selectable ? event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(object.id);
                }
              } : undefined}>
              <title>{label}</title>
              <circle r={Math.max(9, ringRadius + 1)} fill="transparent" pointerEvents={selectable ? "all" : "none"} />
              <g pointerEvents="none">
                {selected && <>
                  <circle r={ringRadius} fill="none" stroke="rgba(0,0,0,.8)" strokeWidth={1.6} />
                  <circle r={ringRadius} fill="none" stroke="white" strokeWidth={.8} />
                </>}
                <Shape shape={tower ? "square" : object.shape} radius={radius} fill={rgbString(object.recipe)} />
                <circle className="remix-arcade-focus-ring" r={ringRadius + 1.4} fill="none" stroke="white" strokeWidth={.8} strokeDasharray="1 1" />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ArcadeScene;
