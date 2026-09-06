import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { newRun, publicRun, transition, type Run } from '../server/secure/game';
import { ColorMergeLogic } from '../server/secure/engine';
import { makeHandler } from '../server/secure/handler';
import type { Store } from '../server/secure/store';

function fixed(colors: string[], maxMixes = colors.length, hearts = 3) {
  const run = newRun();
  const e = ColorMergeLogic.restore({ ...run.engine, maxMixes: colors.length + 1 });
  for (const c of colors) e.addColor(c);
  run.engine.targetColor = e.getState().currentColor;
  run.engine.recipe = Object.fromEntries(['red','blue','yellow','white','black'].map(c=>[c,colors.filter(v=>v===c).length]));
  run.engine.maxMixes = maxMixes; run.engine.hearts = hearts;
  return run;
}
const action = (run: Run, color: string) => ({ type:'tap' as const, color, revision:run.revision, roundId:run.roundId });
test('public state omits recipe, including after failed attempts on active target', () => {
  let run = fixed(['red']);
  run = transition(run, action(run,'blue')).run;
  assert.equal(run.mistakes.length,1);
  assert.equal(publicRun(run).mistakes.length,0);
  assert.equal('recipe' in publicRun(run).state,false);
  assert.deepEqual(run.engine.targetColor,{r:255,g:0,b:0});
  assert.equal(run.engine.hearts,2);
});
test('pigment permutations preserve green conversion and rounded matching', () => {
  for (const colors of [['red','blue','yellow'],['yellow','red','blue'],['blue','yellow','red']]) {
    let run = fixed(['red','blue','yellow']);
    for (const color of colors) run = transition(run,action(run,color)).run;
    assert.equal(run.status,'won'); assert.equal(run.engine.hearts,3);
  }
});
test('shorter matches award one heart; completed rounds reject further taps and duplicate advance', () => {
  let run = fixed(['red','red'], 2);
  const move = action(run,'red');
  run = transition(run,move).run;
  assert.equal(run.status,'won'); assert.equal(run.engine.hearts,4);
  assert.throws(()=>transition(run,move));
  assert.throws(()=>transition(run,action(run,'red')));
  const advance = {type:'advance' as const, revision:run.revision, roundId:run.roundId};
  run = transition(run,advance).run;
  assert.equal(run.engine.currentLevel,2);
  assert.throws(()=>transition(run,advance));
});
test('level ten milestone and failure at zero hearts remain authoritative', () => {
  let run = fixed(['red']); run.engine.currentLevel = 9;
  run = transition(run,action(run,'red')).run;
  run = transition(run,{type:'advance',revision:run.revision,roundId:run.roundId}).run;
  assert.equal(run.engine.currentLevel,10); assert.equal(run.engine.hearts,4);
  run = fixed(['red'],1,1); run = transition(run,action(run,'black')).run;
  assert.equal(run.status,'over'); assert.equal(publicRun(run).mistakes.length,1);
  assert.throws(()=>transition(run,action(run,'red')));
});
test('restart retains verified best and cannot bypass rate limit', () => {
  let run = fixed(['red']); run.bestLevel=12; run.rateCount=600;
  assert.throws(()=>transition(run,{type:'restart',revision:run.revision,roundId:run.roundId}));
  run.rateCount=3;
  run=transition(run,{type:'restart',revision:run.revision,roundId:run.roundId}).run;
  assert.equal(run.bestLevel,12); assert.equal(run.engine.currentLevel,1); assert.equal(run.rateCount,4);
});
test('HTTP sessions, forged stats, origins, concurrent moves and missing database', async () => {
  const data = new Map<string,Run>();
  const store: Store = {
    async get(id) { const r=data.get(id); return r && structuredClone(r); },
    async create(id,run) { data.set(id,structuredClone(run)); },
    async save(id,revision,run) { if(data.get(id)?.revision!==revision) return false; data.set(id,structuredClone(run)); return true; }
  };
  const app=express(); app.use(express.json({limit:'4kb'})); app.all('/api/game',makeHandler(()=>store));
  app.all('/unavailable',makeHandler(()=>{throw new Error('secret connection details');}));
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const port=(server.address() as any).port;
  const url=`http://127.0.0.1:${port}/api/game`;
  const headers={'X-ColorMerge':'1'};
  try {
    assert.equal((await fetch(url)).status,403);
    const first=await fetch(url,{headers}); const a=await first.json();
    const cookie=first.headers.get('set-cookie')!.split(';')[0];
    assert.match(first.headers.get('set-cookie')!,/HttpOnly/);
    assert.match(first.headers.get('cache-control')!,/no-store/);
    const b=await (await fetch(url,{headers})).json(); assert.notEqual(a.roundId,b.roundId);
    const post=(body: unknown, extra={})=>fetch(url,{method:'POST',headers:{...headers,Cookie:cookie,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
    assert.equal((await post({type:'tap',color:'red',roundId:a.roundId,revision:a.revision,hearts:99})).status,400);
    assert.equal((await post({type:'advance',roundId:a.roundId,revision:a.revision})).status,409);
    assert.equal((await post({}, {Origin:'https://evil.example'})).status,403);
    const body={type:'tap',color:'red',roundId:a.roundId,revision:a.revision};
    const results=await Promise.all([post(body),post(body)]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    const saved=await (await fetch(url,{headers:{...headers,Cookie:cookie}})).json();
    assert.equal(saved.revision,1); assert.equal('recipe' in saved.state,false);
    const unavailable=await fetch(`http://127.0.0.1:${port}/unavailable`,{headers});
    assert.equal(unavailable.status,503); assert.doesNotMatch(await unavailable.text(),/secret connection/);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
});
