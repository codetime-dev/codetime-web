<script setup lang="ts">
import { refreshNuxtData } from '#app'
import * as d3 from 'd3'
import { v3GetUserByUserId, v3GetUserTopLanguagesRank, v3UpdateBio } from '~/api/v3'

type UnifiedUserDashboardProps = {
  userId?: number
  showUserInfo?: boolean
  showControls?: boolean
  layout?: 'dashboard' | 'user'
}

const props = withDefaults(defineProps<UnifiedUserDashboardProps>(), {
  showUserInfo: false,
  showControls: true,
  layout: 'dashboard',
})

const route = useRoute()
const t = useI18N()

// 确定用户ID - 优先使用props，否则从路由获取，最后使用当前用户
const currentUser = useUser()
const targetUserId = computed(() => {
  if (props.userId) {
 return props.userId
}
  if (route.params.uid) {
 return Number(route.params.uid)
}
  return currentUser.value?.id
})

const isOwnProfile = computed(() => {
  return targetUserId.value === currentUser.value?.id
})

// 过滤器系统（仅在概览模式下使用）
const filters = reactive<FilterItem[]>([])
provide('filters', filters)

// 日期范围控制
const days = useLocalStorage('days', ref(currentUser.value?.plan === 'pro' ? 365 : 28))
const segments = ref(5)

const endTime = computed(() => new Date())
const startTime = computed(() => {
  const start = new Date()
  start.setDate(start.getDate() - days.value)
  return start
})

const BIO_MAX_LENGTH = 280

// 用户信息获取（仅在显示用户信息时）
const { data: userResult, error: userError, refresh: refreshUser } = await useAsyncData(`user-${targetUserId.value}`, async () => {
  if (!props.showUserInfo || !targetUserId.value) {
 return null
}

  try {
    const response = await v3GetUserByUserId({
      path: {
        user_id: targetUserId.value,
      },
    })
    return {
      user: response.data,
      isHidden: false,
      notFound: false,
    }
  }
  catch (error: any) {
    console.error('Error fetching user:', error)

    if (error?.status_code === 403 || error?.status === 403) {
      return {
        user: null,
        isHidden: true,
        notFound: false,
      }
    }

    return {
      user: null,
      isHidden: false,
      notFound: true,
    }
  }
})

const user = computed(() => {
  if (props.showUserInfo) {
    return userResult.value?.user || null
  }
  if (isOwnProfile.value) {
    return currentUser.value
  }
  return null
})
const userHiddenData = computed(() => {
  if (!props.showUserInfo) {
    return false
  }
  return userResult.value?.isHidden || false
})
const userNotFound = computed(() => {
  if (!props.showUserInfo) {
    return false
  }
  return userResult.value?.notFound || false
})
const planBadgeLabel = computed(() => {
  if (!user.value?.plan) {
    return 'FREE'
  }
  return String(user.value.plan).toUpperCase()
})

const canEditBio = computed(() => isOwnProfile.value && !userHiddenData.value)
const isEditingBio = ref(false)
const bioDraft = ref('')
const bioSaving = ref(false)
const bioStatus = ref<'success' | 'error' | null>(null)
const bioStatusMessage = ref('')
const bioRemaining = computed(() => BIO_MAX_LENGTH - bioDraft.value.length)

// 如果用户不存在，显示404错误
if (props.showUserInfo && userNotFound.value && userError.value && !userHiddenData.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'User not found',
  })
}

// Dashboard数据获取（仅在dashboard模式或查看自己的资料时）
const shouldFetchDashboardData = computed(() => {
  return props.layout === 'dashboard' || isOwnProfile.value
})

const allDataResp = shouldFetchDashboardData.value ? fetchStats(days, 'time', 'days') : { data: ref(null), status: ref('success') }
const allLanguageDataResp = shouldFetchDashboardData.value ? fetchStats(days, 'language', 'days') : { data: ref(null), status: ref('success') }
const allProjectDataResp = shouldFetchDashboardData.value ? fetchStats(days, 'workspace', 'days') : { data: ref(null), status: ref('success') }

const allLanguageData = computed(() => allLanguageDataResp.data.value?.data ?? [])
const allProjectData = computed(() => allProjectDataResp.data.value?.data ?? [])
const hasData = computed(() => {
  if (allDataResp.data.value === null) {
    return false
  }
  return (allDataResp.data.value?.data.length ?? 0) > 0
})

const allData = computed(() => {
  return allDataResp.data.value?.data ?? []
})

const pAllData = useProcessedData(allData)
const pAllLangData = useProcessedData(allLanguageData)
const pAllProjectData = useProcessedData(allProjectData)

