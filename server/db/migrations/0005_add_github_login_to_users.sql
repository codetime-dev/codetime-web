-- 0005_add_github_login_to_users.sql
--
-- Adds the `github_login` column to `users`. Stores the GitHub username
-- (`login` field returned from api.github.com/user) alongside the existing
-- numeric `github_id`. Without it we cannot construct a public profile
-- URL (`https://github.com/<login>`) from `github_id` alone.
--
-- Written/refreshed on every GitHub OAuth callback (see
-- server/utils/oauth.ts::upsertGithubUser). Legacy rows that linked GitHub
-- before this column existed will populate on next login.
--
-- Safe on a live database:
--   * Postgres 11+ ADD COLUMN with no default + nullable = catalog-only,
--     no table rewrite, no row scan. Brief ACCESS EXCLUSIVE lock.
--   * `lock_timeout` bounds the worst case: if another transaction holds
--     a conflicting lock, this aborts in 2s instead of queueing every
--     other query behind it.
--
-- Idempotent: safe to re-apply.

BEGIN;

SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '5s';

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_login text;

COMMIT;
