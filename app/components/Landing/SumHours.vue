<script setup lang="ts">
import { v3GetTotalMinutes } from '~/api/v3'
import { locales } from '~/i18n'

const locale = useLocale()
const { data, status } = await useAsyncData('landing-total-minutes', async () => {
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
      class="sum-number text-ct-fg leading-none font-mono font-semibold tabular-nums"
    >
      {{ fomater.format(minutes) }}
    </span>
    <div v-else class="sum-skel" />

    <div class="sum-caption">
      <span class="sum-rule" />
      <span>{{ t.landing.alreadyStatistical }}</span>
      <span class="sum-sep">·</span>
      <span class="sum-unit">{{ t.landing.minutes }}</span>
      <span class="sum-rule" />
    </div>

    <div
      v-if="status === 'success' && data?.last24HMinutes"
      class="sum-delta"
    >
      <span class="sum-delta-arrow">↑</span>
      <span class="sum-delta-num tabular-nums">{{ fomater.format(data.last24HMinutes) }}</span>
      <span class="sum-delta-label">last 24h</span>
    </div>
  </div>
</template>

<style scoped>
.sum-number {
  position: relative;
  font-size: clamp(3rem, 11vw, 6.5rem);
  letter-spacing: -0.025em;
  font-family: var(--ct-font-mono);
  color: var(--ct-fg);
  text-shadow: 0 0 60px color-mix(in srgb, var(--ct-primary) 25%, transparent);
}
.sum-skel {
  height: clamp(3rem, 9vw, 5rem);
  width: min(24rem, 80vw);
  background: var(--ct-surface-2);
  animation: sum-pulse 1.4s ease-in-out infinite;
}
@keyframes sum-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
.sum-caption {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
}
.sum-rule {
  width: 40px;
  height: 1px;
  display: inline-block;
  background: color-mix(in srgb, var(--ct-primary) 40%, transparent);
}
.sum-sep { color: var(--ct-fg-disabled); }
.sum-unit { color: var(--ct-primary); }

.sum-delta {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
  padding: 6px 14px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.04em;
  color: var(--ct-fg-muted);
  background: color-mix(in srgb, var(--ct-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--ct-primary) 25%, transparent);
}
.sum-delta-arrow {
  color: var(--ct-primary);
  font-weight: var(--ct-weight-semibold);
}
.sum-delta-num {
  color: var(--ct-fg);
  font-weight: var(--ct-weight-semibold);
}
.sum-delta-label {
  color: var(--ct-fg-subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
