<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import type { VibeTokenBucket } from './types'
import * as Plot from '@observablehq/plot'
import { computed, ref } from 'vue'
import { useExchangeRate } from '~/composables/useExchangeRate'
import { agentColor, compactParts } from './types'

// Stacked per-bucket bar timeline, coloured by agent source (codex /
// claude-code / opencode / pi / …). The user picks the metric the bars
// encode — cost (USD) or tokens (input + output) — but the tooltip
// always carries both numbers plus model-call count so hovering reveals
// the full per-bucket picture regardless of the active mode.

const props = defineProps<{
  buckets: VibeTokenBucket[]
  // Matches the dashboard payload's `bucket` field — used to size the
  // rectY interval so bars meet end-to-end on a continuous time axis.
  bucket?: 'hour' | 'day' | 'week'
  // ISO timestamps for the selected range. Used to pin the x-axis
  // domain so the chart spans the whole window even when no data
  // exists at the edges.
  since?: string | null
  until?: string
}>()

const { format: fmtCurrency } = useExchangeRate()
const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.timeline)

type Metric = 'cost' | 'tokens'
const metric = ref<Metric>('cost')

const totals = computed(() => {
  let cost = 0
  let modelCalls = 0
  let cached = 0
  let fresh = 0
  let tokens = 0
  for (const b of props.buckets) {
    cost += b.estimatedCostUsd
    modelCalls += b.modelCalls
    cached += b.cachedInputTokens
    fresh += Math.max(0, b.inputTokens - b.cachedInputTokens)
    tokens += b.inputTokens + b.outputTokens
  }
  const totalInput = cached + fresh
  return {
    cost,
    modelCalls,
    cacheHitRate: totalInput === 0 ? 0 : cached / totalInput,
    tokens,
  }
})

// Stable across the toggle: sort sources by total spend (descending) so
// the biggest spender is always at the bottom of the stack and colours
// don't shuffle when the user flips the metric. The tokens view re-uses
// the same ordering for visual continuity.
const sourceOrder = computed(() => {
  const totals = new Map<string, number>()
  for (const b of props.buckets) {
    for (const [src, cell] of Object.entries(b.bySource ?? {})) {
      totals.set(src, (totals.get(src) ?? 0) + cell.estimatedCostUsd)
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([source]) => source)
})

type Row = {
  ts: Date
  source: string
  cost: number
  tokens: number
  modelCalls: number
  // Pre-rendered metric value the y channel reads from — picked at
  // build time so we don't pay for a getter in Plot's inner loop.
  value: number
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const isTokens = metric.value === 'tokens'
  for (const b of props.buckets) {
    const entries = b.bySource && Object.keys(b.bySource).length > 0
      ? Object.entries(b.bySource)
      : [['unknown', {
          estimatedCostUsd: b.estimatedCostUsd,
          inputTokens: b.inputTokens,
          outputTokens: b.outputTokens,
          modelCalls: b.modelCalls,
        }] as const]
    for (const [source, cell] of entries) {
      const cost = cell.estimatedCostUsd
      const tokens = (cell.inputTokens ?? 0) + (cell.outputTokens ?? 0)
      const calls = cell.modelCalls ?? 0
      const value = isTokens ? tokens : cost
      // Skip empty stacks — they contribute nothing to the chart but
      // a hover target.
      if (!(value > 0)) {
        continue
      }
      out.push({ ts: new Date(b.ts), source, cost, tokens, modelCalls: calls, value })
    }
  }
  return out
})

function floorToBucket(date: Date, bucket: 'hour' | 'day' | 'week'): Date {
  const d = new Date(date)
  d.setUTCMinutes(0, 0, 0)
  if (bucket === 'hour') {
    return d
  }
  d.setUTCHours(0)
  if (bucket === 'day') {
    return d
  }
  // Week: snap to Monday (matches Postgres `date_trunc('week', …)`,
  // which counts ISO weeks starting on Monday).
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d
}

