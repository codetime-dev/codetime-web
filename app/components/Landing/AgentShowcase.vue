<script setup lang="ts">
// Landing-page preview of the agent telemetry feature. Mirrors the
// WidgetShowcase strategy: the chart is hand-authored inline SVG so the
// landing first paint ships none of Observable Plot / d3. The real,
// interactive dashboard lives at /demo/agent (synthetic data) and
// /dashboard/agent (real data, login required).

import { agentColor } from '~/components/Vibe/types'

const t = useI18N()
const locale = useLocale()
const demoHref = computed(() => `/${locale.value || 'en'}/demo/agent`)

const fallback = {
  title: 'Track every AI agent session, not just keystrokes.',
  description:
    'Install one CLI and Code Time captures sessions from Claude Code, Codex, '
    + 'OpenCode, and Pi — model calls, tokens, cache hit rate, estimated cost, '
    + 'and the projects they touched. Your prompt text and source code never '
    + 'leave your machine.',
  supports: 'Hooks into',
  kpiSessions: 'sessions',
  kpiCost: 'est. cost',
  kpiCalls: 'model calls',
  chartLegend: 'cost by agent · last 14 days',
  cta: 'Open the agent demo',
}

const copy = computed(() => ({ ...fallback, ...t.value.landing.features.agent }))
const sectionLabel = computed(() => t.value.landing.sections.agentTelemetry ?? 'agent · telemetry')

// Re-uses the canonical VIBE_PALETTE / agent colour map so the same
// agent renders in the same hue on the landing showcase and inside the
// real /dashboard/agent timeline.
const AGENTS = [
  { id: 'claude-code', name: 'Claude Code', icon: 'i-simple-icons-anthropic' },
  { id: 'codex', name: 'Codex', icon: 'i-simple-icons-openai' },
  { id: 'opencode', name: 'OpenCode', icon: 'i-brand-opencode' },
  { id: 'pi', name: 'Pi', icon: 'i-brand-pi' },
].map(a => ({ ...a, color: agentColor(a.id) }))

// Deterministic 14-day stacked cost series. Picked by hand to read like a
// real developer's fortnight: a launch push mid-window, a weekend dip at
// day 5, and a closing crunch on the last two days. Each row is one
// agent's daily cost in USD; the SVG stacks them per-day.
const series: number[][] = [
  // claude-code
  [3.2, 4.1, 5.6, 4.8, 2.4, 1.1, 6.2, 7.4, 8.1, 5.9, 4.6, 4.2, 6.8, 9.2],
  // codex
  [1.4, 1.8, 2.6, 2.2, 1.1, 0.6, 3.1, 4, 4.6, 3, 2.4, 2.1, 3.6, 4.9],
  // opencode
  [0.6, 0.9, 1.4, 1, 0.4, 0.2, 1.6, 2, 1.8, 1.3, 1, 0.8, 1.5, 2.4],
  // pi
  [0.1, 0.2, 0.3, 0.2, 0, 0, 0.4, 0.5, 0.6, 0.3, 0.2, 0.2, 0.4, 0.6],
]

const totals = series[0]!.map((_, i) => series.reduce((s, row) => s + row[i]!, 0))
const totalCost = totals.reduce((a, b) => a + b, 0)
const totalCalls = 1248
const totalSessions = 47

// SVG dimensions. Aspect ratio chosen so it docks cleanly above the agent
// leaderboard on wide layouts and stays readable when stacked on mobile.
const W = 540
const H = 220
const PAD_L = 40
const PAD_R = 16
const PAD_T = 18
const PAD_B = 30
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B
const colCount = totals.length
const barW = (innerW / colCount) * 0.66
const colStep = innerW / colCount
const maxTotal = Math.max(...totals)

type Slice = { x: number, y: number, w: number, h: number, color: string }
const slices: Slice[] = []
for (let i = 0; i < colCount; i += 1) {
  const cx = PAD_L + colStep * i + colStep / 2
  let yCursor = PAD_T + innerH
  for (const [a, AGENT] of AGENTS.entries()) {
    const v = series[a]![i]!
    const segH = (v / maxTotal) * innerH
    yCursor -= segH
    slices.push({
      x: cx - barW / 2,
      y: yCursor,
      w: barW,
      h: segH,
      color: AGENT!.color,
    })
  }
}

