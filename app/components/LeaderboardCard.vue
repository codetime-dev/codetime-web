<script setup lang="ts">
import * as d3 from 'd3'
import { v3GetLeaderboard } from '~/api/v3'

const props = defineProps<{
  days: number
  num?: string
}>()
const days = computed(() => props.days)
const t = useI18N()

const resp = useAsyncData(`leaderboard-${days.value}`, async () => {
  const result = await v3GetLeaderboard({
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
      <i class="i-tabler-trophy text-surface-dimmed/70 text-[15px]" />
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
            <div class="bg-surface-variant-1/55 h-3 w-4 animate-pulse" />
          </div>
          <div class="bg-surface-variant-1/55 h-7 w-7 animate-pulse" />
          <div class="flex-1 space-y-1">
            <div class="bg-surface-variant-1/55 h-3 w-24 animate-pulse" />
            <div class="bg-surface-variant-1/45 h-2 w-16 animate-pulse" />
          </div>
          <div class="bg-surface-variant-1/45 h-3 w-10 animate-pulse" />
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
        <i class="i-tabler-trophy-off text-surface-dimmed/50 text-2xl" />
        <p class="lb-empty-text">
          empty · leaderboard
        </p>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.lb-daterange {
  padding: 0.65rem 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--r-surface-border-color) 22%, transparent);
  font-variant-numeric: tabular-nums;
}

.lb-list {
  display: flex;
  flex-direction: column;
}

.lb-row {
  display: grid;
  grid-template-columns: 2.25rem 1.85rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 1rem;
  background: transparent;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 18%, transparent);
  cursor: pointer;
  text-align: left;
  transition: background-color 180ms ease;
}

.lb-row:first-child {
  border-top: 0;
}

.lb-row:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.18);
}

.lb-row-podium {
  background-color: color-mix(in srgb, var(--color-primary-1) 4%, transparent);
}

.lb-row-podium:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 10%, transparent);
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
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
  border-radius: 9999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.lb-meta {
  min-width: 0;
}

.lb-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: var(--r-surface-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lb-row-podium .lb-name {
  font-weight: 500;
}

.lb-duration {
  margin-top: 0.15rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}

.lb-pct {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--r-surface-text-color) 60%, transparent);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.lb-pct-lead {
  color: var(--color-primary-1);
}

.lb-pct-unit {
  font-size: 9.5px;
  margin-left: 0.1rem;
  opacity: 0.6;
}

.lb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 3rem 1rem;
}

.lb-empty-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 50%, transparent);
}
</style>
