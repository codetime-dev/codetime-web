<script setup lang="ts">
import { refreshNuxtData } from '#app'
import {
  v3GetUserByUserId,
  v3GetUserCodingHistory,
  v3GetUserOverallRank,
  v3GetUserTopLanguagesRank,
  v3UpdateBio,
} from '~/api/v3'
import Activity from './UserProfile/Activity.vue'
import Bio from './UserProfile/Bio.vue'
import Identity from './UserProfile/Identity.vue'
import Languages from './UserProfile/Languages.vue'
import Section from './UserProfile/Section.vue'
import Stats from './UserProfile/Stats.vue'

const props = defineProps<{
  userId: number
}>()

const t = useI18N()
const currentUser = useUser()

const isOwnProfile = computed(() => props.userId === currentUser.value?.id)

const BIO_MAX_LENGTH = 280
const HISTORY_DAYS = 90

const { data: userResult, error: userError, refresh: refreshUser } = await useAsyncData(
  `up-user-${props.userId}`,
  async () => {
    try {
      const response = await v3GetUserByUserId({ path: { user_id: props.userId } })
      return { user: response.data, isHidden: false, notFound: false }
    }
    catch (error: any) {
      if (error?.status_code === 403 || error?.status === 403) {
        return { user: null, isHidden: true, notFound: false }
      }
      return { user: null, isHidden: false, notFound: true }
    }
  },
)

const user = computed(() => userResult.value?.user || null)
const userHidden = computed(() => userResult.value?.isHidden || false)
const userNotFound = computed(() => userResult.value?.notFound || false)

if (userNotFound.value && userError.value && !userHidden.value) {
  throw createError({ statusCode: 404, statusMessage: 'User not found' })
}

const { data: topLanguagesData, pending: languagesPending } = await useAsyncData(
  `up-top-langs-${props.userId}`,
  async () => {
    if (userHidden.value) {
      return null
    }
    try {
      const response = await v3GetUserTopLanguagesRank({ path: { user_id: props.userId } })
      return response.data
    }
    catch {
      return null
    }
  },
)

const { data: overallRankData } = await useAsyncData(
  `up-overall-rank-${props.userId}`,
  async () => {
    if (userHidden.value) {
      return null
    }
    try {
      const response = await v3GetUserOverallRank({ path: { user_id: props.userId } })
      return response.data
    }
    catch {
      return null
    }
  },
)

const { data: codingHistoryData, pending: historyPending } = await useAsyncData(
  `up-coding-history-${props.userId}`,
  async () => {
    if (userHidden.value) {
      return null
    }
    try {
      const response = await v3GetUserCodingHistory({
        path: { user_id: props.userId },
        query: { days: HISTORY_DAYS },
      })
      return response.data
    }
    catch {
      return null
    }
  },
)

const topLanguages = computed(() => topLanguagesData.value?.entries || [])
const codingHistory = computed(() => codingHistoryData.value?.data || [])
const overallRank = computed(() => overallRankData.value)

const totalMinutes = computed(() => overallRank.value?.totalMinutes ?? 0)
const totalLanguages = computed(() => topLanguagesData.value?.entries.length ?? 0)

function compactNum(value: number): { value: string, unit?: string } {
  const abs = Math.abs(value)
  if (abs >= 1e6) {
    return { value: (value / 1e6).toFixed(1), unit: 'M' }
  }
  if (abs >= 1e4) {
    return { value: (value / 1e3).toFixed(1), unit: 'k' }
  }
  if (abs >= 1e3) {
    return { value: (value / 1e3).toFixed(2), unit: 'k' }
  }
  return { value: Math.round(value).toString() }
}

function fmtHoursDisplay(minutes: number): { value: string, unit: string } {
  if (minutes <= 0) {
    return { value: '0', unit: 'h' }
  }
  const hours = minutes / 60
  if (hours >= 1000) {
    return { value: compactNum(hours).value, unit: `${compactNum(hours).unit ?? ''}h` }
  }
  if (hours >= 100) {
    return { value: hours.toFixed(0), unit: 'h' }
  }
  if (hours >= 10) {
    return { value: hours.toFixed(1), unit: 'h' }
  }
  return { value: hours.toFixed(2), unit: 'h' }
}

