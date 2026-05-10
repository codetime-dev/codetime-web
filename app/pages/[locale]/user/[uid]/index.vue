<script setup lang="ts">
import { v3GetUserByUserId, v3GetUserOverallRank, v3GetUserTopLanguagesRank } from '~/api/v3'

definePageMeta({
  middleware: ['i18n'],
})

const route = useRoute()
const locale = useLocale()
const t = useI18N()
const uid = computed(() => Number(route.params.uid))

// Fetched here at the page level so SEO/OG metadata is set before render.
// Inner UserProfile.vue uses the same useAsyncData keys and will hydrate from cache.
const { data: userResult } = await useAsyncData(
  () => `up-user-${uid.value}`,
  async () => {
    try {
      const response = await v3GetUserByUserId({ path: { user_id: uid.value } })
      return { user: response.data, isHidden: false, notFound: false }
    }
    catch (error: any) {
      if (error?.status_code === 403 || error?.status === 403) {
        return { user: null, isHidden: true, notFound: false }
      }
      return { user: null, isHidden: false, notFound: true }
    }
  },
  { watch: [uid] },
)
const user = computed(() => userResult.value?.user || null)
const userHidden = computed(() => userResult.value?.isHidden || false)

const { data: overallRank } = await useAsyncData(
  () => `up-overall-rank-${uid.value}`,
  async () => {
    if (userHidden.value || !user.value) {
      return null
    }
    try {
      const resp = await v3GetUserOverallRank({ path: { user_id: uid.value } })
      return resp.data
    }
    catch {
      return null
    }
  },
  { watch: [uid] },
)

const { data: topLanguages } = await useAsyncData(
  () => `up-top-langs-${uid.value}`,
  async () => {
    if (userHidden.value || !user.value) {
      return null
    }
    try {
      const resp = await v3GetUserTopLanguagesRank({ path: { user_id: uid.value } })
      return resp.data
    }
    catch {
      return null
    }
  },
  { watch: [uid] },
)

const totalHours = computed(() => Math.round((overallRank.value?.totalMinutes ?? 0) / 60))
const languagesCount = computed(() => topLanguages.value?.entries?.length ?? 0)

watchEffect(() => {
  if (!user.value || userHidden.value) {
    return
  }
  const u = user.value
  useSeoMeta({
    title: `${u.username} · CodeTime`,
    description: u.bio || `${u.username}'s coding analytics on CodeTime`,
    ogTitle: `${u.username} · CodeTime`,
    ogDescription: u.bio || `${u.username}'s coding analytics`,
    ogUrl: `https://codetime.dev/${locale.value}/user/${uid.value}`,
    twitterCard: 'summary_large_image',
  })
})

if (user.value && !userHidden.value) {
  defineOgImageComponent('UserProfile', {
    username: user.value.username,
    avatar: user.value.avatar ?? '',
    bio: (user.value.bio ?? '').slice(0, 140),
    totalHours: totalHours.value,
    languages: languagesCount.value,
    plan: String(user.value.plan ?? 'free'),
    locale: locale.value,
  }, {
    width: 1200,
    height: 630,
    fonts: getOgFonts(locale.value),
    cacheMaxAgeSeconds: 60 * 60 * 24,
  })
}

// Fallback metadata when the profile is hidden / missing — still set
// title so the social card has something readable.
watchEffect(() => {
  if (userHidden.value) {
    useSeoMeta({
      title: t.value.meta.title,
      description: t.value.meta.description,
    })
  }
})
</script>

<template>
  <NuxtLayout name="user">
    <UserProfile :user-id="uid" />
  </NuxtLayout>
</template>
