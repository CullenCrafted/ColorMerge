import type { Pigment, Recipe, RGB, Style, LevelSpec, RemixObject, RemixState, RemixAction } from './types';
export type { Pigment, Recipe, RGB, Style, LevelSpec, RemixObject, RemixState, RemixAction } from './types';

export const PIGMENTS: readonly Pigment[] = ['blue', 'red', 'yellow', 'white', 'black'];
export function emptyRecipe(): Recipe { return { red: 0, blue: 0, yellow: 0, white: 0, black: 0 }; }
export function countRecipe(recipe: Recipe): number { return PIGMENTS.reduce((sum, p) => sum + recipe[p], 0); }
export function mix(recipe: Recipe): RGB {
  const green = Math.min(recipe.blue, recipe.yellow);
  const blue = recipe.blue - green, yellow = recipe.yellow - green;
  const total = countRecipe(recipe) - green;
  if (!total) return { r: 255, g: 255, b: 255 };
  return {
    r: 255 * (recipe.red + yellow + recipe.white) / total,
    g: 255 * (yellow + green + recipe.white) / total,
    b: 255 * (blue + recipe.white) / total,
  };
}
export function rgbString(recipe: Recipe): string {
  const c = mix(recipe);
  return 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
}
export function matches(a: Recipe, b: Recipe): boolean { return rgbString(a) === rgbString(b); }
export function remainingAdditions(object: RemixObject): number {
  return Math.max(0, countRecipe(object.target) - countRecipe(object.initial) - object.additions.length);
}
const INTRO: [number, Style][] = [[1,'mix'],[11,'rings'],[21,'fall'],[36,'strands'],[51,'recall'],[66,'tower'],[81,'swarm'],[101,'zen'],[121,'sphere']];
const LABELS: Record<Style, [string,string]> = {
  mix: ['Color mix', 'Add colors to make your circle match the background.'],
  rings: ['Rings', 'Match the outlined ring, then work out toward the next ring.'],
  fall: ['Color fall', 'Mix the lowest shape before it reaches the floor.'],
  strands: ['Strands', 'Select a strand and mix its missing colors to clear it.'],
  recall: ['Recall', 'Remember the background, mix your answer, then press Check.'],
  tower: ['Tower', 'Match each arriving block to the base before its time runs out.'],
  swarm: ['Swarm', 'Select moving shapes and clear them before the screen fills up.'],
  zen: ['Zen', 'Match the target before it fades away. Each success shortens the next window.'],
  sphere: ['Sphere', 'Turn the sphere, select a dimple, and mix it into the background.'],
};
export function getLevelSpec(requested: number): LevelSpec {
  const level = Number.isFinite(requested) ? Math.max(1, Math.min(100000, Math.floor(requested))) : 1;
  const unlocked = INTRO.filter(([at]) => at <= level);
  const [introducedAt, introduced] = unlocked[unlocked.length - 1];
  // Three focused rounds introduce each mechanic; later rounds revisit learned skills.
  let style = level - introducedAt < 3 ? introduced : unlocked[(level - introducedAt - 3) % unlocked.length][1];
  const modifier = level >= 141 && (level - 141) % 12 === 0 ? 'recall' : null;
  if (modifier) style = 'strands';
  const gentle = level - introducedAt < 3;
  const recipeSize = gentle ? (style === 'mix' ? 1 : 2) : Math.min(6, 2 + Math.floor(level / 30));
  const missingCount = gentle ? 1 : Math.min(3, 1 + Math.floor(level / 40));
  const amounts: Record<Style, number> = {
    mix: 1, rings: Math.min(6, 3 + Math.floor(level / 60)),
    fall: gentle ? 6 : Math.min(20, 8 + Math.floor(level / 15)),
    strands: gentle ? 3 : Math.min(10, 4 + Math.floor(level / 30)),
    recall: 1, tower: gentle ? 5 : Math.min(12, 6 + Math.floor(level / 30)),
    swarm: gentle ? 6 : Math.min(18, 8 + Math.floor(level / 25)),
    zen: gentle ? 4 : 6, sphere: level === 121 ? 1 : gentle ? 3 : Math.min(12, 4 + Math.floor(level / 30)),
  };
  return {
    level, style, title: LABELS[style][0] + (modifier ? ' + Recall' : ''),
    instruction: modifier ? 'Remember the background, then select and mix each strand. Press Check to submit.' : LABELS[style][1],
    modifier, objectCount: amounts[style], recipeSize, missingCount,
    timeLimitMs: Math.max(45000, amounts[style] * (gentle ? 18000 : 13000)),
    revealMs: Math.max(800, 2000 - Math.max(0, level - 51) * 8),
    spawnEveryMs: gentle ? 6500 : Math.max(2800, 6000 - level * 15),
    travelMs: gentle ? 18000 : Math.max(9000, 17000 - level * 30),
    capacity: 6,
  };
}
function rngFor(seed: number): () => number {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
function randomRecipe(size: number, random: () => number): Recipe {
  const recipe = emptyRecipe();
  for (let i = 0; i < size; i++) recipe[PIGMENTS[Math.floor(random() * PIGMENTS.length)]]++;
  // Empty white is a visual match, so use a non-white target.
  if (matches(recipe, emptyRecipe())) { recipe.white--; recipe.red++; }
  return recipe;
}
function partialRecipe(target: Recipe, missing: number, random: () => number): Recipe {
  for (let attempt = 0; attempt < 50; attempt++) {
    const start = { ...target };
    for (let i = 0; i < missing; i++) {
      const choices = PIGMENTS.filter(p => start[p] > 0);
      start[choices[Math.floor(random() * choices.length)]]--;
    }
    if (!matches(start, target)) return start;
  }
  // Uniform targets can have no visually different non-empty subset.
  return emptyRecipe();
}
export function createRun(level = 1, seed = 1): RemixState {
  const spec = getLevelSpec(level);
  seed = Number.isFinite(seed) ? seed >>> 0 : 1;
  const random = rngFor(seed ^ Math.imul(spec.level, 2654435761));
  const target = randomRecipe(spec.recipeSize, random);
  const shapes: RemixObject['shape'][] = ['circle','triangle','square','pentagon','octagon','trapezoid'];
  let previous = emptyRecipe();
  const objects: RemixObject[] = [];
  for (let i = 0; i < spec.objectCount; i++) {
    let objectTarget = { ...target };
    let initial = partialRecipe(objectTarget, Math.min(spec.missingCount, spec.recipeSize), random);
    if (spec.style === 'mix' || spec.style === 'recall') initial = emptyRecipe();
    if (spec.style === 'zen') objectTarget = randomRecipe(spec.recipeSize, random);
    if (spec.style === 'zen') initial = partialRecipe(objectTarget, Math.min(spec.missingCount, spec.recipeSize), random);
    if (spec.style === 'rings') {
      initial = { ...previous };
      objectTarget = { ...previous };
      // Each ring adds one raw unit; retry until the next ring is visually different.
      for (let attempt = 0; attempt < 30; attempt++) {
        objectTarget = { ...previous };
        objectTarget[PIGMENTS[Math.floor(random() * PIGMENTS.length)]]++;
        if (!matches(initial, objectTarget)) break;
      }
      if (matches(initial, objectTarget)) {
        objectTarget = { ...previous };
        objectTarget[matches(previous, { ...emptyRecipe(), red: 1 }) ? 'blue' : 'red']++;
      }
      previous = { ...objectTarget };
    }
    const all = ['strands','sphere'].includes(spec.style);
    objects.push({
      id: 'object-' + i, initial, recipe: { ...initial }, target: objectTarget, additions: [],
      status: all || i === 0 ? 'active' : 'queued',
      x: spec.style === 'tower' ? .5 : .12 + random() * .76,
      y: spec.style === 'fall' ? .06 : spec.style === 'tower' ? .22 : .12 + random() * .7,
      vx: (random() < .5 ? -1 : 1) * (.045 + random() * .035),
      vy: (random() < .5 ? -1 : 1) * (.04 + random() * .035),
      shape: shapes[i % shapes.length], width: .05 + random() * .05,
      angle: random() * Math.PI,
      latitude: i === 0 ? 0 : Math.asin(1 - 2 * (i + .5) / spec.objectCount),
      longitude: i === 0 ? 0 : i * Math.PI * (3 - Math.sqrt(5)),
      spawnAtMs: ['fall','swarm'].includes(spec.style) ? i * spec.spawnEveryMs : 0,
    });
  }
  return {
    version: 1, seed, level: spec.level, spec, objects, selectedId: objects[0].id,
    phase: 'intro', paused: false, elapsedMs: 0, remainingMs: spec.timeLimitMs,
    lives: 3, solved: 0, target: { ...objects[0].target }, assisted: false,
  };
}
function isMemory(state: RemixState): boolean { return state.spec.style === 'recall' || state.spec.modifier === 'recall'; }
export function targetVisible(state: RemixState): boolean {
  return !isMemory(state) || state.phase === 'reveal' || state.phase === 'won' || state.phase === 'lost';
}
export function targetOpacity(state: RemixState): number {
  if (!targetVisible(state)) return 0;
  if (state.spec.style !== 'zen' || state.phase !== 'playing') return 1;
  const object = state.objects.find(o => o.status === 'active');
  if (!object) return 0;
  const window = Math.max(6000, state.spec.travelMs - state.solved * 700);
  const age = (state.elapsedMs - object.spawnAtMs) / window;
  return Math.max(0, Math.min(1, age / .1, (1 - age) / .2));
}
function refreshSelection(state: RemixState): void {
  const active = state.objects.filter(o => o.status === 'active');
  if (state.spec.style === 'fall') active.sort((a,b) => b.y - a.y);
  const selected = active.find(o => o.id === state.selectedId);
  state.selectedId = (state.spec.style === 'fall' ? active[0] : selected || active[0])?.id || null;
  const object = active.find(o => o.id === state.selectedId);
  if (object) state.target = { ...object.target };
}
function settle(state: RemixState): void {
  state.solved = state.objects.filter(o => o.status === 'solved').length;
  if (state.lives <= 0) { state.lives = 0; state.phase = 'lost'; return; }
  if (state.objects.every(o => o.status === 'solved' || o.status === 'missed')) { state.phase = 'won'; return; }
  if (['rings','tower','zen'].includes(state.spec.style) && !state.objects.some(o => o.status === 'active')) {
    const next = state.objects.find(o => o.status === 'queued');
    if (next) { next.status = 'active'; next.spawnAtMs = state.elapsedMs; }
  }
  refreshSelection(state);
}
function failObject(state: RemixState, object: RemixObject, missed: boolean): void {
  state.lives--;
  if (missed) object.status = 'missed';
  else { object.recipe = { ...object.initial }; object.additions = []; }
  settle(state);
}
function evaluate(state: RemixState, object: RemixObject): void {
  if (matches(object.recipe, object.target) && object.additions.length > 0) {
    object.status = 'solved'; settle(state);
  } else if (isMemory(state) || remainingAdditions(object) === 0) failObject(state, object, false);
}
function stepTime(state: RemixState, ms: number): void {
  if (state.phase === 'reveal') {
    const left = Math.max(0, state.spec.revealMs - state.elapsedMs);
    const used = Math.min(ms, left);
    state.elapsedMs += used;
    if (state.elapsedMs >= state.spec.revealMs) {
      state.phase = 'playing'; state.elapsedMs = 0;
      if (ms > used) stepTime(state, ms - used);
    }
    return;
  }
  if (state.phase !== 'playing') return;
  state.elapsedMs += ms;
  state.remainingMs = Math.max(0, state.remainingMs - ms);
  if (state.remainingMs === 0) { state.lives = 0; state.phase = 'lost'; return; }
  const style = state.spec.style;
  for (const object of state.objects) {
    if (['fall','swarm'].includes(style) && object.status === 'queued' && object.spawnAtMs <= state.elapsedMs) object.status = 'active';
    if (object.status !== 'active') continue;
    if (style === 'fall') {
      object.y = .06 + .86 * (state.elapsedMs - object.spawnAtMs) / state.spec.travelMs;
      if (object.y >= .92) failObject(state, object, true);
    }
    if (style === 'swarm') {
      object.x += object.vx * ms / 1000; object.y += object.vy * ms / 1000;
      if (object.x < .08 || object.x > .92) { object.x = Math.max(.08, Math.min(.92, object.x)); object.vx *= -1; }
      if (object.y < .08 || object.y > .88) { object.y = Math.max(.08, Math.min(.88, object.y)); object.vy *= -1; }
    }
    if (['tower','zen'].includes(style)) {
      const window = Math.max(6000, state.spec.travelMs - state.solved * 700);
      if (state.elapsedMs - object.spawnAtMs >= window) failObject(state, object, true);
    }
    if (state.phase !== 'playing') return;
  }
  if (style === 'swarm' && state.objects.filter(o => o.status === 'active').length > state.spec.capacity) {
    state.lives = 0; state.phase = 'lost'; return;
  }
  settle(state);
}
/** Local, unranked simulation. Payment/reward authorization belongs to the shell. */
export function reducer(saved: RemixState, action: RemixAction): RemixState {
  if (action.type === 'retry') return createRun(saved.level, saved.seed);
  if (action.type === 'next') return saved.phase === 'won' ? createRun(saved.level + 1, saved.seed) : saved;
  const state = structuredClone(saved);
  if (action.type === 'pause') { state.paused = action.paused; return state; }
  if (action.type === 'resume') {
    if (state.phase !== 'lost') return saved;
    state.lives = 1; state.assisted = true; state.paused = false;
    state.remainingMs = state.spec.timeLimitMs;
    // Preserve unfinished mixtures while moving timed objects safely back into play.
    for (const object of state.objects) {
      if (object.status === 'missed') object.status = 'queued';
      if (object.status === 'active') {
        object.spawnAtMs = state.elapsedMs;
        if (state.spec.style === 'fall') object.y = .06;
      }
    }
    if (state.spec.style === 'swarm') {
      const active = state.objects.filter(o => o.status === 'active');
      for (const object of active.slice(3)) object.status = 'queued';
    }
    let offset = 1;
    for (const object of state.objects.filter(o => o.status === 'queued')) object.spawnAtMs = state.elapsedMs + offset++ * state.spec.spawnEveryMs;
    state.phase = isMemory(state) ? 'reveal' : 'playing';
    if (isMemory(state)) state.elapsedMs = 0;
    settle(state);
    return state;
  }
  if (state.paused) return saved;
  if (action.type === 'start') {
    if (state.phase !== 'intro') return saved;
    state.phase = isMemory(state) ? 'reveal' : 'playing'; return state;
  }
  if (action.type === 'tick') {
    if (!Number.isFinite(action.deltaMs) || action.deltaMs <= 0 || !['playing','reveal'].includes(state.phase)) return saved;
    // Bounded substeps make spawn/miss events independent of frame rate.
    let left = Math.min(action.deltaMs, 3600000);
    while (left > 0 && ['playing','reveal'].includes(state.phase)) {
      const step = Math.min(left, 50); stepTime(state, step); left -= step;
    }
    return state;
  }
  if (state.phase !== 'playing') return saved;
  if (action.type === 'select') {
    if (state.spec.style === 'fall') return saved;
    if (!state.objects.some(o => o.id === action.id && o.status === 'active')) return saved;
    state.selectedId = action.id; refreshSelection(state); return state;
  }
  const object = state.objects.find(o => o.id === state.selectedId && o.status === 'active');
  if (!object) return saved;
  if (action.type === 'add') {
    if (!PIGMENTS.includes(action.color) || remainingAdditions(object) <= 0) return saved;
    object.recipe[action.color]++; object.additions.push(action.color);
    if (!isMemory(state)) evaluate(state, object);
  } else if (action.type === 'undo') {
    const color = object.additions.pop();
    if (color) object.recipe[color]--;
  } else if (action.type === 'reset') {
    object.recipe = { ...object.initial }; object.additions = [];
  } else if (action.type === 'submit') {
    evaluate(state, object);
  }
  return state;
}

/** Validate local saves before resuming; saves never establish ranked scores or purchases. */
export function restoreRun(value: unknown): RemixState | null {
  try {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<RemixState>;
    if (candidate.version !== 1 || !Number.isInteger(candidate.level) || !Number.isInteger(candidate.seed)) return null;
    if (!candidate.level || candidate.level < 1 || candidate.level > 100000 || candidate.seed === undefined || candidate.seed < 0 || candidate.seed > 4294967295) return null;
    const canonical = createRun(candidate.level, candidate.seed);
    if (!Array.isArray(candidate.objects) || candidate.objects.length !== canonical.objects.length) return null;
    if (!candidate.phase || !['intro','reveal','playing','won','lost'].includes(candidate.phase)) return null;
    if (typeof candidate.paused !== 'boolean' || typeof candidate.assisted !== 'boolean') return null;
    if (candidate.elapsedMs === undefined || !Number.isFinite(candidate.elapsedMs) || candidate.elapsedMs < 0 || candidate.elapsedMs > 1e9) return null;
    if (candidate.remainingMs === undefined || !Number.isFinite(candidate.remainingMs) || candidate.remainingMs < 0 || candidate.remainingMs > canonical.spec.timeLimitMs) return null;
    if (candidate.lives === undefined || !Number.isInteger(candidate.lives) || candidate.lives < 0 || candidate.lives > 3) return null;
    if ((candidate.phase === 'lost') !== (candidate.lives === 0)) return null;
    const objects: RemixObject[] = [];
    for (let i = 0; i < candidate.objects.length; i++) {
      const object = candidate.objects[i], base = canonical.objects[i];
      if (!object || object.id !== base.id || !['queued','active','solved','missed'].includes(object.status)) return null;
      if (!Array.isArray(object.additions) || object.additions.length > countRecipe(base.target) - countRecipe(base.initial)) return null;
      const recipe = { ...base.initial };
      for (const color of object.additions) { if (!PIGMENTS.includes(color)) return null; recipe[color]++; }
      if (!object.recipe || !object.initial || !object.target) return null;
      for (const p of PIGMENTS) if (object.recipe[p] !== recipe[p] || object.initial[p] !== base.initial[p] || object.target[p] !== base.target[p]) return null;
      if (object.status === 'solved' && (!object.additions.length || !matches(recipe, base.target))) return null;
      if (![object.x,object.y,object.vx,object.vy,object.spawnAtMs].every(Number.isFinite)) return null;
      if (object.x < 0 || object.x > 1 || object.y < 0 || object.y > 1 || Math.abs(object.vx) > 1 || Math.abs(object.vy) > 1 || object.spawnAtMs < 0 || object.spawnAtMs > 1e9) return null;
      objects.push({ ...base, recipe, additions: [...object.additions], status: object.status, x: object.x, y: object.y, vx: object.vx, vy: object.vy, spawnAtMs: object.spawnAtMs });
    }
    if (candidate.selectedId !== null && !objects.some(o => o.id === candidate.selectedId && o.status === 'active')) {
      // Terminal snapshots may retain the last selected completed object.
      if (!['won','lost'].includes(candidate.phase) || !objects.some(o => o.id === candidate.selectedId)) return null;
    }
    const restored: RemixState = {
      ...canonical, objects, selectedId: candidate.selectedId || null, phase: candidate.phase,
      paused: candidate.paused, assisted: candidate.assisted, elapsedMs: candidate.elapsedMs,
      remainingMs: candidate.remainingMs, lives: candidate.lives, solved: objects.filter(o => o.status === 'solved').length,
    };
    if (restored.phase === 'won' && !objects.every(o => o.status === 'solved' || o.status === 'missed')) return null;
    const selected = objects.find(o => o.id === restored.selectedId);
    if (selected) restored.target = { ...selected.target };
    return restored;
  } catch { return null; }
}
