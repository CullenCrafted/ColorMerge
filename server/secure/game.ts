import { randomUUID } from 'node:crypto';
import { ColorMergeLogic, type ColorMergeState } from './engine.js';

export type Action = { type: 'tap'; color: string; roundId: string; revision: number } | { type: 'advance' | 'restart'; roundId: string; revision: number };
export interface Run {
  engine: ColorMergeState;
  roundId: string;
  revision: number;
  status: 'playing' | 'won' | 'over';
  bestLevel: number;
  mistakes: { guess: string[]; correct: string[]; level: number; roundId: string }[];
  rateStart: number;
  rateCount: number;
}
export function newRun(bestLevel = 1): Run {
  return { engine: new ColorMergeLogic().getState(), roundId: randomUUID(), revision: 0, status: 'playing', bestLevel, mistakes: [], rateStart: Date.now(), rateCount: 0 };
}
export function publicRun(run: Run) {
  const { recipe, ...state } = run.engine;
  return { state, roundId: run.roundId, revision: run.revision, status: run.status, bestLevel: run.bestLevel,
    mistakes: run.mistakes.filter(m => m.roundId !== run.roundId || run.status !== 'playing').map(({ roundId, ...m }) => m) };
}
export class GameError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function transition(saved: Run, action: Action, now = Date.now()) {
  const run = structuredClone(saved);
  if (action.revision !== run.revision || action.roundId !== run.roundId) throw new GameError(409, 'The game changed. Please retry.');
  if (now - run.rateStart >= 60000) { run.rateStart = now; run.rateCount = 0; }
  if (++run.rateCount > 600) throw new GameError(429, 'Please slow down.');
  const game = ColorMergeLogic.restore(run.engine);
  let result = { success: false, gameOver: false, levelComplete: false, bonusHeart: false };
  if (action.type === 'tap') {
    if (run.status !== 'playing') throw new GameError(409, 'This round is finished.');
    if (!['red', 'blue', 'yellow', 'white', 'black'].includes(action.color)) throw new GameError(400, 'Invalid pigment.');
    const guess = [...run.engine.chosenColors, action.color];
    result = game.addColor(action.color);
    if (!result.success) run.mistakes.push({ guess, correct: game.getCurrentTargetColorArray(), level: run.engine.currentLevel, roundId: run.roundId });
    // Bound session size without changing the game rules.
    run.mistakes = run.mistakes.slice(-100);
    if (result.levelComplete) run.status = 'won';
    if (result.gameOver) run.status = 'over';
    run.engine = game.getState();
  } else if (action.type === 'advance') {
    if (run.status !== 'won') throw new GameError(409, 'Complete this level first.');
    game.nextLevel();
    run.engine = game.getState();
    run.bestLevel = Math.max(run.bestLevel, run.engine.currentLevel);
    run.roundId = randomUUID();
    run.status = 'playing';
  } else if (action.type === 'restart') {
    const fresh = newRun(run.bestLevel);
    run.engine = fresh.engine; run.roundId = fresh.roundId; run.status = 'playing'; run.mistakes = [];
  } else throw new GameError(400, 'Invalid action.');
  run.revision++;
  return { run, result };
}
