<script setup lang="ts">
import type { VibeProjectRow, VibeProjectSourceSegment } from './types'
import { computed } from 'vue'
import { agentColor, compactParts, fmtDurationShort, fmtUsd } from './types'

const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.table)

// Top-N project leaderboard ranked by estimated cost. Each row gets a
// horizontal bar whose width is relative to the top project, segmented
// by agent source (codex / claude-code / opencode / pi) so the share
// of each agent inside one project reads at a glance — matches
// agent-time's project leaderboard idiom.

const props = defineProps<{ rows: VibeProjectRow[] }>()

const TOP = 12

const totalCost = computed(() => props.rows.reduce((s, r) => s + r.estimatedCostUsd, 0))

type Segment = VibeProjectSourceSegment & {
  color: string
  // Width as a percentage of the project's total cost (not of the
  // global max — the parent bar already encodes that via widthPct).
  segPct: number
}

function buildSegments(row: VibeProjectRow): Segment[] {
  const raw = (row.sourceSegments ?? []).filter(s => s.estimatedCostUsd > 0)
  if (raw.length === 0) {
    return []
  }
  const total = raw.reduce((s, x) => s + x.estimatedCostUsd, 0)
  return raw.map(seg => ({
    ...seg,
    color: agentColor(seg.source),
    segPct: total > 0 ? (seg.estimatedCostUsd / total) * 100 : 0,
  }))
}

const view = computed(() => {
  const rows = props.rows.slice(0, TOP)
  const max = Math.max(1, ...rows.map(r => r.estimatedCostUsd))
  return rows.map((row, index) => ({
    index: String(index + 1).padStart(2, '0'),
    project: row.project,
    total: row.totalTokens,
    cacheHit: row.inputTokens > 0 ? row.cachedInputTokens / row.inputTokens : 0,
    sharePct: totalCost.value > 0 ? (row.estimatedCostUsd / totalCost.value) * 100 : 0,
    widthPct: max > 0 ? (row.estimatedCostUsd / max) * 100 : 0,
    modelCalls: row.modelCalls,
    sessions: row.sessions,
    cost: row.estimatedCostUsd,
    agentDurationMs: row.agentDurationMs,
    segments: buildSegments(row),
  }))
})

// Distinct agent sources in the rendered view — surfaced as a small
// legend so the colour map is readable.
const legend = computed(() => {
  const seen = new Map<string, { source: string, color: string }>()
  for (const row of view.value) {
    for (const seg of row.segments) {
      if (!seen.has(seg.source)) {
        seen.set(seg.source, { source: seg.source, color: seg.color })
      }
    }
  }
  return [...seen.values()]
})
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">{{ L?.project ?? 'Project' }}</span>
      <span class="hcell" />
      <span class="hcell num">{{ L?.cost ?? 'Cost' }}</span>
      <span class="hcell num">{{ L?.share ?? 'Share' }}</span>
      <span class="hcell num">{{ L?.tokens ?? 'Tokens' }}</span>
      <span class="hcell num">{{ L?.cache ?? 'Cache' }}</span>
      <span class="hcell num">{{ L?.calls ?? 'Calls' }}</span>
      <span class="hcell num">{{ L?.time ?? 'Time' }}</span>
    </li>
    <li
      v-for="row in view"
      :key="row.project"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.project">{{ row.project }}</span>
      <span class="bar-wrap">
        <span class="bar-track" :style="{ width: `${row.widthPct}%` }">
          <template v-if="row.segments.length > 0">
            <span
              v-for="seg in row.segments"
              :key="seg.source"
              class="bar-seg"
              :style="{ width: `${seg.segPct}%`, background: seg.color }"
              :title="`${seg.source} · ${fmtUsd(seg.estimatedCostUsd)}`"
            />
          </template>
          <span v-else class="bar-seg fallback" :style="{ width: '100%' }" />
        </span>
      </span>
      <span class="num cost">{{ fmtUsd(row.cost) }}</span>
      <span class="num share">{{ row.sharePct.toFixed(1) }}%</span>
      <span class="num tokens">
        {{ compactParts(row.total).value }}{{ compactParts(row.total).unit ?? '' }}
      </span>
      <span class="num hit">{{ (row.cacheHit * 100).toFixed(0) }}%</span>
      <span class="num calls">
        {{ compactParts(row.modelCalls).value }}{{ compactParts(row.modelCalls).unit ?? '' }}
      </span>
      <span class="num time">{{ fmtDurationShort(row.agentDurationMs) }}</span>
    </li>
    <li v-if="view.length === 0" class="empty">
      {{ L?.noProject ?? '— no project data in window —' }}
    </li>
  </ul>
  <ul v-if="legend.length > 1" class="model-legend">
    <li v-for="item in legend" :key="item.source" class="legend-item">
      <span class="legend-swatch" :style="{ background: item.color }" />
      <span class="legend-label">{{ item.source }}</span>
    </li>
  </ul>
</template>

<style scoped>
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: grid;
  grid-template-columns: 28px 1.25fr 1.6fr 80px 56px 64px 50px 60px 66px;
  gap: 10px;
  align-items: center;
  padding: 8px 6px;
  margin: 0 -6px;
  border-bottom: 1px solid var(--ct-border-subtle);
  font-size: 13px;
  transition: background 120ms ease;
}
.row:not(.head):hover { background: var(--ct-surface-1); }
.row:last-child { border-bottom: none; }
.row.head {
  border-bottom: 1px solid var(--ct-border);
  padding-bottom: 8px;
}

.hcell {
  font-size: 11px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.hcell.num { text-align: right; }

.idx {
  color: var(--ct-fg-subtle);
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
.name {
  color: var(--ct-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-wrap {
  position: relative;
  height: 10px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 2px;
  overflow: hidden;
}
.bar-track {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  display: flex;
  transition: width 400ms ease;
}
.bar-seg {
  display: inline-block;
  height: 100%;
  transition: width 400ms ease;
}
.bar-seg.fallback { background: var(--ct-primary); opacity: 0.5; }

.model-legend {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px 18px;
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

.num {
  text-align: right;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
.tokens { color: var(--ct-fg); }
.cost   { color: var(--ct-primary); }
.share  { color: var(--ct-fg-muted); }
.hit    { color: var(--ct-fg-muted); }
.calls  { color: var(--ct-fg-muted); }
.time   { color: var(--ct-fg-muted); }

.empty {
  text-align: center;
  color: var(--ct-fg-muted);
  padding: 24px 0;
}

@media (max-width: 980px) {
  .row {
    grid-template-columns: 28px minmax(112px, 1fr) minmax(52px, 0.8fr) 70px 52px 60px 50px;
  }
  .row > :nth-child(8),
  .row > :nth-child(9) { display: none; }
}

@media (max-width: 700px) {
  .row {
    grid-template-columns: 28px minmax(96px, 1fr) minmax(44px, 0.7fr) 70px 62px;
  }
  .row > :nth-child(5),
  .row > :nth-child(7),
  .row > :nth-child(9) { display: none; }
}
</style>
