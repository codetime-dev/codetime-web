-- 0002_drop_agent_tokens.sql
--
-- Reverses part of 0001: drops `agent_tokens` and `agent_cli_links`.
-- The agent CLI now reuses the user's existing `upload_token` for auth
-- (same one VSCode uses) and declares its identity via the
-- `X-Machine-Id` header, so the dedicated agent-token + device-link
-- tables are no longer needed.
--
-- Safe to run before any rows have been written. After 0001 went out,
-- both tables exist but should be empty unless a CLI completed the
-- device-flow login (which the new ingest path does not require).

BEGIN;

DROP TABLE IF EXISTS agent_cli_links;
DROP TABLE IF EXISTS agent_tokens;

COMMIT;