const processedHistory = computed(() => codingHistory.value.map(d => ({
  date: new Date(d.time),
  duration: d.duration,
})))

const currentStreak = useCurrentStreak(processedHistory)
const maxStreak = useMaxStreak(processedHistory)

const last7DayMinutes = computed(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return processedHistory.value
    .filter(d => d.date.getTime() >= cutoff)
    .reduce((acc, d) => acc + d.duration, 0)
})

const activeDays = computed(() => processedHistory.value.filter(d => d.duration > 0).length)

const topLanguageEntry = computed(() => topLanguages.value[0] ?? null)

const kpis = computed(() => {
  const totalH = fmtHoursDisplay(totalMinutes.value)
  const recent7 = fmtHoursDisplay(last7DayMinutes.value)
  const percentile = overallRank.value
    ? Math.max(1, Math.round(overallRank.value.percentile * 100))
    : null
  const topLang = topLanguageEntry.value
  return [
    {
      index: '01',
      label: 'TOTAL',
      icon: 'i-tabler-clock-hour-4',
      value: totalH.value,
      unit: totalH.unit,
      caption: 'cumulative coding',
      accent: true,
    },
    {
      index: '02',
      label: 'LAST 7D',
      icon: 'i-tabler-history',
      value: recent7.value,
      unit: recent7.unit,
      caption: `${activeDays.value}/${HISTORY_DAYS}d active`,
    },
    {
      index: '03',
      label: 'PERCENTILE',
      icon: 'i-tabler-trending-up',
      value: percentile === null ? '—' : `${percentile}`,
      unit: percentile === null ? undefined : '%',
      caption: percentile === null ? 'no rank yet' : `top ${percentile}% of devs`,
      accent: true,
    },
    {
      index: '04',
      label: 'TOP·LANG',
      icon: 'i-tabler-code',
      value: topLang ? getLanguageName(topLang.language || 'Unknown') : '—',
      caption: topLang
        ? `${(topLang.totalMinutes / 60).toFixed(1)}h · top ${Math.max(1, Math.round(topLang.percentile * 100))}%`
        : '—',
    },
    {
      index: '05',
      label: 'STREAK·CUR',
      icon: 'i-tabler-flame',
      value: String(currentStreak.value),
      unit: 'd',
      caption: 'consecutive days',
    },
    {
      index: '06',
      label: 'STREAK·MAX',
      icon: 'i-tabler-mountain',
      value: String(maxStreak.value),
      unit: 'd',
      caption: 'longest streak',
    },
    {
      index: '07',
      label: 'LANGS',
      icon: 'i-tabler-braces',
      value: String(totalLanguages.value),
      caption: 'tracked languages',
    },
    {
      index: '08',
      label: 'WINDOW',
      icon: 'i-tabler-calendar',
      value: String(HISTORY_DAYS),
      unit: 'd',
      caption: 'history range',
    },
  ]
})

// Bio editing
const canEditBio = computed(() => isOwnProfile.value && !userHidden.value)
const isEditingBio = ref(false)
const bioDraft = ref('')
const bioSaving = ref(false)
const bioStatus = ref<'success' | 'error' | null>(null)
const bioStatusMessage = ref('')
const bioRemaining = computed(() => BIO_MAX_LENGTH - bioDraft.value.length)

watch(() => user.value?.bio, (bio) => {
  if (isEditingBio.value) {
    return
  }
  bioDraft.value = bio ?? ''
}, { immediate: true })

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
  const newBio = bioDraft.value.trim().length > 0 ? bioDraft.value.trim() : null

  try {
    const response = await v3UpdateBio({ body: { bio: newBio } })
    const updatedUser = (response as any)?.data as { bio?: string | null } | undefined
    if (updatedUser) {
      if (userResult.value?.user) {
        userResult.value = {
          ...userResult.value,
          user: { ...userResult.value.user, bio: updatedUser.bio ?? null },
        }
      }
      if (currentUser.value) {
        currentUser.value = { ...currentUser.value, bio: updatedUser.bio ?? null }
      }
    }
    Promise.all([
      typeof refreshUser === 'function' ? refreshUser() : Promise.resolve(),
      refreshNuxtData('user-self'),
    ]).catch(() => {})
    isEditingBio.value = false
    bioStatus.value = 'success'
    bioStatusMessage.value = t.value.dashboard.profile.bio.saveSuccess
  }
  catch (error: any) {
    bioStatus.value = 'error'
    const detail = (error as { detail?: string })?.detail
    const message = (error as { message?: string })?.message
    const fallback = typeof error === 'string' ? error : ''
    bioStatusMessage.value = detail || message || fallback || t.value.dashboard.profile.bio.saveError
  }
  finally {
    bioSaving.value = false
  }
}

