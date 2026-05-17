<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import type { VibeTokenBucket } from './types'
import * as Plot from '@observablehq/plot'
import { computed } from 'vue'
import { agentColor, compactParts, fmtUsd } from './types'

const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.timeline)

// Stacked cost-per-bucket bar timeline, coloured by agent source
// (codex / claude-code / opencode / pi / …). Mirrors agent-time's
// TokenTimeline.vue: one rectY per (bucket, source) pair, stacked
// upward so total bucket cost reads as bar height and per-agent
// share reads as stack thickness. The header strip below the chart
// holds the three numbers a Vibe user actually cares about: total
// cost, model calls, cache hit rate.

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

// Flatten buckets × sources into one row per stack segment. Sources
// are sorted by total spend (descending) so the biggest spender
// renders at the bottom of each stack — agent-time's convention.
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

const rows = computed(() => {
  const out: { ts: Date, source: string, cost: number }[] = []
  for (const b of props.buckets) {
    const entries = b.bySource && Object.keys(b.bySource).length > 0
      ? Object.entries(b.bySource)
      : [['unknown', { estimatedCostUsd: b.estimatedCostUsd }] as const]
    for (const [source, cell] of entries) {
      // Keep zero-cost rows out — they collapse to a 0-height stack
      // and contribute nothing to the chart but a hover target.
      if (!(cell.estimatedCostUsd > 0)) {
        continue
      }
      out.push({ ts: new Date(b.ts), source, cost: cell.estimatedCostUsd })
    }
  }
  return out
})

// Align [since, until] onto bucket boundaries — done in UTC because
// Plot's x scale is `type: 'utc'` and the server uses Postgres
// `date_trunc(..., ts)` which already lands on UTC boundaries. Doing
// the snap in local time would offset by the user's TZ and bleed the
// first/last bar past the axis (the symptom users see as "柱子超出
// 坐标轴").
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
    return undefined
  }
  const until = new Date(props.until)
  const since = props.since ? new Date(props.since) : null
  if (!since || Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return undefined
  }
  const bucket = props.bucket ?? 'day'
  return [floorToBucket(since, bucket), ceilToBucket(until, bucket)]
})

const legend = computed(() => sourceOrder.value.map(source => ({
  source,
  color: agentColor(source),
})))

// rectY draws closed rectangles; on a continuous time axis it needs an
// `interval` so each bar gets a width (otherwise Plot falls back to a
// band scale and throws "utc !== band"). The interval also lets Plot
// fill gaps with zero-height bars so the timeline reads as a series.
// Tooltip date formatter — emits a human-readable label in the user's
// local timezone at the bucket grain. The bucket Date arrives as a UTC
// instant (server-side date_trunc + ISO serialisation); Intl renders
// it in whatever zone the browser is set to.
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
    case 'hour': { return 'hour'
    }
    case 'week': { return 'week'
    }
    case 'day':
    default: { return 'day'
    }
  }
})

const options = computed<PlotOptions>(() => ({
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
    label: 'USD',
    grid: true,
    tickFormat: (d: number) => (d >= 1 ? `$${d.toFixed(0)}` : `$${d.toFixed(2)}`),
  },
  color: {
    type: 'categorical',
    domain: sourceOrder.value,
    range: sourceOrder.value.map(s => agentColor(s)),
  },
  marks: [
    Plot.rectY(rows.value, {
      x: 'ts',
      y: 'cost',
      fill: 'source',
      interval: intervalFor.value,
      // Stack order matches sourceOrder (biggest at the bottom).
      order: sourceOrder.value,
      fillOpacity: 0.9,
      tip: true,
      title: (d: { ts: Date, source: string, cost: number }) =>
        `${d.source}\n${formatBucketTs(d.ts)}\n${fmtUsd(d.cost)}`,
    }),
    Plot.ruleY([0], { stroke: 'var(--ct-border-strong)' }),
  ],
}))
</script>

<template>
  <div class="timeline">
    <div class="timeline-meta">
      <div class="meta-cell">
        <span class="meta-label">{{ L?.cost ?? 'cost' }}</span>
        <span class="meta-value">{{ fmtUsd(totals.cost) }}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">{{ L?.modelCalls ?? 'model calls' }}</span>
        <span class="meta-value">
          {{ compactParts(totals.modelCalls).value }}{{ compactParts(totals.modelCalls).unit ?? '' }}
        </span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">{{ L?.cacheHit ?? 'cache hit' }}</span>
        <span class="meta-value">{{ (totals.cacheHitRate * 100).toFixed(0) }}%</span>
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
        ? L.tokensFoot(props.buckets.length, `${compactParts(totals.tokens).value}${compactParts(totals.tokens).unit ?? ''}`)
        : `${props.buckets.length} buckets · ${compactParts(totals.tokens).value}${compactParts(totals.tokens).unit ?? ''} tokens` }}
    </div>
  </div>
</template>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 8px; }
.timeline-meta {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  align-items: center;
}
.meta-cell { display: flex; flex-direction: column; gap: 2px; }
.meta-label {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
}
.meta-value {
  font-size: 18px;
  color: var(--ct-fg);
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
.meta-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-left: auto;
  align-self: flex-end;
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
