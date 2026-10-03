import {timingSafeEqual} from 'node:crypto';
import type {CommerceStore} from './store.js';
export const nativePacks=()=>[
 {sku:'hearts5',hearts:5,productId:process.env.REVENUECAT_PRODUCT_HEARTS_5||''},
 {sku:'hearts20',hearts:20,productId:process.env.REVENUECAT_PRODUCT_HEARTS_20||''},
 {sku:'hearts60',hearts:60,productId:process.env.REVENUECAT_PRODUCT_HEARTS_60||''},
];
export function nativeConfigured() {
 return process.env.NATIVE_COMMERCE_ENABLED==='true'&&!!process.env.COMMERCE_ORIGIN&&
 (process.env.REVENUECAT_WEBHOOK_SECRET?.length||0)>=32&&nativePacks().every(p=>p.productId);
}
export function validRevenueCatSecret(header:unknown,secret:string) {
 if(typeof header!=='string'||secret.length<32)return false;
 const actual=Buffer.from(header);const expected=Buffer.from('Bearer '+secret);
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export async function applyRevenueCatEvent(store:CommerceStore,input:unknown) {
 const event=(input as {event?:Record<string,unknown>})?.event;
 if(!event||typeof event.type!=='string')throw new Error('Invalid event');
 if(!['NON_RENEWING_PURCHASE','CANCELLATION'].includes(event.type))return;
 if(!['APP_STORE','PLAY_STORE'].includes(String(event.store)))return;
 const expectedEnvironment=process.env.REVENUECAT_ENVIRONMENT||'PRODUCTION';
 if(event.environment!==expectedEnvironment)return;
 const pack=nativePacks().find(p=>p.productId&&p.productId===event.product_id);
 if(!pack)return; // Non-consumables and unknown products never create currency.
 if(typeof event.app_user_id!=='string'||!/^[0-9a-f-]{36}$/i.test(event.app_user_id))throw new Error('Unknown wallet');
 if(typeof event.transaction_id!=='string'||event.transaction_id.length>256||!event.transaction_id)throw new Error('Missing transaction');
 // appUserID was assigned by wallet bootstrap. No aliases or client metadata grant credit.
 await store.nativeEvent(String(event.store)+':'+event.transaction_id,event.app_user_id,pack.productId,pack.hearts,event.type==='CANCELLATION');
}
