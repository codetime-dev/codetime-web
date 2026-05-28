<script setup lang="ts">
// Mirror of Languages.vue but for project (workspace) breakdown. Fed by
// /v3/users/{uid}/public/top-projects → gated by history.projects facet.
// Differences vs Languages: no VSCode icon, no percentile column (project
// rank is not a published leaderboard concept).

type ProjectEntry = {
  field?: string | null
  minutes: number
}

const props = defineProps<{
  entries: ProjectEntry[]
  pending?: boolean
}>()

const t = useI18N()

const totalMinutes = computed(() => props.entries.reduce((acc, e) => acc + e.minutes, 0))
const maxMinutes = computed(() => Math.max(1, ...props.entries.map(e => e.minutes)))

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
    <ul class="proj-rows">
      <li class="proj-row head">
        <span />
        <span class="hcell">PROJECT</span>
        <span />
        <span class="hcell num">HOURS</span>
        <span class="hcell num">SHARE</span>
      </li>

      <template v-if="pending">
        <li v-for="i in 5" :key="`s-${i}`" class="proj-row">
          <span class="text-[12px] text-ct-fg-subtle font-mono tabular-nums">{{ String(i).padStart(2, '0') }}</span>
          <span class="bg-ct-surface-2 h-4 w-24 animate-pulse" />
          <span class="bg-ct-surface-2 h-2 w-full animate-pulse" />
          <span class="bg-ct-surface-2 h-3 w-12 justify-self-end animate-pulse" />
          <span class="bg-ct-surface-2 h-3 w-10 justify-self-end animate-pulse" />
        </li>
      </template>

      <template v-else-if="entries.length > 0">
        <li v-for="(entry, index) in entries" :key="entry.field || `proj-${index}`" class="proj-row">
          <span class="text-[13px] text-ct-fg-muted font-mono tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>

          <span class="flex gap-2.5 min-w-0 items-center">
            <i class="i-tabler-folder text-[15px] text-ct-fg-muted shrink-0" />
            <span class="text-[14px] text-ct-fg font-mono truncate" :title="entry.field || 'unknown'">
              {{ entry.field || 'unknown' }}
            </span>
          </span>

          <span class="bar-wrap">
            <span class="bar" :style="{ width: `${widthPct(entry.minutes)}%` }" />
          </span>

          <span class="num text-primary text-[13px] font-mono tabular-nums">
            {{ fmtHours(entry.minutes) }}<span class="text-ct-fg-muted">h</span>
          </span>
          <span class="num text-[13px] text-ct-fg-muted font-mono tabular-nums">
            {{ sharePct(entry.minutes).toFixed(1) }}%
          </span>
        </li>
      </template>

      <li v-else class="empty">
        <i class="i-tabler-folder-off text-2xl text-ct-fg-subtle mb-2 block" />
        <span class="text-[12px] tracking-[0.04em] font-mono">{{ t.dashboard.profile.languages.noData }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.proj-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.proj-row {
  display: grid;
  grid-template-columns: 28px minmax(120px, 1.2fr) minmax(60px, 1.6fr) 70px 60px;
  gap: 14px;
  align-items: center;
  padding: 9px 22px;
  margin: 0 -22px;
  border-bottom: 1px solid var(--ct-border);
  transition: background 120ms ease;
}

.proj-row:not(.head):hover {
  background: var(--r-surface-background-variant-1-color);
}

.proj-row:last-child {
  border-bottom: none;
}

.proj-row.head {
  padding: 6px 22px 8px;
}

.hcell {
  font-family: var(--ct-font-mono);
  font-size: 12px;
  color: var(--r-surface-text-dimmed-color);
}

.hcell.num {
  text-align: right;
}

.bar-wrap {
  position: relative;
  height: 8px;
  background: var(--r-surface-background-variant-1-color);
  border: 1px solid var(--ct-border);
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

@media (max-width: 480px) {
  .proj-row {
    grid-template-columns: 24px 1fr 60px 56px;
    gap: 8px;
  }
  .proj-row > :nth-child(3) {
    display: none;
  }
}
</style>
