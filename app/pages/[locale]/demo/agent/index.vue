<script setup lang="ts">
import type { UserSelfPublic } from '~/api/v3/types.gen'
import type {
  VibeAgentRow,
  VibeDashboard,
  VibeHeatmapCell,
  VibeModelRow,
  VibeOverviewBucket,
  VibeProjectRow,
  VibeTokenBucket,
  VibeToolRow,
} from '~/components/Vibe/types'
import { compact } from '~/components/Vibe/types'
import { useExchangeRate } from '~/composables/useExchangeRate'

const { format: fmtCurrency } = useExchangeRate()

// Public demo of the Vibe (agent telemetry) dashboard. Reuses the same
// Vibe* components as /dashboard/agent but feeds them deterministic
// synthetic data so anonymous visitors can preview the layout without
// agent uploads.
//
// Mirrors /demo/index.vue's auth shim: injects a fake `pro` user so the
// dashboard layout opens its slot, restores the previous user on leave.

definePageMeta({
  layout: 'dashboard',
  skipAuthGate: true,
})

const t = useI18N()

const user = useUser()
const FAKE_USER: UserSelfPublic = {
  id: 0,
  username: 'demo',
  email: undefined,
  avatar: undefined,
  plan: 'pro',
  timezone: 'UTC',
  uploadToken: '',
  bio: undefined,
  githubId: undefined,
  googleId: undefined,
  planExpiresAt: undefined,
  planStatus: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const originalUser = user.value
user.value = FAKE_USER
const stopWatch = watch(user, (v) => {
  if (!v) {
    user.value = FAKE_USER
  }
}, { flush: 'sync' })
onBeforeUnmount(() => {
  stopWatch()
  user.value = originalUser
})

// ---------------------------------------------------------------------------
// Synthetic dashboard. Numbers are pinned (seeded PRNG, no Math.random) so
// SSR and hydration agree and screenshots stay stable. Shapes match the
// real GET /v3/agent/dashboard response.
//
// The original generator used a single sine wave + linear ramp which made
// every chart read as obviously synthetic. The current version layers:
//   * weekly cadence (Mon-Fri productive, Sat-Sun reduced)
//   * an autocorrelated "energy" walk that drifts day to day
//   * a few hand-placed binge days and rest days
//   * per-day seeded jitter
// so the shapes feel like a real developer's month instead of a sine wave.
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000
// `now` is intentionally mid-day. TokenTimeline aligns its x-axis by
// running `ceilToBucket(until)` — when `until` lands exactly on a UTC
// midnight (which is also a bucket boundary), ceilToBucket is a no-op
// and the right-most bar (which still spans [midnight, midnight+1d))
// pokes past the domain, producing a visible 1-bucket right shift.
// Keeping `now` mid-day pushes the ceil to the following midnight so
// the last bar fits inside the axis.
const now = new Date('2026-05-18T15:00:00Z')
// Bucket timestamps are server-style UTC midnights (Postgres date_trunc).
const baseDay = new Date('2026-05-18T00:00:00Z')
const since = new Date(baseDay.getTime() - 27 * DAY_MS)

function isoDay(offset: number): string {
  return new Date(baseDay.getTime() - offset * DAY_MS).toISOString()
}

// mulberry32 — small deterministic PRNG seeded from a fixed string so the
// jitter survives SSR + hydration unchanged.
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D_2B_79_F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

const rng = makeRng(0xC0_DE_71_AE)
const jitter = (amp: number) => (rng() * 2 - 1) * amp

// Hand-placed anomalies indexed by `i` (0 = 28 days ago, 27 = today).
// Negative entries are rest days, positive entries are binge days. Keeps
// the timeline from feeling uniformly noisy.
const ANOMALIES: Record<number, number> = {
  3: -0.7, // weekend trip
  4: -0.6,
  9: 1.6, // launch crunch
  10: 1.45,
  15: -0.5, // sick day
  21: 1.35, // late-night push
  24: -0.4,
  27: 1.25, // shipping today
}

// Autocorrelated daily energy walk anchored around 1.0.
const energy: number[] = []
{
  let prev = 1
  for (let i = 0; i < 28; i += 1) {
    // Drift + jitter, clamped so we don't blow up.
    prev = Math.max(0.35, Math.min(1.7, prev * 0.78 + 0.22 * (0.85 + rng() * 0.35)))
    const day = new Date(since.getTime() + i * DAY_MS).getUTCDay() // 0 = Sun
    const weekendMult = day === 0 || day === 6 ? 0.45 + rng() * 0.25 : 1
    const anomaly = ANOMALIES[i] ?? 0
    energy.push(Math.max(0.05, prev * weekendMult + anomaly))
  }
}

const overviewBuckets: VibeOverviewBucket[] = Array.from({ length: 28 }, (_, i) => {
  const e = energy[i]!
  const tokens = Math.max(0, Math.round(48_000 * e + jitter(9000) * Math.sign(e)))
  return {
    ts: isoDay(27 - i),
    activity: Math.max(0, Math.round(58 * e + jitter(14))),
    sessions: Math.max(0, Math.round(2.6 * e + jitter(1.2) + (e > 1.3 ? 2 : 0))),
    tokens,
    linesChanged: Math.max(0, Math.round(170 * e + jitter(55))),
    estimatedCostUsd: Number(Math.max(0, 0.55 * e + jitter(0.12)).toFixed(2)),
  }
})

const tokenBuckets: VibeTokenBucket[] = overviewBuckets.map((b, i) => {
  // Mix shifts week-over-week — claude leads early, codex catches up,
  // opencode picks up in the last stretch. Small random per-day jitter
  // keeps the stacks from looking like neat ribbons.
  const claudeShare = Math.max(0.05, 0.6 - i * 0.012 + jitter(0.08))
  const codexShare = Math.max(0.05, 0.2 + i * 0.008 + jitter(0.07))
  const opencodeShare = Math.max(0.02, 1 - claudeShare - codexShare)
  const input = Math.round(b.tokens * (0.58 + jitter(0.04)))
  const cached = Math.round(b.tokens * (0.16 + jitter(0.03)))
  const output = Math.round(b.tokens * (0.2 + jitter(0.03)))
  const reasoning = Math.max(0, b.tokens - input - cached - output)
  const modelCalls = Math.max(1, Math.round(32 * (energy[i] ?? 1) + jitter(8)))
  const slice = (share: number) => ({
    inputTokens: Math.round(input * share),
    cachedInputTokens: Math.round(cached * share),
    outputTokens: Math.round(output * share),
    reasoningOutputTokens: Math.round(reasoning * share),
    modelCalls: Math.max(0, Math.round(modelCalls * share)),
    estimatedCostUsd: Number((b.estimatedCostUsd * share).toFixed(3)),
  })
  return {
    ts: b.ts,
    inputTokens: input,
    cachedInputTokens: cached,
    outputTokens: output,
    reasoningOutputTokens: reasoning,
    modelCalls,
    estimatedCostUsd: b.estimatedCostUsd,
    bySource: {
      'claude-code': slice(claudeShare),
      'codex': slice(codexShare),
      'opencode': slice(opencodeShare),
    },
  }
})

const heatmap: VibeHeatmapCell[] = []
for (let weekday = 0; weekday < 7; weekday += 1) {
  // Each weekday gets its own personality. Mon eases in, Tue–Thu peak,
  // Fri tapers, weekends are sparse and late.
  const dayProfile = [0.55, 1.05, 1.4, 1.3, 0.95, 0.35, 0.25][weekday]!
  for (let hour = 0; hour < 24; hour += 1) {
    const morning = Math.max(0, 1 - Math.abs(hour - 10) / 3.5)
    const afternoon = Math.max(0, 1 - Math.abs(hour - 15) / 4)
    const lateNight = weekday === 5 ? Math.max(0, 1 - Math.abs(hour - 23) / 3) : 0
    // Random per-cell drop-outs (~22% chance) leave realistic gaps.
    if (rng() < 0.22) {
      continue
    }
    const intensity = (morning * 0.55 + afternoon * 0.7 + lateNight * 0.5) * dayProfile
      * (0.7 + rng() * 0.6)
    if (intensity < 0.06) {
      continue
    }
    heatmap.push({
      weekday,
      hour,
      count: Math.max(1, Math.round(intensity * 32)),
      estimatedCostUsd: Number((intensity * 0.48).toFixed(3)),
    })
  }
}

const projectTokens: VibeProjectRow[] = [
  {
    project: 'codetime-web-v3',
    inputTokens: 420_000,
cachedInputTokens: 96_000,
outputTokens: 138_000,
    reasoningOutputTokens: 22_000,
totalTokens: 676_000,
    modelCalls: 312,
sessions: 41,
agentDurationMs: 14 * 60 * 60 * 1000,
    estimatedCostUsd: 7.42,
    sourceSegments: [
      { source: 'claude-code', estimatedCostUsd: 4.6 },
      { source: 'codex', estimatedCostUsd: 1.9 },
      { source: 'opencode', estimatedCostUsd: 0.92 },
    ],
  },
  {
    project: 'codetime-server-v3',
    inputTokens: 280_000,
cachedInputTokens: 64_000,
outputTokens: 92_000,
    reasoningOutputTokens: 18_000,
totalTokens: 454_000,
    modelCalls: 214,
sessions: 28,
agentDurationMs: 9 * 60 * 60 * 1000,
    estimatedCostUsd: 4.86,
    sourceSegments: [
      { source: 'claude-code', estimatedCostUsd: 2.9 },
      { source: 'codex', estimatedCostUsd: 1.6 },
      { source: 'opencode', estimatedCostUsd: 0.36 },
    ],
  },
  {
    project: 'agent-time',
    inputTokens: 156_000,
cachedInputTokens: 32_000,
outputTokens: 48_000,
    reasoningOutputTokens: 8000,
totalTokens: 244_000,
    modelCalls: 118,
sessions: 17,
agentDurationMs: 4 * 60 * 60 * 1000,
    estimatedCostUsd: 2.41,
    sourceSegments: [
      { source: 'codex', estimatedCostUsd: 1.6 },
      { source: 'claude-code', estimatedCostUsd: 0.81 },
    ],
  },
  {
    project: 'observable-plot-playground',
    inputTokens: 64_000,
cachedInputTokens: 12_000,
outputTokens: 22_000,
    reasoningOutputTokens: 3000,
totalTokens: 101_000,
    modelCalls: 52,
sessions: 9,
agentDurationMs: 90 * 60 * 1000,
    estimatedCostUsd: 0.92,
    sourceSegments: [
      { source: 'opencode', estimatedCostUsd: 0.62 },
      { source: 'claude-code', estimatedCostUsd: 0.3 },
    ],
  },
]

const modelCosts: VibeModelRow[] = [
  {
    model: 'anthropic/claude-opus-4-7',
    inputTokens: 540_000,
cachedInputTokens: 120_000,
    outputTokens: 180_000,
reasoningOutputTokens: 38_000,
    modelCalls: 412,
durationMs: 18 * 60 * 60 * 1000,
    estimatedCostUsd: 9.84,
    pricing: {
      displayName: 'Claude Opus 4.7',
      source: 'openrouter',
      inputPerMillion: 15,
cacheCreationInputPerMillion: 18.75,
      cacheReadInputPerMillion: 1.5,
cachedInputPerMillion: 1.5,
      outputPerMillion: 75,
    },
  },
  {
    model: 'openai/gpt-5-codex',
    inputTokens: 320_000,
cachedInputTokens: 68_000,
    outputTokens: 96_000,
reasoningOutputTokens: 12_000,
    modelCalls: 268,
durationMs: 7 * 60 * 60 * 1000,
    estimatedCostUsd: 4.2,
    pricing: {
      displayName: 'GPT-5 Codex',
      source: 'openrouter',
      inputPerMillion: 10,
cacheCreationInputPerMillion: 12.5,
      cacheReadInputPerMillion: 1,
cachedInputPerMillion: 1,
      outputPerMillion: 30,
    },
  },
  {
    model: 'anthropic/claude-sonnet-4-6',
    inputTokens: 60_000,
cachedInputTokens: 16_000,
    outputTokens: 24_000,
reasoningOutputTokens: 1000,
    modelCalls: 36,
durationMs: 90 * 60 * 1000,
    estimatedCostUsd: 1.57,
    pricing: {
      displayName: 'Claude Sonnet 4.6',
      source: 'openrouter',
      inputPerMillion: 3,
cacheCreationInputPerMillion: 3.75,
      cacheReadInputPerMillion: 0.3,
cachedInputPerMillion: 0.3,
      outputPerMillion: 15,
    },
  },
]

const agentCosts: VibeAgentRow[] = [
  {
    source: 'claude-code',
    sessions: 48,
    modelCalls: 412,
    inputTokens: 540_000,
    cachedInputTokens: 120_000,
    outputTokens: 180_000,
    reasoningOutputTokens: 38_000,
    totalTokens: 878_000,
    agentDurationMs: 18 * 60 * 60 * 1000,
    estimatedCostUsd: 9.2,
    modelSegments: [
      { model: 'anthropic/claude-opus-4-7', estimatedCostUsd: 7.6 },
      { model: 'anthropic/claude-sonnet-4-6', estimatedCostUsd: 1.6 },
    ],
  },
  {
    source: 'codex',
    sessions: 32,
    modelCalls: 268,
    inputTokens: 320_000,
    cachedInputTokens: 68_000,
    outputTokens: 96_000,
    reasoningOutputTokens: 12_000,
    totalTokens: 496_000,
    agentDurationMs: 7 * 60 * 60 * 1000,
    estimatedCostUsd: 4.2,
    modelSegments: [
      { model: 'openai/gpt-5-codex', estimatedCostUsd: 4.2 },
    ],
  },
  {
    source: 'opencode',
    sessions: 11,
    modelCalls: 36,
    inputTokens: 60_000,
    cachedInputTokens: 16_000,
    outputTokens: 24_000,
    reasoningOutputTokens: 1000,
    totalTokens: 101_000,
    agentDurationMs: 90 * 60 * 1000,
    estimatedCostUsd: 1.4,
    modelSegments: [
      { model: 'anthropic/claude-sonnet-4-6', estimatedCostUsd: 1.4 },
    ],
  },
  {
    source: 'pi',
    sessions: 4,
    modelCalls: 14,
    inputTokens: 8000,
    cachedInputTokens: 1000,
    outputTokens: 3000,
    reasoningOutputTokens: 0,
    totalTokens: 12_000,
    agentDurationMs: 12 * 60 * 1000,
    estimatedCostUsd: 0.18,
    modelSegments: [
      { model: 'openai/gpt-5-codex', estimatedCostUsd: 0.18 },
    ],
  },
]

const tools: VibeToolRow[] = [
  { tool: 'Read', calls: 1840, failures: 12, totalDurationMs: 92_000, avgDurationMs: 50 },
  { tool: 'Edit', calls: 920, failures: 38, totalDurationMs: 86_000, avgDurationMs: 93 },
  { tool: 'Bash', calls: 612, failures: 41, totalDurationMs: 320_000, avgDurationMs: 523 },
  { tool: 'Grep', calls: 418, failures: 6, totalDurationMs: 18_000, avgDurationMs: 43 },
  { tool: 'Write', calls: 184, failures: 4, totalDurationMs: 14_000, avgDurationMs: 76 },
]

const baseDashboard: VibeDashboard = {
  range: { key: '30d', since: since.toISOString(), until: now.toISOString() },
  bucket: 'day',
  summary: {
    totalSessions: 95,
    totalEvents: 4280,
    totalProjects: 4,
    totalToolCalls: tools.reduce((a, x) => a + x.calls, 0),
    totalCommandCalls: 612,
    totalInputTokens: 920_000,
    totalCachedInputTokens: 204_000,
    totalOutputTokens: 300_000,
    totalReasoningOutputTokens: 51_000,
    totalTokens: 1_475_000,
    totalDurationMs: 27 * 60 * 60 * 1000,
    totalLinesAdded: 4812,
    totalLinesRemoved: 1984,
  },
  overviewBuckets,
  tokenBuckets,
  heatmap,
  projectTokens,
  modelCosts,
  agentCosts,
  tools,
  availableSources: ['claude-code', 'codex', 'opencode', 'pi'],
}

// -----------------------------------------------------------------------
// Rangebar state — mirrors the real /dashboard/agent so the demo's
// controls feel identical. Filters mutate a derived `dashboard` view
// rather than re-running the synthetic generator, which keeps the
// numbers stable across switches.
// -----------------------------------------------------------------------
const days = ref<number>(28)
const startTime = ref<Date | null>(null)
const endTime = ref<Date | null>(null)
const machineId = ref<string | null>(null)
const sourceId = ref<string | null>(null)
const refreshing = ref(false)

// Two synthetic machines that partition the data: each owns a fixed
// subset of agent sources. Switching the picker filters every
// source-aware aggregate to that machine's sources and scales the
// source-agnostic ones (heatmap / overview / tools) by the machine's
// share of total cost, so the whole dashboard noticeably changes.
type DemoMachine = {
  id: string
  label: string
  icon: string
  sources: string[]
}
const demoMachines: DemoMachine[] = [
  // MacBook owns the heavy hitters — claude-code + codex — so picking
  // it keeps the dashboard "busy".
  { id: 'demo-mbp', label: 'MacBook Pro', icon: 'i-tabler-brand-apple', sources: ['claude-code', 'codex'] },
  // Linux gets the experimental agents — opencode + pi — so the
  // timeline visibly thins out when picked.
  { id: 'demo-linux', label: 'Linux Dev Box', icon: 'i-tabler-brand-debian', sources: ['opencode', 'pi'] },
]
const machineById = new Map(demoMachines.map(m => [m.id, m]))

type PillItem<T extends string> = { id: T | null, label: string, icon?: string }

const machineItems = computed<PillItem<string>[]>(() => [
  { id: null, label: 'All machines', icon: 'i-tabler-stack-2' },
  ...demoMachines.map(m => ({ id: m.id, label: m.label, icon: m.icon })),
])

function sourceMeta(id: string): { label: string, icon: string } {
  const key = id.toLowerCase()
  switch (key) {
    case 'claude':
    case 'claude-code': {
      return { label: 'Claude Code', icon: 'i-simple-icons-anthropic' }
    }
    case 'codex': {
      return { label: 'Codex', icon: 'i-simple-icons-openai' }
    }
    case 'opencode': {
      return { label: 'OpenCode', icon: 'i-brand-opencode' }
    }
    case 'pi': {
      return { label: 'Pi', icon: 'i-brand-pi' }
    }
    default: {
      const label = id.length > 0 ? id.charAt(0).toUpperCase() + id.slice(1) : id
      return { label, icon: 'i-tabler-terminal-2' }
    }
  }
}

const sourceItems = computed<PillItem<string>[]>(() => [
  { id: null, label: 'All agents', icon: 'i-tabler-robot' },
  ...baseDashboard.availableSources.map((id) => {
    const meta = sourceMeta(id)
    return { id, label: meta.label, icon: meta.icon }
  }),
])

// Effective window:
//  • custom start/end → use those literal bounds
//  • days preset      → slice the last N buckets (clamped to the 28
//                       buckets the generator emits; presets larger
//                       than that still show all 28 days)
const windowBounds = computed<{ since: Date, until: Date }>(() => {
  if (startTime.value && endTime.value) {
    return { since: startTime.value, until: endTime.value }
  }
  const until = now
  const span = Math.max(1, days.value)
  const sinceClamped = new Date(until.getTime() - (span - 1) * DAY_MS)
  return { since: sinceClamped, until }
})

function inWindow(tsIso: string): boolean {
  const t = new Date(tsIso).getTime()
  return t >= windowBounds.value.since.getTime() && t <= windowBounds.value.until.getTime()
}

function sumBy<T, K extends keyof T>(rows: T[], key: K): number {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Effective set of agent sources after machine + source filters.
// machineId narrows to the machine's owned sources; sourceId then
// further narrows to a single source (when both are set and the
// picked source isn't owned by the machine, the result is empty —
// matches the real backend behaviour).
const activeSources = computed<Set<string>>(() => {
  const machineSources = machineId.value
    ? (machineById.get(machineId.value)?.sources ?? [])
    : baseDashboard.availableSources
  const allowed = new Set<string>(machineSources)
  if (sourceId.value) {
    if (allowed.has(sourceId.value)) {
      allowed.clear()
      allowed.add(sourceId.value)
    }
    else {
      allowed.clear()
    }
  }
  return allowed
})

// Pre-computed total cost across all agents, used to derive each
// machine/source filter's "share" of the source-agnostic data
// (heatmap counts, overview activity, tool calls).
const baseAgentCostTotal = agentCosts.reduce((s, a) => s + a.estimatedCostUsd, 0)

// Share of base data that survives the current machine + source
// filters, used to scale source-agnostic aggregates.
const activeShare = computed<number>(() => {
  if (!machineId.value && !sourceId.value) {
    return 1
  }
  const active = agentCosts
    .filter(a => activeSources.value.has(a.source))
    .reduce((s, a) => s + a.estimatedCostUsd, 0)
  return baseAgentCostTotal > 0 ? active / baseAgentCostTotal : 0
})

// Derived dashboard view — date-window slice + source / machine
// filtering. Source-aware arrays (tokenBuckets.bySource, agentCosts,
// projectTokens.sourceSegments, modelCosts) drop rows outside the
// active source set; source-agnostic ones (overview activity, heatmap,
// tools) get scaled by `activeShare` so the KPI numbers also drop.
const dashboard = computed<VibeDashboard>(() => {
  const active = activeSources.value
  const share = activeShare.value
  const overview = baseDashboard.overviewBuckets
    .filter(b => inWindow(b.ts))
    .map(b => ({
      ...b,
      activity: Math.round(b.activity * share),
      sessions: Math.round(b.sessions * share),
      tokens: Math.round(b.tokens * share),
      linesChanged: Math.round(b.linesChanged * share),
      estimatedCostUsd: Number((b.estimatedCostUsd * share).toFixed(2)),
    }))
  const tokens = baseDashboard.tokenBuckets
    .filter(b => inWindow(b.ts))
    .map((b) => {
      const filteredEntries = Object.entries(b.bySource ?? {})
        .filter(([src]) => active.has(src))
      const reduced = {
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningOutputTokens: 0,
        modelCalls: 0,
        estimatedCostUsd: 0,
      }
      for (const [, cell] of filteredEntries) {
        reduced.inputTokens += cell.inputTokens
        reduced.cachedInputTokens += cell.cachedInputTokens
        reduced.outputTokens += cell.outputTokens
        reduced.reasoningOutputTokens += cell.reasoningOutputTokens
        reduced.modelCalls += cell.modelCalls
        reduced.estimatedCostUsd += cell.estimatedCostUsd
      }
      return {
        ts: b.ts,
        ...reduced,
        estimatedCostUsd: Number(reduced.estimatedCostUsd.toFixed(3)),
        bySource: Object.fromEntries(filteredEntries),
      }
    })
  const agents = baseDashboard.agentCosts.filter(a => active.has(a.source))
  // Project rows: scale aggregates by the share of their cost that
  // falls inside the active source set, drop the row if zero.
  const projects = baseDashboard.projectTokens
    .map((p) => {
      const segs = (p.sourceSegments ?? []).filter(s => active.has(s.source))
      const segCost = segs.reduce((s, x) => s + x.estimatedCostUsd, 0)
      const fullCost = (p.sourceSegments ?? []).reduce((s, x) => s + x.estimatedCostUsd, 0)
      const ratio = fullCost > 0 ? segCost / fullCost : 0
      return {
        ...p,
        inputTokens: Math.round(p.inputTokens * ratio),
        cachedInputTokens: Math.round(p.cachedInputTokens * ratio),
        outputTokens: Math.round(p.outputTokens * ratio),
        reasoningOutputTokens: Math.round(p.reasoningOutputTokens * ratio),
        totalTokens: Math.round(p.totalTokens * ratio),
        modelCalls: Math.round(p.modelCalls * ratio),
        sessions: Math.round(p.sessions * ratio),
        agentDurationMs: Math.round(p.agentDurationMs * ratio),
        estimatedCostUsd: Number(segCost.toFixed(2)),
        sourceSegments: segs,
      }
    })
    .filter(p => p.estimatedCostUsd > 0)
  // Models: scale each row by the share of the active agent set that
  // routes through it. Drop rows whose cost falls to zero.
  const modelToCost = new Map<string, number>()
  for (const a of agents) {
    for (const seg of a.modelSegments ?? []) {
      modelToCost.set(seg.model, (modelToCost.get(seg.model) ?? 0) + seg.estimatedCostUsd)
    }
  }
  const models = baseDashboard.modelCosts
    .map((m) => {
      const newCost = modelToCost.get(m.model) ?? 0
      const ratio = m.estimatedCostUsd > 0 ? newCost / m.estimatedCostUsd : 0
      return {
        ...m,
        inputTokens: Math.round(m.inputTokens * ratio),
        cachedInputTokens: Math.round(m.cachedInputTokens * ratio),
        outputTokens: Math.round(m.outputTokens * ratio),
        reasoningOutputTokens: Math.round(m.reasoningOutputTokens * ratio),
        modelCalls: Math.round(m.modelCalls * ratio),
        durationMs: Math.round(m.durationMs * ratio),
        estimatedCostUsd: Number(newCost.toFixed(2)),
      }
    })
    .filter(m => m.estimatedCostUsd > 0)
  // Heatmap: scale counts/costs by share, drop cells that fall under 1.
  const heat = baseDashboard.heatmap
    .map(c => ({
      ...c,
      count: Math.round(c.count * share),
      estimatedCostUsd: Number((c.estimatedCostUsd * share).toFixed(3)),
    }))
    .filter(c => c.count > 0)
  const toolRows = baseDashboard.tools.map(tool => ({
    ...tool,
    calls: Math.round(tool.calls * share),
    failures: Math.round(tool.failures * share),
    totalDurationMs: Math.round(tool.totalDurationMs * share),
  }))
  return {
    range: {
      key: baseDashboard.range.key,
      since: windowBounds.value.since.toISOString(),
      until: windowBounds.value.until.toISOString(),
    },
    bucket: baseDashboard.bucket,
    summary: {
      totalSessions: sumBy(overview, 'sessions'),
      totalEvents: overview.reduce((s, r) => s + r.activity, 0),
      totalProjects: projects.length,
      totalToolCalls: toolRows.reduce((s, x) => s + x.calls, 0),
      totalCommandCalls: Math.round(baseDashboard.summary.totalCommandCalls * share),
      totalInputTokens: sumBy(tokens, 'inputTokens'),
      totalCachedInputTokens: sumBy(tokens, 'cachedInputTokens'),
      totalOutputTokens: sumBy(tokens, 'outputTokens'),
      totalReasoningOutputTokens: sumBy(tokens, 'reasoningOutputTokens'),
      totalTokens: sumBy(tokens, 'inputTokens') + sumBy(tokens, 'outputTokens'),
      totalDurationMs: agents.reduce((s, a) => s + a.agentDurationMs, 0),
      totalLinesAdded: Math.round(baseDashboard.summary.totalLinesAdded * share),
      totalLinesRemoved: Math.round(baseDashboard.summary.totalLinesRemoved * share),
    },
    overviewBuckets: overview,
    tokenBuckets: tokens,
    heatmap: heat,
    projectTokens: projects,
    modelCosts: models,
    agentCosts: agents,
    tools: toolRows,
    availableSources: baseDashboard.availableSources,
  }
})

const totalCostUsd = computed(() =>
  dashboard.value.modelCosts.reduce((sum, m) => sum + m.estimatedCostUsd, 0),
)
const totalToolCalls = computed(() =>
  dashboard.value.tools.reduce((sum, x) => sum + x.calls, 0),
)

function refreshDashboard(): void {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
  }, 420)
}

