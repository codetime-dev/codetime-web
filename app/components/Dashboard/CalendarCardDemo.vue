<script setup lang="ts">
import seedrandom from 'seedrandom'

const rng = seedrandom('pancake')
/**
 * 近一年西方常用节假日判断（含固定日期与动态计算节日）
 * 节日包括但不限于：元旦(1/1)、圣诞节(12/25)、感恩节(11月第4个星期四)、
 * 复活节(动态计算)、万圣节(10/31)、独立日(7/4)、劳动节(9月第1个星期一)、情人节(2/14)等。
 * 浮动节日算法见 isWesternHoliday 函数。
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

  // 复活节（西方）：匿名公式（Meeus/Jones/Butcher算法）
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
    const month = Math.floor((h + l - 7 * m1 + 114) / 31) // 3=3月, 4=4月
    const day = ((h + l - 7 * m1 + 114) % 31) + 1
    if (m === month && d === day) {
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

const t = useI18N()
const data = Array.from({ length: 365 }, (_, i) => {
  // 以组件加载时的系统时间为基准，生成前365天的UTC零点
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - i)

  let duration = 0
  if (isWesternHoliday(date)) {
    duration = 0
  }
  else {
    const day = date.getUTCDay() // 0:周日, 1:周一, ..., 6:周六
    duration = (day === 0 || day === 6)
      ? Math.floor(rng() * (120 - 6 + 1)) // 6~120分钟
      : Math.floor(rng() * (600 - 240 + 1)) + 240 // 240~600分钟
  }

  if (rng() < 0.25) {
    duration /= 3
  }

  return {
    duration,
    time: date.toISOString(),
    by: '',
  }
})
</script>

<template>
  <PanelSection num="02" :title="t.dashboard.overview.activityTitle">
    <template #icon>
      <i class="i-tabler-activity text-[15px] text-ct-fg-muted" />
    </template>
    <DashboardCalendarCard :data="data" />
  </PanelSection>
</template>
