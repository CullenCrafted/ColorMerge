export interface RemixSave {
  version: 1;
  unlockedLevel: number;
  selectedLevel: number;
  bestTimes: Record<string, number>;
  settings: { sound: boolean; haptics: boolean; reducedMotion: boolean };
}
const KEY = "colormerge.remix.v1";
const LIMIT = 100000;
const initial = (): RemixSave => ({
  version: 1, unlockedLevel: 1, selectedLevel: 1, bestTimes: {},
  settings: { sound: false, haptics: true, reducedMotion: typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches },
});
const validLevel = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= LIMIT;
export function readRemixSave(): RemixSave {
  const fallback = initial();
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return fallback;
    const data = raw as Partial<RemixSave>;
    if (data.version !== 1 || !validLevel(data.unlockedLevel)) return fallback;
    fallback.unlockedLevel = data.unlockedLevel;
    fallback.selectedLevel = validLevel(data.selectedLevel) ? Math.min(data.selectedLevel, data.unlockedLevel) : data.unlockedLevel;
    if (data.bestTimes && typeof data.bestTimes === "object") {
      for (const [key, value] of Object.entries(data.bestTimes)) {
        if (validLevel(Number(key)) && Number(key) < data.unlockedLevel && typeof value === "number" && Number.isFinite(value) && value >= 0) fallback.bestTimes[key] = value;
      }
    }
    if (data.settings && typeof data.settings === "object") {
      for (const key of ["sound", "haptics", "reducedMotion"] as const) {
        if (typeof data.settings[key] === "boolean") fallback.settings[key] = data.settings[key];
      }
    }
  } catch { /* Private browsing or a damaged save must not prevent play. */ }
  return fallback;
}
export function writeRemixSave(save: RemixSave): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(save)); return true; }
  catch { return false; }
}
export function completeLevel(save: RemixSave, level: number, elapsedMs: number, assisted = false): RemixSave {
  if (!validLevel(level) || level > save.unlockedLevel) return save;
  const previous = save.bestTimes[String(level)];
  const bestTimes = { ...save.bestTimes };
  if (!assisted && Number.isFinite(elapsedMs) && elapsedMs >= 0 && (previous === undefined || elapsedMs < previous)) bestTimes[String(level)] = elapsedMs;
  const unlockedLevel = Math.min(LIMIT, Math.max(save.unlockedLevel, level + 1));
  return { ...save, unlockedLevel, selectedLevel: Math.min(level + 1, unlockedLevel), bestTimes };
}
