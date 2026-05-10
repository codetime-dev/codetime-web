<script setup lang="ts">
import * as Plot from '@observablehq/plot'
import { v3GetUserByUserId, v3GetYearlyReportData } from '~/api/v3'

const route = useRoute()
const uid = computed(() => Number(route.params.uid))
const t = useI18N()
const locale = useLocale()

const { data: user } = await v3GetUserByUserId({
  path: { user_id: uid.value },
})

if (!user) {
  throw createError({
    statusCode: 404,
    message: t.value.annualReport.userNotFound,
  })
}

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const reportTimezone = resolveTimezone(user.timezone ?? browserTimezone, browserTimezone)
const reportYear = computed(() => {
  return parseYearParam((route.query.year as string | undefined) ?? undefined) ?? getDefaultReportYear(reportTimezone)
})

watchEffect(() => {
  useSeoMeta({
    title: `${user?.username} - ${t.value.annualReport.annualCodeTimeReport(reportYear.value)}`,
    description: t.value.meta.description,
    ogTitle: t.value.meta.ogTitle,
    ogDescription: t.value.meta.ogDescription,
    twitterTitle: t.value.meta.twitterTitle,
    twitterDescription: t.value.meta.twitterDescription,
    ogUrl: 'https://codetime.dev',
    twitterCard: 'summary',
  })
})

const { share } = useShare()

const yearlyDataResp = await v3GetYearlyReportData({
  query: {
    user_id: uid.value,
    year: reportYear.value,
    timezone: reportTimezone,
  },
})
const yearlyData = computed(() => yearlyDataResp.data)

const yearCalendarData = computed(() => {
  if (!yearlyData.value) {
    return []
  }
  return yearlyData.value.dailyDistribution.map(d => ({
    date: new Date(d.field),
    duration: d.minutes,
  }))
})

const sumMinutes = computed(() => {
  return yearlyData.value?.dailyDistribution.reduce((acc, cur) => acc + cur.minutes, 0) ?? 0
})

const averageMinutes = computed(() => {
  if (!yearlyData.value || yearlyData.value.dailyDistribution.length === 0) {
    return 0
  }
  return sumMinutes.value / yearlyData.value.dailyDistribution.length
})

const mostProductiveHour = computed(() => {
  if (yearlyData.value && yearlyData.value.hourlyDistribution.length > 0) {
    let maxHour = yearlyData.value.hourlyDistribution[0]!
    for (const hourData of yearlyData.value.hourlyDistribution) {
      if (hourData.minutes > maxHour.minutes) {
        maxHour = hourData
      }
    }
    return maxHour
  }
  return { field: 0, minutes: 0 }
})

const hourlyDistribution = computed(() => {
  if (!yearlyData.value) {
    return []
  }
  return yearlyData.value.hourlyDistribution.map((d) => {
    const field = d.field.toString().padStart(2, '0')
    return { field, minutes: d.minutes }
  }).toSorted((a, b) => {
    if (a.field >= '06' && b.field < '06') {
      return -1
    }
    if (a.field <= '06' && b.field > '06') {
      return 1
    }
    return a.field.localeCompare(b.field)
  })
})

const dayPeriods = computed(() => {
  const result = { morning: 0, afternoon: 0, evening: 0, midnight: 0 }
  if (!yearlyData.value) {
    return result
  }
  for (const cur of yearlyData.value.hourlyDistribution) {
    const h = Number(cur.field)
    if (h >= 6 && h < 12) {
      result.morning += cur.minutes
    }
    else if (h >= 12 && h < 18) {
      result.afternoon += cur.minutes
    }
    else if (h >= 18 && h < 24) {
      result.evening += cur.minutes
    }
    else {
      result.midnight += cur.minutes
    }
  }
  return result
})

const periodPercents = computed(() => {
  const total = sumMinutes.value || 1
  return Object.entries(dayPeriods.value).map(([key, value]) => ({
    key,
    label: t.value.annualReport.priodOfDay[key as keyof typeof t.value.annualReport.priodOfDay],
    minutes: value,
    pct: (value / total) * 100,
  }))
})

const weekendMinutes = computed(() => {
  if (!yearlyData.value) {
    return 0
  }
  let sum = 0
  for (const cur of yearlyData.value.dailyDistribution) {
    const day = new Date(cur.field).getDay()
    if (day === 0 || day === 6) {
      sum += cur.minutes
    }
  }
  return sum
})
const weekendMinutesRatio = computed(() => {
  return sumMinutes.value > 0 ? weekendMinutes.value / sumMinutes.value : 0
})

