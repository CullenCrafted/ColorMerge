import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRevenueCatEvent,validRevenueCatSecret} from '../server/commerce/revenuecat';
import type {CommerceStore} from '../server/commerce/store';
test('RevenueCat callback requires exact sufficiently strong authorization secret',()=>{
 const secret='a'.repeat(40);
 assert.equal(validRevenueCatSecret('Bearer '+secret,secret),true);
 assert.equal(validRevenueCatSecret('Bearer '+'b'.repeat(40),secret),false);
 assert.equal(validRevenueCatSecret(undefined,secret),false);
 assert.equal(validRevenueCatSecret('Bearer short','short'),false);
});
test('native provider events ignore unknown SKU and untrusted environment; duplicate and refund-first deliveries do not create extra hearts',async()=>{
 const oldPrice=process.env.REVENUECAT_PRODUCT_HEARTS_5;const oldEnvironment=process.env.REVENUECAT_ENVIRONMENT;
 process.env.REVENUECAT_PRODUCT_HEARTS_5='game.hearts5';process.env.REVENUECAT_ENVIRONMENT='SANDBOX';
 let balance=0;
 const transactions=new Map<string,{refunded:boolean;credited:boolean}>();
 const store={nativeEvent:async(tx:string,_wallet:string,_product:string,hearts:number,refund:boolean)=>{
  const t=transactions.get(tx)||{refunded:false,credited:false};
  if(refund&&!t.refunded){if(t.credited)balance-=hearts;t.refunded=true;}
  else if(!refund&&!t.refunded&&!t.credited){balance+=hearts;t.credited=true;}
  transactions.set(tx,t);
 }} as unknown as CommerceStore;
 const base={type:'NON_RENEWING_PURCHASE',store:'APP_STORE',environment:'SANDBOX',app_user_id:'abcdefab-abcd-abcd-abcd-abcdefabcdef',product_id:'game.hearts5',transaction_id:'tx1'};
 try{
  await applyRevenueCatEvent(store,{event:{...base,product_id:'forged.hearts999'}});assert.equal(balance,0);
  await applyRevenueCatEvent(store,{event:{...base,environment:'PRODUCTION'}});assert.equal(balance,0);
  await applyRevenueCatEvent(store,{event:base});await applyRevenueCatEvent(store,{event:base});assert.equal(balance,5);
  await applyRevenueCatEvent(store,{event:{...base,type:'CANCELLATION'}});await applyRevenueCatEvent(store,{event:{...base,type:'CANCELLATION'}});assert.equal(balance,0);
  await applyRevenueCatEvent(store,{event:{...base,type:'CANCELLATION',transaction_id:'tx2'}});
  await applyRevenueCatEvent(store,{event:{...base,transaction_id:'tx2'}});assert.equal(balance,0);
  await assert.rejects(()=>applyRevenueCatEvent(store,{event:{...base,app_user_id:'forged'}}));
 }finally{
  if(oldPrice===undefined)delete process.env.REVENUECAT_PRODUCT_HEARTS_5;else process.env.REVENUECAT_PRODUCT_HEARTS_5=oldPrice;
  if(oldEnvironment===undefined)delete process.env.REVENUECAT_ENVIRONMENT;else process.env.REVENUECAT_ENVIRONMENT=oldEnvironment;
 }
});
