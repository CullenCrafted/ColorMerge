import {useEffect,useState} from 'react';
import {createCheckout,formatPrice,getWallet,restoreWallet,isNativeCommerce,purchaseNative,readAdPreference,setAdPreference,type Sku,type WalletStatus} from '../platform/commerce';
export default function HeartShop({onClose,onBalanceChange}:{onClose:()=>void;onBalanceChange?:(balance:number)=>void}) {
 const [wallet,setWallet]=useState<WalletStatus|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [parent,setParent]=useState(false);
 const [answer,setAnswer]=useState('');
 const [recovery,setRecovery]=useState('');
 const [savedCode,setSavedCode]=useState('');
 const [ack,setAck]=useState(false);
 const [ads,setAds]=useState(readAdPreference);
 async function refresh() {
  const next=await getWallet();setWallet(next);onBalanceChange?.(next.balance);
  setSavedCode(sessionStorage.getItem('cm-parent-recovery')||'');
  if(next.recoveryCode) {setSavedCode(next.recoveryCode);sessionStorage.setItem('cm-parent-recovery',next.recoveryCode);}
 }
 useEffect(()=>{
  setSavedCode(sessionStorage.getItem('cm-parent-recovery')||'');
  refresh().catch(()=>setError('Shop unavailable. You can keep playing for free.'));
  // Payment return only prompts polling. URL parameters never grant hearts.
  const returned=new URLSearchParams(location.search).get('checkout')==='returned';
  if(!returned) return;
  let count=0;
  const timer=setInterval(()=>{refresh().catch(()=>{});if(++count>=12)clearInterval(timer);},2500);
  return()=>clearInterval(timer);
 },[]);
 async function buy(sku:Sku) {
  setBusy(true);setError('');
  try {
   if(isNativeCommerce()){
    const result=await purchaseNative(sku);await refresh();
    setError(result.state==='pending'?'Payment is awaiting store confirmation. Please do not purchase again; refresh the balance shortly.':'Hearts confirmed in your wallet.');
    setBusy(false);return;
   }
   const {url}=await createCheckout(sku);const target=new URL(url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw new Error('Invalid checkout');location.assign(url);}
  catch {setError(isNativeCommerce()?'Purchase did not finish here. Refresh your balance before trying again; store approval may still be pending.':'Checkout could not open. Refresh your balance before trying again.');setBusy(false);}
 }
 async function restore() {
  setBusy(true);setError('');
  try {await restoreWallet(recovery.trim());setSavedCode(recovery.trim());setAck(true);setRecovery('');await refresh();}
  catch {setError('Wallet could not be restored. Check the parent-held recovery code.');}
  finally {setBusy(false);}
 }
 return <div role="dialog" aria-modal="true" aria-labelledby="heart-shop-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
  <section className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-neutral-900 shadow-xl">
   <button onClick={onClose} disabled={busy} className="float-right min-h-11 min-w-11 rounded-full" aria-label="Close heart shop">×</button>
   <h2 id="heart-shop-title" className="text-2xl font-semibold">For parents</h2>
   <p className="mt-3">Extra hearts are optional. Your child can always retry and play for free.</p>
   {!parent?<form className="mt-5" onSubmit={e=>{e.preventDefault();if(answer.trim()==='42')setParent(true);else setError('Please ask a parent to help.');}}>
    <p>This purchase area is for a parent or guardian. What is six multiplied by seven?</p>
    <input aria-label="Parent area answer" inputMode="numeric" value={answer} onChange={e=>setAnswer(e.target.value)} className="my-3 w-full rounded-xl border p-3"/>
    <button className="min-h-11 rounded-xl bg-neutral-900 px-5 text-white" type="submit">Open parent area</button>
   </form>:<>
    <p className="mt-4 font-medium">Hearts: {wallet?.balance??'…'}</p>
    <p className="mt-2 text-sm">A heart continues one failed attempt. It is spent only when you choose to use it. This parent area deters accidental purchases; it does not verify identity or parental consent.</p>
    <p className="mt-2 text-sm">The wallet belongs to this installation, separately from game resets. Keep its recovery code privately to restore it after clearing cookies or changing devices. We do not ask children for an email address.</p>
    {savedCode&&<div className="mt-3 rounded-xl bg-neutral-100 p-3"><p className="font-medium">Parent recovery code — keep private</p><code className="block break-all text-xs">{savedCode}</code><label className="mt-3 flex gap-2"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>I saved this code somewhere private.</label></div>}
    {wallet?.available?<div className="mt-4 grid gap-3">{wallet.products.map(p=><button key={p.sku} disabled={busy||(!!savedCode&&!ack)} onClick={()=>buy(p.sku)} className="min-h-12 rounded-xl border border-neutral-300 p-3 disabled:opacity-50">{p.hearts} hearts · {p.localizedPrice||formatPrice(p.amount,p.currency)}</button>)}</div>:<p className="mt-4">{wallet?.message||'Loading shop…'}</p>}
    <p className="mt-3 text-sm">{isNativeCommerce()?'Purchases use your device’s App Store or Google Play. Hearts appear after the store confirms payment to our server. Consumable hearts are recovered through your parent wallet code, not by restoring spent store purchases.':'Payment is handled by Stripe on the website. Hearts appear after confirmed payment. Final taxes and checkout options appear before payment.'}</p>
    {isNativeCommerce()&&<label className="mt-4 flex gap-2"><input type="checkbox" checked={ads} onChange={e=>{setAds(e.target.checked);setAdPreference(e.target.checked);}}/>Allow optional ads. This preference does not verify parental consent. You can turn it off here.</label>}
    <button className="mt-3 min-h-11 underline" disabled={busy} onClick={()=>refresh().catch(()=>setError('Could not refresh the wallet.'))}>Refresh balance</button>
    <details className="mt-4"><summary>Restore a parent wallet</summary><input aria-label="Private recovery code" autoComplete="off" type="password" value={recovery} onChange={e=>setRecovery(e.target.value)} className="my-3 w-full rounded-xl border p-3"/><button disabled={busy||!recovery.trim()} onClick={restore} className="min-h-11 rounded-xl border px-4">Restore wallet</button><p className="mt-2 text-sm">Restoring signs this wallet out on other browsers. Lost cookies and a lost recovery code require parent support.</p></details>
   </>}
   {error&&<p role="alert" className="mt-3">{error}</p>}
   <button onClick={onClose} disabled={busy} className="mt-5 min-h-11 w-full rounded-xl border p-3">Back to free play</button>
  </section>
 </div>;
}
