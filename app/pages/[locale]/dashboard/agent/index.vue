<script setup lang="ts">
import type { VibeDashboard } from '~/components/Vibe/types'
import { getV3AgentSessions } from '~/api/v3'

// Vibe page. Top half is an agent-time-style telemetry dashboard
// (KPIs + cost timeline + rhythm heatmap + project/model/tool
// leaderboards) over data from GET /v3/agent/dashboard. Bottom half
// keeps the original sessions table, since it's still the only way
// to drill into a specific rollup. Range picker is the single source
// of truth — every chart re-derives from the resulting payload.
//
// The dashboard endpoint is fetched via raw $fetch because the
// generated SDK only catches up after `pnpm openapi`; the sessions
// list still uses the SDK call so its types stay in sync.

definePageMeta({
  layout: 'dashboard',
})

const t = useI18N()

type AgentSession = NonNullable<
  Awaited<ReturnType<typeof getV3AgentSessions>>['data']
>['sessions'][number]

type RangeKey = '24h' | '7d' | '30d' | 'all'
const range = ref<RangeKey>('30d')

const { data: dashboard, pending: dashboardPending, error: dashboardError, refresh: refreshDashboard }
  = useAsyncData<VibeDashboard>(
    'vibe-dashboard',
    () => $fetch<VibeDashboard>('/v3/agent/dashboard', {
      params: { range: range.value },
      credentials: 'include',
    }),
    { watch: [range] },
  )

const cursor = ref<string | null>(null)
const sessions = ref<AgentSession[]>([])
const sessionsPending = ref(false)
const sessionsError = ref<string | null>(null)

async function loadPage(reset = false) {
  if (sessionsPending.value) {
 return
}
  sessionsPending.value = true
  sessionsError.value = null
  try {
    const resp = await getV3AgentSessions({
      query: {
        limit: 50,
        ...((!reset && cursor.value) ? { cursor: cursor.value } : {}),
      },
    })
    const body = resp.data
    if (!body) {
 throw new Error('Empty response')
}
    sessions.value = reset ? body.sessions : [...sessions.value, ...body.sessions]
    cursor.value = body.nextCursor ?? null
  }
  catch (error) {
    sessionsError.value = error instanceof Error ? error.message : 'Failed to load sessions'
  }
  finally {
    sessionsPending.value = false
  }
}

onMounted(() => loadPage(true))

const hasData = computed(() => {
  const d = dashboard.value
  if (!d) {
 return false
}
  return d.summary.totalSessions > 0 || d.summary.totalEvents > 0
})

const totalCostUsd = computed(() =>
  dashboard.value?.modelCosts.reduce((sum, m) => sum + m.estimatedCostUsd, 0) ?? 0,
)

const totalToolCalls = computed(() =>
  dashboard.value?.tools.reduce((sum, x) => sum + x.calls, 0) ?? 0,
)

function fmtDuration(ms: number): string {
  if (ms < 1000) {
 return `${ms}ms`
}
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) {
 return `${seconds}s`
}
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
 return `${minutes}m ${seconds % 60}s`
}
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) {
 return `${(n / 1_000_000).toFixed(1)}M`
}
  if (n >= 1000) {
 return `${(n / 1000).toFixed(1)}k`
}
  return String(n)
}

const RANGE_OPTIONS: { key: RangeKey, label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'all' },
]

const rangeMeta = computed(() => {
  const d = dashboard.value
  if (!d) {
 return ''
}
  if (d.range.key === 'all') {
 return 'all-time window'
}
  const since = d.range.since ? new Date(d.range.since) : null
  const until = new Date(d.range.until)
  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `${since ? fmt(since) : ''} → ${fmt(until)}`
})

