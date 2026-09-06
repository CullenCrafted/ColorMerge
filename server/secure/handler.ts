import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { databaseStore, type Store } from './store';
import { GameError, newRun, publicRun, transition } from './game';

const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tap'), color: z.enum(['red', 'blue', 'yellow', 'white', 'black']), roundId: z.string().uuid(), revision: z.number().int().nonnegative() }).strict(),
  z.object({ type: z.enum(['advance', 'restart']), roundId: z.string().uuid(), revision: z.number().int().nonnegative() }).strict(),
]);
const cookieName = 'cm_session';
export function makeHandler(getStore: () => Store = databaseStore) {
  return async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
    // Custom header is mandatory even for session creation. No cross-origin CORS is enabled.
    if (req.headers['x-colormerge'] !== '1' || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ message: 'Open the game on this site.' });
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ message: 'Origin not allowed.' }); }
      catch { return res.status(403).json({ message: 'Invalid origin.' }); }
    }
    try {
      const store = getStore();
      let token = req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
      if (!token || !/^[a-f0-9]{64}$/.test(token)) token = undefined;
      let id = token ? createHash('sha256').update(token).digest('hex') : '';
      let run = id ? await store.get(id) : undefined;
      if (!run) {
        if (req.method !== 'GET') return res.status(401).json({ message: 'Your session expired. Reload the game.' });
        token = randomBytes(32).toString('hex');
        id = createHash('sha256').update(token).digest('hex');
        run = newRun();
        await store.create(id, run);
      }
      const secure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
      res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure ? '; Secure' : ''}`);
      if (req.method === 'GET') return res.json(publicRun(run));
      if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ message: 'JSON required.' });
      const parsed = actionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid game action.' });
      const { run: next, result } = transition(run, parsed.data);
      if (!await store.save(id, run.revision, next)) return res.status(409).json({ message: 'The game changed in another request. Please retry.' });
      return res.json({ ...publicRun(next), result });
    } catch (error) {
      if (error instanceof GameError) return res.status(error.status).json({ message: error.message });
      // Never expose database connection details or secret game state in errors/logs.
      return res.status(503).json({ message: 'The game service is unavailable. Please try again shortly.' });
    }
  };
}
export const gameHandler = makeHandler();
