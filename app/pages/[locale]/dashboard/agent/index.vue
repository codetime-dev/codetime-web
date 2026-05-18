<script setup lang="ts">
import type { VibeDashboard } from '~/components/Vibe/types'
import { getV3AgentSessions, getV3Machines } from '~/api/v3'
import { compact, fmtUsd } from '~/components/Vibe/types'

type Machine = {
  id: string
  hostname?: string | null
  displayName?: string | null
  platform?: string | null
  source?: string | null
  lastSeenAt?: string | null
  createdAt?: string | null
}

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

// Mirrors the date controls on Overview / Workspace etc. so the Agent
// page reads with the same time chrome as the rest of the dashboard.
const days = ref<number>(28)
const startTime = ref<Date | null>(null)
const endTime = ref<Date | null>(null)

// Machine scope. `null` means "All machines"; a value pins every
// aggregate and the sessions list to a single machine UUID.
const machineId = ref<string | null>(null)
const machines = ref<Machine[]>([])
const machinesLoading = ref(false)

// Agent-source scope (claude-code / codex / opencode / pi / …). The
// list of options comes back inside the dashboard response so the
// dropdown stays in sync with what the user has actually ingested.
const sourceId = ref<string | null>(null)

async function loadMachines() {
  if (machinesLoading.value) {
    return
  }
  machinesLoading.value = true
  try {
    const resp = await getV3Machines()
    const list = (resp.data?.machines ?? []) as Machine[]
    machines.value = list.filter(m => typeof m.id === 'string' && m.id.length > 0)
  }
  catch {
    machines.value = []
  }
  finally {
    machinesLoading.value = false
  }
}

// Browser IANA timezone (e.g. "Asia/Shanghai"). Server uses this to
// bucket weekday/hour for the rhythm heatmap so the grid reflects the
// user's local schedule, not UTC. Falls back to UTC during SSR where
// `Intl` resolves to the server's zone.
const userTz = computed<string>(() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
  catch {
    return 'UTC'
  }
})

// Forward the picker's state to the backend either as an explicit
// since/until pair (custom mode) or as a `days=N` preset, so the
// server side can pick the matching bucket grain.
const dashboardParams = computed<Record<string, string>>(() => {
  const base: Record<string, string> = { tz: userTz.value }
  if (startTime.value && endTime.value) {
    base.since = startTime.value.toISOString()
    base.until = endTime.value.toISOString()
  }
  else {
    base.days = String(days.value)
  }
  if (machineId.value) {
    base.machine_id = machineId.value
  }
  if (sourceId.value) {
    base.source = sourceId.value
  }
  return base
})

// useFetch (not useAsyncData) so the request automatically re-fires
// whenever any reactive value in `query` changes — switching the
// DataRange picker rebuilds the URL with the new days/since/until and
// every section (including the heatmap) gets fresh numbers.
const { data: dashboard, pending: dashboardPending, error: dashboardError, refresh: refreshDashboard }
  = await useFetch<VibeDashboard>('/v3/agent/dashboard', {
    key: 'vibe-dashboard',
    query: dashboardParams,
    credentials: 'include',
    watch: [days, startTime, endTime, machineId, sourceId],
  })

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
        ...(machineId.value ? { machine_id: machineId.value } : {}),
        ...(sourceId.value ? { source: sourceId.value } : {}),
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

onMounted(() => {
  loadMachines()
  loadPage(true)
})

// Reset the sessions list whenever a scope filter changes so the list
// reflects the current filter instead of appending to the old one.
watch([machineId, sourceId], () => {
  cursor.value = null
  sessions.value = []
  loadPage(true)
})

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
  return compact(n)
}

// Section titles — i18n with English fallback during translation rollout.
// `useI18N()` returns Ref<Translation>; access via `t.value.*` in setup.
const sectionTitles = computed(() => {
  const s = t.value.dashboard?.agent?.sections
  return {
    overview: s?.overview ?? 'Overview',
    costTimeline: s?.costTimeline ?? 'Cost · Timeline',
    rhythm: s?.rhythm ?? 'Rhythm · When',
    projects: s?.projects ?? 'Projects · Costs',
    models: s?.models ?? 'Models · Costs',
    tools: s?.tools ?? 'Tools',
    sessions: s?.sessions ?? 'Sessions · List',
  }
})

const Lsess = computed(() => t.value.dashboard.agent?.labels?.sessions)
const Lmeta = computed(() => t.value.dashboard.agent?.labels?.meta)

function machineLabel(m: Machine): string {
  return m.displayName?.trim() || m.hostname?.trim() || m.id.slice(0, 8)
}

// Pick a tabler icon from a platform string. The CLI ingests platform
// values like "darwin" / "linux" / "win32", so we match on substrings
// rather than hand-listing every variant.
function platformIcon(p?: string | null): string {
  const norm = (p ?? '').toLowerCase()
  if (norm.includes('darwin') || norm.includes('mac')) {
    return 'i-tabler-brand-apple'
  }
  if (norm.includes('win')) {
    return 'i-tabler-brand-windows'
  }
  if (norm.includes('linux')) {
    return 'i-tabler-brand-debian'
  }
  return 'i-tabler-device-desktop'
}

