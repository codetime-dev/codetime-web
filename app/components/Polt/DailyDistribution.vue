<script setup lang="ts">
import * as d3 from 'd3'
import { getV3UsersSelfTimeDistribution } from '~/api/v3'

type DataPoint = {
  time: number
  ratio: number
}

const props = withDefaults(defineProps<{
  startTime: Date
  endTime: Date
  interval?: number
  segments?: number
}>(), {
  interval: 10,
  segments: 5,
})

function fillGapsInData(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) {
    return []
  }

  const timeMap = new Map<number, number>()

  for (const point of data) {
    timeMap.set(point.time, point.ratio)
  }

  const filledData: DataPoint[] = []
  for (let minute = 0; minute < 1440; minute++) {
    filledData.push({
      time: minute,
      ratio: timeMap.get(minute) ?? 0,
    })
  }

  return filledData
}

function aggregateData(data: DataPoint[], interval = 15): DataPoint[] {
  const filledData = fillGapsInData(data)
  const aggregatedData: DataPoint[] = []

  for (let i = 0; i < filledData.length; i += interval) {
    const chunk = filledData.slice(i, i + interval)
    let maxRatio = 0
    for (const item of chunk) {
      if (item.ratio > maxRatio) {
        maxRatio = item.ratio
      }
    }
    const datum = filledData[i]
    if (datum) {
      aggregatedData.push({ time: datum.time, ratio: maxRatio })
    }
  }

  return aggregatedData
}

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

const { data: timeDistributionData, pending: segmentsPending } = useAsyncData('time-distribution-segments', async () => {
  const totalMs = props.endTime.getTime() - props.startTime.getTime()
  const segmentMs = Math.floor(totalMs / props.segments)
  const promises = []

  for (let i = 0; i < props.segments; i++) {
    const segmentEndTime = new Date(props.endTime.getTime() - i * segmentMs)
    const segmentStartTime = new Date(segmentEndTime.getTime() - segmentMs)

    const resp = getV3UsersSelfTimeDistribution({
      query: {
        start_time: segmentStartTime,
        end_time: segmentEndTime,
        tz,
      },
    }).then(response => ({
      data: response.data?.data ?? [],
      period: `Period ${i + 1}`,
      periodIndex: i,
      startTime: segmentStartTime,
      endTime: segmentEndTime,
    }))
    promises.push(resp)
  }

  const results = await Promise.all(promises)
  return results
}, {
  server: false,
  watch: [() => props.startTime, () => props.endTime, () => props.segments],
})

const { data: summaryData, pending: summaryPending } = useAsyncData('time-distribution-summary', async () => {
  const resp = await getV3UsersSelfTimeDistribution({
    query: {
      start_time: props.startTime,
      end_time: props.endTime,
      tz,
    },
  })

  return resp.data?.data ?? []
}, {
  server: false,
  watch: [() => props.startTime, () => props.endTime],
})

const isLoading = computed(() => segmentsPending.value || summaryPending.value)

const data = computed<DataPoint[]>(() => {
  if (!timeDistributionData.value || timeDistributionData.value.length === 0) {
    return []
  }

  const firstSegment = timeDistributionData.value[0]
  if (!firstSegment) {
    return []
  }

  const maxCount = d3.max(firstSegment.data.map(d => d.count) ?? []) ?? 1
  const processedData = firstSegment.data.map((d) => {
    const ratio = d.count / maxCount
    const timeInMinutes = d.hour * 60 + d.minute
    return {
      time: timeInMinutes,
      ratio,
    }
  })

  return aggregateData(processedData, props.interval)
})

const summaryDistribution = computed<DataPoint[]>(() => {
  if (!summaryData.value || summaryData.value.length === 0) {
    return []
  }

  const maxCount = d3.max(summaryData.value.map(d => d.count) ?? []) ?? 1
  const processedData = summaryData.value.map((d) => {
    const ratio = d.count / maxCount
    const timeInMinutes = d.hour * 60 + d.minute
    return {
      time: timeInMinutes,
      ratio,
    }
  })

  return aggregateData(processedData, props.interval)
})

const segmentedData = computed(() => {
  if (!timeDistributionData.value || timeDistributionData.value.length === 0) {
    return []
  }

  return timeDistributionData.value.map((segment, index) => {
    const maxCount = d3.max(segment.data.map(d => d.count) ?? []) ?? 1
    const processedData = segment.data.map((d) => {
      const ratio = d.count / maxCount
      const timeInMinutes = d.hour * 60 + d.minute
      return {
        time: timeInMinutes,
        ratio,
      }
    })

    return {
      period: segment.period,
      data: aggregateData(processedData, props.interval),
      opacity: Math.max(0.3, 1 - index * 0.2),
    }
  })
})
</script>

<template>
  <PoltDailyDistributionTemplate
    :loading="isLoading"
    :segmented-data="segmentedData"
    :summary-data="summaryDistribution"
    :fallback-data="data"
    :interval="interval"
  />
</template>
