import { createHash, randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export function validClassicContinuation(value: Record<string, unknown>) {
  return typeof value.roundId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.roundId) &&
    Number.isSafeInteger(value.revision) && Number(value.revision) >= 0;
}
export async function continueClassic(walletId: string, cookieHeader: string | undefined, roundId: string, revision: number) {
  const token = cookieHeader?.split(';').map(part => part.trim())
    .find(part => part.startsWith('cm_session='))?.slice('cm_session='.length);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw Object.assign(new Error('Game session missing'), { code: 'P0003' });
  const url = (process.env.STORAGE_DATABASE_URL ?? process.env.DATABASE_URL)?.trim();
  if (!url) throw new Error('Commerce unavailable');
  const sessionId = createHash('sha256').update(token).digest('hex');
  const sql = neon(url);
  const rows = await sql`SELECT * FROM cm_classic_continue(${walletId}::uuid,${sessionId},${roundId},${revision}::bigint,${randomUUID()}::uuid)`;
  return { authorizationId: String(rows[0].authorization_id), balance: Number(rows[0].balance) };
}