// Map an agent-source id → display label + icon. The icon set
// mirrors the chips on the empty-state guide (DashboardAgentGuide) so
// the picker reads consistent with the install page.
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
      // Title-case any unknown source so newly-added agents still
      // render with a readable label.
      const label = id.length > 0 ? id.charAt(0).toUpperCase() + id.slice(1) : id
      return { label, icon: 'i-tabler-terminal-2' }
    }
  }
}

type PillItem<T extends string> = { id: T | null, label: string, icon?: string }

const machineItems = computed<PillItem<string>[]>(() => [
  { id: null, label: 'All machines', icon: 'i-tabler-stack-2' },
  ...machines.value.map(m => ({
    id: m.id,
    label: machineLabel(m),
    icon: platformIcon(m.platform),
  })),
])

const sourceItems = computed<PillItem<string>[]>(() => {
  const sources = dashboard.value?.availableSources ?? []
  return [
    { id: null, label: 'All agents', icon: 'i-tabler-robot' },
    ...sources.map((id) => {
      const meta = sourceMeta(id)
      return { id, label: meta.label, icon: meta.icon }
    }),
  ]
})

const rangeMeta = computed(() => {
  const d = dashboard.value
  if (!d) {
    return ''
  }
  if (!d.range.since) {
    return Lmeta.value?.allTime ?? 'all-time window'
  }
  const since = new Date(d.range.since)
  const until = new Date(d.range.until)
  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `${fmt(since)} → ${fmt(until)}`
})

const bucketMeta = computed(() => {
  const b = dashboard.value?.bucket
  const m = Lmeta.value
  if (b === 'hour') {
    return m?.bucketHour ?? '1h buckets'
  }
  if (b === 'day') {
    return m?.bucketDay ?? '1d buckets'
  }
  if (b === 'week') {
    return m?.bucketWeek ?? '1w buckets'
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
      <button
        class="range-refresh"
        :disabled="dashboardPending"
        title="Refresh"
        @click="refreshDashboard()"
      >
        <i v-if="dashboardPending" class="i-tabler-loader-2 spinning" />
        <i v-else class="i-tabler-refresh" />
      </button>
    </div>

    <div v-if="dashboardError" class="vibe-error">
      {{ dashboardError.message ?? 'Failed to load dashboard' }}
    </div>

    <template v-if="dashboard && hasData">
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
        :meta="fmtUsd(totalCostUsd)"
      >
        <VibeModelCosts :rows="dashboard.modelCosts" />
      </VibeSection>

      <VibeSection
        num="06"
        :title="sectionTitles.tools"
        :meta="Lmeta?.calls ? Lmeta.calls(compact(totalToolCalls)) : `${compact(totalToolCalls)} calls`"
      >
        <VibeToolPerformance :rows="dashboard.tools" />
      </VibeSection>

      <VibeSection
        num="07"
        :title="sectionTitles.sessions"
        :meta="Lsess?.loaded ? Lsess.loaded(sessions.length) : `${sessions.length} loaded`"
        flush
      >
        <div v-if="sessionsError" class="vibe-error">
          {{ sessionsError }}
        </div>
        <div v-else class="vibe-table-wrap">
          <table class="vibe-table">
            <thead>
              <tr>
                <th>{{ Lsess?.source ?? 'Source' }}</th>
                <th>{{ Lsess?.project ?? 'Project' }}</th>
                <th>{{ Lsess?.started ?? 'Started' }}</th>
                <th class="num">
                  {{ Lsess?.duration ?? 'Duration' }}
                </th>
                <th class="num">
                  {{ Lsess?.turns ?? 'Turns' }}
                </th>
                <th class="num">
                  {{ Lsess?.tools ?? 'Tools' }}
                </th>
                <th class="num">
                  {{ Lsess?.inTok ?? 'In tok' }}
                </th>
                <th class="num">
                  {{ Lsess?.outTok ?? 'Out tok' }}
                </th>
                <th class="lines">
                  {{ Lsess?.lines ?? 'Lines +/-' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.rollupKey">
                <td><span class="mono">{{ s.source }}</span></td>
                <td>{{ s.project ?? '—' }}</td>
                <td class="tnum op75">
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
                <td class="lines">
                  <div class="lines-cell">
                    <span class="rm">-{{ s.linesRemoved }}</span>
                    <span class="add">+{{ s.linesAdded }}</span>
                  </div>
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
            {{ sessionsPending ? (Lsess?.loading ?? 'Loading…') : (Lsess?.loadMore ?? 'Load more') }}
          </button>
          <div v-else-if="sessionsPending" class="op75">
            {{ Lsess?.loading ?? 'Loading…' }}
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
  gap: 12px;
  padding: 12px 22px;
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface-1);
  flex-wrap: wrap;
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
.vibe-table td.num,
.vibe-table td.tnum {
  font-family: var(--ct-font-mono);
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
.rm  { color: var(--ct-danger); }

/* Lines column: - sticks to the left gutter, + sticks to the right
   gutter, so each row reads at-a-glance as a small diff bar. Wrapped
   in a flex div so the surrounding <td> stays a real table cell (a
   `display: flex` <td> breaks row-level vertical alignment). */
.vibe-table th.lines,
.vibe-table td.lines {
  font-variant-numeric: tabular-nums;
}
.vibe-table td.lines {
  font-family: var(--ct-font-mono);
}
.vibe-table th.lines {
  text-align: left;
}
.lines-cell {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

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