const activeDays = computed(() => {
  return yearlyData.value?.dailyDistribution.filter(d => d.minutes > 0).length ?? 0
})
const totalDaysInYear = computed(() => getDaysInYear(reportYear.value))
const activeDaysRatio = computed(() => {
  return totalDaysInYear.value > 0 ? activeDays.value / totalDaysInYear.value : 0
})

const longestStreak = computed(() => {
  if (!yearlyData.value) {
    return 0
  }
  return getLongestStreak(yearlyData.value.dailyDistribution, reportYear.value)
})

const busiestDay = computed(() => {
  if (!yearlyData.value || yearlyData.value.dailyDistribution.length === 0) {
    return null
  }
  let max = yearlyData.value.dailyDistribution[0]!
  for (const cur of yearlyData.value.dailyDistribution) {
    if (cur.minutes > max.minutes) {
      max = cur
    }
  }
  return max
})

const monthlyMinutes = computed(() => {
  const resp: Record<string, number> = {}
  for (const data of yearlyData.value?.dailyDistribution ?? []) {
    const m = new Date(data.field).getMonth()
    resp[m] = (resp[m] ?? 0) + data.minutes
  }
  const yearValue = reportYear.value
  return Object.keys(resp).map((key) => {
    const monthStr = new Date(yearValue, Number(key), 1).toLocaleString(locale.value, { month: 'long' })
    return { month: Number(key), field: monthStr, minutes: resp[key] }
  }).toSorted((a, b) => a.month - b.month)
})
const allMonths = computed(() => {
  const yearValue = reportYear.value
  return Array.from({ length: 12 }, (_, i) => {
    return new Date(yearValue, i, 1).toLocaleString(locale.value, { month: 'long' })
  })
})
const averageMonthlyMinutes = computed(() => {
  return yearlyData.value ? sumMinutes.value / 12 : 0
})

const busiestMonth = computed(() => {
  if (monthlyMinutes.value.length === 0) {
    return null
  }
  return monthlyMinutes.value.reduce((max, cur) => ((cur.minutes ?? 0) > (max.minutes ?? 0) ? cur : max))
})

const topLanguages = computed(() => yearlyData.value?.topLanguages ?? [])
const topLanguage = computed(() => topLanguages.value[0] ?? null)
const languageEntries = computed(() => topLanguages.value.map(l => ({
  language: l.field ?? 'Unknown',
  totalMinutes: l.minutes,
})))

const kpis = computed(() => [
  {
    index: '01',
    label: 'TOTAL',
    value: getDurationString(sumMinutes.value * 60 * 1000, ['hours']),
    caption: t.value.annualReport.totalCodingTimeOfTheYear,
    accent: true,
    icon: 'i-tabler-clock-hour-4',
  },
  {
    index: '02',
    label: 'ACTIVE · DAYS',
    value: `${activeDays.value}/${totalDaysInYear.value}`,
    caption: `${(activeDaysRatio.value * 100).toFixed(0)}% · ${t.value.annualReport.activeDaysOfTheYear}`,
    icon: 'i-tabler-calendar-check',
  },
  {
    index: '03',
    label: 'LONGEST · STREAK',
    value: String(longestStreak.value),
    unit: 'd',
    caption: t.value.annualReport.longestStreakOfTheYear,
    icon: 'i-tabler-flame',
  },
  {
    index: '04',
    label: 'DAILY · AVG',
    value: getDurationString(averageMinutes.value * 60 * 1000, ['hours', 'minutes']),
    caption: t.value.annualReport.averageDailyCodingTime,
    icon: 'i-tabler-chart-bar',
  },
  {
    index: '05',
    label: 'WEEKEND · SHARE',
    value: `${(weekendMinutesRatio.value * 100).toFixed(0)}%`,
    caption: t.value.annualReport.weekendCodingTimeRatio,
    icon: 'i-tabler-coffee',
  },
  {
    index: '06',
    label: 'PEAK · DAY',
    value: busiestDay.value ? getDurationString(busiestDay.value.minutes * 60 * 1000, ['hours', 'minutes']) : '—',
    caption: busiestDay.value ? formatDateString(busiestDay.value.field, locale.value) : t.value.annualReport.busiestDayOfTheYear,
    accent: true,
    icon: 'i-tabler-trophy',
  },
  {
    index: '07',
    label: 'PEAK · MONTH',
    value: busiestMonth.value?.field ?? '—',
    caption: busiestMonth.value ? getDurationString((busiestMonth.value.minutes ?? 0) * 60 * 1000) : t.value.annualReport.busiestMonthOfTheYear,
    accent: true,
    icon: 'i-tabler-calendar-stats',
  },
  {
    index: '08',
    label: 'PEAK · HOUR',
    value: `${String(mostProductiveHour.value.field).padStart(2, '0')}:00`,
    caption: t.value.annualReport.theMostProductiveHourOfTheYear,
    icon: 'i-tabler-sun',
  },
])

