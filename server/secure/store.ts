import { neon } from '@neondatabase/serverless';
import type { Run } from './game';

export interface Store {
  get(id: string): Promise<Run | undefined>;
  create(id: string, run: Run): Promise<void>;
  save(id: string, revision: number, run: Run): Promise<boolean>;
}
export function databaseStore(): Store {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  return {
    async get(id) {
      const rows = await sql`SELECT state FROM colormerge_sessions WHERE id = ${id} AND expires_at > now()`;
      return rows[0]?.state as Run | undefined;
    },
    async create(id, run) {
      await sql`INSERT INTO colormerge_sessions (id, revision, state, expires_at) VALUES (${id}, ${run.revision}, ${JSON.stringify(run)}::jsonb, now() + interval '30 days')`;
    },
    async save(id, revision, run) {
      const rows = await sql`
        WITH updated AS (
          UPDATE colormerge_sessions
          SET revision = ${run.revision},
              state = ${JSON.stringify(run)}::jsonb,
              expires_at = now() + interval '30 days'
          WHERE id = ${id}
            AND revision = ${revision}
            AND expires_at > now()
          RETURNING id
        )
        SELECT count(*)::int AS count FROM updated
      `;
      return Number(rows[0]?.count) === 1;
    }
  };
}
