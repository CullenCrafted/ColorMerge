import { ColorMergeLogic as Engine, type ColorMergeState } from '../../../shared/classic-engine';

type DisplayState = Omit<ColorMergeState, 'recipe'>;
type Status = 'playing' | 'won' | 'over';
type MoveResult = ReturnType<Engine['addColor']>;
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
interface Mistake { guess: string[]; correct: string[]; level: number }
interface SavedClassic {
  version: 1; engine: ColorMergeState; status: Status; bestLevel: number;
  mistakes: Mistake[]; runId: string; revision: number;
}
export const LOCAL_CLASSIC_KEY = 'colormerge.native-classic.v1';
const pigments = ['red', 'yellow', 'blue', 'white', 'black'];
const blankCounts = () => ({ red: 0, yellow: 0, blue: 0, white: 0, black: 0 });
const newId = () => 'native-' + (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
function defaultStorage(): StoragePort | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
function display(state: ColorMergeState): DisplayState {
  const { recipe, ...result } = structuredClone(state);
  return result;
}
function rgb(counts: Record<string, number>) {
  const green = Math.min(counts.blue, counts.yellow);
  const blue = counts.blue - green, yellow = counts.yellow - green;
  const total = pigments.reduce((n, p) => n + counts[p], 0) - green;
  return total ? {
    r: 255 * (counts.red + yellow + counts.white) / total,
    g: 255 * (yellow + green + counts.white) / total,
    b: 255 * (blue + counts.white) / total,
  } : { r: 255, g: 255, b: 255 };
}
function validCounts(value: unknown, maximum: number): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const counts = value as Record<string, unknown>;
  return Object.keys(counts).length === 5 && pigments.every(p =>
    typeof counts[p] === 'number' && Number.isInteger(counts[p]) && (counts[p] as number) >= 0 && (counts[p] as number) <= maximum);
}
function nearColor(a: ColorMergeState['currentColor'], b: ColorMergeState['currentColor']): boolean {
  return !!a && ['r','g','b'].every(channel => {
    const key = channel as keyof typeof a;
    return Number.isFinite(a[key]) && Math.abs(a[key] - b[key]) < 1e-7;
  });
}
function sameColor(a: ColorMergeState['currentColor'], b: ColorMergeState['currentColor']): boolean {
  return Math.round(a.r) === Math.round(b.r) && Math.round(a.g) === Math.round(b.g) && Math.round(a.b) === Math.round(b.b);
}
/** Local save validation is a corruption boundary, never ranked-score verification. */
function restore(raw: string | null): SavedClassic | null {
  try {
    if (!raw || raw.length > 300000) return null;
    const saved = JSON.parse(raw) as SavedClassic;
    if (!saved || saved.version !== 1 || !saved.engine || !['playing','won','over'].includes(saved.status)) return null;
    if (typeof saved.runId !== 'string' || !/^native-[a-zA-Z0-9-]{10,70}$/.test(saved.runId)) return null;
    if (!Number.isSafeInteger(saved.revision) || saved.revision < 0) return null;
    const s = saved.engine;
    if (!Number.isInteger(s.currentLevel) || s.currentLevel < 1 || s.currentLevel > 10000 || s.maxMixes !== s.currentLevel) return null;
    if (!Number.isInteger(s.hearts) || s.hearts < 0 || s.hearts > 1000000) return null;
    if (!Number.isInteger(saved.bestLevel) || saved.bestLevel < s.currentLevel || saved.bestLevel > 10000) return null;
    if (!Number.isInteger(s.mixCount) || s.mixCount < 0 || s.mixCount > s.maxMixes) return null;
    if (!validCounts(s.recipe, s.maxMixes) || !validCounts(s.colorClicks, s.mixCount)) return null;
    if (pigments.reduce((n,p) => n + s.recipe[p], 0) !== s.maxMixes) return null;
    if (!Array.isArray(s.chosenColors) || s.chosenColors.length !== s.mixCount || !s.chosenColors.every(c => pigments.includes(c))) return null;
    const expectedClicks: Record<string, number> = blankCounts();
    for (const color of s.chosenColors) expectedClicks[color]++;
    if (!pigments.every(p => expectedClicks[p] === s.colorClicks[p])) return null;
    if (!nearColor(s.currentColor, rgb(expectedClicks)) || !nearColor(s.targetColor, rgb(s.recipe))) return null;
    const matched = s.mixCount > 0 && sameColor(s.currentColor, s.targetColor);
    if (saved.status === 'won' && (!matched || s.hearts === 0)) return null;
    if (saved.status === 'over' && (s.hearts !== 0 || s.mixCount !== s.maxMixes || matched)) return null;
    if (saved.status === 'playing' && (s.hearts === 0 || s.mixCount >= s.maxMixes || matched)) return null;
    if (!Array.isArray(saved.mistakes) || saved.mistakes.length > 100) return null;
    for (const mistake of saved.mistakes) {
      if (!mistake || !Number.isInteger(mistake.level) || mistake.level < 1 || mistake.level > s.currentLevel) return null;
      for (const colors of [mistake.guess, mistake.correct]) if (!Array.isArray(colors) || colors.length > 10000 || !colors.every(c => pigments.includes(c))) return null;
    }
    return saved;
  } catch { return null; }
}

