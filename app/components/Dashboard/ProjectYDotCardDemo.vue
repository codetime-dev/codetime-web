<script lang="ts" setup>
import seedrandom from 'seedrandom'

const rng = seedrandom('pancake')
const t = useI18N()
/**
 * 自动生成覆盖近 365 天的项目工时数据，节假日算法与 CalendarCardDemo.vue 保持一致
 */
function isWesternHoliday(date: Date): boolean {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1 // 1-12
  const d = date.getUTCDate()

  // 固定日期节日
  if (
    (m === 1 && d === 1) // 元旦
    || (m === 2 && d === 14) // 情人节
    || (m === 7 && d === 4) // 独立日
    || (m === 10 && d === 31) // 万圣节
    || (m === 12 && d === 25) // 圣诞节
  ) {
    return true
  }

  // 感恩节：11月第4个星期四
  if (m === 11) {
    const firstDay = new Date(Date.UTC(y, 10, 1)).getUTCDay()
    const offset = (11 - firstDay) % 7 // 第一个星期四的日期
    const thanksgiving = 1 + offset + 7 * 3 // 第4个星期四
    if (d === thanksgiving) {
      return true
    }
  }

  // 复活节（西方）：Meeus/Jones/Butcher算法
  {
    const a = y % 19
    const b = Math.floor(y / 100)
    const c = y % 100
    const d1 = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d1 - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m1 = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m1 + 114) / 31)
    const day = ((h + l - 7 * m1 + 114) % 31) + 1
    if ((m === month) && (d === day)) {
      return true
    }
  }

  // 劳动节：9月第1个星期一
  if (m === 9) {
    const firstDay = new Date(Date.UTC(y, 8, 1)).getUTCDay()
    const laborDay = 1 + ((8 - firstDay) % 7)
    if (d === laborDay) {
      return true
    }
  }

  return false
}

const projectNames = [
  'Manhattan Project',
  'Red Queen',
  'The Matrix',
  'PASIV',
  'HAL 9000',
  'J.A.R.V.I.S.',
  'MOSS',
]

// 生成过去 365 天，每个项目名每天一条数据，共 365×7 条
const data = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - i)
  return projectNames.map((by) => {
    let duration = 0
    if (isWesternHoliday(date)) {
      duration = 0
    }
    else {
      const day = date.getUTCDay()
      duration = (day === 0 || day === 6)
        ? Math.floor(rng() * (120 - 6 + 1)) + 6 // 6~120
        : Math.floor(rng() * (600 - 0 + 1)) + 0 // 240~600
    }
    if (projectNames.indexOf(by) === 0) {
      duration = Math.floor(rng() * (200 - 0 + 1)) + 0 // 0~200
    }
    if (projectNames.indexOf(by) === 1) {
      duration = Math.floor(rng() * (300 - 0 + 1)) + 0 // 0~200
      if (i < 20) {
        duration = 0
      }
    }

    if (projectNames.indexOf(by) === 5 && i > 20) {
      duration = 0
    }

    if (projectNames.indexOf(by) === 4 && i < 5) {
      duration = 0
    }

    if (rng() < 0.25) {
      duration /= 3
    }
    if (rng() < 0.5) {
      duration /= 3
    }
    if (rng() < 0.25) {
      duration = 0
    }
    return { date: new Date(date), duration, by }
  })
}).flat()
</script>

<template>
  <div>
    <div class="text-lg mb-2 flex gap-2 items-center">
      <i class="i-carbon-chart-line-data" />
      <div>
        {{ t.dashboard.overview.codetimeProjectTrendTitle }}
      </div>
    </div>
    <PoltYDot
      :data="data"
      :y-label="t.plot.label.project"
    />
  </div>
</template>
