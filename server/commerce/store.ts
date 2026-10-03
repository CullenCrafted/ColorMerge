import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
export interface Wallet { id: string; balance: number }
export interface Order { id: string; wallet_id: string; hearts: number; price_id: string; session_id: string | null }
export interface CommerceStore {
 adChallenge(wallet:string,nonce:string,expiresAt:number):Promise<void>;
 adReward(wallet:string,nonce:string,transaction:string):Promise<void>;
 adStatus(wallet:string,nonce:string):Promise<boolean>;
 wallet(hash: string): Promise<Wallet | undefined>;
 createWallet(tokenHash: string, recoveryHash: string): Promise<Wallet>;
 restore(recoveryHash: string, tokenHash: string): Promise<Wallet | undefined>;
 order(wallet: string, sku: string, priceId: string, hearts: number): Promise<string>;
 attach(order: string, session: string): Promise<void>;
 recordPayment(id: string, intent: string): Promise<void>;
 refund(intent: string,charge: string,amount: number,refunded: number): Promise<void>;
 findOrder(id: string): Promise<Order | undefined>;
 apply(wallet: string, source: string, delta: number): Promise<{authorizationId: string; balance: number}>;
}
export function commerceStore(): CommerceStore {
 const url = (process.env.STORAGE_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();
 if (!url) throw new Error('Commerce unavailable');
 const sql = neon(url);
 return {
  async adChallenge(wallet,nonce,expiresAt) {await sql`INSERT INTO cm_ad_challenges(nonce,wallet_id,expires_at) VALUES(${nonce},${wallet},${new Date(expiresAt).toISOString()})`;},
  async adReward(wallet,nonce,transaction) {await sql`SELECT cm_ad_reward(${nonce},${wallet}::uuid,${transaction})`;},
  async adStatus(wallet,nonce) {const rows=await sql`SELECT authorization_id FROM cm_ad_challenges WHERE nonce=${nonce} AND wallet_id=${wallet}`;return !!rows[0]?.authorization_id;},
  async wallet(hash) { const rows = await sql`SELECT id,balance FROM cm_wallets WHERE token_hash=${hash}`; return rows[0] as Wallet | undefined; },
  async createWallet(tokenHash,recoveryHash) {
   const rows=await sql`INSERT INTO cm_wallets(id,token_hash,recovery_hash) VALUES(${randomUUID()},${tokenHash},${recoveryHash}) RETURNING id,balance`;
   return rows[0] as Wallet;
  },
  async restore(recoveryHash,tokenHash) {
   const rows=await sql`UPDATE cm_wallets SET token_hash=${tokenHash} WHERE recovery_hash=${recoveryHash} RETURNING id,balance`;
   return rows[0] as Wallet | undefined;
  },
  async order(wallet,sku,priceId,hearts) {
   const id=randomUUID();
   await sql`INSERT INTO cm_orders(id,wallet_id,sku,price_id,hearts) VALUES(${id},${wallet},${sku},${priceId},${hearts})`;
   return id;
  },
  async attach(order,session) { await sql`UPDATE cm_orders SET session_id=${session} WHERE id=${order} AND session_id IS NULL`; },
  async recordPayment(id,intent) { await sql`UPDATE cm_orders SET payment_intent=${intent} WHERE id=${id} AND (payment_intent IS NULL OR payment_intent=${intent})`; },
  async refund(intent,charge,amount,refunded) { await sql`SELECT cm_wallet_refund(${intent},${charge},${amount},${refunded})`; },
  async findOrder(id) { const rows=await sql`SELECT * FROM cm_orders WHERE id=${id}`; return rows[0] as Order | undefined; },
  async apply(wallet,source,delta) {
   const rows=await sql`SELECT * FROM cm_wallet_apply(${wallet}::uuid,${source},${delta},${randomUUID()}::uuid)`;
   return {authorizationId: rows[0].authorization_id as string,balance:Number(rows[0].balance)};
  },
 };
}