/** Offline Classic for native builds. It never reads or writes verified web progress. */
export class LocalClassicLogic {
  private engine = new Engine();
  private phase: Status = 'playing';
  private best = 1;
  private errors: Mistake[] = [];
  private runId = newId();
  private revision = 0;
  private preview: DisplayState | null = null;
  private loaded = false;
  busy = false;
  ready = false;
  constructor(private storage: StoragePort | null = defaultStorage()) {}
  private persist(): void {
    const saved: SavedClassic = {
      version: 1, engine: this.engine.getState(), status: this.phase, bestLevel: this.best,
      mistakes: this.errors, runId: this.runId, revision: this.revision,
    };
    try { this.storage?.setItem(LOCAL_CLASSIC_KEY, JSON.stringify(saved)); }
    catch { /* Storage restrictions do not prevent offline play. */ }
  }
  async load(): Promise<void> {
    if (this.loaded) { this.ready = true; return; }
    let saved: SavedClassic | null = null;
    try { saved = restore(this.storage?.getItem(LOCAL_CLASSIC_KEY) ?? null); } catch { /* Start fresh. */ }
    if (saved) {
      this.engine = Engine.restore(saved.engine); this.phase = saved.status;
      this.best = saved.bestLevel; this.errors = saved.mistakes;
      this.runId = saved.runId; this.revision = saved.revision;
    }
    this.loaded = true; this.ready = true; this.persist();
  }
  private assertReady(): void { if (!this.ready || this.busy) throw new Error('Please wait for the game.'); }
  getState(): DisplayState { return structuredClone(this.preview || display(this.engine.getState())); }
  get status(): Status { return this.phase; }
  get bestLevel(): number { return this.best; }
  get mistakes(): Mistake[] {
    return structuredClone(this.errors.filter(m => this.phase !== 'playing' || m.level !== this.engine.getState().currentLevel));
  }
  get continuationKey(): string { return this.runId + '-' + this.revision; }
  previewColor(color: string): void {
    if (!this.ready || this.busy || this.phase !== 'playing' || !pigments.includes(color)) return;
    const state = display(this.engine.getState());
    if (state.mixCount >= state.maxMixes) return;
    state.chosenColors.push(color); state.colorClicks[color]++; state.mixCount++;
    state.currentColor = rgb(state.colorClicks);
    this.preview = state;
  }
  async addColor(color: string): Promise<MoveResult> {
    this.assertReady();
    if (this.phase !== 'playing') throw new Error('This round is finished.');
    if (!pigments.includes(color)) { this.preview = null; throw new Error('Invalid pigment.'); }
    this.busy = true;
    try {
      const state = this.engine.getState();
      const guess = [...state.chosenColors, color];
      const result = this.engine.addColor(color);
      this.preview = null;
      if (!result.success) this.errors.push({ guess, correct: this.engine.getCurrentTargetColorArray(), level: state.currentLevel });
      this.errors = this.errors.slice(-100);
      if (result.levelComplete) this.phase = 'won';
      if (result.gameOver) this.phase = 'over';
      this.revision++; this.persist();
      return result;
    } finally { this.busy = false; }
  }
  async nextLevel(): Promise<void> {
    this.assertReady();
    if (this.phase !== 'won') throw new Error('Complete this level first.');
    this.engine.nextLevel(); this.phase = 'playing'; this.preview = null;
    this.best = Math.max(this.best, this.engine.getState().currentLevel);
    this.revision++; this.persist();
  }
  async resetGame(): Promise<void> {
    this.assertReady();
    this.engine.resetGame(); this.phase = 'playing'; this.errors = []; this.preview = null;
    this.runId = newId(); this.revision = 0; this.persist();
  }
  /** Caller must first verify a wallet debit. This adapter never owns a money balance. */
  async continueWithHeart(): Promise<void> {
    this.assertReady();
    if (this.phase !== 'over') throw new Error('A continuation is only available after a loss.');
    const state = this.engine.getState();
    this.engine = Engine.restore({
      ...state, hearts: 1, mixCount: 0, chosenColors: [], colorClicks: blankCounts(),
      currentColor: { r: 255, g: 255, b: 255 },
    });
    this.phase = 'playing'; this.preview = null; this.revision++; this.persist();
  }
  getRemainingMixes(): number { const s = this.getState(); return s.maxMixes - s.mixCount; }
  getTargetColorString(): string { const c = this.getState().targetColor; return 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')'; }
  getCurrentColorString(): string { const c = this.getState().currentColor; return 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')'; }
  isTargetWhite(): boolean { return this.getTargetColorString() === 'rgb(255, 255, 255)'; }
  isCurrentMixWhite(): boolean { return this.getCurrentColorString() === 'rgb(255, 255, 255)'; }
}