// SEO
watchEffect(() => {
  if (user.value && !userHidden.value) {
    useSeoMeta({
      title: `${user.value.username} · CodeTime`,
      description: user.value.bio
        || `View ${user.value.username}'s programming analytics on CodeTime.`,
      ogTitle: `${user.value.username} · CodeTime`,
      ogDescription: user.value.bio || `${user.value.username}'s coding analytics`,
      ogType: 'profile',
      ogImage: user.value.avatar || '/icon.png',
      twitterCard: 'summary',
    })
  }
})

const lastUpdatedLabel = computed(() => {
  const updated = overallRank.value?.updatedAt
  if (!updated) {
    return ''
  }
  const date = new Date(updated)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 16).replace('T', ' ')
})
</script>

<template>
  <div class="user-profile-frame mx-auto max-w-7xl w-full">
    <!-- Hidden state -->
    <div v-if="userHidden" class="px-5.5 py-12 text-center space-y-3">
      <div class="text-[12px] text-amber-500 tracking-[0.2em] font-mono px-3 py-1.5 border border-amber-500/40 bg-amber-500/5 inline-flex gap-2 uppercase items-center justify-center">
        <i class="i-tabler-lock text-base" />
        <span>PROFILE · LOCKED</span>
      </div>
      <p class="text-[13px] text-ct-fg-muted font-mono">
        // 此用户已隐藏了信息
      </p>
      <p class="text-[12px] text-ct-fg-muted font-mono">
        // The user chose to keep their coding data private.
      </p>
    </div>

    <template v-else>
      <Section num="01" :title="t.dashboard.profile.identity.title" :meta="`user · #${userId}`">
        <template #icon>
          <i class="i-tabler-user-circle text-[15px] text-ct-fg-muted" />
        </template>
        <Identity
          :username="user?.username"
          :avatar="user?.avatar"
          :email="user?.email"
          :plan="user?.plan"
          :timezone="user?.timezone"
          :user-id="userId"
          :created-at="user?.createdAt"
          :updated-at="user?.updatedAt"
        />
      </Section>

      <Section
        num="02"
        :title="t.dashboard.profile.bio.title"
        :meta="canEditBio ? 'editable · owner' : 'read only'"
      >
        <template #icon>
          <i class="i-tabler-quote text-[15px] text-ct-fg-muted" />
        </template>
        <Bio
          :bio="user?.bio"
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
      </Section>

      <Section
        num="03"
        :title="t.dashboard.profile.stats.title"
        :meta="lastUpdatedLabel ? `updated ${lastUpdatedLabel}` : `${HISTORY_DAYS}d window`"
        :flush="true"
      >
        <template #icon>
          <i class="i-tabler-chart-bar text-[15px] text-ct-fg-muted" />
        </template>
        <Stats :kpis="kpis" />
      </Section>

      <Section
        num="04"
        :title="t.dashboard.profile.languages.title"
        :meta="`${topLanguages.length} tracked`"
      >
        <template #icon>
          <i class="i-tabler-braces text-[15px] text-ct-fg-muted" />
        </template>
        <Languages :entries="topLanguages" :pending="languagesPending" />
      </Section>

      <Section
        num="05"
        :title="t.dashboard.profile.activity.title"
        :meta="`${HISTORY_DAYS}d · ${activeDays} active`"
      >
        <template #icon>
          <i class="i-tabler-activity text-[15px] text-ct-fg-muted" />
        </template>
        <Activity :history="codingHistory" :pending="historyPending" />
      </Section>
    </template>
  </div>
</template>

<style scoped>
.user-profile-frame {
  position: relative;
  min-height: calc(100vh - 200px);
}
</style>
