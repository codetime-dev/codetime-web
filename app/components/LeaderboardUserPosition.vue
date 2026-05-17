<script setup lang="ts">
import { getV3UsersSelfOverallRank } from '~/api/v3'

const props = defineProps<{
  days: number
}>()

const userRankData = useAsyncData(`user-rank-${props.days}`, async () => {
  try {
    const result = await getV3UsersSelfOverallRank({ query: { days: props.days } })
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

const userSelfData = fetchUser()

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
      <div class="up-skel up-skel-rank" />
    </div>
    <div class="up-skel up-skel-avatar" />
    <div class="up-self-meta">
      <div class="up-skel up-skel-name" />
      <div class="up-skel up-skel-meta" />
    </div>
    <div class="up-skel up-skel-pct" />
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
  display: grid;
  grid-template-columns: 2.25rem 1.85rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 60px;
  padding: 0.65rem 1rem;
  background: var(--ct-surface-1);
  border: 0;
  border-bottom: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.up-self:hover { background: var(--ct-surface-2); }

.up-self-skel {
  cursor: default;
  pointer-events: none;
}

.up-self-rank {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-family: var(--ct-font-mono);
  color: var(--ct-fg-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.up-self-rank-prefix { font-size: 10px; opacity: 0.75; }
.up-self-rank-value { font-size: var(--ct-text-sm); font-weight: var(--ct-weight-semibold); }

.up-self-avatar {
  width: 1.85rem;
  height: 1.85rem;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 9999px;
}
.up-self-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg-muted);
  background: var(--ct-surface-2);
}

.up-self-meta { min-width: 0; }
.up-self-name {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.up-self-duration {
  margin-top: 2px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.up-self-pct {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  white-space: nowrap;
}

.up-skel { background: var(--ct-surface-2); animation: up-pulse 1.4s ease-in-out infinite; }
.up-skel-rank { width: 36px; height: 14px; }
.up-skel-avatar { width: 28px; height: 28px; border-radius: 9999px; }
.up-skel-name { width: 96px; height: 14px; }
.up-skel-meta { width: 56px; height: 12px; margin-top: 4px; }
.up-skel-pct { width: 40px; height: 14px; }
@keyframes up-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
</style>