function parseYearParam(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string') {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 2024) {
    return null
  }
  return parsed
}

function getDefaultReportYear(timezone: string): number {
  const dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric' })
  const parts = dateFormatter.formatToParts(new Date())
  const yearPart = parts.find(part => part.type === 'year')?.value
  const monthPart = parts.find(part => part.type === 'month')?.value
  const yearValue = yearPart ? Number.parseInt(yearPart, 10) : new Date().getFullYear()
  const monthValue = monthPart ? Number.parseInt(monthPart, 10) : new Date().getMonth() + 1
  return monthValue === 1 ? yearValue - 1 : yearValue
}

function getDaysInYear(year: number): number {
  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)
  return Math.round((end - start) / 86_400_000)
}

function getLongestStreak(days: { field: string, minutes: number }[], year: number): number {
  const activeDates = new Set<string>()
  for (const day of days) {
    if (day.minutes > 0) {
      activeDates.add(day.field)
    }
  }
  let longest = 0
  let current = 0
  const totalDays = getDaysInYear(year)
  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(Date.UTC(year, 0, 1 + i))
    const key = date.toISOString().slice(0, 10)
    if (activeDates.has(key)) {
      current += 1
      if (current > longest) {
        longest = current
      }
    }
    else {
      current = 0
    }
  }
  return longest
}

function formatDateString(value: string, localeValue: string): string {
  const parts = value.split('-')
  if (parts.length !== 3) {
    return value
  }
  const year = Number.parseInt(parts[0] ?? '', 10)
  const month = Number.parseInt(parts[1] ?? '', 10)
  const day = Number.parseInt(parts[2] ?? '', 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return value
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(localeValue, { timeZone: 'UTC', dateStyle: 'medium' }).format(date)
}

function resolveTimezone(value: string, fallback: string): string {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return value
  }
  catch {
    return fallback
  }
}

const hasData = computed(() => (yearlyData.value?.dailyDistribution.length ?? 0) > 0)
</script>

