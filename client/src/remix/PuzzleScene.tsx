import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { countRecipe, rgbString, targetVisible } from "@shared/remix";
import type { RemixObject, RemixState } from "@shared/remix";
import "./puzzle.css";

export interface PuzzleSceneProps {
  state: RemixState;
  onSelect: (id: string) => void;
}

const canPlay = (state: RemixState) => state.phase === "playing" && !state.paused;
const activeObject = (state: RemixState) =>
  state.objects.find(object => object.id === state.selectedId && object.status === "active") ??
  state.objects.find(object => object.status === "active");

function activate(event: KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function MixScene({ state }: PuzzleSceneProps) {
  const object = activeObject(state);
  const clipId = "mix-" + useId().replace(/:/g, "");
  const recipe = object?.recipe;
  const fraction = object ? Math.min(1, countRecipe(object.recipe) / Math.max(1, countRecipe(object.target))) : 1;
  const isMemory = state.spec.style === "recall" || state.spec.modifier === "recall";
  const message = isMemory
    ? (targetVisible(state) ? "Remember the background" : "Mix the color from memory")
    : state.spec.style === "zen" ? "Match before the next fade" : "Mix until your circle disappears";
  return (
    <div className="remix-puzzle">
      <svg viewBox="0 0 360 320" className="remix-puzzle-svg" role="img" aria-label="Your current color mixture">
        <defs><clipPath id={clipId}><circle cx="180" cy="158" r="94" /></clipPath></defs>
        {object && (
          <g>
            <circle cx="180" cy="158" r="96" fill="white" stroke="rgba(0,0,0,.5)" strokeWidth="3" />
            <g clipPath={"url(#" + clipId + ")"}>
              <rect x="84" y={252 - 188 * fraction} width="192" height={188 * fraction}
                fill={recipe ? rgbString(recipe) : "white"} />
            </g>
            <circle cx="180" cy="158" r="94" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <p className="remix-puzzle-note">{object ? message : "Colors merged"}</p>
    </div>
  );
}

function RingsScene({ state, onSelect }: PuzzleSceneProps) {
  const current = activeObject(state);
  const currentIndex = current ? state.objects.indexOf(current) : state.objects.length;
  const visibleTarget = targetVisible(state);
  const count = Math.max(1, state.objects.length);
  const radius = (index: number) => 30 + (index + 1) * 120 / count;
  // A completed inner region joins the next playable disk; it must not remain
  // a separate old-colored island when that larger disk receives new pigment.
  const remaining = state.objects.map((object, index) => ({ object, index }))
    .filter(({ object }) => object.status !== "solved").reverse();
  return (
    <div className="remix-puzzle">
      <svg viewBox="0 0 360 360" className="remix-puzzle-svg" role="group" aria-label="Concentric color rings">
        {current && visibleTarget && (
          <circle cx="180" cy="180" r="166" fill={rgbString(state.objects[count - 1].target)} />
        )}
        {remaining.map(({ object, index }) => {
          const selected = object.id === current?.id;
          const selectable = selected && canPlay(state);
          return (
            <g key={object.id} role={selected ? "button" : undefined} tabIndex={selectable ? 0 : undefined}
              aria-label={selected ? "Active ring " + (index + 1) : undefined}
              aria-disabled={selected ? !selectable : undefined}
              className={selected ? "remix-svg-control" : undefined}
              onClick={() => { if (selectable) onSelect(object.id); }}
              onKeyDown={event => activate(event, () => { if (selectable) onSelect(object.id); })}>
              <circle cx="180" cy="180" r={radius(index)}
                fill={object.status === "queued" && !visibleTarget ? "#e5e7eb" : rgbString(object.recipe)}
                stroke={selected ? "rgba(0,0,0,.65)" : "rgba(255,255,255,.65)"} strokeWidth={selected ? 3 : 1} />
              {selected && <circle cx="180" cy="180" r={radius(index) - 4}
                fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 6" pointerEvents="none" />}
            </g>
          );
        })}
      </svg>
      <p className="remix-puzzle-note">
        {current ? "Ring " + (currentIndex + 1) + " of " + count + " · Match the next ring outward" : "All rings merged"}
      </p>
    </div>
  );
}

function strandPath(index: number, total: number, level: number): string {
  const y = 58 + index * 244 / Math.max(1, total - 1);
  // Early strands run in parallel. Later arrangements cross, then develop waves.
  const crossing = level >= 51;
  const curved = level >= 56;
  const endY = crossing && index % 2 === 1 ? 360 - y : y;
  if (!curved) return "M 26 " + y + " L 334 " + endY;
  const bend = (index % 2 === 0 ? 1 : -1) * (36 + (index % 3) * 20);
  return "M 26 " + y + " C 115 " + (y + bend) + ", 245 " + (endY - bend) + ", 334 " + endY;
}

function StrandsScene({ state, onSelect }: PuzzleSceneProps) {
  const unfinished = state.objects.filter(object => object.status === "active");
  const selected = activeObject(state);
  const rows = state.objects.map((object, index) => ({ object, index }))
    .filter(({ object }) => object.status === "active")
    .sort((a, b) => Number(a.object.id === selected?.id) - Number(b.object.id === selected?.id));
  const selectNext = () => {
    const index = unfinished.findIndex(object => object.id === selected?.id);
    const next = unfinished[(index + 1) % unfinished.length];
    if (next && canPlay(state)) onSelect(next.id);
  };
  return (
    <div className="remix-puzzle">
      <svg viewBox="0 0 360 360" className="remix-puzzle-svg" role="group" aria-label="Select a strand to mix">
        {rows.map(({ object, index }) => {
          const d = strandPath(index, state.objects.length, state.spec.level);
          const width = Math.max(8, Math.min(26, object.width <= 1 ? object.width * 100 : object.width));
          const selectedHere = object.id === selected?.id;
          const select = () => { if (canPlay(state)) onSelect(object.id); };
          return (
            <g key={object.id} role="button" tabIndex={canPlay(state) ? 0 : -1}
              aria-label={"Strand " + (index + 1)} aria-pressed={selectedHere} aria-disabled={!canPlay(state)}
              className="remix-svg-control" onClick={select} onKeyDown={event => activate(event, select)}>
              <path d={d} fill="none" stroke={selectedHere ? "rgba(0,0,0,.85)" : "rgba(0,0,0,.35)"}
                strokeWidth={width + (selectedHere ? 7 : 2)} strokeLinecap="round" />
              <path d={d} fill="none" stroke={rgbString(object.recipe)} strokeWidth={width} strokeLinecap="round" />
              {selectedHere && <path d={d} fill="none" stroke="white" strokeWidth={1.5}
                strokeDasharray="3 12" strokeLinecap="round" pointerEvents="none" />}
              <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(44, width)}
                strokeLinecap="round" pointerEvents="stroke" />
            </g>
          );
        })}
      </svg>
      <div className="remix-puzzle-footer">
        <p className="remix-puzzle-note">{unfinished.length} strands remaining</p>
        <button className="remix-puzzle-button" disabled={!canPlay(state) || unfinished.length < 2} onClick={selectNext}>
          Next strand
        </button>
      </div>
    </div>
  );
}

type Vec3 = { x: number; y: number; z: number };
type Rotation = { yaw: number; pitch: number };

function position(latitude: number, longitude: number): Vec3 {
  return { x: Math.cos(latitude) * Math.sin(longitude), y: Math.sin(latitude), z: Math.cos(latitude) * Math.cos(longitude) };
}

function rotate(point: Vec3, rotation: Rotation): Vec3 {
  const x = point.x * Math.cos(rotation.yaw) + point.z * Math.sin(rotation.yaw);
  const z = -point.x * Math.sin(rotation.yaw) + point.z * Math.cos(rotation.yaw);
  return { x, y: point.y * Math.cos(rotation.pitch) - z * Math.sin(rotation.pitch),
    z: point.y * Math.sin(rotation.pitch) + z * Math.cos(rotation.pitch) };
}

// Orthographic projection of spherical caps, not screen-space circles.
// Latitude/longitude and both rotation axes alter placement and foreshortening.
function capPath(object: RemixObject, rotation: Rotation, angularRadius: number): string {
  const normal = position(object.latitude, object.longitude);
  const east = { x: Math.cos(object.longitude), y: 0, z: -Math.sin(object.longitude) };
  const north = { x: -Math.sin(object.latitude) * Math.sin(object.longitude),
    y: Math.cos(object.latitude), z: -Math.sin(object.latitude) * Math.cos(object.longitude) };
  const points: Vec3[] = Array.from({ length: 48 }, (_, index) => {
    const angle = index / 48 * Math.PI * 2;
    const a = Math.cos(angularRadius), b = Math.sin(angularRadius) * Math.cos(angle), c = Math.sin(angularRadius) * Math.sin(angle);
    return rotate({ x: normal.x * a + east.x * b + north.x * c,
      y: normal.y * a + east.y * b + north.y * c, z: normal.z * a + east.z * b + north.z * c }, rotation);
  });
  // Clip cap geometry at the visible hemisphere before projecting.
  const clipped: Vec3[] = [];
  points.forEach((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    if ((point.z >= 0) !== (previous.z >= 0)) {
      const t = previous.z / (previous.z - point.z);
      clipped.push({ x: previous.x + t * (point.x - previous.x), y: previous.y + t * (point.y - previous.y), z: 0 });
    }
    if (point.z >= 0) clipped.push(point);
  });
  return clipped.length < 3 ? "" : clipped.map((point, index) =>
    (index === 0 ? "M " : " L ") + (180 + point.x * 144).toFixed(2) + " " + (180 - point.y * 144).toFixed(2)).join("") + " Z";
}

function SphereScene({ state, onSelect }: PuzzleSceneProps) {
  const first = state.objects[0];
  const [rotation, setRotation] = useState<Rotation>({ yaw: -(first?.longitude ?? 0), pitch: first?.latitude ?? 0 });
  const uniqueId = useId().replace(/:/g, "");
  const gradientId = "sphere-rim-" + uniqueId;
  const maskId = "sphere-mask-" + uniqueId;
  const gesture = useRef<{ pointerId: number; x: number; y: number; moved: boolean; rotation: Rotation; id: string | null } | null>(null);
  const unfinished = state.objects.filter(object => object.status === "active");
  const selected = activeObject(state);
  const selectedIndex = state.objects.findIndex(object => object.id === selected?.id);
  const enabled = canPlay(state);

  useEffect(() => {
    const initial = state.objects[0];
    setRotation({ yaw: -(initial?.longitude ?? 0), pitch: initial?.latitude ?? 0 });
    gesture.current = null;
    // Rotation belongs to a level, never to its changing recipe state.
  }, [state.spec.level]);

  const angularRadius = Math.min(.46, Math.max(.18, .85 / Math.sqrt(Math.max(1, state.objects.length) / 3)));
  const patches = state.objects.map(object => ({
    object,
    center: rotate(position(object.latitude, object.longitude), rotation),
    path: capPath(object, rotation, angularRadius),
  })).filter(patch => patch.path).sort((a, b) => a.center.z - b.center.z);

  function faceNext() {
    const index = unfinished.findIndex(object => object.id === selected?.id);
    const next = unfinished[(index + 1) % unfinished.length];
    if (!next || !enabled) return;
    // Yaw sends the chosen longitude to the front meridian; pitch then puts
    // its latitude on the equator, making the chosen patch face the camera.
    setRotation({ yaw: -next.longitude, pitch: next.latitude });
    onSelect(next.id);
  }

  function pointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!enabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
    const element = event.target as Element;
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, rotation,
      moved: false, id: element.closest("[data-dimple-id]")?.getAttribute("data-dimple-id") ?? null };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId || !enabled) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 7) start.moved = true;
    if (start.moved) {
      const scale = Math.PI / Math.max(180, event.currentTarget.getBoundingClientRect().width);
      setRotation({ yaw: start.rotation.yaw + dx * scale, pitch: start.rotation.pitch + dy * scale });
    }
  }

  function pointerUp(event: PointerEvent<SVGSVGElement>) {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (enabled && !start.moved && start.id) onSelect(start.id);
  }

  function keyboardRotate(event: KeyboardEvent<SVGSVGElement>) {
    if (!enabled) return;
    const delta: Record<string, Rotation> = {
      ArrowLeft: { yaw: -.2, pitch: 0 }, ArrowRight: { yaw: .2, pitch: 0 },
      ArrowUp: { yaw: 0, pitch: -.2 }, ArrowDown: { yaw: 0, pitch: .2 },
    };
    const change = delta[event.key];
    if (!change) return;
    event.preventDefault();
    setRotation(previous => ({ yaw: previous.yaw + change.yaw, pitch: previous.pitch + change.pitch }));
  }

  return (
    <div className="remix-puzzle">
      <svg viewBox="0 0 360 360" className="remix-puzzle-svg remix-sphere-svg" role="group"
        aria-label="Rotatable color sphere. Drag or use arrow keys to rotate. Choose a dimple to mix."
        tabIndex={enabled ? 0 : -1} onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; }}
        onLostPointerCapture={() => { gesture.current = null; }} onKeyDown={keyboardRotate}>
        <defs>
          <radialGradient id={gradientId} cx="38%" cy="30%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity=".1" />
            <stop offset="72%" stopColor="white" stopOpacity=".03" />
            <stop offset="100%" stopColor="black" stopOpacity=".28" />
          </radialGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="360">
            <rect width="360" height="360" fill="white" />
            {patches.filter(patch => patch.object.status === "solved").map(patch =>
              <path key={patch.object.id} d={patch.path} fill="black" stroke="black" strokeWidth="5" />)}
          </mask>
        </defs>
        {unfinished.length > 0 && (
          <circle cx="180" cy="180" r="144" fill={"url(#" + gradientId + ")"}
            stroke="rgba(255,255,255,.4)" strokeWidth="1.5" mask={"url(#" + maskId + ")"} />
        )}
        {patches.filter(patch => patch.object.status === "active").map(({ object, center, path }) => {
          const selectable = enabled && center.z > .12;
          const selectedHere = object.id === selected?.id;
          const index = state.objects.indexOf(object);
          return (
            <g key={object.id} data-dimple-id={selectable ? object.id : undefined}
              role={selectable ? "button" : undefined} tabIndex={selectable ? 0 : undefined}
              aria-label={selectable ? "Dimple " + (index + 1) : undefined}
              aria-pressed={selectable ? selectedHere : undefined} className="remix-svg-control"
              onClick={event => { if (selectable && event.detail === 0) onSelect(object.id); }}
              onKeyDown={event => activate(event, () => { if (selectable) onSelect(object.id); })}>
              <path d={path} fill={rgbString(object.recipe)} stroke="rgba(0,0,0,.7)" strokeWidth="4" />
              <path d={path} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.5" pointerEvents="none" />
              {selectedHere && <path d={path} fill="none" stroke="white" strokeWidth="3"
                strokeDasharray="5 5" pointerEvents="none" />}
            </g>
          );
        })}
      </svg>
      <div className="remix-puzzle-footer">
        <p className="remix-puzzle-note" aria-live="polite">{unfinished.length} dimples remaining</p>
        <button className="remix-puzzle-button" onClick={faceNext} disabled={!enabled || !unfinished.length}>
          Next unfinished
        </button>
      </div>
      {selected && (
        <div className="remix-dimple-preview" aria-label={"Selected dimple " + (selectedIndex + 1)}>
          <span className="remix-dimple-swatch" style={{ backgroundColor: rgbString(selected.recipe) }} />
          <span>Dimple {selectedIndex + 1} selected · drag to turn</span>
        </div>
      )}
    </div>
  );
}

export function PuzzleScene(props: PuzzleSceneProps) {
  switch (props.state.spec.style) {
    case "rings": return <RingsScene {...props} />;
    case "strands": return <StrandsScene {...props} />;
    case "sphere": return <SphereScene {...props} />;
    default: return <MixScene {...props} />;
  }
}

export default PuzzleScene;
