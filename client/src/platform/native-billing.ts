import {loadNativeServices,isNativePlatform,getNativePlatform} from './mobile';
type StoredWallet={token:string;walletId:string};
type NativeStatus={available:boolean;walletId:string;balance:number;nativeProducts:Array<{sku:string;hearts:number;productId:string}>;products:unknown[]};
const key='cm-native-wallet-v1';
let wallet:StoredWallet|undefined;let bootstrap:Promise<StoredWallet>|undefined;
let configuredWallet='';
function apiOrigin() {
 const value=import.meta.env.VITE_COMMERCE_ORIGIN;
 if(!value)throw new Error('Native shop is not configured.');
 const url=new URL(value);if(url.protocol!=='https:')throw new Error('Native shop requires HTTPS.');
 return url.origin;
}
async function rawRequest<T>(action:string,body?:unknown,token?:string):Promise<T> {
 const response=await fetch(apiOrigin()+'/api/commerce?action='+action,{
  method:body?'POST':'GET',credentials:'omit',cache:'no-store',
  headers:{'X-ColorMerge':'1','X-ColorMerge-Native':'1',...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},
  body:body?JSON.stringify(body):undefined,
 });
 const result=await response.json();
 if(!response.ok)throw new Error(result.message||'Native shop unavailable.');
 return result as T;
}
async function persist(value:StoredWallet&{recoveryCode?:string}) {
 const services=await loadNativeServices();if(!services)throw new Error('Native services unavailable.');
 await services.Preferences.set({key,value:JSON.stringify({token:value.token,walletId:value.walletId})});
 wallet={token:value.token,walletId:value.walletId};
 if(value.recoveryCode)sessionStorage.setItem('cm-parent-recovery',value.recoveryCode);
 return wallet;
}
async function ensureWallet():Promise<StoredWallet> {
 if(wallet)return wallet;
 if(bootstrap)return bootstrap;
 bootstrap=(async()=>{
  const services=await loadNativeServices();if(!services)throw new Error('Native services unavailable.');
  const saved=await services.Preferences.get({key});
  if(saved.value) {
   const parsed=JSON.parse(saved.value) as StoredWallet;
   if(/^[a-f0-9]{64}$/.test(parsed.token)&&typeof parsed.walletId==='string'){wallet=parsed;return parsed;}
   throw new Error('Restore your parent wallet.');
  }
  return persist(await rawRequest<StoredWallet&{recoveryCode:string}>('native-bootstrap',{}));
 })();
 try{return await bootstrap;}finally{bootstrap=undefined;}
}
export async function nativeRequest<T>(action:string,body?:unknown):Promise<T> {
 const current=await ensureWallet();return rawRequest(action,body,current.token);
}
export async function restoreNativeWallet(recoveryCode:string):Promise<{balance:number}> {
 const result=await rawRequest<StoredWallet&{balance:number;recoveryCode:string}>('restore',{recoveryCode});
 await persist(result);return {balance:result.balance};
}
function platformKey() {
 const platform=getNativePlatform();
 return platform==='ios'?import.meta.env.VITE_REVENUECAT_IOS_KEY:platform==='android'?import.meta.env.VITE_REVENUECAT_ANDROID_KEY:undefined;
}
async function sdk(walletId:string) {
 if(!isNativePlatform())throw new Error('Native store only.');
 const services=await loadNativeServices();const apiKey=platformKey();
 if(!services||!apiKey)throw new Error('Store purchases are not configured.');
 if(!configuredWallet)await services.Purchases.configure({apiKey,appUserID:walletId});
 else if(configuredWallet!==walletId)await services.Purchases.logIn({appUserID:walletId});
 configuredWallet=walletId;
 return services.Purchases;
}
export async function nativeCatalog() {
 const state=await nativeRequest<NativeStatus>('status');
 const purchases=await sdk(state.walletId);
 const result=await purchases.getProducts({productIdentifiers:state.nativeProducts.map(p=>p.productId)});
 return {available:true,balance:state.balance,products:state.nativeProducts.flatMap(pack=>{
  const product=result.products.find(p=>p.identifier===pack.productId);
  return product?[{sku:pack.sku as 'hearts5'|'hearts20'|'hearts60',hearts:pack.hearts,amount:0,currency:'',localizedPrice:product.priceString}]:[];
 })};
}
export async function purchaseNative(sku:string):Promise<{state:'verified'|'pending';balance:number}> {
 const before=await nativeRequest<NativeStatus>('status');
 const pack=before.nativeProducts.find(p=>p.sku===sku);if(!pack)throw new Error('Product unavailable.');
 const purchases=await sdk(before.walletId);
 await purchases.purchaseProduct({productIdentifier:pack.productId});
 // SDK completion is not proof of credit. Only backend provider-webhook balance is trusted.
 for(let attempt=0;attempt<15;attempt++) {
  await new Promise(resolve=>setTimeout(resolve,1500));
  const next=await nativeRequest<NativeStatus>('status');
  if(next.balance>=before.balance+pack.hearts)return {state:'verified',balance:next.balance};
 }
 const next=await nativeRequest<NativeStatus>('status');
 return {state:'pending',balance:next.balance};
}
