#!/usr/bin/env node
// Seed fresh agent-dashboard data for the App Store review account.
//
// The reviewer account (APP_REVIEWER_USER_ID) needs recent, lifelike
// activity so the iOS Vibe dashboard isn't empty when Apple reviews the
// build. This script writes a rolling window: the last 7 days of agent
// sessions, with the most recent 24h intentionally denser.
//
// It is SAFE TO RUN REPEATEDLY. Every row it writes carries a `rvseed-`
// key prefix; each run first deletes the previous `rvseed-` rows for this
// user, then re-seeds relative to the current clock. Pre-existing historical
// sessions (any key NOT starting with `rvseed-`) are never touched.
//
// Usage:
//   node --env-file=.env scripts/seed-reviewer-data.mjs          # write
//   DRY_RUN=1 node --env-file=.env scripts/seed-reviewer-data.mjs # plan only
//
// Requires POSTGRES_* and APP_REVIEWER_USER_ID in the environment (both
// live in .env). The script refuses to run without APP_REVIEWER_USER_ID
// so it can never accidentally seed an arbitrary account.

import { randomUUID } from 'node:crypto'
import process from 'node:process'
import postgres from 'postgres'

const UID = Number(process.env.APP_REVIEWER_USER_ID)
if (!Number.isFinite(UID)) {
  console.error('APP_REVIEWER_USER_ID is required (none set). Aborting.')
  process.exit(1)
}
const DRY_RUN = process.env.DRY_RUN === '1'
const PREFIX = 'rvseed-'
// workspace_minutes_v2 / workspace_meta_v2 have no key column to prefix, so
// seeded editor rows are tagged by a sentinel xxh3_64 range near the int64
// ceiling. Real xxh3 hashes practically never land here, so `>= base` both
// identifies and (on the next run) cleans up exactly the rows we wrote.
const SEED_META_BASE = 9_000_000_000_000_000_000n
const DAYS = 7
const NOW = Date.now()
const MIN = 60_000
const FIVE_MIN_MS = 5 * MIN
const DAY_MS = 86_400_000

