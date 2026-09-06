// Categorized, sanitized server-side diagnostics for /api/game failures.
// These logs may never contain connection strings, credentials, cookies,
// session contents, recipes, or raw error text, so only fixed messages,
// PostgreSQL SQLSTATE codes, and Node system error codes are emitted.
export type DatabaseErrorCategory =
  | 'missing-database-url'
  | 'connection-or-auth'
  | 'missing-sessions-table'
  | 'other-database-failure';

// Safe machine codes only: PostgreSQL SQLSTATE classes/codes and Node system
// error codes never embed secrets or SQL text.
const pgAuthCodes = new Set(['28000', '28P01', '3D000']);
const pgTableNotFound = '42P01';
// SQLSTATEs are exactly five alphanumeric characters; Node system codes are
// short all-caps tokens. Anything else is dropped so an arbitrary error's
// `code` cannot inject sensitive data or forge log lines.
const safeCodePattern = /^([A-Z0-9]{5}|[A-Z][A-Z0-9_]{1,19})$/;

// Marks errors already logged by the store so the handler does not emit a
// second, contradictory line for the same failure.
const alreadyLogged = new WeakSet<object>();

interface CodedError { code?: unknown }

function codeOf(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as CodedError).code;
  return typeof code === 'string' && safeCodePattern.test(code) ? code : undefined;
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
  if (error && typeof error === 'object') alreadyLogged.add(error);
  const category = categorizeDatabaseError(error);
  const code = codeOf(error);
  const detail = code ? ` (code ${code})` : '';
  console.error(`[colormerge] ${operation} failed: ${category}${detail}`);
}

// Log the missing DATABASE_URL configuration failure with its own category.
export function logMissingDatabaseUrl(): void {
  console.error('[colormerge] store-init failed: missing-database-url');
}

// Log any non-GameError failure caught by the /api/game handler. Failures
// already logged by the store are skipped; anything else is reported by
// category (and a safe code, when one is present) so secrets in raw
// messages cannot reach the logs.
export function logGameFailure(error: unknown): void {
  if (error && typeof error === 'object' && alreadyLogged.has(error)) return;
  if (error instanceof Error && error.message === 'DATABASE_URL is required') {
    console.error('[colormerge] /api/game failed: missing-database-url');
    return;
  }
  const code = codeOf(error);
  const detail = code ? ` (code ${code})` : '';
  console.error(`[colormerge] /api/game failed: ${categorizeDatabaseError(error)}${detail}`);
}
