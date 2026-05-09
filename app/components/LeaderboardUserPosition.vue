<script setup lang="ts">
import { v3GetSelfOverallRank, v3GetUserSelf } from '~/api/v3'

const props = defineProps<{
  days: number
}>()

const userRankData = useAsyncData(`user-rank-${props.days}`, async () => {
  try {
    const result = await v3GetSelfOverallRank({ query: { days: props.days } })
    return result.data
  }
  catch (error) {
    console.error('Failed to fetch user rank:', error)
    return null
  }
}, {
  server: false,
  watch: [() => props.days],
})

const userSelfData = useAsyncData('user-self', async () => {
  try {
    const result = await v3GetUserSelf()
    return result.data
  }
  catch (error) {
    console.error('Failed to fetch user self:', error)
    return null
  }
}, {
  server: false,
})

const userDisplayRank = computed(() => {
  if (!userRankData.data.value) {
    return null
  }
  const percentile = userRankData.data.value.percentile
  if (percentile > 0.9) {
    return { prefix: '', value: '>90%' }
  }
  const value = percentile <= 0.01
    ? `${(percentile * 100).toFixed(1)}%`
    : `${(percentile * 100).toFixed(0)}%`
  return { prefix: 'Top', value }
})

const formattedDuration = computed(() => {
  if (!userRankData.data.value) {
    return '--'
  }
  return getDurationString(userRankData.data.value.totalMinutes * 60 * 1000)
})

const userPercentage = computed(() => {
  if (!userRankData.data.value) {
    return '--'
  }
  const percentage = ((userRankData.data.value.totalMinutes * 60 * 1000) / (props.days * 24 * 60 * 60 * 1000) * 100)
  return `${percentage.toFixed(2)}%`
})

const locale = useLocale()

function navigateToUser() {
  if (userSelfData.data.value?.id) {
    navigateTo(`/${locale.value}/user/${userSelfData.data.value.id}`)
  }
}
</script>

<template>
  <div v-if="userRankData.status.value === 'pending'" class="up-self up-self-skel">
    <div class="up-self-rank">
      <div class="bg-surface-variant-1/55 h-3 w-12 animate-pulse" />
    </div>
    <div class="bg-surface-variant-1/55 h-7 w-7 animate-pulse" />
    <div class="up-self-meta">
      <div class="bg-surface-variant-1/55 h-3 w-20 animate-pulse" />
      <div class="bg-surface-variant-1/45 h-2 w-14 animate-pulse" />
    </div>
    <div class="bg-surface-variant-1/45 h-3 w-10 animate-pulse" />
  </div>

  <button
    v-else-if="userRankData.data.value"
    type="button"
    class="up-self"
    @click="navigateToUser"
  >
    <div class="up-self-rank">
      <span v-if="userDisplayRank?.prefix" class="up-self-rank-prefix">{{ userDisplayRank.prefix }}</span>
      <span class="up-self-rank-value">{{ userDisplayRank?.value }}</span>
    </div>

    <img
      v-if="userSelfData.data.value?.avatar"
      :src="userSelfData.data.value.avatar"
      :alt="userRankData.data.value.username"
      class="up-self-avatar"
    >
    <div v-else class="up-self-avatar up-self-avatar-fallback">
      {{ userRankData.data.value.username.slice(0, 2) }}
    </div>

    <div class="up-self-meta">
      <div class="up-self-name">
        {{ userRankData.data.value.username }}
      </div>
      <div class="up-self-duration">
        {{ formattedDuration }}
      </div>
    </div>

    <div class="up-self-pct">
      {{ userPercentage }}
    </div>
  </button>
</template>

<style scoped>
.up-self {
  height: 65px;
  display: grid;
  grid-template-columns: 2.25rem 1.85rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  background-color: color-mix(in srgb, var(--color-primary-1) 8%, transparent);
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary-1) 25%, transparent);
  cursor: pointer;
  text-align: left;
  transition: background-color 180ms ease;
}

.up-self:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 16%, transparent);
}

.up-self-skel {
  cursor: default;
  pointer-events: none;
}

.up-self-rank {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--color-primary-1);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.up-self-rank-prefix {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.75;
}

.up-self-rank-value {
  font-size: 12px;
  letter-spacing: 0.02em;
  font-weight: 500;
}

.up-self-avatar {
  width: 1.85rem;
  height: 1.85rem;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 9999px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-1) 40%, transparent);
}

.up-self-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 16%, transparent);
}

.up-self-meta {
  min-width: 0;
}

.up-self-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--r-surface-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.up-self-duration {
  margin-top: 0.15rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
}

.up-self-pct {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: var(--color-primary-1);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
