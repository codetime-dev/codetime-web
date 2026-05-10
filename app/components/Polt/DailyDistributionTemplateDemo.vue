<script setup lang="ts">
function generateMockData(segmentIndex = 0) {
  // 时间演进不规律，波动更大
  const wakeUpVariation = [0, -0.5, -1.2, -0.8][segmentIndex] || 0
  const sleepVariation = [0, -0.2, -0.8, -0.3][segmentIndex] || 0
  const wakeUpTime = 8 + wakeUpVariation + (Math.random() - 0.5) * 0.4
  const sleepTime = 24 + sleepVariation + (Math.random() - 0.5) * 0.6

  // 不同时段的高峰时间和强度偏移
  const morningPeakTime = [10, 9.8, 10.3, 9.5][segmentIndex] || 10
  const morningPeakIntensity = [0.3, 0.35, 0.25, 0.4][segmentIndex] || 0.3

  const afternoonPeakTime = [16, 16.8, 16.2, 15.3][segmentIndex] || 16
  const afternoonPeakIntensity = [0.5, 0.65, 0.9, 0.55][segmentIndex] || 0.5

  const eveningLevel = [0.35, 0.4, 0.3, 0.38][segmentIndex] || 0.35

  const lunchDipTime = [12.75, 12.5, 13, 12.8][segmentIndex] || 12.75
  const dinnerDipTime = [18.75, 18.5, 19, 18.3][segmentIndex] || 18.75

  // 生成基础数据点
  const rawData = []
  for (let minute = 0; minute < 1440; minute += 5) {
    const hour = minute / 60
    let ratio = 0

    // 核心睡眠时间
    if ((hour >= 1 && hour < Math.max(5, wakeUpTime - 2))) {
      ratio = 0
    }
    // 起床渐变
    else if (hour >= Math.max(5, wakeUpTime - 2) && hour < wakeUpTime + 1) {
      const progress = (hour - Math.max(5, wakeUpTime - 2)) / (wakeUpTime + 1 - Math.max(5, wakeUpTime - 2))
      ratio = 0.05 + progress * 0.15 + Math.random() * 0.1
    }
    // 上午工作时间 - 动态峰值时间和强度
    else if (hour >= wakeUpTime + 1 && hour < 12) {
      const morningPeak = Math.exp(-((hour - morningPeakTime) ** 2) / 2) * morningPeakIntensity
      ratio = 0.25 + morningPeak + Math.random() * 0.2
    }
    // 午餐低谷 - 动态低谷时间
    else if (hour >= 12 && hour <= 13.5) {
      const lunchDip = 1 - Math.exp(-((hour - lunchDipTime) ** 2) / 0.5)
      ratio = 0.05 + lunchDip * 0.15 + Math.random() * 0.1
    }
    // 下午工作时间 - 动态峰值时间和强度
    else if (hour > 13.5 && hour < 18) {
      const afternoonPeak = Math.exp(-((hour - afternoonPeakTime) ** 2) / 1.5) * afternoonPeakIntensity
      ratio = 0.3 + afternoonPeak + Math.random() * 0.15
    }
    // 晚餐低谷 - 动态低谷时间
    else if (hour >= 18 && hour <= 19.5) {
      const dinnerDip = Math.exp(-((hour - dinnerDipTime) ** 2) / 0.3)
      ratio = 0.08 + dinnerDip * 0.12 + Math.random() * 0.15
    }
    // 晚上平台期 - 动态水平
    else if (hour > 19.5 && hour < Math.min(sleepTime - 1, 23)) {
      ratio = eveningLevel + Math.random() * 0.2
    }
    // 睡前渐变
    else if (hour >= Math.min(sleepTime - 1, 23) && hour <= sleepTime) {
      const progress = 1 - (hour - Math.min(sleepTime - 1, 23)) / (sleepTime - Math.min(sleepTime - 1, 23))
      ratio = 0.1 + progress * 0.25 + Math.random() * 0.1
    }
    // 深夜时间 - 接近0的固定值
    else if (hour > sleepTime || hour < 1) {
      ratio = 0.02 + Math.random() * 0.03
    }
    // 其他工作时间
    else {
      ratio = 0.2 + Math.random() * 0.2
    }

    rawData.push({
      time: minute,
      ratio: Math.max(0, Math.min(1, ratio) * 0.8),
    })
  }

  // 确保首尾连接 - 调整深夜和凌晨的值使其接近
  const midnightValue = 0.025 + Math.random() * 0.02 // 固定的午夜基准值

  // 调整深夜和凌晨时段，使其围绕midnightValue波动
  for (const rawDatum of rawData) {
    if (rawDatum) {
      const hour = rawDatum!.time / 60
      if ((hour >= 23.5 && hour <= 24) || (hour >= 0 && hour < 1.5)) {
        // 深夜到凌晨时段，围绕midnightValue小幅波动
        rawDatum!.ratio = midnightValue + (Math.random() - 0.5) * 0.015
      }
    }
  }

  // 应用平滑滤波
  const smoothedData = []
  for (let i = 0; i < rawData.length; i++) {
    let sum = 0
    let count = 0
    const windowSize = 3 // 平滑窗口大小

    for (let j = Math.max(0, i - windowSize); j <= Math.min(rawData.length - 1, i + windowSize); j++) {
      const weight = 1 - Math.abs(i - j) / (windowSize + 1)
      sum += rawData[j]!.ratio * weight
      count += weight
    }

    smoothedData.push({
      time: rawData[i]!.time,
      ratio: sum / count,
    })
  }

  // 最终确保首尾值接近
  if (smoothedData.length > 0) {
    const firstValue = smoothedData[0]!.ratio
    const lastValue = smoothedData.at(-1)!.ratio
    const avgValue = (firstValue + lastValue) / 2

    smoothedData[0]!.ratio = avgValue + (Math.random() - 0.5) * 0.005
    smoothedData.at(-1)!.ratio = avgValue + (Math.random() - 0.5) * 0.005
  }

  return smoothedData
}

const summaryData = generateMockData(0)

const segmentedData = [
  {
    period: 'Period 1',
    data: generateMockData(0),
    opacity: 1,
  },
  {
    period: 'Period 2',
    data: generateMockData(1),
    opacity: 0.8,
  },
  {
    period: 'Period 3',
    data: generateMockData(2),
    opacity: 0.6,
  },
  {
    period: 'Period 4',
    data: generateMockData(3),
    opacity: 0.4,
  },
]
</script>

<template>
  <PanelSection
    num="04"
    title="Daily Coding Distribution"
    flush
  >
    <template #icon>
      <i class="i-tabler-clock-hour-4 text-[15px] text-ct-fg-muted" />
    </template>
    <div class="dist-pad">
      <PoltDailyDistributionTemplate
        :segmented-data="segmentedData"
        :summary-data="summaryData"
        :fallback-data="[]"
        :interval="10"
        :loading="false"
      />
    </div>
  </PanelSection>
</template>

<style scoped>
.dist-pad { padding: 12px 18px 18px; }
</style>