const sectionTitles = computed(() => {
  const s = t.value.dashboard?.agent?.sections
  return {
    overview: s?.overview ?? 'Overview',
    costTimeline: s?.costTimeline ?? 'Cost · Timeline',
    rhythm: s?.rhythm ?? 'Rhythm · When',
    projects: s?.projects ?? 'Projects · Costs',
    models: s?.models ?? 'Models · Costs',
    agents: s?.agents ?? 'Agents · Costs',
    tools: s?.tools ?? 'Tools',
  }
})

const Lmeta = computed(() => t.value.dashboard.agent?.labels?.meta)

const rangeMeta = computed(() =>
  `${fmtDate(windowBounds.value.since)} → ${fmtDate(windowBounds.value.until)}`,
)
const bucketMeta = '1d buckets'

useSeoMeta({
  title: 'CodeTime Agent Telemetry Demo',
  description: 'Preview the Vibe / agent telemetry dashboard rendered against synthetic data — no agent setup required.',
  robots: 'noindex',
})

const locale = useLocale()
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.agent ?? 'Vibe'"
    :description="t.dashboard.pageHeader.description.agent"
  />
  <DashboardPageContent>
    <div class="demo-banner">
      <i class="i-tabler-info-circle" />
      <span>
        {{ t.demoBanner.agentPrefix }}
        <NuxtLink :to="`/${locale}/dashboard/agent`" class="demo-banner-link">
          /dashboard/agent
        </NuxtLink>
        {{ t.demoBanner.agentSuffix }}
      </span>
    </div>
    <div class="ct-stripes-band" aria-hidden="true">
      <div class="ct-stripes" />
    </div>

    <div class="vibe-rangebar">
      <DashboardDataRange
        v-model:days="days"
        v-model:start-time="startTime"
        v-model:end-time="endTime"
      />
      <DashboardPillSelect
        v-model="machineId"
        :items="machineItems"
        empty-title="No machines yet"
      />
      <DashboardPillSelect
        v-model="sourceId"
        :items="sourceItems"
        empty-title="No agents yet"
      />
      <VibeCurrencyPicker />
      <button
        class="range-refresh"
        :disabled="refreshing"
        title="Refresh"
        @click="refreshDashboard()"
      >
        <i v-if="refreshing" class="i-tabler-loader-2 spinning" />
        <i v-else class="i-tabler-refresh" />
      </button>
    </div>

    <VibeSection
      num="01"
      :title="sectionTitles.overview"
      :meta="rangeMeta"
      flush
    >
      <VibeKpiGrid
        :summary="dashboard.summary"
        :overview="dashboard.overviewBuckets"
        :total-cost-usd="totalCostUsd"
      />
    </VibeSection>

    <VibeSection
      num="02"
      :title="sectionTitles.costTimeline"
      :meta="Lmeta?.estimatedBuckets ? Lmeta.estimatedBuckets(bucketMeta, rangeMeta) : `estimated · ${bucketMeta} · ${rangeMeta}`"
    >
      <VibeTokenTimeline
        :buckets="dashboard.tokenBuckets"
        :bucket="dashboard.bucket"
        :since="dashboard.range.since"
        :until="dashboard.range.until"
      />
    </VibeSection>

    <VibeSection
      num="03"
      :title="sectionTitles.rhythm"
      :meta="Lmeta?.rhythmMeta ? Lmeta.rhythmMeta(rangeMeta) : `hour × weekday · local time · ${rangeMeta}`"
    >
      <VibeRhythmHeatmap :cells="dashboard.heatmap" />
    </VibeSection>

    <VibeSection
      num="04"
      :title="sectionTitles.projects"
      :meta="Lmeta?.projects ? Lmeta.projects(dashboard.projectTokens.length) : `${dashboard.projectTokens.length} projects`"
    >
      <VibeProjectTokens :rows="dashboard.projectTokens" />
    </VibeSection>

    <VibeSection
      num="05"
      :title="sectionTitles.models"
      :meta="fmtCurrency(totalCostUsd)"
    >
      <VibeModelCosts :rows="dashboard.modelCosts" />
    </VibeSection>

    <VibeSection
      num="06"
      :title="sectionTitles.agents"
      :meta="Lmeta?.agents ? Lmeta.agents(dashboard.agentCosts.length) : `${dashboard.agentCosts.length} agents`"
    >
      <VibeAgentCosts :rows="dashboard.agentCosts" />
    </VibeSection>

    <VibeSection
      num="07"
      :title="sectionTitles.tools"
      :meta="Lmeta?.calls ? Lmeta.calls(compact(totalToolCalls)) : `${compact(totalToolCalls)} calls`"
    >
      <VibeToolPerformance :rows="dashboard.tools" />
    </VibeSection>
  </DashboardPageContent>
</template>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  background: var(--ct-surface-1);
  border-bottom: 1px solid var(--ct-border);
}
.demo-banner-link {
  color: var(--ct-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.demo-banner-link:hover {
  color: var(--ct-primary-hover);
}

/* Rangebar — mirrors /dashboard/agent's .vibe-rangebar exactly so the
   demo reads as the same UI surface. */
.vibe-rangebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
  flex-wrap: wrap;
}
.vibe-rangebar > :nth-child(2) {
  margin-left: auto;
}
.range-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
  color: var(--ct-fg-muted);
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  transition: all 140ms ease;
}
.range-refresh:hover:not(:disabled) {
  border-color: var(--ct-primary);
  color: var(--ct-primary);
}
.range-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.range-refresh .i-tabler-refresh,
.range-refresh .i-tabler-loader-2 { width: 16px; height: 16px; font-size: 16px; }
.spinning { animation: vibe-spin 0.9s linear infinite; }
@keyframes vibe-spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}
</style>
