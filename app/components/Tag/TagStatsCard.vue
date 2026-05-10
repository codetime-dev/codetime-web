<script setup lang="ts">
import type { TagTimeData } from '~/api/v3/types.gen'
import { v3GetTagTimeStats } from '~/api/v3'
import { getDurationString } from '~/utils/format'
import { getTagDisplay } from '~/utils/tag'

type Props = {
  timeRange?: string
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: '7d',
})

const t = useI18N()

// 获取所有标签的时间统计
const { data: allTagStats, pending: loading } = await useAsyncData(
  `all-tag-stats-${props.timeRange}`,
  async () => {
    try {
      const days = props.timeRange === '7d' ? 7 : (props.timeRange === '30d' ? 30 : 90)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const response = await v3GetTagTimeStats({
        query: {
          start_datetime: startDate,
          end_datetime: endDate,
        },
      })

      return response.data
    }
    catch (error_) {
      console.error('Failed to fetch tag time stats:', error_)
      return null
    }
  },
  {
    server: false,
    watch: [() => props.timeRange],
  },
)

// 计算标签统计数据
const tagStats = computed(() => {
  if (!allTagStats.value?.data || allTagStats.value.data.length === 0) {
    return []
  }

  const totalAllMinutes = allTagStats.value.totalMinutes

  return allTagStats.value.data.map((tagData: TagTimeData) => ({
    tag: tagData.tag,
    totalMinutes: tagData.totalMinutes,
    percentage: totalAllMinutes > 0 ? (tagData.totalMinutes / totalAllMinutes) * 100 : 0,
  })).toSorted((a: any, b: any) => b.totalMinutes - a.totalMinutes)
})
</script>

<template>
  <CardBase>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-medium">
        {{ t.dashboard.tags.stats.title }}
      </h3>
      <NuxtLink
        to="/dashboard/tags"
        class="hover:text-primary-variant text-sm text-primary transition-colors"
      >
        {{ t.dashboard.tags.stats.viewAll }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 5"
        :key="i"
        class="flex gap-3 items-center"
      >
        <div class="bg-ct-surface-1 rounded h-4 w-4 animate-pulse" />
        <div class="bg-ct-surface-1 rounded flex-1 h-4 animate-pulse" />
        <div class="bg-ct-surface-1 rounded h-4 w-16 animate-pulse" />
      </div>
    </div>

    <div v-else-if="tagStats.length === 0" class="text-ct-fg-muted py-8 text-center">
      <i class="i-tabler-tag-off text-2xl mb-2" />
      <p class="text-sm">
        {{ t.dashboard.tags.stats.noData }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="stat in tagStats.slice(0, 8)"
        :key="stat.tag.id"
        class="flex gap-3 items-center"
      >
        <div
          class="text-xs font-medium rounded-full flex h-5 w-5 items-center justify-center"
          :style="{ backgroundColor: stat.tag.color, color: 'white' }"
        >
          {{ getTagDisplay(stat.tag) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium truncate">{{ stat.tag.name }}</span>
            <span class="text-ct-fg-muted text-sm">{{ stat.percentage.toFixed(1) }}%</span>
          </div>
          <div class="bg-ct-surface-1 mt-1 rounded-full h-2 overflow-hidden">
            <div
              class="rounded-full h-full transition-all duration-300"
              :style="{
                backgroundColor: stat.tag.color,
                width: `${stat.percentage}%`,
                opacity: 0.8,
              }"
            />
          </div>
        </div>
        <span class="text-ct-fg-muted text-sm font-medium">
          {{ getDurationString(stat.totalMinutes * 60 * 1000) }}
        </span>
      </div>
    </div>
  </CardBase>
</template>
