// Display-only state. Targets, wins, hearts and recipes are controlled by /api/game.
interface Color { r: number; g: number; b: number }
interface State {
  currentColor: Color; targetColor: Color; mixCount: number; maxMixes: number;
  hearts: number; chosenColors: string[]; colorClicks: Record<string, number>; currentLevel: number;
}
interface Snapshot {
  state: State; roundId: string; revision: number; status: 'playing' | 'won' | 'over';
  bestLevel: number; mistakes: { guess: string[]; correct: string[]; level: number }[];
  result?: { success: boolean; gameOver: boolean; levelComplete: boolean; bonusHeart: boolean };
}
const white = { r: 255, g: 255, b: 255 };
const values: Record<string, Color> = { red: { r:255,g:0,b:0 }, blue:{r:0,g:0,b:255}, yellow:{r:255,g:255,b:0}, white, black:{r:0,g:0,b:0}, green:{r:0,g:255,b:0} };
export class ColorMergeLogic {
  private snapshot: Snapshot = { state: { currentColor: white, targetColor: white, mixCount:0, maxMixes:1, hearts:3, chosenColors:[], colorClicks:{red:0,blue:0,yellow:0,white:0,black:0}, currentLevel:1 }, roundId:'', revision:0, status:'playing', bestLevel:1, mistakes:[] };
  busy = false;
  ready = false;
  private async request(action?: { type: string; color?: string }) {
    const response = await fetch('/api/game', {
      method: action ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'X-ColorMerge':'1', ...(action ? {'Content-Type':'application/json'} : {}) },
      body: action ? JSON.stringify({ ...action, roundId:this.snapshot.roundId, revision:this.snapshot.revision }) : undefined,
    });
    let data;
    try { data = await response.json(); } catch { throw new Error('The game service is unavailable. Please retry.'); }
    if (!response.ok) throw new Error(data.message || 'Unable to save your move.');
    if (!data.state || typeof data.revision !== 'number') throw new Error('Invalid game service response.');
    this.snapshot = data;
    this.ready = true;
    return data as Snapshot;
  }
  async load() {
    if (this.busy) return;
    this.busy = true;
    try { await this.request(); } finally { this.busy = false; }
  }
  private async command(action: { type: string; color?: string }) {
    if (this.busy || !this.ready) throw new Error('Please wait for the game.');
    this.busy = true;
    try { return await this.request(action); }
    catch (error) {
      // A lost response may already have committed. Reload authoritative state;
      // never blindly replay a tap or trust the optimistic display.
      try { await this.request(); } catch { this.ready = false; }
      throw error;
    } finally { this.busy = false; }
  }
  getState() { return structuredClone(this.snapshot.state); }
  get bestLevel() { return this.snapshot.bestLevel; }
  get mistakes() { return this.snapshot.mistakes; }
  get status() { return this.snapshot.status; }
  async addColor(color: string) {
    return (await this.command({ type:'tap', color })).result!;
  }
  async nextLevel() { await this.command({type:'advance'}); }
  async resetGame() { await this.command({type:'restart'}); }
  previewColor(color: string) {
    // Predict only the visual mix. Never predict scores, hearts or completion.
    const s = this.snapshot.state;
    s.chosenColors.push(color); s.colorClicks[color]++; s.mixCount++;
    const counts = {...s.colorClicks};
    const green = Math.min(counts.blue, counts.yellow);
    counts.blue -= green; counts.yellow -= green; counts.green = green;
    const count = Object.values(counts).reduce((a,b) => a+b,0);
    s.currentColor = {
      r:Object.entries(counts).reduce((sum,[c,n])=>sum+values[c].r*n,0)/count,
      g:Object.entries(counts).reduce((sum,[c,n])=>sum+values[c].g*n,0)/count,
      b:Object.entries(counts).reduce((sum,[c,n])=>sum+values[c].b*n,0)/count,
    };
  }
  getRemainingMixes() { return this.snapshot.state.maxMixes-this.snapshot.state.mixCount; }
  getTargetColorString() { const c=this.snapshot.state.targetColor; return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`; }
  getCurrentColorString() { const c=this.snapshot.state.currentColor; return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`; }
  isTargetWhite() { return this.getTargetColorString()==='rgb(255, 255, 255)'; }
  isCurrentMixWhite() { return this.getCurrentColorString()==='rgb(255, 255, 255)'; }
}
