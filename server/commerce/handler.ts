import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PACKS, configured } from './catalog.js';
import { commerceStore, type CommerceStore, type Wallet } from './store.js';
import { createAdChallenge, verifyAdReward } from './admob.js';
const adsEnabled=()=>process.env.ADMOB_REWARDS_ENABLED==='true'&&process.env.ADMOB_CHILD_AUDIENCE_READY==='true'&&!!process.env.ADMOB_REWARD_SECRET&&!!process.env.ADMOB_REWARDED_AD_UNITS;
const cookieName='cm_wallet';
const hash=(value: string)=>createHash('sha256').update(value).digest('hex');
const secret=()=>randomBytes(32).toString('hex');
const tokenPattern=/^[a-f0-9]{64}$/;
function cookie(res: Response,token: string) {
 res.setHeader('Set-Cookie',cookieName+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000'+(process.env.NODE_ENV==='production'||process.env.VERCEL?'; Secure':''));
}
export function isAllowedRequest(req: Request, origin: string) {
 if(req.headers['x-colormerge']!=='1'||req.headers['sec-fetch-site']==='cross-site') return false;
 if(!req.headers.origin) return true;
 try{return new URL(req.headers.origin).origin===new URL(origin).origin;}catch{return false;}
}
function jsonBody(req: Request): Record<string,unknown> {
 const value=Buffer.isBuffer(req.body)?JSON.parse(req.body.toString('utf8')||'{}'):req.body;
 if(!value || typeof value!=='object'||Array.isArray(value)) throw new Error('Invalid request');
 return value;
}
export async function fulfillSession(store: CommerceStore, session: Stripe.Checkout.Session) {
 if(session.mode!=='payment'||session.payment_status!=='paid'||!session.metadata?.orderId) return;
 const order=await store.findOrder(session.metadata.orderId);
 // The server saved this order's product and quantity before redirecting to Stripe.
 if(!order || order.session_id!==session.id || session.metadata.walletId!==order.wallet_id) throw new Error('Order mismatch');
 const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
 if(!intent) throw new Error('Missing payment');
 await store.recordPayment(order.id,intent);
 await store.apply(order.wallet_id,'stripe:'+session.id,order.hearts);
}
export function makeCommerceHandler(deps: {store?:()=>CommerceStore; stripe?:()=>Stripe; enabled?:()=>boolean}={}) {
 return async(req: Request,res: Response)=>{
  res.setHeader('Cache-Control','private, no-store'); res.setHeader('Vary','Cookie');
  res.setHeader('X-Content-Type-Options','nosniff');
  const action=new URL(req.url,'https://local.invalid').searchParams.get('action')||'status';
  const enabled=(deps.enabled||configured)();
  if(!enabled) return res.status(action==='status'?200:503).json({available:false,balance:0,products:[],message:'Purchases are not available yet. Free play is always available.'});
  const stripe=()=>deps.stripe?deps.stripe():new Stripe(process.env.STRIPE_SECRET_KEY!);
  try {
   if(action==='admob-ssv') {
    if(req.method!=='GET'||!adsEnabled()) return res.sendStatus(503);
    // action is routing data, not part of the Google-signed query.
    const raw=(req.url.split('?')[1]||'').replace(/^action=admob-ssv&/,'');
    const verified=await verifyAdReward(raw,{secret:process.env.ADMOB_REWARD_SECRET!,allowedAdUnits:process.env.ADMOB_REWARDED_AD_UNITS!.split(',').map(v=>v.trim())});
    await (deps.store||commerceStore)().adReward(verified.walletId,verified.nonce,verified.transactionId);
    return res.json({received:true});
   }
   if(action==='webhook') {
    if(req.method!=='POST') return res.sendStatus(405);
    if(!Buffer.isBuffer(req.body)) return res.status(400).json({message:'Raw webhook body required.'});
    const signature=req.headers['stripe-signature'];
    if(typeof signature!=='string') return res.sendStatus(400);
    let event: Stripe.Event;
    try {event=stripe().webhooks.constructEvent(req.body,signature,process.env.STRIPE_WEBHOOK_SECRET!);}
    catch{return res.status(400).json({message:'Invalid signature.'});}
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded') await fulfillSession((deps.store||commerceStore)(),event.data.object as Stripe.Checkout.Session);
    if(event.type==='charge.refunded') {
     const charge=event.data.object as Stripe.Charge;
     const intent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
     if(intent) await (deps.store||commerceStore)().refund(intent,charge.id,charge.amount,charge.amount_refunded);
    }
    return res.json({received:true});
   }
   if(!isAllowedRequest(req,process.env.COMMERCE_ORIGIN!)) return res.sendStatus(403);
   if(!['GET','POST'].includes(req.method)) return res.sendStatus(405);
   if((action==='status')!==(req.method==='GET')) return res.sendStatus(405);
   if(req.method==='POST' && !req.headers['content-type']?.startsWith('application/json')) return res.sendStatus(415);
   const store=(deps.store||commerceStore)();
   if(action==='restore') {
    const body=jsonBody(req);
    if(typeof body.recoveryCode!=='string'||!tokenPattern.test(body.recoveryCode)) return res.status(400).json({message:'Enter the complete recovery code.'});
    const token=secret(); const wallet=await store.restore(hash(body.recoveryCode),hash(token));
    if(!wallet) return res.status(404).json({message:'Recovery code not recognized.'});
    cookie(res,token); return res.json({balance:Math.max(0,wallet.balance)});
   }
   let token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
   let wallet: Wallet|undefined=token&&tokenPattern.test(token)?await store.wallet(hash(token)):undefined;
   let recoveryCode: string|undefined;
   if(!wallet) {
    if(action!=='status') return res.status(401).json({message:'Open the heart shop to start a wallet.'});
    token=secret(); recoveryCode=secret(); wallet=await store.createWallet(hash(token),hash(recoveryCode)); cookie(res,token);
   }
   if(action==='status') {
    const products=await Promise.all(PACKS.map(async p=>{
     const price=await stripe().prices.retrieve(process.env[p.env]!);
     if(!price.active||price.type!=='one_time'||price.unit_amount===null) throw new Error('Unavailable product');
     return {sku:p.sku,hearts:p.hearts,amount:price.unit_amount,currency:price.currency};
    }));
    return res.json({available:true,balance:wallet.balance,products,...(recoveryCode?{recoveryCode}:{})});
   }
   const body=jsonBody(req);
   if(action==='ad-challenge') {
    if(!adsEnabled()||body.parentApproved!==true) return res.status(503).json({message:'Optional ads are not available.'});
    const challenge=createAdChallenge(wallet.id,process.env.ADMOB_REWARD_SECRET!);
    await store.adChallenge(wallet.id,challenge.nonce,challenge.expiresAt);
    return res.json(challenge);
   }
   if(action==='ad-status') {
    if(typeof body.nonce!=='string'||body.nonce.length>200) return res.sendStatus(400);
    return res.json({granted:await store.adStatus(wallet.id,body.nonce),balance:Math.max(0,wallet.balance)});
   }
   if(action==='checkout') {
    // Native clients must use platform billing. This web endpoint only accepts the configured web origin.
    if(body.platform!=='web') return res.status(400).json({message:'Use your device store for native purchases.'});
    const pack=PACKS.find(p=>p.sku===body.sku); if(!pack) return res.sendStatus(400);
    const priceId=process.env[pack.env]!;
    const price=await stripe().prices.retrieve(priceId);
    if(!price.active||price.type!=='one_time'||price.unit_amount===null) throw new Error('Unavailable product');
    const orderId=await store.order(wallet.id,pack.sku,priceId,pack.hearts);
    const origin=new URL(process.env.COMMERCE_ORIGIN!).origin;
    const session=await stripe().checkout.sessions.create({
     mode:'payment',line_items:[{price:priceId,quantity:1}],locale:'auto',
     success_url:origin+'/?shop=1&checkout=returned',cancel_url:origin+'/?shop=1&checkout=cancelled',
     metadata:{orderId,walletId:wallet.id},client_reference_id:orderId,
    },{idempotencyKey:'checkout:'+orderId});
    await store.attach(orderId,session.id);
    if(!session.url) throw new Error('Checkout unavailable');
    return res.json({url:session.url});
   }
   if(action==='consume') {
    if(typeof body.idempotencyKey!=='string'||! /^[a-zA-Z0-9_-]{16,100}$/.test(body.idempotencyKey)) return res.sendStatus(400);
    const result=await store.apply(wallet.id,'consume:'+wallet.id+':'+body.idempotencyKey,-1);
    return res.json(result);
   }
   return res.sendStatus(404);
  } catch(error) {
   if(typeof error==='object'&&error&&'code' in error&&error.code==='P0002') return res.status(409).json({message:'No hearts available. You can retry for free.'});
   // Do not expose payment, database, or recovery details.
   return res.status(503).json({message:'The heart shop is temporarily unavailable. Free play is always available.'});
  }
 };
}
export const commerceHandler=makeCommerceHandler();
