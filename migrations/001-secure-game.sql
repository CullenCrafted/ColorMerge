CREATE TABLE IF NOT EXISTS colormerge_sessions (
  id text PRIMARY KEY,
  revision bigint NOT NULL DEFAULT 0,
  state jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS colormerge_sessions_expiry ON colormerge_sessions (expires_at);
