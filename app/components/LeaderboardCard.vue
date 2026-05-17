<script setup lang="ts">
import * as d3 from 'd3'
import { getV3PublicLeaderboard } from '~/api/v3'

const props = defineProps<{
  days: number
  num?: string
}>()
const days = computed(() => props.days)
const t = useI18N()

const resp = useAsyncData(`leaderboard-${days.value}`, async () => {
  const result = await getV3PublicLeaderboard({
    query: {
      days: days.value,
    },
  })
  return result.data?.entries?.map(entry => ({
    id: entry.user.id,
    username: entry.user.username,
    avatar: entry.user.avatar,
    minutes: entry.totalMinutes,
  })) ?? []
}, {
  server: false,
  watch: [days],
})

const fromDate = computed(() => d3.utcDay.offset(new Date(), -days.value))

const dateRange = computed(() => {
  const from = fromDate.value.toISOString().slice(0, 10)
  const to = new Date().toISOString().slice(0, 10)
  return `${from} → ${to}`
})

const locale = useLocale()

function navigateToUser(userId: number) {
  navigateTo(`/${locale.value}/user/${userId}`)
}

function pct(minutes: number) {
  return ((minutes * 60 * 1000) / (days.value * 60 * 24 * 60 * 1000) * 100)
}
</script>

<template>
  <PanelSection
    :num="num ?? '00'"
    :title="t.dashboard.leaderboard.title(days)"
    flush
  >
    <template #icon>
      <i class="i-tabler-trophy text-[15px] text-ct-fg-muted" />
    </template>

    <div class="lb-daterange">
      {{ dateRange }}
    </div>

    <LeaderboardUserPosition :days="days" />

    <div class="lb-list">
      <template v-if="resp.status.value === 'pending'">
        <div
          v-for="i in 12"
          :key="i"
          class="lb-row lb-row-skel"
          :style="{ opacity: 1 - (i - 1) * 0.06 }"
        >
          <div class="lb-rank">
            <div class="lb-skel lb-skel-rank" />
          </div>
          <div class="lb-skel lb-skel-avatar" />
          <div class="flex-1 space-y-1">
            <div class="lb-skel lb-skel-name" />
            <div class="lb-skel lb-skel-meta" />
          </div>
          <div class="lb-skel lb-skel-pct" />
        </div>
      </template>

      <template v-else-if="resp.data.value?.length">
        <button
          v-for="(item, i) in resp.data.value"
          :key="item.username"
          type="button"
          class="lb-row group"
          :class="i < 3 ? 'lb-row-podium' : ''"
          @click="navigateToUser(item.id)"
        >
          <div class="lb-rank">
            <i v-if="i === 0" class="i-fluent-emoji-flat-1st-place-medal h-5 w-5" />
            <i v-else-if="i === 1" class="i-fluent-emoji-flat-2nd-place-medal h-5 w-5" />
            <i v-else-if="i === 2" class="i-fluent-emoji-flat-3rd-place-medal h-5 w-5" />
            <span v-else class="lb-rank-num">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>

          <img
            v-if="item.avatar"
            :src="item.avatar"
            :alt="item.username"
            class="lb-avatar"
          >
          <div v-else class="lb-avatar lb-avatar-fallback">
            {{ item.username.slice(0, 2) }}
          </div>

          <div class="lb-meta">
            <div class="lb-name">
              {{ item.username }}
            </div>
            <div class="lb-duration">
              {{ getDurationString(item.minutes * 60 * 1000) }}
            </div>
          </div>

          <div class="lb-pct" :class="i === 0 ? 'lb-pct-lead' : ''">
            {{ pct(item.minutes).toFixed(2) }}<span class="lb-pct-unit">%</span>
          </div>
        </button>
      </template>

      <div v-else class="lb-empty">
        <i class="i-tabler-trophy-off lb-empty-icon" />
        <p class="lb-empty-text">
          {{ t.dashboard.leaderboard.title(days) }}
        </p>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.lb-daterange {
  padding: 10px 16px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  border-bottom: 1px solid var(--ct-border-subtle);
  font-variant-numeric: tabular-nums;
}

.lb-list {
  display: flex;
  flex-direction: column;
}

.lb-row {
  display: grid;
  grid-template-columns: 2.25rem 1.85rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 60px;
  padding: 0.65rem 1rem;
  background: transparent;
  border: 0;
  border-top: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  text-align: left;
  transition: background-color 180ms ease;
}

.lb-row:first-child {
  border-top: 0;
}

.lb-row:hover {
  background-color: var(--ct-surface-1);
}

.lb-row-podium {
  background: var(--ct-surface-1);
}
.lb-row-podium:hover {
  background: var(--ct-surface-2);
}

.lb-row-skel {
  pointer-events: none;
}

.lb-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lb-rank-num {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  font-variant-numeric: tabular-nums;
}

.lb-avatar {
  width: 1.85rem;
  height: 1.85rem;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 9999px;
}

.lb-avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: var(--ct-weight-medium);
  text-transform: uppercase;
  color: var(--ct-fg-muted);
  background-color: var(--ct-surface-2);
}

.lb-meta {
  min-width: 0;
}

.lb-name {
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  color: var(--ct-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lb-row-podium .lb-name { font-weight: var(--ct-weight-semibold); }

.lb-duration {
  margin-top: 2px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}

.lb-pct {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  white-space: nowrap;
}

.lb-pct-lead {
  color: var(--color-primary-1);
}

.lb-pct-unit { font-size: 11px; margin-left: 2px; opacity: 0.6; }

.lb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 16px;
}
.lb-empty-icon { font-size: 28px; color: var(--ct-fg-subtle); }
.lb-empty-text { font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); }

.lb-skel { background: var(--ct-surface-2); animation: lb-pulse 1.4s ease-in-out infinite; }
.lb-skel-rank { width: 16px; height: 12px; }
.lb-skel-avatar { width: 28px; height: 28px; border-radius: 9999px; }
.lb-skel-name { width: 96px; height: 12px; }
.lb-skel-meta { width: 64px; height: 10px; }
.lb-skel-pct { width: 40px; height: 12px; }
@keyframes lb-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}
</style>
