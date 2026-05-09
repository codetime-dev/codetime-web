<script setup lang="ts">
import { v3GetTotalMinutes } from '~/api/v3'
import { locales } from '~/i18n'

const locale = useLocale()
const { data, status } = await useAsyncData(async () => {
  const { data } = await v3GetTotalMinutes()
  return data
}, { server: false })

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10_000
  return x - Math.floor(x)
}

const currentTime = ref(Date.now())
const minutes = computed(() => {
  if (!data.value) {
    return 0
  }
  const { totalMinutes, last24HMinutes, cacheTimestamp } = data.value
  const cacheTime = new Date(cacheTimestamp).getTime()
  const elapsedMs = currentTime.value - cacheTime
  const elapsedMinutes = elapsedMs / (1000 * 60)
  const averageRatePerMinute = last24HMinutes / (24 * 60)
  const estimatedAdditionalMinutes = Math.max(0, elapsedMinutes * averageRatePerMinute)
  const noise = seededRandom(totalMinutes) * 2 - 1
  const noiseAmount = Math.abs(noise) * Math.min(5, totalMinutes * 0.001)
  const finalMinutes = totalMinutes + estimatedAdditionalMinutes + (noise > 0 ? noiseAmount : -noiseAmount)
  return Math.round(Math.max(0, finalMinutes))
})

const fomater = computed(() => {
  const finalLocale = locales.includes(locale.value) ? locale.value : 'en'
  return new Intl.NumberFormat(finalLocale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
})

onMounted(() => {
  const interval = setInterval(() => {
    currentTime.value = Date.now()
  }, 200)

  onUnmounted(() => {
    clearInterval(interval)
  })
})

const t = useI18N()
</script>

<template>
  <div class="flex flex-col gap-6 items-center">
    <span
      v-if="status === 'success'"
      class="sum-number text-surface leading-none font-mono font-semibold tabular-nums"
    >
      {{ fomater.format(minutes) }}
    </span>
    <div v-else class="bg-surface-variant-1/40 h-[clamp(3rem,9vw,5rem)] w-[min(24rem,80vw)] animate-pulse" />

    <div class="text-surface-dimmed/80 text-[11px] tracking-[0.32em] font-mono inline-flex gap-3 uppercase items-center">
      <span class="bg-primary/40 h-px w-10 inline-block" />
      <span>{{ t.landing.alreadyStatistical }}</span>
      <span class="text-surface-dimmed/40">·</span>
      <span class="text-primary/80">{{ t.landing.minutes }}</span>
      <span class="bg-primary/40 h-px w-10 inline-block" />
    </div>
  </div>
</template>

<style scoped>
.sum-number {
  position: relative;
  font-size: clamp(3rem, 11vw, 6.5rem);
  letter-spacing: -0.025em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: linear-gradient(180deg,
    var(--r-surface-text-color) 0%,
    var(--r-surface-text-color) 40%,
    color-mix(in srgb, var(--color-primary-1) 70%, transparent) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 60px color-mix(in srgb, var(--color-primary-1) 25%, transparent);
}
</style>