const bucketMeta = computed(() => {
  const b = dashboard.value?.bucket
  if (b === 'hour') {
 return '1h buckets'
}
  if (b === 'day') {
 return '1d buckets'
}
  if (b === 'week') {
 return '1w buckets'
}
  return ''
})
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.agent ?? 'Vibe'"
    :description="t.dashboard.pageHeader.description.agent"
  />
  <DashboardPageContent>
    <div class="vibe-rangebar">
      <div class="vibe-rangebar-left">
        <span>RANGE</span>
        <span class="op55">{{ rangeMeta }}</span>
      </div>
      <div class="vibe-rangebar-right">
        <button
          v-for="opt in RANGE_OPTIONS"
          :key="opt.key"
          class="range-pill"
          :class="{ active: range === opt.key }"
          @click="range = opt.key"
        >
          {{ opt.label }}
        </button>
        <button
          class="range-pill refresh"
          :disabled="dashboardPending"
          @click="refreshDashboard()"
        >
          {{ dashboardPending ? '…' : '↻' }}
        </button>
      </div>
    </div>

    <div v-if="dashboardError" class="vibe-error">
      {{ dashboardError.message ?? 'Failed to load dashboard' }}
    </div>

    <template v-if="dashboard && hasData">
      <VibeSection
        title="OVERVIEW"
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
        title="COST · TIMELINE"
        :meta="`estimated · ${bucketMeta} · ${rangeMeta}`"
      >
        <VibeTokenTimeline :buckets="dashboard.tokenBuckets" :bucket="dashboard.bucket" />
      </VibeSection>

      <VibeSection
        title="RHYTHM · WHEN"
        :meta="`estimated cost · hour × weekday · local time · ${rangeMeta}`"
      >
        <VibeRhythmHeatmap :cells="dashboard.heatmap" />
      </VibeSection>

      <VibeSection
        title="PROJECTS · COSTS"
        :meta="`${dashboard.projectTokens.length} projects`"
      >
        <VibeProjectTokens :rows="dashboard.projectTokens" />
      </VibeSection>

      <VibeSection
        title="MODELS · COSTS"
        :meta="`$${totalCostUsd.toFixed(2)}`"
      >
        <VibeModelCosts :rows="dashboard.modelCosts" />
      </VibeSection>

      <VibeSection
        title="TOOLS"
        :meta="`${totalToolCalls.toLocaleString()} calls`"
      >
        <VibeToolPerformance :rows="dashboard.tools" />
      </VibeSection>

      <VibeSection
        title="SESSIONS · LIST"
        :meta="`${sessions.length} loaded`"
        flush
      >
        <div v-if="sessionsError" class="vibe-error">
          {{ sessionsError }}
        </div>
        <div v-else class="vibe-table-wrap">
          <table class="vibe-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Project</th>
                <th>Started</th>
                <th class="num">
                  Duration
                </th>
                <th class="num">
                  Turns
                </th>
                <th class="num">
                  Tools
                </th>
                <th class="num">
                  In tok
                </th>
                <th class="num">
                  Out tok
                </th>
                <th class="num">
                  Lines +/-
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.rollupKey">
                <td><span class="mono">{{ s.source }}</span></td>
                <td>{{ s.project ?? '—' }}</td>
                <td class="op75 tnum">
                  {{ new Date(s.startedAt).toLocaleString() }}
                </td>
                <td class="num">
                  {{ fmtDuration(s.durationMs) }}
                </td>
                <td class="num">
                  {{ s.turnCount }}
                </td>
                <td class="num">
                  {{ s.toolCallCount }}
                </td>
                <td class="num">
                  {{ fmtTokens(s.inputTokens) }}
                </td>
                <td class="num">
                  {{ fmtTokens(s.outputTokens) }}
                </td>
                <td class="num">
                  <span class="add">+{{ s.linesAdded }}</span>
                  <span class="rm">-{{ s.linesRemoved }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="vibe-more">
          <button
            v-if="cursor"
            class="vibe-more-btn"
            :disabled="sessionsPending"
            @click="loadPage(false)"
          >
            {{ sessionsPending ? 'Loading…' : 'Load more' }}
          </button>
          <div v-else-if="sessionsPending" class="op75">
            Loading…
          </div>
        </div>
      </VibeSection>
    </template>

    <DashboardAgentGuide v-else-if="!dashboardPending && !hasData" />

    <div v-else-if="dashboardPending" class="vibe-loading">
      <span class="vibe-cursor">▌</span> establishing telemetry link…
    </div>
  </DashboardPageContent>
</template>

<style scoped>
.vibe-rangebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
  font-size: 12px;
}
.vibe-rangebar-left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  letter-spacing: 0.16em;
  color: var(--ct-fg-muted);
  text-transform: uppercase;
}
.vibe-rangebar-right {
  display: inline-flex;
  gap: 6px;
}
.range-pill {
  padding: 4px 12px;
  border: 1px solid var(--ct-border);
  background: transparent;
  color: var(--ct-fg-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 140ms ease;
  border-radius: 4px;
}
.range-pill:hover:not(:disabled) {
  border-color: var(--ct-primary);
  color: var(--ct-primary);
}
.range-pill.active {
  border-color: var(--ct-primary);
  background: color-mix(in srgb, var(--ct-primary) 12%, transparent);
  color: var(--ct-primary);
}
.range-pill.refresh { padding: 4px 10px; }
.range-pill:disabled { opacity: 0.5; cursor: not-allowed; }

.vibe-error {
  padding: 16px 24px;
  background: var(--ct-danger-soft);
  color: var(--ct-danger);
  border-bottom: 1px solid var(--ct-border);
}

.vibe-loading {
  padding: 80px 22px;
  text-align: center;
  color: var(--ct-fg-muted);
  font-size: 12.5px;
}
.vibe-cursor {
  color: var(--ct-primary);
  margin-right: 6px;
  animation: vibe-blink 1s ease-in-out infinite;
}
@keyframes vibe-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.vibe-table-wrap { width: 100%; overflow-x: auto; }
.vibe-table {
  width: 100%;
  font-size: var(--ct-text-sm);
  border-collapse: collapse;
}
.vibe-table thead tr {
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
}
.vibe-table th {
  text-align: left;
  padding: 10px 16px;
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  letter-spacing: 0.02em;
}
.vibe-table th.num,
.vibe-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.vibe-table tbody tr {
  border-bottom: 1px solid var(--ct-border-subtle);
}
.vibe-table tbody tr:hover { background: var(--ct-surface-1); }
.vibe-table td {
  padding: 10px 16px;
  color: var(--ct-fg);
}
/* Reserve mono for code-style identifiers (agent source ids, model
   names, tool names). Timestamps and labels stay in the sans body
   font — tabular-nums keeps digits aligned without the typewriter
   feel. */
.mono { font-family: var(--ct-font-mono); }
.tnum { font-variant-numeric: tabular-nums; }
.op55 { opacity: 0.55; }
.op75 { opacity: 0.75; }
.add { color: var(--ct-success); }
.rm  { color: var(--ct-danger); margin-left: 6px; }

.vibe-more {
  display: flex;
  justify-content: center;
  padding: 24px;
}
.vibe-more-btn {
  padding: 8px 16px;
  border: 1px solid var(--ct-border);
  border-radius: 8px;
  background: transparent;
  color: var(--ct-fg);
  cursor: pointer;
  transition: background 180ms ease;
}
.vibe-more-btn:hover:not(:disabled) { background: var(--ct-surface-1); }
.vibe-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
