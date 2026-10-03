import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import express from 'express';
import {rotateRecoveryCode} from '../server/commerce/recovery';
import {makeCommerceHandler} from '../server/commerce/handler';
import type {CommerceStore} from '../server/commerce/store';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
test('replacement code invalidates old recovery without changing wallet identity',async()=>{
 const wallet={id:'wallet',balance:12};let recoveryHash=hash('old-code');
 const store={
  rotateRecovery:async(id:string,newHash:string)=>{assert.equal(id,wallet.id);recoveryHash=newHash;},
  restore:async(codeHash:string)=>codeHash===recoveryHash?wallet:undefined,
 } as unknown as CommerceStore;
 await assert.rejects(()=>rotateRecoveryCode(store,undefined));
 const result=await rotateRecoveryCode(store,wallet);
 assert.match(result.recoveryCode,/^[a-f0-9]{64}$/);
 assert.equal(await store.restore(hash('old-code'),'new-token'),undefined);
 assert.deepEqual(await store.restore(hash(result.recoveryCode),'new-token'),wallet);
 const second=await rotateRecoveryCode(store,wallet);
 assert.notEqual(second.recoveryCode,result.recoveryCode);
 assert.equal(await store.restore(hash(result.recoveryCode),'token'),undefined);
 assert.deepEqual(await store.restore(hash(second.recoveryCode),'token'),wallet);
});
test('web recovery rotation requires the authenticated cookie and ignores requested wallet IDs',async()=>{
 const token='a'.repeat(64);let rotated='';
 const store={
  wallet:async(tokenHash:string)=>tokenHash===hash(token)?{id:'authenticated-wallet',balance:5}:undefined,
  rotateRecovery:async(id:string)=>{rotated=id;},
 } as unknown as CommerceStore;
 const app=express();app.use(express.json());
 app.all('/api/commerce',makeCommerceHandler({enabled:()=>true,store:()=>store}));
 const server=app.listen(0,'127.0.0.1');
 await new Promise<void>(resolve=>server.once('listening',resolve));
 const url='http://127.0.0.1:'+(server.address() as {port:number}).port+'/api/commerce?action=rotate-recovery';
 try{
  const post=(cookie?:string)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-ColorMerge':'1',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({walletId:'victim-wallet'})});
  assert.equal((await post()).status,401);assert.equal(rotated,'');
  assert.equal((await post('cm_wallet='+token)).status,200);assert.equal(rotated,'authenticated-wallet');
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
