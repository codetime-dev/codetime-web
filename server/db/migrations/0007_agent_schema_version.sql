-- 0007_agent_schema_version.sql
--
-- Adds `schema_version` to agent_sessions. This records the rollup
-- wire-format version the CLI used when emitting the session:
--   1 = legacy CLI (no top-level schemaVersion). Turn durationMs may be
--       lazy-stamp polluted, so the dashboard caps it on read; tokensOutput
--       may slightly under-count Gemini/OpenCode reasoning.
--   2+ = turn durationMs is already gap-clamped active time (trusted, no
--       cap) and tokensOutput already includes reasoning tokens.
--
-- Backfills as 1 so all pre-existing rows keep the conservative cap-on-read
-- behaviour. New v2 ingests stamp 2.
--
-- Safe on a live database: ADD COLUMN with a NOT NULL DEFAULT, no existing
-- rows touched beyond the default backfill. Idempotent via IF NOT EXISTS.

BEGIN;

ALTER TABLE agent_sessions
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1;

COMMIT;
