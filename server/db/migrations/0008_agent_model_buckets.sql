-- 0008_agent_model_buckets.sql
--
-- v3 rollup additions. Two related changes:
--
--   1. agent_session_models gains cache_creation_5m/1h_input_tokens — TTL
--      split subsets of cache_creation_input_tokens. Anthropic prices a
--      1-hour ephemeral cache write at 2x input vs the 5-minute write at
--      1.25x input, so the cost path needs the split to bill the 1h
--      portion correctly. 0 = split unknown (legacy CLI), in which case
--      cost is unchanged (everything bills at the 5m/default creation rate).
--
--   2. New table agent_model_buckets — per-(model, 15-min bucket) token
--      rollups anchored to the real activity time `ts`. The cost timeline
--      previously dumped a whole session's model tokens onto the bucket of
--      s.last_event_at, so a session spanning midnight billed entirely to
--      its last day. v3 CLIs ship these buckets so cost lands on the day it
--      actually happened; v2 / legacy sessions have no rows here and the
--      dashboard falls back to the agent_session_models / last_event_at path.
--
-- Safe on a live database: ADD COLUMN with NOT NULL DEFAULT 0 (no existing
-- rows rewritten beyond the default backfill) and CREATE TABLE / INDEX
-- IF NOT EXISTS. Fully idempotent.

BEGIN;

-- 1. cache-creation TTL split columns on the per-session model rollup.
ALTER TABLE agent_session_models
  ADD COLUMN IF NOT EXISTS cache_creation_5m_input_tokens bigint NOT NULL DEFAULT 0;
ALTER TABLE agent_session_models
  ADD COLUMN IF NOT EXISTS cache_creation_1h_input_tokens bigint NOT NULL DEFAULT 0;

-- 2. per-(model, 15-min bucket) token rollups for the cost timeline.
CREATE TABLE IF NOT EXISTS agent_model_buckets (
    bucket_key                     text PRIMARY KEY,
    rollup_key                     text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id                        bigint NOT NULL,
    machine_id                     uuid   NOT NULL,
    source                         text   NOT NULL,
    ts                             timestamptz NOT NULL,
    model                          text   NOT NULL,
    call_count                     integer NOT NULL DEFAULT 0,
    input_tokens                   bigint  NOT NULL DEFAULT 0,
    cached_input_tokens            bigint  NOT NULL DEFAULT 0,
    cache_creation_input_tokens    bigint  NOT NULL DEFAULT 0,
    cache_creation_5m_input_tokens bigint  NOT NULL DEFAULT 0,
    cache_creation_1h_input_tokens bigint  NOT NULL DEFAULT 0,
    cache_read_input_tokens        bigint  NOT NULL DEFAULT 0,
    output_tokens                  bigint  NOT NULL DEFAULT 0,
    reasoning_output_tokens        bigint  NOT NULL DEFAULT 0,
    total_tokens                   bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_model_buckets_tenant_idx
    ON agent_model_buckets (user_id, machine_id, ts);
CREATE INDEX IF NOT EXISTS agent_model_buckets_rollup_idx
    ON agent_model_buckets (rollup_key);

COMMIT;
