<script setup lang="ts">
import type { PlotOptions } from '@observablehq/plot'
import type { TagResponse } from '~/api/v3/types.gen'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import { v3GetTagHistory } from '~/api/v3'
import { getDurationString } from '~/utils/format'
import { getTagDisplay } from '~/utils/tag'

type Props = {
  tag: TagResponse
}

const props = defineProps<Props>()

const t = useI18N()

const timeRange = ref<'7d' | '30d' | '90d'>('7d')
const timeRangeOptions = computed(() => [
  { label: t.value.dashboard.tags.timeRange.last7Days, id: '7d' as const },
  { label: t.value.dashboard.tags.timeRange.last30Days, id: '30d' as const },
  { label: t.value.dashboard.tags.timeRange.last90Days, id: '90d' as const },
])

let refreshStats: (() => Promise<void>) | undefined

defineExpose({
  refreshStats: () => refreshStats?.(),
})

const { data: tagStats, pending: loadingStats, refresh } = await useAsyncData(
  `tag-stats-${props.tag.id}-${timeRange.value}`,
  async () => {
    try {
      const days = timeRange.value === '7d' ? 7 : (timeRange.value === '30d' ? 30 : 90)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const response = await v3GetTagHistory({
        path: { tag_id: props.tag.id },
        query: {
          start_datetime: startDate,
          end_datetime: endDate,
        },
      })
      return response.data
    }
    catch (error_) {
      console.error('Failed to fetch tag stats:', error_)
      return null
    }
  },
  {
    server: false,
    watch: [timeRange, () => props.tag.id],
  },
)

refreshStats = refresh

const chart = ref()
useElementBounding(chart)

const chartData = computed(() => {
  const days = timeRange.value === '7d' ? 7 : (timeRange.value === '30d' ? 30 : 90)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days + 1)

  const fullDateRange = []
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    fullDateRange.push(currentDate)
  }

  const dataMap = new Map()
  if (tagStats.value?.data) {
    for (const dataPoint of tagStats.value.data) {
      const dateKey = new Date(dataPoint.time).toDateString()
      dataMap.set(dateKey, dataPoint)
    }
  }

  return fullDateRange.map((date) => {
    const dateKey = date.toDateString()
    const dataPoint = dataMap.get(dateKey)
    return {
      date: new Date(date),
      duration: dataPoint?.duration || 0,
      minutes: dataPoint?.duration || 0,
      hours: (dataPoint?.duration || 0) / 60,
    }
  })
})

const hasActualData = computed(() => {
  return chartData.value.some(d => d.duration > 0)
})

const chartOptions = computed<PlotOptions>(() => {
  const data = chartData.value
  const hasData = data.length > 0
  if (!hasData) {
    return {
      height: 240,
      marks: [],
    }
  }

  const maxHours = Math.max(...data.map((d: any) => d.hours))
  const avgHours = data.reduce((sum: number, d: any) => sum + d.hours, 0) / data.length

  return {
    padding: 0,
    marginLeft: 36,
    marginRight: 16,
    marginBottom: 32,
    marginTop: 12,
    height: 240,
    x: {
      label: t.value.plot.label.date,
      paddingInner: 0.15,
      tickFormat: d3.timeFormat('%m/%d'),
      interval: d3.timeDay,
    },
    y: {
      grid: true,
      nice: true,
      label: t.value.plot.label.timeHour,
      tickFormat: (d: number) => d3.format('.1f')(d),
      domain: [0, maxHours * 1.1],
    },
    marks: [
      Plot.barY(data, {
        x: 'date',
        y: 'hours',
        fill: props.tag.color,
        fillOpacity: 0.85,
        tip: true,
        title: (d: any) => {
          return `${d.date.toLocaleDateString()}\n${getDurationString(d.minutes * 60 * 1000, ['hours', 'minutes'])}`
        },
      }),
      ...(data.length > 1
        ? [
            Plot.ruleY([avgHours], {
              stroke: props.tag.color,
              strokeDasharray: '3,4',
              strokeOpacity: 0.7,
              strokeWidth: 1.5,
            }),
          ]
        : []),
    ],
  }
})

const periodDays = computed(() => {
  if (!tagStats.value) {
    return 0
  }
  return Math.ceil((new Date(tagStats.value.periodEnd).getTime() - new Date(tagStats.value.periodStart).getTime()) / (1000 * 60 * 60 * 24))
})

const dailyAvgMs = computed(() => {
  if (!tagStats.value) {
    return 0
  }
  return (tagStats.value.totalMinutes / Math.max(1, periodDays.value)) * 60 * 1000
})
</script>