// Hand-picked x-axis ticks. Two-week window → label every third day so
// the labels don't crowd at this width.
const xTickIdx = [0, 3, 6, 9, 12]

// Y-axis ticks in USD. maxTotal sits at ~17 with the chosen series, so
// 0/5/10/15 reads cleanly without a third decimal place.
const yTicks = [0, 5, 10, 15]

// Per-agent totals over the window — drives the leaderboard bars.
const agentTotals = AGENTS.map((a, i) => ({
  ...a,
  total: series[i]!.reduce((s, v) => s + v, 0),
}))
const leaderMax = Math.max(...agentTotals.map(a => a.total))

function fmtUsd(v: number): string {
  return v >= 100 ? `$${v.toFixed(0)}` : `$${v.toFixed(2)}`
}

function fmtCompact(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`
  }
  return String(n)
}
</script>

<template>
  <section>
    <div class="mx-auto px-6 py-24 max-w-6xl sm:py-32">
      <div class="mb-12 flex flex-col gap-3">
        <div class="eyebrow">
          <span class="eyebrow-bracket">[</span>
          <span class="eyebrow-num">02</span>
          <span class="eyebrow-sep">/</span>
          <span>{{ sectionLabel }}</span>
          <span class="eyebrow-bracket">]</span>
        </div>
        <h2 class="section-heading text-ct-fg leading-[1.05] font-semibold max-w-3xl">
          {{ copy.title }}
        </h2>
        <p class="text-[14px] text-ct-fg-muted leading-[1.7] mt-2 max-w-2xl">
          {{ copy.description }}
        </p>
      </div>

      <div class="agent-frame">
        <!-- KPI strip -->
        <div class="agent-kpi-row">
          <div class="agent-kpi">
            <span class="agent-kpi-num">{{ totalSessions }}</span>
            <span class="agent-kpi-label">{{ copy.kpiSessions }}</span>
          </div>
          <span class="agent-kpi-rule" aria-hidden="true" />
          <div class="agent-kpi">
            <span class="agent-kpi-num">{{ fmtUsd(totalCost) }}</span>
            <span class="agent-kpi-label">{{ copy.kpiCost }}</span>
          </div>
          <span class="agent-kpi-rule" aria-hidden="true" />
          <div class="agent-kpi">
            <span class="agent-kpi-num">{{ fmtCompact(totalCalls) }}</span>
            <span class="agent-kpi-label">{{ copy.kpiCalls }}</span>
          </div>
        </div>

        <div class="agent-grid">
          <!-- Stacked cost chart -->
          <div class="agent-chart">
            <div class="agent-chart-caption">
              {{ copy.chartLegend }}
            </div>
            <svg
              :viewBox="`0 0 ${W} ${H}`"
              role="img"
              :aria-label="copy.chartLegend"
              class="agent-chart-svg"
            >
              <!-- y-grid -->
              <g class="agent-chart-grid">
                <line
                  v-for="ty in yTicks"
                  :key="`gy-${ty}`"
                  :x1="PAD_L"
                  :x2="W - PAD_R"
                  :y1="PAD_T + innerH - (ty / 15) * innerH"
                  :y2="PAD_T + innerH - (ty / 15) * innerH"
                />
              </g>
              <!-- y-labels -->
              <g class="agent-chart-axis">
                <text
                  v-for="ty in yTicks"
                  :key="`yt-${ty}`"
                  :x="PAD_L - 8"
                  :y="PAD_T + innerH - (ty / 15) * innerH + 3"
                  text-anchor="end"
                >${{ ty }}</text>
              </g>
              <!-- bars -->
              <g>
                <rect
                  v-for="(s, i) in slices"
                  :key="`s-${i}`"
                  :x="s.x"
                  :y="s.y"
                  :width="s.w"
                  :height="s.h"
                  :fill="s.color"
                  rx="1"
                />
              </g>
              <!-- x-labels -->
              <g class="agent-chart-axis">
                <text
                  v-for="i in xTickIdx"
                  :key="`xt-${i}`"
                  :x="PAD_L + colStep * i + colStep / 2"
                  :y="H - 10"
                  text-anchor="middle"
                >−{{ colCount - 1 - i }}d</text>
              </g>
            </svg>
          </div>

          <!-- Agent leaderboard -->
          <div class="agent-leader">
            <span class="agent-leader-label">{{ copy.supports }}</span>
            <ul class="agent-leader-list">
              <li
                v-for="a in agentTotals"
                :key="a.name"
                class="agent-leader-row"
              >
                <span class="agent-leader-name">
                  <i :class="`${a.icon} agent-leader-icon`" />
                  <span>{{ a.name }}</span>
                </span>
                <span class="agent-leader-bar-wrap">
                  <span
                    class="agent-leader-bar"
                    :style="{ width: `${(a.total / leaderMax) * 100}%`, background: a.color }"
                  />
                </span>
                <span class="agent-leader-val">{{ fmtUsd(a.total) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="agent-cta-row">
        <NuxtLink :to="demoHref" class="agent-cta">
          <i class="agent-cta-icon i-tabler-sparkles" />
          <span>{{ copy.cta }}</span>
          <i class="agent-cta-arrow i-tabler-arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <!-- UnoCSS class discovery anchor — leaderboard icons are sourced
         from a runtime array, so the scanner can't see them. Listing
         them here keeps the agent glyphs in the generated stylesheet. -->
    <span
      aria-hidden="true"
      class="icon-discovery i-simple-icons-anthropic i-simple-icons-openai i-tabler-sparkles i-brand-opencode i-brand-pi"
    />
  </section>
</template>

<style scoped>
.agent-frame {
  border: 1px solid var(--ct-border);
  border-radius: 16px;
  background: var(--ct-surface);
  overflow: hidden;
}

.agent-kpi-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: var(--ct-surface-1);
  border-bottom: 1px solid var(--ct-border);
}
.agent-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 96px;
}
.agent-kpi-num {
  font-family: var(--ct-font-mono);
  font-size: clamp(1.4rem, 2.2vw, 1.8rem);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.agent-kpi-label {
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ct-fg-muted);
  text-transform: uppercase;
}
.agent-kpi-rule {
  width: 1px;
  height: 28px;
  background: var(--ct-border);
}

.agent-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@media (min-width: 900px) {
  .agent-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  }
  .agent-grid > .agent-leader {
    border-top: 0;
    border-left: 1px solid var(--ct-border-subtle);
  }
}

.agent-chart {
  padding: 18px 18px 12px;
  min-width: 0;
}
.agent-chart-caption {
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ct-fg-subtle);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.agent-chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
.agent-chart-grid line {
  stroke: var(--ct-border-subtle);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}
.agent-chart-axis text {
  font-family: var(--ct-font-mono);
  font-size: 10px;
  fill: var(--ct-fg-subtle);
}

.agent-leader {
  padding: 18px 22px;
  border-top: 1px solid var(--ct-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.agent-leader-label {
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ct-fg-subtle);
  text-transform: uppercase;
}
.agent-leader-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.agent-leader-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr) 60px;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
}
.agent-leader-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ct-fg);
  min-width: 0;
}
.agent-leader-name > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agent-leader-icon {
  width: 14px;
  height: 14px;
  color: var(--ct-fg-muted);
  flex-shrink: 0;
}
.agent-leader-bar-wrap {
  position: relative;
  height: 8px;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 2px;
  overflow: hidden;
}
.agent-leader-bar {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
}
.agent-leader-val {
  text-align: right;
  font-family: var(--ct-font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--ct-primary);
}

.agent-cta-row {
  margin-top: 28px;
  display: flex;
  justify-content: center;
}
.agent-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  font-family: var(--ct-font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--ct-fg);
  text-decoration: none;
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  transition: background-color 200ms ease, border-color 200ms ease, transform 200ms ease;
}
.agent-cta:hover {
  background: var(--ct-surface-2);
  border-color: color-mix(in srgb, var(--ct-primary) 45%, transparent);
  transform: translateY(-1px);
}
.agent-cta-icon {
  font-size: 16px;
  color: var(--ct-primary);
}
.agent-cta-arrow {
  font-size: 15px;
  color: var(--ct-fg-muted);
  transition: transform 200ms ease;
}
.agent-cta:hover .agent-cta-arrow {
  color: var(--ct-primary);
  transform: translateX(3px);
}

.icon-discovery {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