// Deterministic PRNG (mulberry32) seeded off the current day so a given
// day's data is stable within that day but advances as the window rolls.
function makeRng(seed) {
  let a = seed >>> 0
  return () => {
    // mulberry32 relies on `| 0` for 32-bit integer wraparound (ToInt32),
    // which Math.trunc does not replicate — keep the bitwise form.
    // eslint-disable-next-line unicorn/prefer-math-trunc
    a = (a + 0x6D_2B_79_F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}
const rng = makeRng(Math.floor(NOW / DAY_MS))
const rand = (min, max) => min + (max - min) * rng()
const randInt = (min, max) => Math.floor(rand(min, max + 1))
const pick = arr => arr[Math.floor(rng() * arr.length)]

// Agent / model / tool catalogue — mirrors what this account already has,
// so new rows blend in with the historical 35 sessions.
const AGENTS = [
  {
    source: 'claude-code',
    models: ['claude-opus-4-7', 'claude-sonnet-4-6'],
    tools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'TodoWrite', 'WebSearch'],
  },
  {
    source: 'codex',
    models: ['gpt-5.1-codex', 'gpt-5.2-codex'],
    tools: ['exec_command', 'apply_patch', 'update_plan', 'view_image', 'web_search'],
  },
]

const sql = postgres({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'postgres',
  // Map JS camelCase ⇄ DB snake_case in both directions, so the helper
  // inserts (`sql(obj)`) and result rows both speak the schema's names.
  transform: postgres.camel,
})

// Ensure the reviewer has one machine + a few projects to attribute
// activity to. Reuse whatever already exists; only create on first run.
async function ensureMachine() {
  const rows = await sql`select id from machines where user_id = ${UID} order by last_seen_at desc nulls last limit 1`
  if (rows[0]) {
    return rows[0].id
  }
  const [m] = await sql`
    insert into machines (user_id, hostname, display_name, platform, source, last_seen_at, created_at)
    values (${UID}, 'codetime-tester-mac', 'CodeTime Tester (MacBook)', 'darwin', 'agent', now(), now())
    returning id
  `
  return m.id
}

async function ensureProjects() {
  const rows = await sql`select id, git_origin, workspace_name from projects where user_id = ${UID}`
  if (rows.length > 0) {
    return rows
  }
  const defaults = [
    ['git@github.com:jannchie/codetime.git', 'codetime'],
    ['git@github.com:jannchie/nuxt-playground.git', 'nuxt-playground'],
    ['git@github.com:jannchie/dotfiles.git', 'dotfiles'],
  ]
  const out = []
  for (const [origin, name] of defaults) {
    const [p] = await sql`
      insert into projects (user_id, git_origin, workspace_name, display_name, created_at)
      values (${UID}, ${origin}, ${name}, ${name}, now())
      returning id, git_origin, workspace_name
    `
    out.push(p)
  }
  return out
}

// Build one session and all its child rows starting at `startMs`.
function buildSession(startMs, seq, machineId, project) {
  const agent = pick(AGENTS)
  const sessionId = `${PREFIX}${new Date(startMs).toISOString().slice(0, 10).replaceAll('-', '')}-${String(seq).padStart(3, '0')}`
  const rollupKey = `${PREFIX}${sessionId}`

  // Turns drive active time: each turn has its own duration; the gaps
  // between turns are idle and excluded (see agent-dashboard turn logic).
  const turnCount = randInt(3, 8)
  let cursor = startMs
  const turns = []
  let inputTokens = 0
  let outputTokens = 0
  let toolCallTotal = 0
  for (let i = 0; i < turnCount; i++) {
    const promptAt = cursor
    const activeMs = randInt(45, 240) * 1000 // 45s–4m of real work
    const startedAt = promptAt
    const completedAt = promptAt + activeMs
    const tIn = randInt(2500, 9000)
    const tOut = randInt(300, 1200)
    const tTools = randInt(1, 6)
    inputTokens += tIn
    outputTokens += tOut
    toolCallTotal += tTools
    turns.push({ startedAt, completedAt, promptAt, durationMs: activeMs, inputTokens: tIn, outputTokens: tOut, toolCalls: tTools, promptChars: randInt(40, 600) })
    // Idle gap before the next prompt (reading, thinking, AFK).
    cursor = completedAt + randInt(20, 180) * 1000
  }
  const lastEventMs = turns.at(-1).completedAt
  const wallMs = lastEventMs - startMs
  const totalTokens = inputTokens + outputTokens
  const cacheCreation = Math.round(inputTokens * 0.15)
  const cacheRead = Math.round(inputTokens * 0.45)
  const cachedInput = cacheCreation + cacheRead
  const linesAdded = randInt(20, 220)
  const linesRemoved = randInt(5, 90)
  const fileReads = randInt(3, 14)
  const fileWrites = randInt(1, 6)
  const commandCalls = agent.source === 'codex' ? randInt(2, 8) : randInt(1, 5)

  // Split tokens across 1–2 models for this session.
  const modelNames = rng() < 0.6 ? [pick(agent.models)] : agent.models
  const models = modelNames.map((model, idx) => {
    const share = modelNames.length === 1 ? 1 : (idx === 0 ? 0.65 : 0.35)
    const mIn = Math.round(inputTokens * share)
    const mOut = Math.round(outputTokens * share)
    return {
      model,
      callCount: Math.max(1, Math.round(turnCount * share)),
      inputTokens: mIn,
      cachedInputTokens: Math.round(cachedInput * share),
      cacheCreationInputTokens: Math.round(cacheCreation * share),
      cacheReadInputTokens: Math.round(cacheRead * share),
      outputTokens: mOut,
      totalTokens: mIn + mOut,
      estimatedCostMicros: Math.round((mIn * 3 + mOut * 15) / 1000) * 1000,
    }
  })

  // Tool aggregation: spread the per-turn tool calls over the agent's toolset.
  const toolMap = new Map()
  let remaining = toolCallTotal
  const toolset = [...agent.tools]
  while (remaining > 0) {
    const t = pick(toolset)
    const take = Math.min(remaining, randInt(1, 4))
    toolMap.set(t, (toolMap.get(t) ?? 0) + take)
    remaining -= take
  }

  // Files touched.
  const fileCount = randInt(1, 4)
  const exts = ['ts', 'vue', 'mjs', 'json', 'md', 'css']
  const files = Array.from({ length: fileCount }, (_, i) => ({
    idx: i,
    displayPath: `src/${pick(['components', 'server', 'utils', 'pages'])}/file-${randInt(1, 40)}.${pick(exts)}`,
    reads: randInt(1, 8),
    writes: randInt(0, 4),
    linesAdded: randInt(0, 80),
    linesRemoved: randInt(0, 30),
  }))

  // 5-minute time buckets, attributing each turn to the bucket it began in.
  const bucketAgg = new Map()
  const bucketFor = (ms) => {
    const floor = Math.floor(ms / FIVE_MIN_MS) * FIVE_MIN_MS
    if (!bucketAgg.has(floor)) {
      bucketAgg.set(floor, { ts: floor, activity: 0, sessionStarts: 0, modelCalls: 0, toolCalls: 0, commandCalls: 0, fileReads: 0, fileWrites: 0, linesAdded: 0, linesRemoved: 0, inputTokens: 0, outputTokens: 0 })
    }
    return bucketAgg.get(floor)
  }
  bucketFor(startMs).sessionStarts += 1
  for (const t of turns) {
    const b = bucketFor(t.startedAt)
    b.activity += 1 + t.toolCalls
    b.modelCalls += 1
    b.toolCalls += t.toolCalls
    b.inputTokens += t.inputTokens
    b.outputTokens += t.outputTokens
  }
  // Sprinkle file/line/command counts into the first bucket.
  const firstBucket = bucketFor(startMs)
  firstBucket.fileReads += fileReads
  firstBucket.fileWrites += fileWrites
  firstBucket.linesAdded += linesAdded
  firstBucket.linesRemoved += linesRemoved
  firstBucket.commandCalls += commandCalls

  return {
    session: {
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      payloadHash: `${PREFIX}hash-${sessionId}`,
      source: agent.source,
      project: project.workspaceName,
      sessionId,
      agent: agent.source,
      startedAt: new Date(startMs),
      lastEventAt: new Date(lastEventMs),
      eventCount: turnCount + toolCallTotal + commandCalls,
      promptCount: turnCount,
      turnCount,
      toolCallCount: toolCallTotal,
      commandCallCount: commandCalls,
      inputTokens,
      cachedInputTokens: cachedInput,
      cacheCreationInputTokens: cacheCreation,
      cacheReadInputTokens: cacheRead,
      outputTokens,
      reasoningOutputTokens: 0,
      totalTokens,
      linesAdded,
      linesRemoved,
      durationMs: wallMs,
    },
    turns: turns.map((t, i) => ({
      turnKey: `${rollupKey}-t${i}`,
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      sessionId,
      source: agent.source,
      project: project.workspaceName,
      turnId: `turn-${i}`,
      startedAt: new Date(t.startedAt),
      lastEventAt: new Date(t.completedAt),
      completedAt: new Date(t.completedAt),
      promptSubmittedAt: new Date(t.promptAt),
      promptChars: t.promptChars,
      eventCount: 1 + t.toolCalls,
      toolCallCount: t.toolCalls,
      inputTokens: t.inputTokens,
      outputTokens: t.outputTokens,
      totalTokens: t.inputTokens + t.outputTokens,
      durationMs: t.durationMs,
    })),
    models: models.map((m, i) => ({
      modelKey: `${rollupKey}-m${i}`,
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      sessionId,
      source: agent.source,
      project: project.workspaceName,
      ...m,
      reasoningOutputTokens: 0,
      cacheCreationInputTokens: m.cacheCreationInputTokens,
      cacheReadInputTokens: m.cacheReadInputTokens,
    })),
    tools: [...toolMap.entries()].map(([tool, callCount], i) => ({
      toolKey: `${rollupKey}-tool${i}`,
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      sessionId,
      source: agent.source,
      project: project.workspaceName,
      tool,
      callCount,
      failureCount: rng() < 0.2 ? randInt(1, 2) : 0,
      totalDurationMs: callCount * randInt(200, 3000),
    })),
    files: files.map(f => ({
      fileKey: `${rollupKey}-f${f.idx}`,
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      sessionId,
      source: agent.source,
      project: project.workspaceName,
      pathHash: `${PREFIX}ph-${sessionId}-${f.idx}`,
      displayPath: f.displayPath,
      reads: f.reads,
      writes: f.writes,
      linesAdded: f.linesAdded,
      linesRemoved: f.linesRemoved,
      lastTouchedAt: new Date(lastEventMs),
    })),
    buckets: [...bucketAgg.values()].map((b, i) => ({
      bucketKey: `${rollupKey}-b${i}`,
      rollupKey,
      userId: UID,
      machineId,
      projectId: project.id,
      sessionId,
      source: agent.source,
      project: project.workspaceName,
      ts: new Date(b.ts),
      activityCount: b.activity,
      sessionStarts: b.sessionStarts,
      modelCalls: b.modelCalls,
      toolCalls: b.toolCalls,
      commandCalls: b.commandCalls,
      fileReads: b.fileReads,
      fileWrites: b.fileWrites,
      linesAdded: b.linesAdded,
      linesRemoved: b.linesRemoved,
      inputTokens: b.inputTokens,
      cachedInputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: b.outputTokens,
      reasoningOutputTokens: 0,
      totalTokens: b.inputTokens + b.outputTokens,
      estimatedCostMicros: Math.round((b.inputTokens * 3 + b.outputTokens * 15) / 1000) * 1000,
    })),
  }
}

// Pick session start times: a baseline spread over the last 7 days plus an
// extra-dense burst inside the last 24h. Daytime-biased (08:00–23:00 local-ish)
// so the rhythm heatmap shows a believable working pattern.
function plannedStarts() {
  const starts = []
  // Baseline: 2–3 sessions per day across the 7-day window.
  for (let d = DAYS - 1; d >= 0; d--) {
    const dayBase = NOW - d * DAY_MS
    const count = randInt(2, 3)
    for (let i = 0; i < count; i++) {
      const dayStart = new Date(dayBase)
      dayStart.setHours(8, 0, 0, 0)
      const hourOffset = rand(0, 15) * 3_600_000 // 08:00–23:00
      const t = dayStart.getTime() + hourOffset
      if (t <= NOW) {
        starts.push(t)
      }
    }
  }
  // Burst: 6–8 extra sessions inside the last 24h.
  const burst = randInt(6, 8)
  for (let i = 0; i < burst; i++) {
    starts.push(NOW - rand(0, 1) * DAY_MS)
  }
  return starts.sort((a, b) => a - b)
}

// ===========================================================================
// Editor coding activity (workspace_minutes_v2 / workspace_meta_v2).
//
// Coding time is literally COUNT(*) of workspace_minutes_v2 rows — one row
// per minute spent in a file. Each minute references a workspace_meta_v2 row
// (the file/language/project context) via (uid, xxh3_64). We mint a small set
// of seed meta rows and scatter minute rows across them.
// ===========================================================================

// (language, relativeFile) templates, round-robined across the user's
// projects. Languages mirror the account's existing top languages.
const CODING_FILES = [
  ['typescript', 'server/routes/v3/agent/dashboard.get.ts'],
  ['typescript', 'app/composables/useAgentDashboard.ts'],
  ['vue', 'app/components/Dashboard/CalendarHeatmap.vue'],
  ['vue', 'app/pages/[locale]/dashboard/vibe.vue'],
  ['markdown', 'README.md'],
  ['shellscript', 'scripts/deploy.sh'],
  ['toml', 'pyproject.toml'],
  ['yaml', 'ecosystem.config.yaml'],
  ['python', 'src/services/tags.py'],
  ['json', 'package.json'],
  ['css', 'app/assets/tokens.css'],
]

function buildCodingMeta(projects) {
  return CODING_FILES.map(([language, relativeFile], i) => {
    const project = projects[i % projects.length]
    return {
      // workspace_meta_v2.id is a NOT-NULL uuid with no DB default.
      id: randomUUID(),
      uid: UID,
      language,
      workspaceName: project.workspaceName,
      absoluteFile: '',
      relativeFile,
      editor: 'vscode',
      platform: 'darwin',
      gitOrigin: project.gitOrigin ?? '',
      gitBranch: '',
      xxh3_64: SEED_META_BASE + BigInt(i),
    }
  })
}

// Plan contiguous coding blocks: a baseline per day plus a denser burst in
// the last 24h. Each block is a run of consecutive minutes in one file.
function plannedCodingBlocks() {
  const blocks = []
  const addDayBlocks = (anchorMs, targetMin) => {
    let remaining = targetMin
    while (remaining > 0) {
      const len = Math.min(remaining, randInt(20, 75))
      remaining -= len
      const dayStart = new Date(anchorMs)
      dayStart.setHours(8, 0, 0, 0)
      const startMs = dayStart.getTime() + Math.round(rand(0, 13) * 3_600_000)
      blocks.push({ startMs, lenMin: len })
    }
  }
  for (let d = DAYS - 1; d >= 0; d--) {
    addDayBlocks(NOW - d * DAY_MS, randInt(90, 180))
  }
  // Last-24h burst.
  let burst = randInt(120, 200)
  while (burst > 0) {
    const len = Math.min(burst, randInt(20, 75))
    burst -= len
    blocks.push({ startMs: NOW - Math.round(rand(0, 1) * DAY_MS), lenMin: len })
  }
  return blocks
}

// Expand blocks into [uid, recordedAt, metaXxh3, language] minute rows,
// deduping any minute already claimed by an earlier block (one row/minute).
function buildCodingMinutes(metas) {
  const used = new Set()
  const rows = []
  for (const block of plannedCodingBlocks()) {
    const meta = pick(metas)
    const startMin = Math.floor(block.startMs / MIN) * MIN
    for (let i = 0; i < block.lenMin; i++) {
      const t = startMin + i * MIN
      if (t > NOW) {
        break
      }
      if (used.has(t)) {
        continue
      }
      used.add(t)
      rows.push([UID, new Date(t), meta.xxh3_64, meta.language])
    }
  }
  rows.sort((a, b) => a[1] - b[1])
  return rows
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

async function main() {
  const machineId = await ensureMachine()
  const projects = await ensureProjects()
  const starts = plannedStarts()

  const built = starts.map((t, i) => buildSession(t, i + 1, machineId, pick(projects)))
  const totals = { sessions: 0, turns: 0, activeMs: 0, tokens: 0 }
  for (const b of built) {
    totals.sessions += 1
    totals.turns += b.turns.length
    for (const t of b.turns) {
      totals.activeMs += t.durationMs
    }
    totals.tokens += b.session.totalTokens
  }

  const last24 = built.filter(b => b.session.lastEventAt.getTime() >= NOW - DAY_MS).length
  console.log(`Vibe:   ${totals.sessions} sessions (${last24} in last 24h), ${totals.turns} turns, ${(totals.activeMs / 3_600_000).toFixed(1)}h active, ${totals.tokens.toLocaleString()} tokens`)

  const codingMetas = buildCodingMeta(projects)
  const codingRows = buildCodingMinutes(codingMetas)
  const codingLast24 = codingRows.filter(r => r[1].getTime() >= NOW - DAY_MS).length
  console.log(`Coding: ${codingRows.length} minutes (${codingLast24} in last 24h) across ${codingMetas.length} files`)
  console.log(`Window: ${new Date(starts[0]).toISOString()} → ${new Date(NOW).toISOString()}`)

  if (DRY_RUN) {
    console.log('DRY_RUN=1 — no rows written.')
    await sql.end()
    return
  }

  await sql.begin(async (tx) => {
    // Clear previous rvseed-* rows for this user. Child tables cascade on
    // agent_sessions delete, but delete explicitly so this works even if a
    // FK is ever recreated without ON DELETE CASCADE.
    await tx`delete from agent_time_buckets where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`
    await tx`delete from agent_session_files where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`
    await tx`delete from agent_session_models where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`
    await tx`delete from agent_tool_calls where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`
    await tx`delete from agent_turns where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`
    await tx`delete from agent_sessions where user_id = ${UID} and rollup_key like ${`${PREFIX}%`}`

    for (const b of built) {
      await tx`insert into agent_sessions ${tx(b.session)}`
      if (b.turns.length > 0) {
        await tx`insert into agent_turns ${tx(b.turns)}`
      }
      if (b.models.length > 0) {
        await tx`insert into agent_session_models ${tx(b.models)}`
      }
      if (b.tools.length > 0) {
        await tx`insert into agent_tool_calls ${tx(b.tools)}`
      }
      if (b.files.length > 0) {
        await tx`insert into agent_session_files ${tx(b.files)}`
      }
      if (b.buckets.length > 0) {
        await tx`insert into agent_time_buckets ${tx(b.buckets)}`
      }
    }
    // --- editor coding activity --------------------------------------
    // Clear prior seed rows (identified by the sentinel xxh3_64 range),
    // then re-insert meta + minute rows. Values go in as positional arrays
    // so the camelCase column transform never touches `xxh3_64`.
    await tx`delete from workspace_minutes_v2 where uid = ${UID} and meta_xxh3_64 >= ${SEED_META_BASE}`
    await tx`delete from workspace_meta_v2 where uid = ${UID} and xxh3_64 >= ${SEED_META_BASE}`
    await tx`
      insert into workspace_meta_v2 (id, uid, language, workspace_name, absolute_file, relative_file, editor, platform, git_origin, git_branch, xxh3_64)
      values ${tx(codingMetas.map(m => [m.id, m.uid, m.language, m.workspaceName, m.absoluteFile, m.relativeFile, m.editor, m.platform, m.gitOrigin, m.gitBranch, m.xxh3_64]))}
    `
    for (const part of chunk(codingRows, 1000)) {
      await tx`insert into workspace_minutes_v2 (uid, recorded_at, meta_xxh3_64, language) values ${tx(part)}`
    }

    // Keep the machine looking active.
    await tx`update machines set last_seen_at = now() where id = ${machineId}::uuid and user_id = ${UID}`
  })

  console.log('Done. Reviewer dashboard re-seeded.')
  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end()
  process.exit(1)
})