const filtedData = computed(() => {
  const data = unref(pAllData)
  const res = data.filter((d) => {
    return d.date.getTime() >= d3.utcDay.offset(new Date(), -days.value).getTime()
  })
  return res
})

// 用户特定数据获取（语言排行和编程历史）
const { data: topLanguagesData, pending: languagesPending } = await useAsyncData(`topLanguages-${targetUserId.value}`, async () => {
  if (!targetUserId.value || (props.showUserInfo && userHiddenData.value)) {
    return null
  }

  try {
    const response = await v3GetUserTopLanguagesRank({
      path: {
        user_id: targetUserId.value,
      },
    })
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching top languages ranks:', error)
    return null
  }
})

const topLanguagesRanks = computed(() => {
  return topLanguagesData.value?.entries || []
})

const topLanguage = computed(() => {
  if (topLanguagesRanks.value.length > 0) {
    return topLanguagesRanks.value[0]?.language
  }
  return null
})

const topLanguageHighlights = computed(() => {
  return topLanguagesRanks.value.slice(0, 4)
})

type ProfileStat = {
  label: string
  value: string
  icon: string
}

function formatDate(value?: string | Date | null): string | null {
  if (!value) {
    return null
  }
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleDateString()
}

const profileStats = computed<ProfileStat[]>(() => {
  if (!user.value) {
    return []
  }

  const profileText = t.value.dashboard.profile

  const stats: ProfileStat[] = [
    {
      label: profileText.stats.plan,
      value: planBadgeLabel.value,
      icon: 'i-tabler-crown',
    },
    {
      label: profileText.stats.timezone,
      value: user.value.timezone ?? profileText.stats.timezoneUnset,
      icon: 'i-tabler-clock-hour-4',
    },
  ]

  const joined = formatDate(user.value.createdAt)
  if (joined) {
    stats.push({
      label: profileText.stats.joined,
      value: joined,
      icon: 'i-tabler-calendar-plus',
    })
  }

  const updated = formatDate(user.value.updatedAt)
  if (updated) {
    stats.push({
      label: profileText.stats.updated,
      value: updated,
      icon: 'i-tabler-refresh',
    })
  }

  return stats
})

watch(() => user.value?.bio, (bio) => {
  if (isEditingBio.value) {
    return
  }
  bioDraft.value = bio ?? ''
}, {
  immediate: true,
})

watch(() => targetUserId.value, () => {
  isEditingBio.value = false
  bioStatus.value = null
  bioStatusMessage.value = ''
})

watch(() => userHiddenData.value, (hidden) => {
  if (hidden) {
    isEditingBio.value = false
    bioDraft.value = ''
  }
})

function startBioEdit() {
  if (!canEditBio.value) {
    return
  }
  bioDraft.value = user.value?.bio ?? ''
  bioStatus.value = null
  bioStatusMessage.value = ''
  isEditingBio.value = true
}

function cancelBioEdit() {
  bioDraft.value = user.value?.bio ?? ''
  isEditingBio.value = false
  bioStatus.value = null
  bioStatusMessage.value = ''
}

function updateBioDraft(value: string) {
  bioDraft.value = value
}

async function saveBio() {
  if (!canEditBio.value || bioSaving.value) {
    return
  }

  bioSaving.value = true
  bioStatus.value = null
  bioStatusMessage.value = ''

  try {
    await v3UpdateBio({
      body: {
        bio: bioDraft.value.trim().length > 0 ? bioDraft.value.trim() : null,
      },
    })

    const refreshTasks: Promise<unknown>[] = []
    if (typeof refreshUser === 'function') {
      refreshTasks.push(refreshUser())
    }
    refreshTasks.push(refreshNuxtData('user-self'))
    await Promise.all(refreshTasks)

    isEditingBio.value = false
    bioStatus.value = 'success'
    bioStatusMessage.value = t.value.dashboard.profile.bio.saveSuccess
  }
  catch (error: any) {
    console.error('Failed to update bio', error)
    bioStatus.value = 'error'
    bioStatusMessage.value = typeof error?.message === 'string'
      ? error.message
      : t.value.dashboard.profile.bio.saveError
  }
  finally {
    bioSaving.value = false
  }
}

