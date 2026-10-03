export type Sku='hearts5'|'hearts20'|'hearts60';
export interface WalletStatus {available:boolean;balance:number;products:Array<{sku:Sku;hearts:number;amount:number;currency:string}>;message?:string;recoveryCode?:string}
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
export function getWallet():Promise<WalletStatus> {
 if(isNativeCommerce()) return Promise.resolve({available:false,balance:0,products:[],message:'Store purchases are not available in this build. Free play is available.'});
 return request<WalletStatus>('status').then(wallet=>{
  if(wallet.recoveryCode) sessionStorage.setItem('cm-parent-recovery',wallet.recoveryCode);
  return wallet;
 });
}
export function consumeHeart(idempotencyKey:string):Promise<{authorizationId:string;balance:number}> {
 if(isNativeCommerce()) return Promise.reject(new Error('Store purchases are not configured.'));
 return request('consume',{idempotencyKey});
}
export function createCheckout(sku:Sku):Promise<{url:string}> {
 if(isNativeCommerce()) return Promise.reject(new Error('Native purchases require your device store.'));
 return request('checkout',{sku,platform:'web'});
}
export function restoreWallet(recoveryCode:string):Promise<{balance:number}> {
 if(isNativeCommerce()) return Promise.reject(new Error('Wallet restoration is available on the website.'));
 return request<{balance:number}>('restore',{recoveryCode}).then(result=>{
  sessionStorage.setItem('cm-parent-recovery',recoveryCode);
  return result;
 });
}
export function formatPrice(amount:number,currency:string) {
 const format=new Intl.NumberFormat(undefined,{style:'currency',currency});
 const digits=['isk','ugx'].includes(currency.toLowerCase())?2:format.resolvedOptions().maximumFractionDigits;
 return format.format(amount/10**digits);
}
