// Local verification fixture only. Production never imports this store.
import express from 'express';
import { makeHandler } from '../server/secure/handler';
import type { Run } from '../server/secure/game';
import type { Store } from '../server/secure/store';
const data = new Map<string, Run>();
const store: Store = {
  async get(id) { const run=data.get(id); return run && structuredClone(run); },
  async create(id,run) { data.set(id,structuredClone(run)); },
  async save(id,revision,run) { if(data.get(id)?.revision!==revision)return false; data.set(id,structuredClone(run)); return true; }
};
const app=express(); app.use(express.json({limit:'4kb'}));
app.all('/api/game',makeHandler(()=>store));
app.use(express.static('dist/public'));
app.listen(4173,'0.0.0.0',()=>console.log('Local browser fixture: http://localhost:4173'));