function ceilToBucket(date: Date, bucket: 'hour' | 'day' | 'week'): Date {
  const floored = floorToBucket(date, bucket)
  if (floored.getTime() === date.getTime()) {
    return floored
  }
  const next = new Date(floored)
  if (bucket === 'hour') {
    next.setUTCHours(next.getUTCHours() + 1)
  }
  else if (bucket === 'day') {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  else {
    next.setUTCDate(next.getUTCDate() + 7)
  }
  return next
}

const xDomain = computed<[Date, Date] | undefined>(() => {
  if (!props.until) {
    return
  }
  const until = new Date(props.until)
  const since = props.since ? new Date(props.since) : null
  if (!since || Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return
  }
  const bucket = props.bucket ?? 'day'
  return [floorToBucket(since, bucket), ceilToBucket(until, bucket)]
})

const legend = computed(() => sourceOrder.value.map(source => ({
  source,
  color: agentColor(source),
})))

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatBucketTs(date: Date): string {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const bucket = props.bucket ?? 'day'
  if (bucket === 'hour') {
    return `${y}-${m}-${d} ${pad2(date.getHours())}:00`
  }
  return `${y}-${m}-${d}`
}

const intervalFor = computed(() => {
  switch (props.bucket) {
    case 'hour': { return 'hour' }
    case 'week': { return 'week' }
    case 'day':
    default: { return 'day' }
  }
})

function fmtCompact(n: number): string {
  const { value, unit } = compactParts(n)
  return `${value}${unit ?? ''}`
}

const tokensLabel = computed(() => L.value?.tokens ?? 'tokens')
const callsLabel = computed(() => L.value?.modelCalls ?? 'model calls')

const options = computed<PlotOptions>(() => {
  const isTokens = metric.value === 'tokens'
  return {
    height: 320,
    marginLeft: 56,
    marginBottom: 28,
    marginTop: 12,
    marginRight: 12,
    x: {
      type: 'utc',
      label: null,
      ticks: 6,
      ...(xDomain.value ? { domain: xDomain.value } : {}),
    },
    y: {
      label: isTokens ? tokensLabel.value : 'USD',
      grid: true,
      tickFormat: isTokens
        ? (d: number) => fmtCompact(d)
        : (d: number) => (d >= 1 ? `$${d.toFixed(0)}` : `$${d.toFixed(2)}`),
    },
    color: {
      type: 'categorical',
      domain: sourceOrder.value,
      range: sourceOrder.value.map(s => agentColor(s)),
    },
    marks: [
      Plot.rectY(rows.value, {
        x: 'ts',
        y: 'value',
        fill: 'source',
        interval: intervalFor.value,
        // Stack order matches sourceOrder (biggest at the bottom).
        order: sourceOrder.value,
        fillOpacity: 0.9,
        tip: true,
        title: (d: Row) =>
          `${d.source}\n${formatBucketTs(d.ts)}\n${fmtCurrency(d.cost)} · ${fmtCompact(d.tokens)} ${tokensLabel.value}\n${fmtCompact(d.modelCalls)} ${callsLabel.value}`,
      }),
      Plot.ruleY([0], { stroke: 'var(--ct-border-strong)' }),
    ],
  }
})
</script>

<template>
  <div class="timeline">
    <div class="timeline-meta">
      <div class="metric-tabs" role="tablist" :aria-label="L?.metricCost ?? 'Cost'">
        <button
          type="button"
          role="tab"
          :aria-selected="metric === 'cost'"
          class="metric-tab"
          :class="{ active: metric === 'cost' }"
          @click="metric = 'cost'"
        >
          <span class="metric-tab-label">{{ L?.cost ?? 'cost' }}</span>
          <span class="metric-tab-value">{{ fmtCurrency(totals.cost) }}</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="metric === 'tokens'"
          class="metric-tab"
          :class="{ active: metric === 'tokens' }"
          @click="metric = 'tokens'"
        >
          <span class="metric-tab-label">{{ L?.tokens ?? 'tokens' }}</span>
          <span class="metric-tab-value">{{ fmtCompact(totals.tokens) }}</span>
        </button>
      </div>

      <ul v-if="legend.length > 1" class="meta-legend">
        <li
          v-for="item in legend"
          :key="item.source"
          class="legend-item"
        >
          <span class="legend-swatch" :style="{ background: item.color }" />
          <span class="legend-label">{{ item.source }}</span>
        </li>
      </ul>
    </div>
    <div class="timeline-chart">
      <PoltChart v-if="rows.length > 0" :options="options" />
      <div v-else class="empty">
        {{ L?.empty ?? 'no model usage in this window' }}
      </div>
    </div>
    <div v-if="rows.length > 0" class="timeline-foot">
      {{ L?.tokensFoot
        ? L.tokensFoot(props.buckets.length, fmtCompact(totals.tokens))
        : `${props.buckets.length} buckets · ${fmtCompact(totals.tokens)} tokens` }}
    </div>
  </div>
</template>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 8px; }
.timeline-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
}

.metric-tabs {
  display: inline-flex;
  gap: 4px;
  align-items: stretch;
}
.metric-tab {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 5px 14px;
  background: transparent;
  border: 0;
  border-radius: var(--ct-radius-md);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: var(--ct-fg-muted);
  transition: background-color 120ms var(--ct-ease),
              color 120ms var(--ct-ease);
}
.metric-tab:hover:not(.active) {
  color: var(--ct-fg);
  background: color-mix(in srgb, var(--ct-fg) 5%, transparent);
}
.metric-tab.active {
  color: var(--ct-fg);
  background: color-mix(in srgb, var(--ct-fg) 7%, transparent);
}
.metric-tab-label {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ct-fg-subtle);
  transition: color 120ms var(--ct-ease);
}
.metric-tab.active .metric-tab-label { color: var(--ct-fg-muted); }
.metric-tab-value {
  font-size: 16px;
  color: var(--ct-fg-muted);
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  transition: color 120ms var(--ct-ease);
}
.metric-tab.active .metric-tab-value { color: var(--ct-fg); }

.meta-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
  align-self: center;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ct-fg-muted);
}
.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}
.legend-label { letter-spacing: 0.02em; }
.timeline-chart { width: 100%; }
.empty {
  padding: 48px 0;
  text-align: center;
  color: var(--ct-fg-muted);
  font-size: 13px;
}
.timeline-foot {
  font-size: 11px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.06em;
  margin-top: -4px;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
</style>
