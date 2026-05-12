<script setup lang="ts">
definePageMeta({
  middleware: ['i18n'],
})

const route = useRoute()
const locale = useLocale()
const t = useI18N()
const uid = computed(() => Number(route.params.uid))

// Page-level fetch is split into a shared composable (handlers live at module
// scope) so the inner UserProfile.vue can register the same useAsyncData keys
// without Nuxt warning "different handler" on hydration.
const { data: userResult } = await useAsyncData(
  () => `up-user-${uid.value}`,
  () => fetchUserProfile(uid.value),
  { watch: [uid] },
)
const user = computed(() => userResult.value?.user || null)
const userHidden = computed(() => userResult.value?.isHidden || false)

const { data: overallRank } = await useAsyncData(
  () => `up-overall-rank-${uid.value}`,
  () => fetchUserOverallRank(uid.value),
  { watch: [uid] },
)

const { data: topLanguages } = await useAsyncData(
  () => `up-top-langs-${uid.value}`,
  () => fetchUserTopLanguages(uid.value),
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
  defineOgImage('UserProfile', {
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
