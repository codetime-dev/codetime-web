<script setup lang="ts">
import type { VibeModelRow } from './types'
import { computed } from 'vue'
import { compact, fmtUsd, providerInfoFor } from './types'

// Per-model cost breakdown — column layout mirrors agent-time's
// ModelCosts.vue so the two dashboards read identical:
//   MODEL · CACHE % · IN % · OUT % · CALLS · TOKENS · COST · SHARE
// The token mix percentages (cache vs fresh input vs output) give a
// quick read on how a model is being used; the cost figure relies on
// the same pricing.ts logic agent-time uses (recomputed server-side
// from the live OpenRouter catalogue with a frozen fallback table).

const props = defineProps<{ rows: VibeModelRow[] }>()
const t = useI18N()
const L = computed(() => t.value.dashboard.agent?.labels?.table)

const TOP = 12

const totalCost = computed(() => props.rows.reduce((s, r) => s + r.estimatedCostUsd, 0))

const maxCost = computed(() => Math.max(1, ...props.rows.map(r => r.estimatedCostUsd)))

const view = computed(() => {
  return props.rows.slice(0, TOP).map((row, index) => {
    // Match agent-time's totals exactly: fresh = inputTokens - cached;
    // outputTotal = output + reasoning; totalTokens = fresh + cached
    // + outputTotal. Pricing rows pull from the same numbers.
    const freshInput = Math.max(0, row.inputTokens - row.cachedInputTokens)
    const outputTotal = row.outputTokens + row.reasoningOutputTokens
    const totalTokens = freshInput + row.cachedInputTokens + outputTotal
    const denom = Math.max(1, totalTokens)
    const cachePct = (row.cachedInputTokens / denom) * 100
    const inputPct = (freshInput / denom) * 100
    const outputPct = (outputTotal / denom) * 100
    const share = totalCost.value > 0 ? (row.estimatedCostUsd / totalCost.value) * 100 : 0
    const { icon, name, provider } = providerInfoFor(row.model, row.pricing?.displayName)
    const pricingSource = row.pricing?.source ?? 'missing'
    return {
      index: String(index + 1).padStart(2, '0'),
      model: row.model,
      name,
      icon,
      provider,
      cachePct,
      inputPct,
      outputPct,
      modelCalls: row.modelCalls,
      totalTokens,
      cost: row.estimatedCostUsd,
      share,
      pricingSource,
      // Width relative to the top spender, so the bar at-a-glance
      // shows "this model costs X% of what the biggest one does".
      widthPct: (row.estimatedCostUsd / maxCost.value) * 100,
    }
  })
})

function fmtPct(value: number): string {
  if (value <= 0) {
    return '0%'
  }
  if (value < 0.1) {
    return '<0.1%'
  }
  if (value >= 99.95) {
    return '100%'
  }
  return `${value.toFixed(1)}%`
}
</script>

<template>
  <ul class="rows">
    <li class="row head">
      <span />
      <span class="hcell">{{ L?.model ?? 'Model' }}</span>
      <span class="hcell" />
      <span class="hcell num">{{ L?.cache ?? 'Cache' }}</span>
      <span class="hcell num">{{ L?.inputPct ?? 'In' }}</span>
      <span class="hcell num">{{ L?.outputPct ?? 'Out' }}</span>
      <span class="hcell num">{{ L?.calls ?? 'Calls' }}</span>
      <span class="hcell num">{{ L?.tokens ?? 'Tokens' }}</span>
      <span class="hcell num">{{ L?.cost ?? 'Cost' }}</span>
      <span class="hcell num">{{ L?.share ?? 'Share' }}</span>
    </li>
    <li
      v-for="row in view"
      :key="row.model"
      class="row"
    >
      <span class="idx">{{ row.index }}</span>
      <span class="name" :title="row.provider ? `${row.provider} · ${row.model}` : row.model">
        <span v-if="row.icon" class="provider-icon" :class="[row.icon]" :aria-label="row.provider" />
        <span v-else class="provider-icon i-mdi-cube-outline" :aria-label="row.provider ?? 'unknown'" />
        <span class="model-name">{{ row.name }}</span>
      </span>
      <span class="bar-wrap">
        <span class="bar" :style="{ width: `${row.widthPct}%` }" />
      </span>
      <span class="num mix cache">{{ fmtPct(row.cachePct) }}</span>
      <span class="num mix input">{{ fmtPct(row.inputPct) }}</span>
      <span class="num mix output">{{ fmtPct(row.outputPct) }}</span>
      <span class="num">{{ compact(row.modelCalls) }}</span>
      <span class="num">{{ compact(row.totalTokens) }}</span>
      <span
        class="num cost"
        :class="{ missing: row.pricingSource === 'missing' }"
      >
        {{ row.pricingSource === 'missing' ? '—' : fmtUsd(row.cost) }}
      </span>
      <span class="num share">{{ row.share.toFixed(1) }}%</span>
    </li>
    <li v-if="view.length === 0" class="empty">
      {{ L?.noModel ?? '— no model usage in window —' }}
    </li>
    <!-- UnoCSS class discovery anchor — provider icons are picked
         from PROVIDER_ICON at runtime, so the scanner can't see them.
         Listing the classes once in markup is more reliable than the
         safelist (which needs a uno.config reload). -->
    <span
      aria-hidden="true"
      class="icon-discovery i-simple-icons-anthropic i-simple-icons-openai i-simple-icons-google i-simple-icons-deepseek i-simple-icons-meta i-simple-icons-mistralai i-simple-icons-x i-simple-icons-alibabacloud i-mdi-cube-outline"
    />
  </ul>
</template>

<style scoped>
.rows { list-style: none; margin: 0; padding: 0; }

.row {
  display: grid;
  grid-template-columns: 28px 1.4fr 1.4fr 64px 60px 60px 70px 78px 90px 60px;
  gap: 10px;
  align-items: center;
  padding: 8px 6px;
  margin: 0 -6px;
  border-bottom: 1px solid var(--ct-border-subtle);
  font-size: 13px;
}

.bar-wrap {
  position: relative;
  height: 10px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 2px;
  overflow: hidden;
}
.bar {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--ct-primary);
  transition: width 400ms ease;
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
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.provider-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: var(--ct-fg-muted);
}
.model-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.num {
  text-align: right;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
}
.mix { font-size: 12.5px; }
.mix.cache { color: var(--ct-fg-muted); }
.mix.input { color: var(--ct-fg); }
.mix.output { color: var(--ct-primary); }
.cost { color: var(--ct-primary); }
.cost.missing { color: var(--ct-fg-subtle); }
.share { color: var(--ct-fg-muted); }

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
  .row { grid-template-columns: 28px minmax(120px, 1fr) minmax(60px, 1fr) 56px 56px 56px 68px 78px; }
  .row > :nth-child(9),
  .row > :nth-child(10) { display: none; }
}

@media (max-width: 700px) {
  .row { grid-template-columns: 28px minmax(96px, 1fr) minmax(40px, 0.6fr) 56px 56px 78px; }
  .row > :nth-child(5),
  .row > :nth-child(6),
  .row > :nth-child(7),
  .row > :nth-child(8),
  .row > :nth-child(10) { display: none; }
}
</style>
