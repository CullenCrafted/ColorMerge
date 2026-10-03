import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import Stripe from 'stripe';
import {fulfillSession,isAllowedRequest,makeCommerceHandler} from '../server/commerce/handler';
import type {CommerceStore} from '../server/commerce/store';
import type {Request} from 'express';
test('only same-origin custom-header requests enter the wallet',()=>{
 assert.equal(isAllowedRequest({headers:{'x-colormerge':'1',origin:'https://game.example'}} as unknown as Request,'https://game.example'),true);
 assert.equal(isAllowedRequest({headers:{origin:'https://game.example'}} as unknown as Request,'https://game.example'),false);
 assert.equal(isAllowedRequest({headers:{'x-colormerge':'1',origin:'https://evil.example'}} as unknown as Request,'https://game.example'),false);
});
test('fulfillment uses stored order hearts, ignores unpaid sessions and deduplicates delivery',async()=>{
 let balance=0;const seen=new Set<string>();
 const store={
  findOrder:async()=>({id:'order',wallet_id:'wallet',hearts:5,price_id:'price',session_id:'cs_test'}),
  recordPayment:async()=>{},
  apply:async(_wallet:string,key:string,delta:number)=>{if(!seen.has(key)){seen.add(key);balance+=delta;}return {authorizationId:key,balance};}
 } as unknown as CommerceStore;
 const session={id:'cs_test',mode:'payment',payment_status:'unpaid',payment_intent:'pi_test',metadata:{orderId:'order',walletId:'wallet',hearts:'999999'}} as unknown as Stripe.Checkout.Session;
 await fulfillSession(store,session);assert.equal(balance,0);
 session.payment_status='paid';
 await Promise.all([fulfillSession(store,session),fulfillSession(store,session)]);
 assert.equal(balance,5);
 await assert.rejects(()=>fulfillSession(store,{...session,id:'forged'}));
});
test('webhook rejects missing/invalid signatures and accepts exact signed raw body',async()=>{
 const previous=process.env.STRIPE_WEBHOOK_SECRET;
 process.env.STRIPE_WEBHOOK_SECRET='whsec_local_test';
 const stripe=new Stripe('sk_test_local');
 const app=express();app.use(express.raw({type:'application/json'}));
 app.all('/api/commerce',makeCommerceHandler({enabled:()=>true,stripe:()=>stripe}));
 const server=app.listen(0,'127.0.0.1');
 await new Promise<void>(resolve=>server.once('listening',resolve));
 const url='http://127.0.0.1:'+(server.address() as {port:number}).port+'/api/commerce?action=webhook';
 const payload=JSON.stringify({id:'evt_test',object:'event',type:'unrelated.event',data:{object:{}}});
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_local_test'});
 try {
  const post=(body:string,sig?:string)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(sig?{'Stripe-Signature':sig}:{})},body});
  assert.equal((await post(payload)).status,400);
  assert.equal((await post(payload,'forged')).status,400);
  assert.equal((await post(payload,signature)).status,200);
  assert.equal((await post(payload+' ',signature)).status,400);
 }finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));if(previous===undefined)delete process.env.STRIPE_WEBHOOK_SECRET;else process.env.STRIPE_WEBHOOK_SECRET=previous;}
});
