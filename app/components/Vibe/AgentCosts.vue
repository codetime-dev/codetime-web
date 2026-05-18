<script setup lang="ts">
import type { VibeAgentModelSegment, VibeAgentRow } from './types'
import { computed } from 'vue'
import { useExchangeRate } from '~/composables/useExchangeRate'
import { agentSourceMeta, compactParts, fmtDurationShort, modelColor } from './types'

// No legend below the bar: each segment already carries the model id
// in its title tooltip, and the table itself doesn't need a colour
// → model lookup the way the Projects bar needs source colours.

// Per-agent-source leaderboard ranked by estimated cost. Symmetric to
// ProjectTokens: the horizontal bar's width is the agent's share of
// the top spender, and the bar is segmented by the models the agent
// invoked so users can read "claude-code is mostly Opus, codex is
// mostly GPT-5" at a glance.

const props = defineProps<{ rows: VibeAgentRow[] }>()

const { format: fmtCurrency } = useExchangeRate()
const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.table)

const TOP = 12

const totalCost = computed(() => props.rows.reduce((s, r) => s + r.estimatedCostUsd, 0))

type Segment = VibeAgentModelSegment & {
  color: string
  segPct: number
}

function buildSegments(row: VibeAgentRow): Segment[] {
  const raw = (row.modelSegments ?? []).filter(s => s.estimatedCostUsd > 0)
  if (raw.length === 0) {
    return []
  }
  const total = raw.reduce((s, x) => s + x.estimatedCostUsd, 0)
  return raw.map(seg => ({
    ...seg,
    color: modelColor(seg.model),
    segPct: total > 0 ? (seg.estimatedCostUsd / total) * 100 : 0,
  }))
}

const view = computed(() => {
  const rows = props.rows.slice(0, TOP)
  const max = Math.max(1, ...rows.map(r => r.estimatedCostUsd))
  return rows.map((row, index) => {
    const meta = agentSourceMeta(row.source)
    return {
      index: String(index + 1).padStart(2, '0'),
      source: row.source,
      label: meta.label,
      icon: meta.icon,
      total: row.totalTokens,
      cacheHit: row.inputTokens > 0 ? row.cachedInputTokens / row.inputTokens : 0,
      sharePct: totalCost.value > 0 ? (row.estimatedCostUsd / totalCost.value) * 100 : 0,
      widthPct: max > 0 ? (row.estimatedCostUsd / max) * 100 : 0,
      modelCalls: row.modelCalls,
      sessions: row.sessions,
      cost: row.estimatedCostUsd,
      agentDurationMs: row.agentDurationMs,
      segments: buildSegments(row),
    }
  })
})
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">{{ L?.agent ?? 'Agent' }}</span>
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
      :key="row.source"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.source">
        <span class="agent-icon" :class="[row.icon]" aria-hidden="true" />
        <span class="agent-name">{{ row.label }}</span>
      </span>
      <span class="bar-wrap">
        <span class="bar-track" :style="{ width: `${row.widthPct}%` }">
          <template v-if="row.segments.length > 0">
            <span
              v-for="seg in row.segments"
              :key="seg.model"
              class="bar-seg"
              :style="{ width: `${seg.segPct}%`, background: seg.color }"
              :title="`${seg.model} · ${fmtCurrency(seg.estimatedCostUsd)}`"
            />
          </template>
          <span v-else class="bar-seg fallback" :style="{ width: '100%' }" />
        </span>
      </span>
      <span class="num cost">{{ fmtCurrency(row.cost) }}</span>
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
      {{ L?.noAgent ?? '— no agent activity in window —' }}
    </li>
  </ul>
  <!-- UnoCSS class discovery anchor — agent icons come from
       agentSourceMeta at runtime so the scanner can't see them. -->
  <span
    aria-hidden="true"
    class="icon-discovery i-simple-icons-anthropic i-simple-icons-openai i-tabler-terminal-2 i-brand-opencode i-brand-pi"
  />
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.agent-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: var(--ct-fg-muted);
}
.agent-name {
  overflow: hidden;
  text-overflow: ellipsis;
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

.icon-discovery {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
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
