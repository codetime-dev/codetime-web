<script setup lang="ts">
import type { VibeOverviewBucket, VibeSummary } from './types'
import { computed } from 'vue'
import { compactParts as compact, fmtDurationParts, fmtUsd } from './types'

// Six KPI tiles laid out as a 6-col grid (collapses to 3-col then
// 2-col on narrower viewports). The shape and sparkline behaviour
// match agent-time/KpiGrid.vue intentionally so the visual language
// is identical; the only change is the colour palette (ct-* tokens).

const props = defineProps<{
  summary: VibeSummary
  overview: VibeOverviewBucket[]
  totalCostUsd?: number
}>()

type Kpi = {
  index: string
  label: string
  value: string
  unit?: string
  delta?: { sign: 1 | -1 | 0, label: string }
  caption: string
  spark: number[]
  accentValue?: boolean
}

// Half-and-half trend: compare the sum of the latter half to the
// earlier half. Same heuristic as agent-time; not statistically
// rigorous but matches user intuition for "is it trending up?"
function trend(buckets: number[]): { sign: 1 | -1 | 0, label: string } {
  if (buckets.length < 4) {
    return { sign: 0, label: '—' }
  }
  const half = Math.floor(buckets.length / 2)
  const head = buckets.slice(0, half).reduce((s, v) => s + v, 0)
  const tail = buckets.slice(half).reduce((s, v) => s + v, 0)
  if (head === 0 && tail === 0) {
    return { sign: 0, label: '0%' }
  }
  if (head === 0) {
    return { sign: 1, label: '+∞' }
  }
  const change = (tail - head) / head
  if (Math.abs(change) < 0.005) {
    return { sign: 0, label: '0%' }
  }
  const sign: 1 | -1 = change > 0 ? 1 : -1
  return { sign, label: `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}%` }
}

const kpis = computed<Kpi[]>(() => {
  const overview = props.overview
  const activityBucket = overview.map(item => item.activity)
  const sessionsBucket = overview.map(item => item.sessions)
  const linesChangedBucket = overview.map(item => item.linesChanged)
  const tokensBucket = overview.map(item => item.tokens)
  const costBucket = overview.map(item => item.estimatedCostUsd)

  const totalTokens = props.summary.totalTokens
  const totalCommands = props.summary.totalCommandCalls
  const totalTools = props.summary.totalToolCalls
  const linesNet = props.summary.totalLinesAdded - props.summary.totalLinesRemoved
  const cost = props.totalCostUsd ?? 0

  const eventsCompact = compact(props.summary.totalEvents)
  const sessionsCompact = compact(props.summary.totalSessions)
  const linesNetCompact = compact(linesNet)
  const tokensCompact = compact(totalTokens)
  const durationMs = props.summary.totalDurationMs
  const timeCompact = fmtDurationParts(durationMs)

  const inCompact = compact(props.summary.totalInputTokens)
  const outCompact = compact(props.summary.totalOutputTokens)

  return [
    {
      index: '01',
      label: 'events',
      value: eventsCompact.value,
      unit: eventsCompact.unit,
      delta: trend(activityBucket),
      caption: `${totalTools.toLocaleString()} tool · ${totalCommands.toLocaleString()} cmd`,
      spark: activityBucket,
    },
    {
      index: '02',
      label: 'sessions',
      value: sessionsCompact.value,
      unit: sessionsCompact.unit,
      delta: trend(sessionsBucket),
      caption: `${props.summary.totalProjects} projects`,
      spark: sessionsBucket,
    },
    {
      index: '03',
      label: 'tokens',
      value: tokensCompact.value,
      unit: tokensCompact.unit,
      delta: trend(tokensBucket),
      caption: `${inCompact.value}${inCompact.unit ?? ''} in · ${outCompact.value}${outCompact.unit ?? ''} out`,
      spark: tokensBucket,
    },
    {
      index: '04',
      label: 'cost',
      value: cost > 0 ? fmtUsd(cost).replace(/^\$/, '') : '—',
      unit: cost > 0 ? 'USD' : undefined,
      delta: trend(costBucket),
      caption: cost > 0 ? 'estimated' : '—',
      spark: costBucket,
      accentValue: true,
    },
    {
      index: '05',
      label: 'time',
      value: timeCompact.value,
      unit: timeCompact.unit,
      delta: trend(sessionsBucket),
      caption: 'agent active',
      spark: sessionsBucket,
    },
    {
      index: '06',
      label: 'lines net',
      value: `${linesNet >= 0 ? '+' : ''}${linesNetCompact.value}`,
      unit: linesNetCompact.unit,
      delta: trend(linesChangedBucket),
      caption: `+${props.summary.totalLinesAdded.toLocaleString()} / −${props.summary.totalLinesRemoved.toLocaleString()}`,
      spark: linesChangedBucket,
    },
  ]
})
</script>

<template>
  <div class="kpis">
    <div
      v-for="kpi in kpis"
      :key="kpi.index"
      class="kpi"
    >
      <div class="head">
        <span class="kpi-index">{{ kpi.index }}</span>
        <span class="kpi-label">{{ kpi.label }}</span>
        <span
          v-if="kpi.delta"
          class="kpi-delta"
          :class="{ up: kpi.delta.sign === 1, down: kpi.delta.sign === -1, flat: kpi.delta.sign === 0 }"
        >
          {{ kpi.delta.label }}
        </span>
      </div>
      <div class="value">
        <span v-if="kpi.accentValue" class="value-prefix">$</span>
        <span class="value-num">{{ kpi.value }}</span>
        <span v-if="kpi.unit" class="value-unit">{{ kpi.unit }}</span>
      </div>
      <VibeSparkline
        :values="kpi.spark"
        color="var(--ct-primary)"
        :width="220"
        :height="28"
        :fill="false"
      />
      <div class="caption">
        {{ kpi.caption }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}

.kpi {
  position: relative;
  border-right: 1px solid var(--ct-border);
  padding: 18px 22px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  transition: background 160ms ease;
}

.kpi:hover { background: var(--ct-surface-1); }
.kpi:last-child { border-right: none; }

.head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
}

.kpi-index {
  font-size: 13px;
  letter-spacing: 0.18em;
  color: var(--ct-fg-subtle);
  font-variant-numeric: tabular-nums;
}

.kpi-label {
  font-size: 13.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
}

.kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--ct-fg-muted);
  font-variant-numeric: tabular-nums;
}

.kpi-delta.up   { color: var(--ct-success); }
.kpi-delta.down { color: var(--ct-danger); }
.kpi-delta.flat { color: var(--ct-fg-subtle); }

.value {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.value-prefix {
  font-size: 14px;
  color: var(--ct-primary);
  margin-right: 1px;
}

.value-num {
  font-size: 26px;
  letter-spacing: -0.02em;
  color: var(--ct-primary);
  line-height: 1.02;
  font-variant-numeric: tabular-nums;
}

.value-unit {
  font-size: 13px;
  color: var(--ct-fg-muted);
  margin-left: 1px;
}

.caption {
  font-size: 12px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

:deep(svg) { width: 100%; }

@media (max-width: 1100px) {
  .kpis { grid-template-columns: repeat(3, 1fr); }
  .kpi:nth-child(3n) { border-right: none; }
  .kpi:nth-child(n + 4) { border-top: 1px solid var(--ct-border); }
}

@media (max-width: 720px) {
  .kpis { grid-template-columns: repeat(2, 1fr); }
  .kpi { border-right: 1px solid var(--ct-border); }
  .kpi:nth-child(2n) { border-right: none; }
  .kpi:nth-child(n + 3) { border-top: 1px solid var(--ct-border); }
}
</style>
