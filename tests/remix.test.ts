import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, getLevelSpec, reducer, mix, matches, emptyRecipe, countRecipe, remainingAdditions, targetVisible, targetOpacity, restoreRun, PIGMENTS } from '../shared/remix';
import { ColorMergeLogic as ClassicEngine } from '../server/secure/engine';
import type { RemixState } from '../shared/remix';

function start(level = 1, seed = 1): RemixState {
  let state = reducer(createRun(level, seed), { type: 'start' });
  if (state.phase === 'reveal') state = reducer(state, { type: 'tick', deltaMs: state.spec.revealMs });
  return state;
}
function solveSelected(state: RemixState): RemixState {
  const object = state.objects.find(o => o.id === state.selectedId)!;
  for (const color of PIGMENTS) {
    const count = object.target[color] - object.recipe[color];
    for (let i = 0; i < count && state.phase === 'playing'; i++) {
      if (state.objects.find(o => o.id === object.id)!.status !== 'active') break;
      state = reducer(state, { type: 'add', color });
    }
  }
  if (state.spec.style === 'recall' || state.spec.modifier) state = reducer(state, { type: 'submit' });
  return state;
}
test('mixer preserves pairing, rounded equivalence and raw quantities', () => {
  const blank = emptyRecipe();
  assert.deepEqual(mix({ ...blank, blue: 1, yellow: 1 }), { r: 0, g: 255, b: 0 });
  assert.deepEqual(mix({ ...blank, red: 1, blue: 1, yellow: 1 }), { r: 127.5, g: 127.5, b: 0 });
  assert.ok(matches({ ...blank, red: 1 }, { ...blank, red: 2 }));
  assert.ok(!matches({ ...blank, red: 1, white: 1 }, { ...blank, red: 2, white: 1 }));
  assert.equal(countRecipe(blank), 0);
  assert.deepEqual(mix(blank), { r: 255, g: 255, b: 255 });
});
test('introductions are spaced and complexity/workload are capped', () => {
  const expected = [[1,'mix'],[11,'rings'],[21,'fall'],[36,'strands'],[51,'recall'],[66,'tower'],[81,'swarm'],[101,'zen'],[121,'sphere']] as const;
  for (const [level, style] of expected) assert.equal(getLevelSpec(level).style, style);
  assert.equal(getLevelSpec(141).modifier, 'recall');
  assert.equal(getLevelSpec(141).style, 'strands');
  assert.equal(getLevelSpec(14).style, 'mix');
  for (let level = 1; level <= 1000; level++) {
    const spec = getLevelSpec(level);
    assert.ok(spec.recipeSize <= 6 && spec.objectCount <= 20 && spec.missingCount <= 3);
  }
});
test('every generated object is unsolved and has a valid raw-quantity completion', () => {
  for (let level = 1; level <= 180; level++) for (let seed = 0; seed < 8; seed++) {
    const state = createRun(level, seed);
    assert.deepEqual(state, createRun(level, seed));
    for (const object of state.objects) {
      assert.ok(!matches(object.initial, object.target), 'already solved at ' + level);
      const completion = { ...object.initial };
      for (const color of PIGMENTS) {
        assert.ok(object.target[color] >= object.initial[color]);
        completion[color] += object.target[color] - object.initial[color];
      }
      assert.ok(matches(completion, object.target));
      assert.ok(countRecipe(object.target) <= 6);
    }
  }
});
test('full reducer playthrough succeeds across every progression level', () => {
  for (let level = 1; level <= 180; level++) {
    let state = start(level, 17), guard = 0;
    while (state.phase === 'playing' && guard++ < 500) {
      if (state.selectedId) state = solveSelected(state);
      else state = reducer(state, { type: 'tick', deltaMs: state.spec.spawnEveryMs });
    }
    assert.equal(state.phase, 'won', 'level ' + level);
    assert.equal(state.lives, 3);
    assert.equal(state.solved, state.spec.objectCount);
  }
});
test('undo/reset restore initial pigment quantities without erasing other objects', () => {
  let state = start(36);
  const initial = structuredClone(state.objects[0].recipe);
  state.spec.modifier = 'recall'; // Defer match evaluation while exercising edits.
  state = reducer(state, { type: 'add', color: 'black' });
  state = reducer(state, { type: 'undo' });
  assert.deepEqual(state.objects[0].recipe, initial);
  state = reducer(state, { type: 'add', color: 'red' });
  state = reducer(state, { type: 'select', id: state.objects[1].id });
  state = reducer(state, { type: 'reset' });
  assert.equal(state.objects[0].additions.length, 1);
});
test('recall does not reveal target or evaluate correctness during mixing', () => {
  let state = reducer(createRun(51), { type: 'start' });
  assert.ok(targetVisible(state));
  state = reducer(state, { type: 'tick', deltaMs: state.spec.revealMs });
  assert.ok(!targetVisible(state));
  const object = state.objects[0];
  for (const color of PIGMENTS) for (let i = 0; i < object.target[color]; i++) state = reducer(state, { type: 'add', color });
  assert.equal(state.phase, 'playing');
  assert.equal(state.solved, 0);
  assert.equal(state.lives, 3);
  state = reducer(state, { type: 'submit' });
  assert.equal(state.phase, 'won');
});
test('failed memory submission loses a life and resets only the answer', () => {
  let state = start(51);
  state = reducer(state, { type: 'submit' });
  assert.equal(state.lives, 2);
  assert.equal(state.phase, 'playing');
  assert.deepEqual(state.objects[0].recipe, state.objects[0].initial);
});
test('pause freezes clocks and invalid time deltas do nothing', () => {
  let state = start(21);
  const frozen = reducer(state, { type: 'pause', paused: true });
  assert.deepEqual(reducer(frozen, { type: 'tick', deltaMs: 5000 }), frozen);
  assert.deepEqual(reducer(state, { type: 'tick', deltaMs: NaN }), state);
  assert.deepEqual(reducer(state, { type: 'tick', deltaMs: -1 }), state);
});
test('spawn/timer behavior is independent of frame batching', () => {
  const state = start(21);
  const batch = reducer(state, { type: 'tick', deltaMs: 7000 });
  let frames = state;
  for (let i = 0; i < 140; i++) frames = reducer(frames, { type: 'tick', deltaMs: 50 });
  assert.deepEqual(batch, frames);
  assert.equal(batch.objects.filter(o => o.status === 'active').length, 2);
  assert.equal(batch.selectedId, batch.objects[0].id);
});
test('countdown loss, free replay and authorized continue preserve appropriate work', () => {
  let state = start(36);
  state = solveSelected(state);
  const solved = state.solved;
  state = reducer(state, { type: 'tick', deltaMs: state.spec.timeLimitMs });
  assert.equal(state.phase, 'lost');
  assert.equal(state.lives, 0);
  const continued = reducer(state, { type: 'resume' });
  assert.equal(continued.phase, 'playing');
  assert.equal(continued.lives, 1);
  assert.equal(continued.solved, solved);
  assert.ok(continued.assisted);
  const replay = reducer(state, { type: 'retry' });
  assert.equal(replay.phase, 'intro');
  assert.equal(replay.lives, 3);
  assert.equal(replay.solved, 0);
  assert.equal(replay.seed, state.seed);
});
test('swarm overrun loses and continuation restores manageable unfinished shapes', () => {
  let state = start(90);
  // Select a later swarm level from the deterministic rotation.
  for (let level = 84; level < 141; level++) if (getLevelSpec(level).style === 'swarm' && getLevelSpec(level).objectCount > 6) { state = start(level); break; }
  state = reducer(state, { type: 'tick', deltaMs: state.spec.spawnEveryMs * 6 });
  assert.equal(state.phase, 'lost');
  const continued = reducer(state, { type: 'resume' });
  assert.equal(continued.phase, 'playing');
  assert.ok(continued.objects.filter(o => o.status === 'active').length <= 3);
});
test('zen fades without modifying the target recipe', () => {
  let state = start(101);
  const target = structuredClone(state.target);
  assert.equal(targetOpacity(state), 0);
  state = reducer(state, { type: 'tick', deltaMs: state.spec.travelMs / 2 });
  assert.equal(targetOpacity(state), 1);
  assert.deepEqual(state.target, target);
});
test('equivalent early solution is accepted', () => {
  let state = start(1);
  state.objects[0].target = { ...emptyRecipe(), red: 2 };
  state.objects[0].initial = emptyRecipe();
  state.objects[0].recipe = emptyRecipe();
  state = reducer(state, { type: 'add', color: 'red' });
  assert.equal(state.phase, 'won');
});
test('restore accepts valid saves and rejects malformed or impossible mixtures', () => {
  const state = start(36);
  assert.deepEqual(restoreRun(state), state);
  assert.equal(restoreRun(null), null);
  const bad = structuredClone(state); bad.objects[0].recipe.red += 100;
  assert.equal(restoreRun(bad), null);
  const lost = reducer(state, { type: 'tick', deltaMs: state.spec.timeLimitMs });
  assert.equal(restoreRun(lost)?.phase, 'lost');
  const wrong = structuredClone(state); wrong.objects[0].x = Infinity;
  assert.equal(restoreRun(wrong), null);
});

test('all pigment sequences through six taps agree with the original Classic mixer', () => {
  const base = new ClassicEngine().getState();
  const visit = (sequence: string[]) => {
    const classic = ClassicEngine.restore({
      ...base, maxMixes: 7, chosenColors: [], colorClicks: emptyRecipe(), mixCount: 0,
      currentColor: { r: 255, g: 255, b: 255 }, targetColor: { r: 1, g: 2, b: 3 },
    });
    const recipe = emptyRecipe();
    for (const color of sequence) { classic.addColor(color); recipe[color as keyof typeof recipe]++; }
    assert.deepEqual(mix(recipe), classic.getState().currentColor, sequence.join(','));
    if (sequence.length < 6) for (const color of PIGMENTS) visit([...sequence, color]);
  };
  visit([]);
});
