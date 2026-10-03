import {nativeCatalog,nativeRequest,purchaseNative,restoreNativeWallet} from './native-billing';
export type Sku='hearts5'|'hearts20'|'hearts60';
export interface WalletStatus {available:boolean;balance:number;products:Array<{sku:Sku;hearts:number;amount:number;currency:string;localizedPrice?:string}>;message?:string;recoveryCode?:string}
declare global {interface Window {Capacitor?: {isNativePlatform?:()=>boolean}}}
export const isNativeCommerce=()=>typeof window!=='undefined'&&!!window.Capacitor?.isNativePlatform?.();
async function request<T>(action:string,body?:unknown):Promise<T> {
 const response=await fetch('/api/commerce?action='+action,{
  method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',
  headers:{'X-ColorMerge':'1',...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined,
 });
 const data=await response.json();
 if(!response.ok) throw new Error(data.message||'The heart shop is unavailable.');
 return data as T;
}
function keepRecoveryCode(code:string|null) {
 try { if(code===null) sessionStorage.removeItem('cm-parent-recovery'); else sessionStorage.setItem('cm-parent-recovery',code); } catch { /* Parent can retain the displayed code without browser storage. */ }
}
export function getWallet():Promise<WalletStatus> {
 if(isNativeCommerce()) return nativeCatalog().catch(()=>({available:false,balance:0,products:[],message:'Store purchases are unavailable right now. Free play is available.'}));
 return request<WalletStatus>('status').then(wallet=>{
  if(wallet.recoveryCode) keepRecoveryCode(wallet.recoveryCode);
  return wallet;
 });
}
export function consumeHeart(idempotencyKey:string):Promise<{authorizationId:string;balance:number}> {
 if(isNativeCommerce()) return nativeRequest('consume',{idempotencyKey});
 return request('consume',{idempotencyKey});
}
export function createCheckout(sku:Sku):Promise<{url:string}> {
 if(isNativeCommerce()) return Promise.reject(new Error('Native purchases require your device store.'));
 return request('checkout',{sku,platform:'web'});
}
export function restoreWallet(recoveryCode:string):Promise<{balance:number}> {
 if(isNativeCommerce()) return restoreNativeWallet(recoveryCode);
 return request<{balance:number}>('restore',{recoveryCode}).then(result=>{
  keepRecoveryCode(recoveryCode);
  return result;
 });
}
export function formatPrice(amount:number,currency:string) {
 const format=new Intl.NumberFormat(undefined,{style:'currency',currency});
 const digits=['isk','ugx'].includes(currency.toLowerCase())?2:(format.resolvedOptions().maximumFractionDigits??2);
 return format.format(amount/10**digits);
}

export {purchaseNative};
export const readAdPreference=()=>{try{return localStorage.getItem('cm-parent-ads-approved')==='true';}catch{return false;}};
export function setAdPreference(approved:boolean) {
 try {localStorage.setItem('cm-parent-ads-approved',String(approved));} catch {return;}
 window.dispatchEvent(new Event('cm-ad-preference'));
}
export const nativeAdTransport={
 async challenge():Promise<{userId:string;customData:string;challengeId:string}> {
  if(!readAdPreference())throw new Error('Parent approval is required for optional ads.');
  const result=await nativeRequest<{walletId:string;token:string;nonce:string}>('ad-challenge',{parentApproved:true});
  return {userId:result.walletId,customData:result.token,challengeId:result.nonce};
 },
 async credited(challengeId:string):Promise<boolean> {
  const result=await nativeRequest<{granted:boolean}>('ad-status',{nonce:challengeId});
  return result.granted;
 },
};

export async function replaceRecoveryCode():Promise<string> {
 sessionStorage.removeItem('cm-parent-recovery');
 const result=isNativeCommerce()
  ?await nativeRequest<{recoveryCode:string}>('rotate-recovery',{})
  :await request<{recoveryCode:string}>('rotate-recovery',{});
 keepRecoveryCode(result.recoveryCode);
 return result.recoveryCode;
}
