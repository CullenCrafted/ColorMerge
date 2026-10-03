import {createHash,randomBytes} from 'node:crypto';
import type {CommerceStore,Wallet} from './store.js';
/** Only call with the wallet authenticated by the request's cookie or bearer.
 * Client-supplied wallet IDs or recovery hashes are never accepted. */
export async function rotateRecoveryCode(store:CommerceStore,wallet:Wallet|undefined) {
 if(!wallet)throw new Error('Authenticated wallet required');
 const recoveryCode=randomBytes(32).toString('hex');
 await store.rotateRecovery(wallet.id,createHash('sha256').update(recoveryCode).digest('hex'));
 return {recoveryCode};
}
