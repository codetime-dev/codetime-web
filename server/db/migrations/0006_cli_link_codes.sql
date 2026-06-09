-- 0006_cli_link_codes.sql
--
-- Rendezvous table for the browser-based `codetime login` (device-code
-- flow). The CLI inserts a row (POST /v3/agent/cli/link/start), the user
-- approves it from a signed-in browser tab (POST .../approve), and the
-- CLI polls (POST .../poll) until `approved_at` is set, then the row is
-- deleted. Rows are short-lived (~10 min) and never store the upload
-- token — only `user_id`, which the poll resolves to the live token.
--
-- `device_code` is the secret the CLI polls with; `user_code` is the
-- public value carried in the /cli/auth?code=… URL the browser opens.
--
-- Safe on a live database: CREATE TABLE IF NOT EXISTS only, no existing
-- tables touched. Idempotent: safe to re-apply.

BEGIN;

SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '5s';

CREATE TABLE IF NOT EXISTS cli_link_codes (
    device_code text PRIMARY KEY,
    user_code   text NOT NULL,
    user_id     bigint,
    approved_at timestamp with time zone,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    expires_at  timestamp with time zone NOT NULL,
    CONSTRAINT cli_link_codes_user_code_unique UNIQUE (user_code)
);

COMMIT;
