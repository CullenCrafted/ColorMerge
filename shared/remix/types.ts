export type Pigment = 'red' | 'blue' | 'yellow' | 'white' | 'black';
export type Recipe = Record<Pigment, number>;
export interface RGB { r: number; g: number; b: number }
export type Style = 'mix' | 'rings' | 'fall' | 'strands' | 'recall' | 'tower' | 'swarm' | 'zen' | 'sphere';
export interface LevelSpec {
  level: number; style: Style; title: string; instruction: string;
  modifier: 'recall' | null; objectCount: number; recipeSize: number; missingCount: number;
  timeLimitMs: number; revealMs: number; spawnEveryMs: number; travelMs: number; capacity: number;
}
export interface RemixObject {
  id: string; initial: Recipe; recipe: Recipe; target: Recipe; additions: Pigment[];
  status: 'queued' | 'active' | 'solved' | 'missed';
  x: number; y: number; vx: number; vy: number;
  shape: 'circle' | 'triangle' | 'square' | 'pentagon' | 'octagon' | 'trapezoid';
  width: number; angle: number; latitude: number; longitude: number; spawnAtMs: number;
}
export interface RemixState {
  version: 1; seed: number; level: number; spec: LevelSpec; objects: RemixObject[];
  selectedId: string | null; phase: 'intro' | 'reveal' | 'playing' | 'won' | 'lost';
  paused: boolean; elapsedMs: number; remainingMs: number; lives: number; solved: number;
  target: Recipe; assisted: boolean;
  zenPhase: 'fadeIn' | 'hold' | 'fadeOut'; zenPhaseMs: number; zenRemainingMs: number; zenStreak: number;
  overloadMs: number;
}
export type RemixAction =
  | { type: 'start' | 'undo' | 'reset' | 'submit' | 'retry' | 'resume' | 'next' }
  | { type: 'tick'; deltaMs: number }
  | { type: 'select'; id: string }
  | { type: 'add'; color: Pigment; id?: string }
  | { type: 'pause'; paused: boolean };
