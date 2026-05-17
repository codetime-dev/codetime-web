-- 0001_agent_merger.sql
--
-- Folds the standalone agent-time service into codetime-web-v3.
-- Creates two shared platform tables (machines, projects) and the
-- agent_* telemetry namespace. No existing tables are altered.
--
-- Hand-written to control SQL exactly; drizzle-kit generate is expected
-- to produce equivalent output once it is wired up. If you regenerate,
-- diff against this file before applying.

BEGIN;

-- ---------------------------------------------------------------------------
-- Shared platform tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS machines (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       bigint NOT NULL,
    hostname      text   NOT NULL,
    display_name  text   NOT NULL,
    platform      text,
    source        text   NOT NULL DEFAULT 'agent',
    last_seen_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS machines_user_idx
    ON machines (user_id, last_seen_at);

ALTER TABLE machines
    ADD CONSTRAINT machines_user_host_uk UNIQUE (user_id, hostname, platform);

CREATE TABLE IF NOT EXISTS projects (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         bigint NOT NULL,
    git_origin      text,
    workspace_name  text   NOT NULL,
    display_name    text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects
    ADD CONSTRAINT projects_uk UNIQUE (user_id, git_origin, workspace_name);

CREATE INDEX IF NOT EXISTS projects_user_idx ON projects (user_id);

-- ---------------------------------------------------------------------------
-- Agent telemetry
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_tokens (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       bigint NOT NULL,
    machine_id    uuid   NOT NULL REFERENCES machines (id) ON DELETE CASCADE,
    token_hash    text   NOT NULL UNIQUE,
    name          text   NOT NULL,
    scopes        text[] NOT NULL DEFAULT ARRAY['agent:write']::text[],
    last_used_at  timestamptz,
    revoked_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_tokens_user_idx ON agent_tokens (user_id);

CREATE TABLE IF NOT EXISTS agent_cli_links (
    code            text PRIMARY KEY,
    user_id         bigint,
    machine_id      uuid,
    token_id        uuid REFERENCES agent_tokens (id) ON DELETE SET NULL,
    hostname        text NOT NULL,
    -- Plaintext token held only between approval and the CLI's next poll.
    -- Cleared by the poll handler. Postgres-resident so PM2 cluster
    -- workers all see the same value.
    pending_secret  text,
    expires_at      timestamptz NOT NULL,
    approved_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_sessions (
    rollup_key                    text PRIMARY KEY,
    user_id                       bigint NOT NULL,
    machine_id                    uuid   NOT NULL,
    project_id                    uuid,
    payload_hash                  text   NOT NULL,
    source                        text   NOT NULL,
    project                       text,
    session_id                    text   NOT NULL,
    agent                         text,
    started_at                    timestamptz NOT NULL,
    last_event_at                 timestamptz NOT NULL,
    event_count                   integer NOT NULL DEFAULT 0,
    prompt_count                  integer NOT NULL DEFAULT 0,
    turn_count                    integer NOT NULL DEFAULT 0,
    tool_call_count               integer NOT NULL DEFAULT 0,
    command_call_count            integer NOT NULL DEFAULT 0,
    input_tokens                  bigint  NOT NULL DEFAULT 0,
    cached_input_tokens           bigint  NOT NULL DEFAULT 0,
    cache_creation_input_tokens   bigint  NOT NULL DEFAULT 0,
    cache_read_input_tokens       bigint  NOT NULL DEFAULT 0,
    output_tokens                 bigint  NOT NULL DEFAULT 0,
    reasoning_output_tokens       bigint  NOT NULL DEFAULT 0,
    total_tokens                  bigint  NOT NULL DEFAULT 0,
    lines_added                   integer NOT NULL DEFAULT 0,
    lines_removed                 integer NOT NULL DEFAULT 0,
    duration_ms                   bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_sessions_tenant_idx
    ON agent_sessions (user_id, machine_id, last_event_at);
CREATE INDEX IF NOT EXISTS agent_sessions_project_idx
    ON agent_sessions (user_id, project_id, last_event_at);
CREATE INDEX IF NOT EXISTS agent_sessions_session_idx
    ON agent_sessions (user_id, source, session_id);

CREATE TABLE IF NOT EXISTS agent_turns (
    turn_key             text PRIMARY KEY,
    rollup_key           text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id              bigint NOT NULL,
    machine_id           uuid   NOT NULL,
    project_id           uuid,
    session_id           text   NOT NULL,
    source               text   NOT NULL,
    project              text,
    turn_id              text   NOT NULL,
    started_at           timestamptz NOT NULL,
    last_event_at        timestamptz NOT NULL,
    completed_at         timestamptz,
    prompt_submitted_at  timestamptz,
    prompt_chars         integer NOT NULL DEFAULT 0,
    event_count          integer NOT NULL DEFAULT 0,
    tool_call_count      integer NOT NULL DEFAULT 0,
    input_tokens         bigint  NOT NULL DEFAULT 0,
    output_tokens        bigint  NOT NULL DEFAULT 0,
    total_tokens         bigint  NOT NULL DEFAULT 0,
    duration_ms          bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_turns_rollup_idx
    ON agent_turns (rollup_key, started_at);
CREATE INDEX IF NOT EXISTS agent_turns_tenant_idx
    ON agent_turns (user_id, machine_id, started_at);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
    tool_key           text PRIMARY KEY,
    rollup_key         text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id            bigint NOT NULL,
    machine_id         uuid   NOT NULL,
    project_id         uuid,
    session_id         text   NOT NULL,
    source             text   NOT NULL,
    project            text,
    tool               text   NOT NULL,
    call_count         integer NOT NULL DEFAULT 0,
    failure_count      integer NOT NULL DEFAULT 0,
    total_duration_ms  bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_tool_calls_rollup_idx
    ON agent_tool_calls (rollup_key);
CREATE INDEX IF NOT EXISTS agent_tool_calls_tenant_idx
    ON agent_tool_calls (user_id, tool);

CREATE TABLE IF NOT EXISTS agent_session_models (
    model_key                     text PRIMARY KEY,
    rollup_key                    text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id                       bigint NOT NULL,
    machine_id                    uuid   NOT NULL,
    project_id                    uuid,
    session_id                    text   NOT NULL,
    source                        text   NOT NULL,
    project                       text,
    model                         text   NOT NULL,
    call_count                    integer NOT NULL DEFAULT 0,
    input_tokens                  bigint  NOT NULL DEFAULT 0,
    cached_input_tokens           bigint  NOT NULL DEFAULT 0,
    cache_creation_input_tokens   bigint  NOT NULL DEFAULT 0,
    cache_read_input_tokens       bigint  NOT NULL DEFAULT 0,
    output_tokens                 bigint  NOT NULL DEFAULT 0,
    reasoning_output_tokens       bigint  NOT NULL DEFAULT 0,
    total_tokens                  bigint  NOT NULL DEFAULT 0,
    estimated_cost_micros         bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_session_models_rollup_idx
    ON agent_session_models (rollup_key);
CREATE INDEX IF NOT EXISTS agent_session_models_tenant_idx
    ON agent_session_models (user_id, model);

CREATE TABLE IF NOT EXISTS agent_session_files (
    file_key         text PRIMARY KEY,
    rollup_key       text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id          bigint NOT NULL,
    machine_id       uuid   NOT NULL,
    project_id       uuid,
    session_id       text   NOT NULL,
    source           text   NOT NULL,
    project          text,
    path_hash        text   NOT NULL,
    display_path     text   NOT NULL,
    reads            integer NOT NULL DEFAULT 0,
    writes           integer NOT NULL DEFAULT 0,
    lines_added      integer NOT NULL DEFAULT 0,
    lines_removed    integer NOT NULL DEFAULT 0,
    last_touched_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS agent_session_files_rollup_idx
    ON agent_session_files (rollup_key);
CREATE INDEX IF NOT EXISTS agent_session_files_tenant_idx
    ON agent_session_files (user_id, last_touched_at);

CREATE TABLE IF NOT EXISTS agent_time_buckets (
    bucket_key                    text PRIMARY KEY,
    rollup_key                    text   NOT NULL REFERENCES agent_sessions (rollup_key) ON DELETE CASCADE,
    user_id                       bigint NOT NULL,
    machine_id                    uuid   NOT NULL,
    project_id                    uuid,
    session_id                    text   NOT NULL,
    source                        text   NOT NULL,
    project                       text,
    ts                            timestamptz NOT NULL,
    activity_count                integer NOT NULL DEFAULT 0,
    session_starts                integer NOT NULL DEFAULT 0,
    model_calls                   integer NOT NULL DEFAULT 0,
    tool_calls                    integer NOT NULL DEFAULT 0,
    command_calls                 integer NOT NULL DEFAULT 0,
    file_reads                    integer NOT NULL DEFAULT 0,
    file_writes                   integer NOT NULL DEFAULT 0,
    lines_added                   integer NOT NULL DEFAULT 0,
    lines_removed                 integer NOT NULL DEFAULT 0,
    input_tokens                  bigint  NOT NULL DEFAULT 0,
    cached_input_tokens           bigint  NOT NULL DEFAULT 0,
    cache_creation_input_tokens   bigint  NOT NULL DEFAULT 0,
    cache_read_input_tokens       bigint  NOT NULL DEFAULT 0,
    output_tokens                 bigint  NOT NULL DEFAULT 0,
    reasoning_output_tokens       bigint  NOT NULL DEFAULT 0,
    total_tokens                  bigint  NOT NULL DEFAULT 0,
    estimated_cost_micros         bigint  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS agent_time_buckets_tenant_idx
    ON agent_time_buckets (user_id, machine_id, ts);
CREATE INDEX IF NOT EXISTS agent_time_buckets_project_idx
    ON agent_time_buckets (user_id, project_id, ts);

COMMIT;
