import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running database setup.');
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL('../migrations/001-secure-game.sql', import.meta.url), 'utf8');
for (const statement of migration.split(';').map(s => s.trim()).filter(Boolean)) await sql(statement);
console.log('ColorMerge session table is ready.');
