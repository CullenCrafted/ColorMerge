import {createHash,randomBytes} from 'node:crypto';
import type {Request,Response} from 'express';
import {commerceStore} from './store.js';
import {applyRevenueCatEvent,nativeConfigured,nativePacks,validRevenueCatSecret} from './revenuecat.js';
import {createAdChallenge,verifyAdReward} from './admob.js';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const secret=()=>randomBytes(32).toString('hex');
const validToken=(s:unknown):s is string=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const adsReady=()=>process.env.ADMOB_REWARDS_ENABLED==='true'&&process.env.ADMOB_CHILD_AUDIENCE_READY==='true'&&!!process.env.ADMOB_REWARD_SECRET&&!!process.env.ADMOB_REWARDED_AD_UNITS;
export function nativeOrigin(req:Request,res:Response) {
 const origin=req.headers.origin;
 const allowed=(process.env.NATIVE_COMMERCE_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
 if(typeof origin!=='string'||!allowed.includes(origin))return false;
 res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,X-ColorMerge,X-ColorMerge-Native');
 return true;
}
export async function nativeCommerceHandler(req:Request,res:Response,action:string) {
 res.setHeader('Cache-Control','private, no-store');
 try {
  if(action==='revenuecat-webhook') {
   if(req.method!=='POST'||!nativeConfigured())return res.sendStatus(503);
   if(!validRevenueCatSecret(req.headers.authorization,process.env.REVENUECAT_WEBHOOK_SECRET!))return res.sendStatus(401);
   const body=Buffer.isBuffer(req.body)?JSON.parse(req.body.toString('utf8')):req.body;
   await applyRevenueCatEvent(commerceStore(),body);
   return res.json({received:true});
  }
  // Public Google callback does not depend on Stripe being enabled.
  if(action==='admob-ssv'&&process.env.NATIVE_COMMERCE_ENABLED==='true') {
   if(req.method!=='GET'||!adsReady())return res.sendStatus(503);
   const raw=(req.url.split('?')[1]||'').replace(/^action=admob-ssv&/,'');
   const reward=await verifyAdReward(raw,{secret:process.env.ADMOB_REWARD_SECRET!,allowedAdUnits:process.env.ADMOB_REWARDED_AD_UNITS!.split(',').map(v=>v.trim())});
   await commerceStore().adReward(reward.walletId,reward.nonce,reward.transactionId);
   return res.json({received:true});
  }
  if(!nativeOrigin(req,res))return res.sendStatus(403);
  if(req.method==='OPTIONS')return res.sendStatus(204);
  if(req.headers['x-colormerge']!=='1'||req.headers['x-colormerge-native']!=='1')return res.sendStatus(403);
  if(!nativeConfigured())return res.status(503).json({message:'Native purchases are not available yet. Free play is available.'});
  if(!['GET','POST'].includes(req.method)||(action==='status')!==(req.method==='GET'))return res.sendStatus(405);
  if(req.method==='POST'&&!req.headers['content-type']?.startsWith('application/json'))return res.sendStatus(415);
  const body=req.method==='POST'?(Buffer.isBuffer(req.body)?JSON.parse(req.body.toString('utf8')||'{}'):req.body):{};
  if(!body||typeof body!=='object'||Array.isArray(body))return res.sendStatus(400);
  const store=commerceStore();
  if(action==='native-bootstrap'||action==='restore') {
   const token=secret();
   const recoveryCode=action==='native-bootstrap'?secret():body.recoveryCode;
   if(!validToken(recoveryCode))return res.sendStatus(400);
   const wallet=action==='native-bootstrap'?await store.createWallet(hash(token),hash(recoveryCode)):await store.restore(hash(recoveryCode),hash(token));
   if(!wallet)return res.status(404).json({message:'Recovery code not recognized.'});
   return res.json({token,recoveryCode,walletId:wallet.id,balance:Math.max(0,wallet.balance)});
  }
  const bearer=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';
  const wallet=validToken(bearer)?await store.wallet(hash(bearer)):undefined;
  if(!wallet)return res.status(401).json({message:'Restore your parent wallet or create a new wallet in the shop.'});
  if(action==='status')return res.json({available:true,walletId:wallet.id,balance:Math.max(0,wallet.balance),nativeProducts:nativePacks(),products:[]});
  if(action==='consume') {
   if(typeof body.idempotencyKey!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(body.idempotencyKey))return res.sendStatus(400);
   return res.json(await store.apply(wallet.id,'consume:'+wallet.id+':'+body.idempotencyKey,-1));
  }
  if(action==='ad-challenge') {
   if(!adsReady()||body.parentApproved!==true)return res.status(503).json({message:'Optional ads are unavailable.'});
   const challenge=createAdChallenge(wallet.id,process.env.ADMOB_REWARD_SECRET!);
   await store.adChallenge(wallet.id,challenge.nonce,challenge.expiresAt);
   return res.json({...challenge,walletId:wallet.id});
  }
  if(action==='ad-status') {
   if(typeof body.nonce!=='string'||body.nonce.length>200)return res.sendStatus(400);
   return res.json({granted:await store.adStatus(wallet.id,body.nonce),balance:Math.max(0,wallet.balance)});
  }
  return res.sendStatus(404);
 }catch(error){
  if(typeof error==='object'&&error&&'code'in error&&error.code==='P0002')return res.status(409).json({message:'No hearts available. You can retry for free.'});
  return res.status(503).json({message:'The shop is temporarily unavailable. Free play is available.'});
 }
}
