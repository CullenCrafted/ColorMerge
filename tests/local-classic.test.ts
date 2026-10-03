import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalClassicLogic, LOCAL_CLASSIC_KEY } from '../client/src/lib/local-classic-logic';
import { ColorMergeLogic as Engine } from '../shared/classic-engine';
import { ColorMergeLogic as ServerEngine } from '../server/secure/engine';

function memory() {
  const data = new Map<string, string>();
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}
function fixture(level = 2, hearts = 3) {
  const storage = memory();
  const state = new Engine().getState();
  state.currentLevel = level; state.maxMixes = level; state.hearts = hearts;
  state.recipe = { red: level, blue: 0, yellow: 0, white: 0, black: 0 };
  state.targetColor = { r: 255, g: 0, b: 0 };
  storage.setItem(LOCAL_CLASSIC_KEY, JSON.stringify({
    version: 1, engine: state, status: 'playing', bestLevel: level, mistakes: [],
    runId: 'native-1234567890-test', revision: 0,
  }));
  return storage;
}
test('server export uses the unchanged shared Classic engine', () => {
  assert.equal(ServerEngine, Engine);
});
test('native Classic loads and plays without making a network request', async () => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network forbidden'); };
  try {
    const game = new LocalClassicLogic(fixture());
    await game.load();
    assert.equal(game.ready, true);
    const result = await game.addColor('red');
    assert.equal(result.levelComplete, true);
    assert.equal(result.bonusHeart, true);
    assert.equal(game.status, 'won');
    assert.equal(game.getState().hearts, 4);
  } finally { globalThis.fetch = fetchBefore; }
});
test('preview never commits or double-counts a tap, rewards only after commit', async () => {
  const storage = fixture(), game = new LocalClassicLogic(storage);
  await game.load();
  const saved = storage.getItem(LOCAL_CLASSIC_KEY);
  game.previewColor('red'); game.previewColor('red');
  assert.equal(game.getState().mixCount, 1);
  assert.equal(game.getState().hearts, 3);
  assert.equal(game.status, 'playing');
  assert.equal(storage.getItem(LOCAL_CLASSIC_KEY), saved);
  await game.addColor('red');
  assert.equal(game.getState().mixCount, 1);
  assert.equal(game.getState().colorClicks.red, 1);
  assert.equal(game.getState().hearts, 4);
  await assert.rejects(game.addColor('red'));
});
test('loaded game restores target, actual quantities and verified local transition state', async () => {
  const storage = fixture(3), first = new LocalClassicLogic(storage);
  await first.load(); await first.addColor('blue');
  const second = new LocalClassicLogic(storage);
  await second.load();
  assert.deepEqual(second.getState(), first.getState());
  assert.equal(second.continuationKey, first.continuationKey);
  assert.equal(second.status, 'playing');
  assert.equal('recipe' in second.getState(), false);
  const exposed = second.getState(); exposed.colorClicks.red = 999;
  assert.equal(second.getState().colorClicks.red, 0);
});
test('failure retries same target and hides active answer until run ends', async () => {
  const game = new LocalClassicLogic(fixture(1, 2));
  await game.load();
  const target = game.getTargetColorString();
  await game.addColor('blue');
  assert.equal(game.getState().hearts, 1);
  assert.equal(game.getState().mixCount, 0);
  assert.equal(game.getTargetColorString(), target);
  assert.equal(game.mistakes.length, 0);
  await game.addColor('blue');
  assert.equal(game.status, 'over');
  assert.equal(game.mistakes.length, 2);
  await assert.rejects(game.nextLevel());
});
test('paid continuation keeps failed target and stable debit identity across reload', async () => {
  const storage = fixture(1, 1), first = new LocalClassicLogic(storage);
  await first.load(); await first.addColor('blue');
  const failedKey = first.continuationKey, target = first.getTargetColorString();
  const game = new LocalClassicLogic(storage); await game.load();
  assert.equal(game.continuationKey, failedKey);
  assert.equal(game.status, 'over');
  await game.continueWithHeart();
  assert.equal(game.status, 'playing');
  assert.equal(game.getState().hearts, 1);
  assert.equal(game.getState().mixCount, 0);
  assert.equal(game.getTargetColorString(), target);
  assert.notEqual(game.continuationKey, failedKey);
  await assert.rejects(game.continueWithHeart());
  const restored = new LocalClassicLogic(storage); await restored.load();
  assert.equal(restored.status, 'playing');
  assert.equal(restored.getState().hearts, 1);
  assert.equal(restored.continuationKey, game.continuationKey);
});
test('milestone heart and best level match Classic; restart keeps local best', async () => {
  const storage = fixture(9), game = new LocalClassicLogic(storage);
  await game.load();
  await game.addColor('red');
  await game.nextLevel();
  assert.equal(game.getState().currentLevel, 10);
  assert.equal(game.getState().hearts, 5);
  assert.equal(game.bestLevel, 10);
  await game.resetGame();
  assert.equal(game.getState().currentLevel, 1);
  assert.equal(game.getState().hearts, 3);
  assert.equal(game.bestLevel, 10);
});
test('malformed local quantities are discarded and remote verified progress is ignored', async () => {
  const storage = fixture(3);
  const corrupt = JSON.parse(storage.getItem(LOCAL_CLASSIC_KEY)!);
  corrupt.engine.colorClicks.green = 1;
  corrupt.engine.hearts = 99;
  storage.setItem(LOCAL_CLASSIC_KEY, JSON.stringify(corrupt));
  storage.setItem('colormerge.stats', JSON.stringify({ bestLevel: 500 }));
  const game = new LocalClassicLogic(storage); await game.load();
  assert.equal(game.getState().currentLevel, 1);
  assert.equal(game.getState().hearts, 3);
  assert.equal(game.bestLevel, 1);
});
test('unsupported pigment cannot enter native raw quantities', async () => {
  const game = new LocalClassicLogic(fixture()); await game.load();
  game.previewColor('green');
  assert.equal(game.getState().mixCount, 0);
  await assert.rejects(game.addColor('green'));
  assert.equal(game.getState().mixCount, 0);
});
test('offline play remains available when device storage throws', async () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); }, removeItem() {} };
  const game = new LocalClassicLogic(storage); await game.load();
  assert.equal(game.ready, true);
  await game.addColor('red');
  assert.equal(game.ready, true);
});
