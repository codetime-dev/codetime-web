<script setup lang="ts">
type LanguageEntry = {
  language?: string | null
  totalMinutes: number
  percentile: number
}

const props = defineProps<{
  entries: LanguageEntry[]
  pending?: boolean
}>()

const totalMinutes = computed(() => props.entries.reduce((acc, e) => acc + e.totalMinutes, 0))
const maxMinutes = computed(() => Math.max(1, ...props.entries.map(e => e.totalMinutes)))

const t = useI18N()

function fmtHours(minutes: number): string {
  const hours = minutes / 60
  if (hours >= 100) {
    return Math.round(hours).toString()
  }
  if (hours >= 10) {
    return hours.toFixed(1)
  }
  return hours.toFixed(2)
}

function sharePct(minutes: number): number {
  if (totalMinutes.value === 0) {
    return 0
  }
  return (minutes / totalMinutes.value) * 100
}

function widthPct(minutes: number): number {
  return (minutes / maxMinutes.value) * 100
}
</script>

<template>
  <div>
    <ul class="lang-rows">
      <li class="lang-row head">
        <span />
        <span class="hcell">LANGUAGE</span>
        <span />
        <span class="hcell num">HOURS</span>
        <span class="hcell num">SHARE</span>
        <span class="hcell num">RANK</span>
      </li>

      <template v-if="pending">
        <li v-for="i in 5" :key="`s-${i}`" class="lang-row">
          <span class="text-surface-dimmed/40 text-[12px] font-mono tabular-nums">{{ String(i).padStart(2, '0') }}</span>
          <span class="bg-surface-variant-1/50 h-4 w-24 animate-pulse" />
          <span class="bg-surface-variant-1/30 h-2 w-full animate-pulse" />
          <span class="bg-surface-variant-1/40 h-3 w-12 justify-self-end animate-pulse" />
          <span class="bg-surface-variant-1/40 h-3 w-10 justify-self-end animate-pulse" />
          <span class="bg-surface-variant-1/40 h-3 w-12 justify-self-end animate-pulse" />
        </li>
      </template>

      <template v-else-if="entries.length > 0">
        <li v-for="(entry, index) in entries" :key="entry.language || `lang-${index}`" class="lang-row">
          <span class="text-surface-dimmed/55 text-[12px] font-mono tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>

          <span class="flex gap-2.5 min-w-0 items-center">
            <VSCodeIcon
              :language="entry.language || 'Unknown'"
              class="shrink-0 h-4.5 w-4.5"
            />
            <span class="text-[13px] text-surface font-mono truncate">
              {{ getLanguageName(entry.language || 'Unknown') }}
            </span>
          </span>

          <span class="bar-wrap">
            <span class="bar" :style="{ width: `${widthPct(entry.totalMinutes)}%` }" />
          </span>

          <span class="num text-[12.5px] text-primary font-mono tabular-nums">
            {{ fmtHours(entry.totalMinutes) }}<span class="text-surface-dimmed/60">h</span>
          </span>
          <span class="num text-[12px] text-surface-dimmed font-mono tabular-nums">
            {{ sharePct(entry.totalMinutes).toFixed(1) }}%
          </span>
          <span class="num text-[11px] text-emerald-500 tracking-[0.06em] font-mono tabular-nums">
            {{ t.dashboard.profile.languages.topPercent(Math.max(1, Math.round(entry.percentile * 100))) }}
          </span>
        </li>
      </template>

      <li v-else class="empty">
        <i class="i-tabler-chart-bar text-surface-dimmed/30 text-2xl mb-2 block" />
        <span class="text-[12px] tracking-[0.04em] font-mono">{{ t.dashboard.profile.languages.noData }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lang-row {
  display: grid;
  grid-template-columns: 28px minmax(120px, 1.2fr) minmax(60px, 1.6fr) 70px 60px 60px;
  gap: 14px;
  align-items: center;
  padding: 9px 22px;
  margin: 0 -22px;
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 40%, transparent);
  transition: background 120ms ease;
}

.lang-row:not(.head):hover {
  background: var(--r-surface-background-variant-1-color);
}

.lang-row:last-child {
  border-bottom: none;
}

.lang-row.head {
  padding: 6px 22px 8px;
}

.hcell {
  font-family: var(--font-mono, monospace);
  font-size: 11.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--r-surface-text-dimmed-color);
}

.hcell.num {
  text-align: right;
}

.bar-wrap {
  position: relative;
  height: 8px;
  background: var(--r-surface-background-variant-1-color);
  border: 1px solid var(--r-surface-border-color);
  overflow: hidden;
}

.bar {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: var(--color-primary-1);
  opacity: 0.75;
  transition: width 320ms ease;
}

.num {
  text-align: right;
}

.empty {
  text-align: center;
  padding: 32px 8px;
  color: var(--r-surface-text-dimmed-color);
  border: none;
}

@media (max-width: 720px) {
  .lang-row {
    grid-template-columns: 24px minmax(96px, 1fr) minmax(40px, 0.6fr) 60px 56px;
    gap: 10px;
  }
  .lang-row > :nth-child(6) {
    display: none;
  }
}

@media (max-width: 480px) {
  .lang-row {
    grid-template-columns: 24px 1fr 60px 56px;
    gap: 8px;
  }
  .lang-row > :nth-child(3) {
    display: none;
  }
}
</style>