<template>
  <NuxtLayout name="user">
    <DashboardPageTitle
      :title="t.annualReport.annualCodeTimeReport(reportYear)"
      :description="`${user?.username ?? ''} · #${uid} · ${reportTimezone}`"
    />
    <DashboardPageContent>
      <!-- Empty state -->
      <div v-if="!hasData || !user" class="px-5.5 py-24">
        <div class="mx-auto text-center max-w-md">
          <i class="i-tabler-calendar-off text-5xl text-ct-fg-subtle mx-auto mb-4 block" />
          <h2 class="text-xl font-bold mb-2">
            {{ t.annualReport.noData }}
          </h2>
          <p class="text-ct-fg-muted">
            {{ t.annualReport.noDataAvailableFor(reportYear) }}
          </p>
        </div>
      </div>

      <template v-else>
        <!-- 01 · Activity calendar -->
        <UserProfileSection
          num="01"
          :title="t.annualReport.totalCodingTimeOfTheYear"
          :meta="`total · ${getDurationString(sumMinutes * 60 * 1000, ['hours'])}`"
        >
          <template #icon>
            <i class="i-tabler-activity text-[15px] text-ct-fg-muted" />
          </template>
          <div class="flex justify-center overflow-x-auto">
            <YearCalendarChart
              :data="yearCalendarData"
              :end-date="new Date(reportYear, 11, 31)"
            />
          </div>
        </UserProfileSection>

        <!-- 02 · KPI grid -->
        <UserProfileSection
          num="02"
          title="Key Indicators"
          meta="year · summary"
          flush
        >
          <template #icon>
            <i class="i-tabler-chart-dots text-[15px] text-ct-fg-muted" />
          </template>
          <UserProfileStats :kpis="kpis" />
        </UserProfileSection>

        <!-- 03 · Monthly trend -->
        <UserProfileSection
          num="03"
          :title="t.annualReport.busiestMonthOfTheYear"
          :meta="busiestMonth ? `${busiestMonth.field} · ${getDurationString((busiestMonth.minutes ?? 0) * 60 * 1000)}` : 'month · trend'"
          flush
        >
          <template #icon>
            <i class="i-tabler-calendar-stats text-[15px] text-ct-fg-muted" />
          </template>
          <div class="px-4 py-3">
            <div class="h-300px w-full">
              <PoltChart
                :options="{
                  marginLeft: 36,
                  marginRight: 12,
                  marginTop: 16,
                  marginBottom: 36,
                  x: { type: 'band', label: null, domain: allMonths },
                  y: { label: t.annualReport.minutes, grid: true },
                  marks: [
                    Plot.lineY(monthlyMinutes, { x: 'field', y: 'minutes', marker: true, stroke: 'var(--color-primary-1)', strokeWidth: 1.6, curve: 'monotone-x' }),
                    Plot.ruleY([0]),
                    Plot.ruleY([averageMonthlyMinutes], { stroke: 'var(--color-primary-1)', strokeOpacity: 0.45, strokeDasharray: '4 4' }),
                  ],
                }"
              />
            </div>
          </div>
        </UserProfileSection>

        <!-- 04 · Hourly distribution -->
        <UserProfileSection
          num="04"
          :title="t.annualReport.theMostProductiveHourOfTheYear"
          :meta="`${String(mostProductiveHour.field).padStart(2, '0')}:00 - ${String(mostProductiveHour.field).padStart(2, '0')}:59`"
          flush
        >
          <template #icon>
            <i class="i-tabler-clock-hour-4 text-[15px] text-ct-fg-muted" />
          </template>
          <div class="px-4 py-3">
            <div class="h-300px w-full">
              <PoltChart
                :options="{
                  marginLeft: 36,
                  marginRight: 12,
                  marginTop: 16,
                  marginBottom: 36,
                  x: {
                    type: 'band',
                    label: t.annualReport.hour,
                    domain: ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '00', '01', '02', '03', '04', '05'],
                  },
                  y: { label: t.annualReport.minutes, grid: true },
                  color: { scheme: 'blues' },
                  marks: [
                    Plot.barY(hourlyDistribution, { x: 'field', y: 'minutes', fill: 'minutes' }),
                    Plot.ruleY([0]),
                  ],
                }"
              />
            </div>
          </div>
        </UserProfileSection>

        <!-- 05 · Period of day -->
        <UserProfileSection
          num="05"
          title="Period of day"
          meta="morning · afternoon · evening · midnight"
          flush
        >
          <template #icon>
            <i class="i-tabler-sun-moon text-[15px] text-ct-fg-muted" />
          </template>
          <div class="period-grid">
            <div
              v-for="p in periodPercents"
              :key="p.key"
              class="period-cell"
            >
              <span class="text-[12px] text-ct-fg-muted tracking-[0.14em] font-mono uppercase">{{ p.label }}</span>
              <div class="flex gap-1.5 items-baseline">
                <span class="text-primary text-[20px] leading-none font-mono tabular-nums">{{ p.pct.toFixed(0) }}<span class="text-[12px] text-ct-fg-muted">%</span></span>
                <span class="text-[12px] text-ct-fg-muted font-mono">· {{ getDurationString(p.minutes * 60 * 1000, ['hours']) }}</span>
              </div>
            </div>
          </div>
        </UserProfileSection>

        <!-- 06 · Top languages -->
        <UserProfileSection
          v-if="topLanguage"
          num="06"
          :title="t.annualReport.theMostUsedLanguageOfTheYear"
          :meta="`${languageEntries.length} tracked`"
        >
          <template #icon>
            <i class="i-tabler-braces text-[15px] text-ct-fg-muted" />
          </template>
          <UserProfileLanguages :entries="languageEntries" />
        </UserProfileSection>

        <!-- 07 · Share -->
        <UserProfileSection
          num="07"
          title="Share"
          meta="export · link"
        >
          <template #icon>
            <i class="i-tabler-share text-[15px] text-ct-fg-muted" />
          </template>
          <div class="flex justify-center">
            <UButton
              variant="primary"
              size="lg"
              icon-left="i-tabler-share"
              @click="() => share({
                title: `${user?.username} - ${t.annualReport.annualCodeTimeReport(reportYear)}`,
                url: `https://codetime.dev/${locale}/user/${uid}/annual-report`,
              })"
            >
              {{ t.annualReport.shareMyReport }}
            </UButton>
          </div>
        </UserProfileSection>
      </template>
    </DashboardPageContent>
  </NuxtLayout>
</template>

<style scoped>
.period-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--ct-border);
}
.period-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px;
  border-right: 1px solid var(--ct-border);
}
.period-cell:last-child {
  border-right: none;
}
@media (max-width: 640px) {
  .period-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .period-cell:nth-child(2n) { border-right: none; }
  .period-cell:nth-child(-n+2) { border-bottom: 1px solid var(--ct-border); }
}
</style>
