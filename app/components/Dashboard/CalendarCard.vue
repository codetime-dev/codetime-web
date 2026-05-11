<script setup lang="ts">
const props = defineProps<{
  data: {
    duration: number
    time: string
    by?: string
  }[]
  loading?: boolean
}>()
const data = computed(() => props.data)

const pAllData = useProcessedData(data)
const totalMinutes = useTotalMinutes(data)
const todayMinutes = useTodayMinutes(data)
const currentStreak = useCurrentStreak(pAllData)
const maxStreak = useMaxStreak(pAllData)
const t = useI18N()
</script>

<template>
  <div class="cal-root space-y-3">
    <div class="stats-grid grid grid-cols-2 sm:grid-cols-4">
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.timeTotal"
        :value="getDurationString(totalMinutes * 60 * 1000)"
        :loading="loading"
        skeleton-width="5rem"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.timeToday"
        :value="getDurationString(todayMinutes * 60 * 1000)"
        :loading="loading"
        skeleton-width="3.5rem"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.currentStreak"
        :value="formateDays(currentStreak)"
        :loading="loading"
        skeleton-width="3rem"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.longestStreak"
        :value="formateDays(maxStreak)"
        :loading="loading"
        skeleton-width="3rem"
      />
    </div>
    <div class="px-2 py-3">
      <div v-if="loading" class="cal-skel" aria-hidden="true">
        <div
          v-for="i in 371"
          :key="i"
          class="cal-skel-cell"
          :style="{ animationDelay: `${(i % 53) * 18}ms` }"
        />
      </div>
      <YearCalendarChart v-else :data="pAllData" />
    </div>
  </div>
</template>

<style scoped>
.cal-root > .stats-grid {
  margin: -10px -18px 0;
  border-bottom: 1px solid var(--ct-border-subtle);
}
/* The two-column (mobile) layout: vertical divider between odd/even
   cells, and a horizontal divider under the first row only. */
.stats-grid > :deep(*) {
  border-right: 1px solid var(--ct-border-subtle);
}
.stats-grid > :deep(*:nth-child(even)) {
  border-right: 0;
}
.stats-grid > :deep(*:nth-child(-n+2)) {
  border-bottom: 1px solid var(--ct-border-subtle);
}
/* The four-column (≥sm) layout: every cell except the last gets a
   right divider, and no cell carries a bottom divider — the
   horizontal border on .stats-grid itself separates this row from
   the calendar below. The previous rules left the even cells without
   a right divider (#2 ↔ #3 gap) and left #1/#2 with a stale bottom
   border that doubled-up against the grid's own bottom border. */
@media (min-width: 640px) {
  .stats-grid > :deep(*),
  .stats-grid > :deep(*:nth-child(even)) {
    border-right: 1px solid var(--ct-border-subtle);
  }
  .stats-grid > :deep(*),
  .stats-grid > :deep(*:nth-child(-n+2)) {
    border-bottom: 0;
  }
  .stats-grid > :deep(*:last-child) {
    border-right: 0;
  }
}

/* Inline calendar skeleton — mirrors the GitHub-style 53×7 grid so the
   placeholder occupies the same footprint as the rendered chart and
   the swap doesn't shift the panels below.

   The Observable Plot SVG is rendered at 800×140 with `max-width:100%;
   height:auto`, so its on-screen size is `min(container, 800) × that
   scaled by 140/800`. Mirror the same width clamp + aspect-ratio so the
   skeleton tracks the chart's actual height at any container width. */
.cal-skel {
  display: grid;
  grid-template-columns: repeat(53, 1fr);
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  gap: 2px;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 800 / 140;
}
.cal-skel-cell {
  background: var(--ct-surface-2);
  border-radius: 2px;
  animation: cal-skel-pulse 1.6s ease-in-out infinite;
}
@keyframes cal-skel-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.85; }
}
</style>
