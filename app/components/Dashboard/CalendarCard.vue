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
  <div class="relative space-y-3">
    <div class="gap-1.5 grid grid-cols-2 sm:grid-cols-4">
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.timeTotal"
        :value="getDurationString(totalMinutes * 60 * 1000)"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.timeToday"
        :value="getDurationString(todayMinutes * 60 * 1000)"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.currentStreak"
        :value="formateDays(currentStreak)"
      />
      <DashboardDataBody
        :title="t.dashboard.overview.statistic.longestStreak"
        :value="formateDays(maxStreak)"
      />
    </div>
    <div class="px-2 py-3">
      <YearCalendarChart :data="pAllData" />
    </div>
    <div
      v-if="loading"
      class="bg-ct-surface-2 inset-0 absolute animate-pulse"
    />
  </div>
</template>
