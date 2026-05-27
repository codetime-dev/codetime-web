-- 0004_user_privacy.sql
--
-- Fine-grained privacy. Replaces the half-wired ad-hoc flags
-- (`share_current`, `hide_current_workspace`, `hide_current_language`,
-- `show_email`, `show_github`) with:
--   * `leaderboard_listed` boolean column — the ONLY privacy setting any
--     query filters MANY users by (leaderboard / language-ranking exclude
--     opted-out users before LIMIT), so it must be an indexable column.
--   * `privacy` JSONB blob — the ~12 fine-grained facets, all read per-user
--     alongside the row, so a column would buy nothing.
--
-- Backfill posture (decided): existing users are grandfathered to their
-- CURRENT effective visibility so live badges / leaderboard presence do not
-- suddenly vanish. Brand-new signups leave `privacy` NULL, which
-- resolveUserPrivacy() maps to the privacy-first new-user default.
--
-- Idempotent: safe to re-apply.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS leaderboard_listed boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy jsonb;

-- Excludes opted-out users from the leaderboard/ranking joins efficiently.
CREATE INDEX IF NOT EXISTS idx_users_leaderboard_listed ON users (leaderboard_listed) WHERE leaderboard_listed;

-- Grandfather existing users. Today the status widget exposes
-- project/language/editor to any embedder (gated only by plan), the profile
-- shows history, and leaderboard lists everyone — so the status-quo
-- effective visibility is "public" for everything except email (always
-- forced false today) and github (whatever show_github said).
--
-- The `created_at` cutoff makes this safe to re-apply: only users that
-- existed before privacy shipped get grandfathered. Anyone who signs up
-- afterwards keeps privacy = NULL, which resolveUserPrivacy() maps to the
-- privacy-first default — so a re-run can never clobber a new user's
-- private settings back to public.
UPDATE users
SET privacy = jsonb_build_object(
  'v', 1,
  'profilePublic', true,
  'widgetsEnabled', true,
  'identity', jsonb_build_object(
    'email', 'private',
    'github', CASE WHEN show_github THEN 'public' ELSE 'private' END
  ),
  'status', jsonb_build_object(
    'coding', 'public',
    'project', 'public',
    'language', 'public',
    'editor', 'public'
  ),
  'history', jsonb_build_object(
    'totalTime', 'public',
    'languages', 'public',
    'projects', 'public',
    'calendar', 'public'
  )
)
WHERE privacy IS NULL
  AND created_at < TIMESTAMPTZ '2026-05-27 00:00:00+00';

COMMIT;
