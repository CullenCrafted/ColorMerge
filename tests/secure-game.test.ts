import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { newRun, publicRun, transition, type Run } from '../server/secure/game';
import { ColorMergeLogic } from '../server/secure/engine';
import { makeHandler } from '../server/secure/handler';
import type { Store } from '../server/secure/store';
import { categorizeDatabaseError, logDatabaseFailure, logGameFailure } from '../server/secure/diagnostics';

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
test('diagnostics categorize database failures without logging secrets', () => {
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'42P01'})),'missing-sessions-table');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'28P01'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'28000'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'3D000'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'08006'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'57P01'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'ECONNREFUSED'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'ETIMEDOUT'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'ENOTFOUND'})),'connection-or-auth');
  assert.equal(categorizeDatabaseError(Object.assign(new Error('x'),{code:'XX000'})),'other-database-failure');
  assert.equal(categorizeDatabaseError(new Error('plain failure')),'other-database-failure');
  assert.equal(categorizeDatabaseError(undefined),'other-database-failure');
});
test('diagnostic logs contain only categories and safe codes, never raw error text', () => {
  const secret='******db.example/colormerge ****** recipe=red,blue';
  const logged: string[]=[];
  const original=console.error;
  console.error=(...args: unknown[])=>{ logged.push(args.map(String).join(' ')); };
  try {
    logDatabaseFailure('get',Object.assign(new Error(secret),{code:'42P01'}));
    logDatabaseFailure('save',Object.assign(new Error(secret),{code:'28P01'}));
    logDatabaseFailure('create',new Error(secret));
    logDatabaseFailure('store-init',new Error('missing'));
    logGameFailure(new Error('DATABASE_URL is required'));
    logGameFailure(new Error(secret));
  } finally { console.error=original; }
  assert.equal(logged.length,6);
  assert.match(logged[0],/missing-sessions-table \(code 42P01\)/);
  assert.match(logged[1],/connection-or-auth \(code 28P01\)/);
  assert.match(logged[2],/other-database-failure/);
  assert.match(logged[3],/other-database-failure/);
  assert.match(logged[4],/missing-database-url/);
  assert.match(logged[5],/unexpected/);
  for (const line of logged) {
    assert.doesNotMatch(line,/postgres:\/\/|p%40ssw0rd|hunter2|recipe|password/);
  }
});
test('503 responses log diagnostics while keeping the public message generic', async () => {
  const secret='******db.example/colormerge';
  const failing: Store = {
    async get() { throw Object.assign(new Error(secret),{code:'42P01'}); },
    async create() { throw Object.assign(new Error(secret),{code:'42P01'}); },
    async save() { return false; }
  };
  const app=express(); app.use(express.json({limit:'4kb'})); app.all('/api/game',makeHandler(()=>failing));
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const port=(server.address() as any).port;
  const logged: string[]=[];
  const original=console.error;
  console.error=(...args: unknown[])=>{ logged.push(args.map(String).join(' ')); };
  try {
    const res=await fetch(`http://127.0.0.1:${port}/api/game`,{headers:{'X-ColorMerge':'1'}});
    assert.equal(res.status,503);
    const body=await res.json();
    assert.deepEqual(body,{message:'The game service is unavailable. Please try again shortly.'});
    assert.doesNotMatch(JSON.stringify(body),/postgres:\/\/|secretpw|42P01/);
    assert.ok(logged.length>=1);
    for (const line of logged) assert.doesNotMatch(line,/postgres:\/\/|secretpw/);
  } finally { console.error=original; server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
});
