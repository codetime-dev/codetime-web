<script setup lang="ts">
import { v3GetTotalMinutes } from '~/api/v3'
import { locales } from '~/i18n'

const locale = useLocale()
const { data, status } = await useAsyncData(async () => {
  const { data } = await v3GetTotalMinutes()
  return data
}, { server: false })

// Simple seeded random number generator for consistent noise across windows
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10_000
  return x - Math.floor(x)
}

// Dynamic minutes calculation based on cache timestamp and current time
const currentTime = ref(Date.now())
const minutes = computed(() => {
  if (!data.value) {
    return 0
  }

  const { totalMinutes, last24HMinutes, cacheTimestamp } = data.value
  const cacheTime = new Date(cacheTimestamp).getTime()
  const elapsedMs = currentTime.value - cacheTime
  const elapsedMinutes = elapsedMs / (1000 * 60)

  // Calculate average coding rate from last 24 hours
  const averageRatePerMinute = last24HMinutes / (24 * 60)

  // Estimate additional minutes since cache time
  const estimatedAdditionalMinutes = Math.max(0, elapsedMinutes * averageRatePerMinute)

  // Add consistent noise that's the same across all windows and time
  // Use totalMinutes as seed for consistent noise based on data, not time
  const noise = seededRandom(totalMinutes) * 2 - 1 // Random between -1 and 1
  const noiseAmount = Math.abs(noise) * Math.min(5, totalMinutes * 0.001) // Scale noise based on total minutes

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

// Update current time every 0.2 seconds for smooth real-time growth
onMounted(() => {
  const interval = setInterval(() => {
    currentTime.value = Date.now()
  }, 200) // Update every 0.2 seconds

  onUnmounted(() => {
    clearInterval(interval)
  })
})

const t = useI18N()
</script>

<template>
  <div class="stats-card px-4 py-10 flex flex-col gap-4 shadow-sm items-center relative overflow-hidden backdrop-blur-sm sm:px-8 sm:py-12">
    <div class="opacity-20 inset-0 absolute">
      <div class="floating-circles">
        <div class="floating-circle" />
        <div class="floating-circle" />
        <div class="floating-circle" />
      </div>
    </div>

    <div class="flex flex-col gap-4 min-w-0 w-full items-center relative z-10">
      <span class="stats-subtitle text-xs tracking-wide font-medium px-2 text-center inline-block sm:text-sm">
        {{ t.landing.alreadyStatistical }} ({{ t.landing.minutes }})
      </span>

      <div
        v-if="status === 'success'"
        class="stats-number-wrap flex min-w-0 w-full items-end justify-center"
      >
        <span
          key="b"
          class="stats-number animate-pulse-glow leading-none font-bold font-mono max-w-full"
        >
          {{ fomater.format(minutes) }}
        </span>
      </div>

      <div v-else class="flex min-w-0 w-full items-end justify-center">
        <div
          key="a"
          class="shimmer font-bold font-mono rounded-lg h-12 w-[min(21rem,80vw)] animate-pulse sm:h-15"
        />
      </div>

      <div class="mt-2 max-w-xs w-full">
        <div class="progress-bg rounded-full h-1 overflow-hidden">
          <div class="progress-bar animate-progress rounded-full h-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Stats card with theme support */
.stats-card {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.6) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark mode styles */
[data-scheme="dark"] .stats-card {
  background: linear-gradient(135deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(20, 20, 20, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Text colors */
.stats-subtitle {
  color: rgba(100, 100, 100, 0.8);
}

[data-scheme="dark"] .stats-subtitle {
  color: rgba(200, 200, 200, 0.7);
}

.stats-number {
  display: block;
  font-size: clamp(2rem, 9vw, 3.75rem);
  line-height: 1;
  white-space: nowrap;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.stats-number-wrap {
  overflow: hidden;
}

[data-scheme="dark"] .stats-number {
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.stats-unit {
  color: rgba(100, 100, 100, 0.6);
}

[data-scheme="dark"] .stats-unit {
  color: rgba(200, 200, 200, 0.6);
}

/* Progress bar */
.progress-bg {
  background: rgba(200, 200, 200, 0.3);
}

[data-scheme="dark"] .progress-bg {
  background: rgba(100, 100, 100, 0.3);
}

.progress-bar {
  background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
}

[data-scheme="dark"] .progress-bar {
  background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%);
}

/* Floating circles background effect */
.floating-circles {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg,
    rgba(2, 132, 199, 0.1) 0%,
    rgba(2, 132, 199, 0.05) 100%
  );
  animation: float 8s ease-in-out infinite;
}

[data-scheme="dark"] .floating-circle {
  background: linear-gradient(135deg,
    rgba(56, 189, 248, 0.15) 0%,
    rgba(56, 189, 248, 0.08) 100%
  );
}

.floating-circle:nth-child(1) {
  width: 100px;
  height: 100px;
  left: 10%;
  top: 20%;
  animation-delay: 0s;
}

.floating-circle:nth-child(2) {
  width: 150px;
  height: 150px;
  right: 15%;
  top: 50%;
  animation-delay: 2s;
}

.floating-circle:nth-child(3) {
  width: 80px;
  height: 80px;
  left: 60%;
  bottom: 20%;
  animation-delay: 4s;
}

/* Pulse glow animation for the number */
.animate-pulse-glow {
  animation: pulseGlow 3s ease-in-out infinite;
}

/* Shimmer effect for loading state */
.shimmer {
  background: linear-gradient(
    90deg,
    rgba(200, 200, 200, 0.6) 0%,
    rgba(220, 220, 220, 0.8) 50%,
    rgba(200, 200, 200, 0.6) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

[data-scheme="dark"] .shimmer {
  background: linear-gradient(
    90deg,
    rgba(40, 40, 40, 0.6) 0%,
    rgba(60, 60, 60, 0.8) 50%,
    rgba(40, 40, 40, 0.6) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Progress bar animation */
.animate-progress {
  width: 0%;
  animation: progress 2s ease-in-out infinite;
}

/* Keyframes */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(2deg);
  }
  66% {
    transform: translateY(10px) rotate(-2deg);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(2, 132, 199, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(2, 132, 199, 0.5));
  }
}

[data-scheme="dark"] .animate-pulse-glow {
  animation: pulseGlowDark 3s ease-in-out infinite;
}

@keyframes pulseGlowDark {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.6));
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes progress {
  0% {
    width: 0%;
    opacity: 0.3;
  }
  50% {
    width: 70%;
    opacity: 1;
  }
  100% {
    width: 100%;
    opacity: 0.6;
  }
}
</style>
