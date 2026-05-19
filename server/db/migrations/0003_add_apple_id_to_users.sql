-- 0003_add_apple_id_to_users.sql
--
-- Adds the `apple_id` column to `users`. Stores the `sub` claim from
-- Apple's identity token — a stable, opaque per-team identifier returned
-- by Sign in with Apple. Distinct from google_id / github_id; populated
-- only for users who authenticate via Apple (web Service ID or iOS
-- bundle ID, both of which resolve to the same `sub`).
--
-- Idempotent: safe to apply multiple times or against an environment
-- where the column was added manually.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id text;
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users (apple_id);

COMMIT;