<template>
  <PanelSection num="03" :title="t.dashboard.tags.stats.title" :meta="`TIME · DISTRIBUTION · ${timeRange}`" flush>
    <template #icon>
      <i class="i-tabler-chart-bar text-surface-dimmed/70 text-[15px]" />
    </template>

    <!-- Toolbar -->
    <div class="stats-toolbar">
      <div class="stats-tag">
        <div
          class="stats-tag-glyph"
          :style="{ backgroundColor: tag.color }"
        >
          {{ getTagDisplay(tag) }}
        </div>
        <h3 class="stats-tag-title">
          {{ t.dashboard.tags.stats.statisticsTitle(tag.name) }}
        </h3>
      </div>

      <!-- Segmented time range -->
      <div class="stats-range">
        <button
          v-for="opt in timeRangeOptions"
          :key="opt.id"
          type="button"
          class="stats-range-btn"
          :class="timeRange === opt.id ? 'stats-range-btn-active' : ''"
          @click="timeRange = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loadingStats" class="stats-cells">
      <div v-for="i in 4" :key="i" class="stats-cell stats-cell-skel">
        <div class="bg-surface-variant-1/40 h-2.5 w-16 animate-pulse" />
        <div class="bg-surface-variant-1/55 h-5 w-24 animate-pulse" />
      </div>
    </div>

    <!-- NO DATA -->
    <div v-else-if="!tagStats" class="stats-empty">
      <i class="i-tabler-chart-bar-off text-surface-dimmed/50 text-3xl" />
      <p class="stats-empty-text">
        {{ t.dashboard.tags.stats.noData }}
      </p>
    </div>

    <!-- DATA -->
    <template v-else>
      <div class="stats-cells">
        <div class="stats-cell">
          <div class="stats-cell-label">
            <i class="i-tabler-clock text-sm text-primary" />
            <span>{{ t.dashboard.tags.stats.totalDuration }}</span>
          </div>
          <div class="stats-cell-value">
            {{ getDurationString(tagStats.totalMinutes * 60 * 1000) }}
          </div>
        </div>

        <div class="stats-cell">
          <div class="stats-cell-label">
            <i class="i-tabler-list text-sm text-primary" />
            <span>{{ t.dashboard.tags.stats.recordCount }}</span>
          </div>
          <div class="stats-cell-value tabular-nums">
            {{ tagStats.data?.length || 0 }}
          </div>
        </div>

        <div class="stats-cell">
          <div class="stats-cell-label">
            <i class="i-tabler-calendar text-sm text-primary" />
            <span>{{ t.dashboard.tags.stats.timeRange }}</span>
          </div>
          <div class="stats-cell-value tabular-nums">
            {{ periodDays }} <span class="stats-cell-unit">{{ t.dashboard.tags.stats.days }}</span>
          </div>
        </div>

        <div class="stats-cell">
          <div class="stats-cell-label">
            <i class="i-tabler-chart-line text-sm text-primary" />
            <span>{{ t.dashboard.tags.stats.dailyAverage }}</span>
          </div>
          <div class="stats-cell-value">
            {{ getDurationString(dailyAvgMs) }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="stats-chart-wrap">
        <div class="stats-chart-eyebrow">
          <span class="stats-chart-eyebrow-bracket">[</span>
          <span class="stats-chart-eyebrow-num">→</span>
          <span class="stats-chart-eyebrow-sep">/</span>
          <span>{{ t.dashboard.tags.stats.timeTrend }}</span>
          <span class="stats-chart-eyebrow-bracket">]</span>
        </div>
        <div v-if="hasActualData" :key="`chart-${props.tag.id}-${timeRange}`" class="stats-chart">
          <PoltChart
            ref="chart"
            :key="`plot-${props.tag.id}-${timeRange}`"
            :options="chartOptions"
          />
        </div>
        <div v-else class="stats-chart-empty">
          <i class="i-tabler-chart-line-off text-surface-dimmed/50 text-2xl" />
          <p class="stats-empty-text">
            {{ t.dashboard.tags.stats.noChartData }}
          </p>
        </div>
      </div>
    </template>
  </PanelSection>
</template>

<style scoped>
.stats-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.stats-tag {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.stats-tag-glyph {
  width: 1.85rem;
  height: 1.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.stats-tag-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Segmented range */
.stats-range {
  display: inline-flex;
}

.stats-range-btn {
  height: 2rem;
  padding: 0 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  background-color: transparent;
  border: 0;
  border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 25%, transparent);
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.stats-range-btn:first-child {
  border-left: 0;
}

.stats-range-btn:hover {
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.22);
}

.stats-range-btn-active {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

/* Cells */
.stats-cells {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .stats-cells {
    grid-template-columns: 1fr 1fr;
  }
  .stats-cells > .stats-cell:nth-child(n+3) {
    border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  }
  .stats-cells > .stats-cell:nth-child(2n) {
    border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  }
}

@media (min-width: 1024px) {
  .stats-cells {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  .stats-cells > .stats-cell:nth-child(n+3) {
    border-top: 0;
  }
  .stats-cells > .stats-cell + .stats-cell {
    border-left: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  }
}

@media (max-width: 639px) {
  .stats-cells > .stats-cell + .stats-cell {
    border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  }
}

.stats-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
}

.stats-cell-label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
}

.stats-cell-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--r-surface-text-color);
}

.stats-cell-unit {
  font-size: 12px;
  font-weight: 400;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  margin-left: 0.25rem;
}

.stats-cell-skel {
  pointer-events: none;
}

/* Empty */
.stats-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 3rem 1rem;
}

.stats-empty-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

/* Chart */
.stats-chart-wrap {
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  padding: 1rem 1.25rem 1.25rem;
}

.stats-chart-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--color-primary-1);
  margin-bottom: 0.85rem;
}

.stats-chart-eyebrow-bracket,
.stats-chart-eyebrow-sep {
  opacity: 0.55;
}

.stats-chart-eyebrow-num {
  color: var(--r-surface-text-color);
  opacity: 0.85;
}

.stats-chart {
  width: 100%;
}

.stats-chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
}
</style>