// SEO设置（仅在用户页面模式）
watchEffect(() => {
  if (props.showUserInfo && user.value && !userHiddenData.value) {
    useSeoMeta({
      title: `${user.value.username} - CodeTime Developer Profile`,
      description: user.value.bio || `View ${user.value.username}'s programming analytics, coding patterns, and development insights on CodeTime. See their most used programming languages and coding activity.`,
      keywords: `${user.value.username}, developer profile, programming analytics, coding statistics, ${topLanguage.value || 'programming'} developer`,
      ogTitle: `${user.value.username} - CodeTime Developer Profile`,
      ogDescription: user.value.bio || `View ${user.value.username}'s programming analytics and coding patterns`,
      ogType: 'profile',
      ogImage: user.value.avatar || '/icon.png',
      twitterTitle: `${user.value.username} - CodeTime Developer Profile`,
      twitterDescription: user.value.bio || `View ${user.value.username}'s programming analytics`,
      twitterCard: 'summary',
    })
  }
})
</script>

<template>
  <div class="mx-auto p-6 max-w-6xl space-y-8">
    <!-- User Header (仅在用户模式显示) -->
    <div v-if="showUserInfo" class="space-y-6">
      <!-- Hidden Data Warning -->
      <div v-if="userHiddenData" :key="`hidden-${targetUserId}`" class="p-6 border border-amber-500/20 rounded-lg bg-amber-500/10">
        <div class="flex gap-3 items-center">
          <i class="i-tabler-lock text-2xl text-amber-600" />
          <div>
            <h2 class="text-lg text-amber-800 font-semibold">
              此用户已隐藏了信息
            </h2>
            <p class="text-amber-700">
              该用户选择将编程数据设为私有。
            </p>
          </div>
        </div>
      </div>

      <!-- User Header -->
      <template v-else>
        <div class="gap-6 grid lg:grid-cols-[2fr,1fr]">
          <div class="border-surface-dimmed/60 p-6 border rounded-3xl bg-surface space-y-6 md:p-8">
            <div class="flex flex-col gap-6 md:flex-row md:items-center">
              <div class="flex justify-center md:block">
                <div v-if="user?.avatar" class="border-surface-dimmed/60 p-2 border-4 rounded-full">
                  <img
                    :src="user.avatar"
                    :alt="user.username"
                    class="rounded-full h-28 w-28 object-cover"
                  >
                </div>
                <div v-else class="border-surface-dimmed/60 bg-surface-dim text-surface-dimmed border-4 rounded-full flex h-28 w-28 items-center justify-center">
                  <i class="i-tabler-user text-4xl" />
                </div>
              </div>
              <div class="text-center flex-1 space-y-3 md:text-left">
                <div class="flex flex-wrap gap-3 items-center justify-center md:justify-between">
                  <h1 class="text-3xl tracking-tight font-bold">
                    {{ user?.username || `User ${targetUserId}` }}
                  </h1>
                  <span class="border-primary/30 bg-primary/10 text-xs text-primary tracking-[0.2em] font-semibold px-4 py-1 border rounded-full uppercase">
                    {{ planBadgeLabel }}
                  </span>
                </div>
                <div v-if="user?.email" class="text-sm text-surface-dimmed">
                  {{ user.email }}
                </div>
                <div class="text-sm text-surface-dimmed flex flex-wrap gap-4 items-center justify-center md:justify-start">
                  <div class="flex gap-1 items-center">
                    <i class="i-tabler-hash" />
                    <span>#{{ user?.id || targetUserId }}</span>
                  </div>
                  <div class="flex gap-1 items-center">
                    <i class="i-tabler-clock-hour-4" />
                    <span>{{ user?.timezone ?? t.dashboard.profile.stats.timezoneUnset }}</span>
                  </div>
                  <div v-if="formatDate(user?.createdAt)" class="flex gap-1 items-center">
                    <i class="i-tabler-calendar-event" />
                    <span>{{ t.dashboard.profile.stats.joined }} {{ formatDate(user?.createdAt) }}</span>
                  </div>
                </div>
                <div v-if="formatDate(user?.updatedAt)" class="text-sm text-surface-dimmed flex gap-2 items-center justify-center md:justify-start">
                  <i class="i-tabler-refresh" />
                  <span>{{ t.dashboard.profile.stats.updated }} {{ formatDate(user?.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-if="topLanguageHighlights.length > 0" class="border-surface-dimmed/60 bg-surface-variant-1/40 p-4 border rounded-2xl">
              <div class="text-xs text-surface-dimmed tracking-[0.3em] mb-3 uppercase">
                {{ t.dashboard.profile.languages.title }}
              </div>
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="rank in topLanguageHighlights"
                  :key="rank.language"
                  class="border-primary/30 bg-primary/5 text-sm px-4 py-2 border rounded-full flex flex-wrap gap-2 items-center"
                >
                  <span class="font-semibold">
                    {{ getLanguageName(rank.language || 'Unknown') }}
                  </span>
                  <span class="text-xs text-surface-dimmed">
                    {{ getDurationString(rank.totalMinutes * 60 * 1000, ['hours', 'minutes']) }}
                  </span>
                  <span class="text-xs text-surface-dimmed">
                    {{ t.dashboard.profile.languages.topPercent(Math.max(1, Math.round(rank.percentile * 100))) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="profileStats.length > 0" class="border-surface-dimmed/60 p-6 border rounded-3xl bg-surface md:p-8">
            <div class="text-xs text-surface-dimmed tracking-[0.3em] uppercase">
              {{ t.dashboard.profile.stats.title }}
            </div>
            <div class="mt-4 gap-4 grid">
              <div
                v-for="stat in profileStats"
                :key="stat.label"
                class="flex gap-3 items-center justify-between"
              >
                <div class="text-sm text-surface-dimmed flex gap-2 items-center">
                  <i class="text-lg text-primary" :class="[stat.icon]" />
                  <span>{{ stat.label }}</span>
                </div>
                <span class="text-sm text-surface font-medium text-right">
                  {{ stat.value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <UserBioCard
          class="border-surface-dimmed/60 p-6 border rounded-3xl bg-surface md:p-8"
          :bio="user?.bio ?? null"
          :can-edit="canEditBio"
          :is-editing="isEditingBio"
          :bio-draft="bioDraft"
          :bio-remaining="bioRemaining"
          :bio-saving="bioSaving"
          :bio-status="bioStatus"
          :bio-status-message="bioStatusMessage"
          :max-length="BIO_MAX_LENGTH"
          @start-edit="startBioEdit"
          @cancel-edit="cancelBioEdit"
          @save="saveBio"
          @update:bio-draft="updateBioDraft"
        />
      </template>
    </div>

    <div v-if="!showUserInfo && canEditBio && !userHiddenData" class="space-y-4">
      <UserBioCard
        class="border-surface-dimmed/60 p-6 border rounded-3xl bg-surface md:p-8"
        :bio="user?.bio ?? null"
        :can-edit="canEditBio"
        :is-editing="isEditingBio"
        :bio-draft="bioDraft"
        :bio-remaining="bioRemaining"
        :bio-saving="bioSaving"
        :bio-status="bioStatus"
        :bio-status-message="bioStatusMessage"
        :max-length="BIO_MAX_LENGTH"
        @start-edit="startBioEdit"
        @cancel-edit="cancelBioEdit"
        @save="saveBio"
        @update:bio-draft="updateBioDraft"
      />
    </div>

    <!-- 控制面板 (仅在启用时显示) -->
    <div v-if="showControls && !userHiddenData" class="space-y-4">
      <DashboardDataRange v-model:days="days" />
    </div>

    <!-- 数据内容区域 -->
    <div v-if="!userHiddenData" class="space-y-8">
      <!-- Dashboard模式的内容 -->
      <template v-if="shouldFetchDashboardData">
        <!-- 插件指引 (当没有数据时，仅在 dashboard 模式下显示) -->
        <DashboardPluginGuide v-if="layout === 'dashboard' && allDataResp.status.value === 'success' && !hasData" />

        <!-- Dashboard内容 (当有数据时) -->
        <template v-else>
          <!-- 活动日历 -->
          <DashboardCalendarCard
            :loading="allDataResp.status.value !== 'success'"
            :data="allData"
          />

          <!-- 过滤器 (仅在概览模式) -->
          <DashboardFilterWrapper v-if="layout === 'dashboard'" />

          <!-- Top卡片区域 -->
          <div
            v-if="hasData"
            class="flex flex-basis-[100%] flex-col flex-wrap gap-2 sm:flex-row sm:children:flex-basis-[calc(100%/3-0.5rem*2/3)] sm:children:max-w-[calc(100%/3-0.5rem*2/3)]"
          >
            <DashboardTopCard
              icon="i-tabler-braces"
              type="language"
              :days="days"
              :filters="filters"
              :title="t.dashboard.overview.top.language"
            />
            <DashboardTopCard
              icon="i-tabler-app-window"
              type="workspace"
              :days="days"
              :filters="filters"
              :title="t.dashboard.overview.top.workspace"
            />
            <DashboardTopCard
              icon="i-tabler-terminal"
              type="platform"
              :days="days"
              :filters="filters"
              :title="t.dashboard.overview.top.platform"
            />
          </div>

          <!-- 累积线性图 -->
          <CumulativeLineChart
            v-if="allDataResp.status.value === 'success' && hasData"
            :loading="false"
            :data="filtedData"
          />
          <CardBase v-else-if="allDataResp.status.value === 'pending'">
            <div>
              <div class="text-lg mb-4 flex gap-2 items-center">
                <i class="i-tabler-calendar-event" />
                <div>
                  {{ t.dashboard.overview.codetimeTrendTitle }}
                </div>
              </div>
            </div>
            <div class="rounded-2xl bg-surface-variant-1 h-64 w-full animate-pulse" />
          </CardBase>

          <!-- 语言趋势图 -->
          <CardBase
            v-if="allLanguageDataResp.status.value === 'success' && pAllLangData.length > 0"
            :loading="false"
          >
            <div>
              <div class="text-lg flex gap-2 items-center">
                <i class="i-carbon-chart-line-data" />
                <div>
                  {{ t.dashboard.overview.codetimeLanguaeTrendTitle }}
                </div>
              </div>
            </div>
            <PoltYDot
              :data="pAllLangData"
              :y-label="t.plot.label.language"
            />
          </CardBase>
          <CardBase v-else-if="allLanguageDataResp.status.value === 'pending'" :loading="true">
            <div>
              <div class="text-lg mb-4 flex gap-2 items-center">
                <i class="i-carbon-chart-line-data" />
                <div>
                  {{ t.dashboard.overview.codetimeLanguaeTrendTitle }}
                </div>
              </div>
            </div>
            <div class="rounded-2xl bg-surface-variant-1 h-64 w-full animate-pulse" />
          </CardBase>

          <!-- 项目趋势图 -->
          <CardBase
            v-if="allProjectDataResp.status.value === 'success' && pAllProjectData.length > 0"
            :loading="false"
          >
            <div>
              <div class="text-lg flex gap-2 items-center">
                <i class="i-carbon-chart-line-data" />
                <div>
                  {{ t.dashboard.overview.codetimeProjectTrendTitle }}
                </div>
              </div>
            </div>
            <PoltYDot
              :data="pAllProjectData"
              :y-label="t.plot.label.project"
            />
          </CardBase>
          <CardBase v-else-if="allProjectDataResp.status.value === 'pending'" :loading="true">
            <div>
              <div class="text-lg mb-4 flex gap-2 items-center">
                <i class="i-carbon-chart-line-data" />
                <div>
                  {{ t.dashboard.overview.codetimeProjectTrendTitle }}
                </div>
              </div>
            </div>
            <div class="rounded-2xl bg-surface-variant-1 h-64 w-full animate-pulse" />
          </CardBase>

          <!-- 每日分布图 -->
          <PoltDailyDistribution
            v-if="hasData"
            :start-time="startTime"
            :end-time="endTime"
            :segments="segments"
          />
        </template>
      </template>
    </div>

    <!-- 扩展信息区域 (仅在用户模式显示) -->
    <div v-if="showUserInfo && !userHiddenData" class="space-y-8">
      <!-- Top Languages Ranking -->
      <div>
        <h2 class="text-2xl font-bold mb-4">
          {{ t.dashboard.overview.top.language }}
        </h2>

        <!-- Loading State -->
        <div v-if="languagesPending" class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="border-surface-dimmed p-4 border rounded-lg animate-pulse"
          >
            <div class="flex gap-3 items-center">
              <div class="bg-surface-dimmed rounded h-8 w-8" />
              <div class="bg-surface-dimmed rounded h-8 w-8" />
              <div class="flex-1 space-y-2">
                <div class="bg-surface-dimmed rounded h-4 w-24" />
                <div class="bg-surface-dimmed rounded h-3 w-16" />
              </div>
            </div>
          </div>
        </div>

        <!-- Data State -->
        <div v-else-if="topLanguagesRanks && topLanguagesRanks.length > 0" class="space-y-3">
          <div
            v-for="(rank, index) in topLanguagesRanks"
            :key="rank.language"
            class="border-surface-dimmed p-4 border rounded-lg flex items-center justify-between"
          >
            <div class="flex gap-3 items-center">
              <div class="text-2xl text-primary font-bold">
                #{{ index + 1 }}
              </div>
              <VSCodeIcon
                :language="rank.language || 'Unknown'"
                class="h-8 w-8"
              />
              <div>
                <div class="font-semibold">
                  {{ getLanguageName(rank.language || 'Unknown') }}
                </div>
                <div class="text-sm text-surface-dimmed">
                  {{ getDurationString(rank.totalMinutes * 60 * 1000) }}
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-surface-dimmed">
                {{ (rank.percentile * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="py-12 text-center">
          <i class="i-tabler-chart-bar text-6xl text-surface-dimmed mx-auto mb-4 block" />
          <h3 class="text-xl font-semibold mb-2">
            {{ t.dashboard.overview.noData.notice.title }}
          </h3>
          <p class="text-surface-dimmed">
            No programming language data available for this user yet.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
