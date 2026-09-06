// Categorized, sanitized server-side diagnostics for /api/game failures.
// These logs may never contain connection strings, credentials, cookies,
// session contents, recipes, or raw error text, so only fixed messages,
// PostgreSQL SQLSTATE codes, and Node system error codes are emitted.
export type DatabaseErrorCategory =
  | 'missing-database-url'
  | 'connection-or-auth'
  | 'missing-sessions-table'
  | 'other-database-failure';

export type GameFailureCategory = DatabaseErrorCategory | 'unexpected';

// Safe machine codes only: PostgreSQL SQLSTATE classes/codes and Node system
// error codes never embed secrets or SQL text.
const pgAuthCodes = new Set(['28000', '28P01', '3D000']);
const pgTableNotFound = '42P01';

interface CodedError { code?: unknown }

function codeOf(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as CodedError).code;
  return typeof code === 'string' ? code : undefined;
}

export function categorizeDatabaseError(error: unknown): DatabaseErrorCategory {
  const code = codeOf(error) ?? '';
  if (code === pgTableNotFound) return 'missing-sessions-table';
  // 08xxx = connection exception; 57Pxx = operator intervention / shutdown;
  // 28P01/28000 = authentication failure; 3D000 = database does not exist.
  if (code.startsWith('08') || code.startsWith('57P') || pgAuthCodes.has(code)) return 'connection-or-auth';
  // Socket-level failures surface Node system codes instead of SQLSTATEs.
  if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ECONNABORTED', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN'].includes(code)) return 'connection-or-auth';
  return 'other-database-failure';
}

// Log a categorized database failure without leaking the underlying message.
export function logDatabaseFailure(operation: 'store-init' | 'get' | 'create' | 'save', error: unknown): void {
  const category = categorizeDatabaseError(error);
  const code = codeOf(error);
  const detail = code ? ` (code ${code})` : '';
  console.error(`[colormerge] ${operation} failed: ${category}${detail}`);
}

// Log any non-GameError failure caught by the /api/game handler. The error is
// never stringified; only its category (and a safe code, when one is present)
// is emitted so secrets in raw messages cannot reach the logs.
export function logGameFailure(error: unknown): void {
  if (error instanceof Error && error.message === 'DATABASE_URL is required') {
    console.error('[colormerge] /api/game failed: missing-database-url');
    return;
  }
  const code = codeOf(error);
  const detail = code ? ` (code ${code})` : '';
  console.error(`[colormerge] /api/game failed: unexpected${detail}`);
}
