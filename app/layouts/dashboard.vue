<script setup lang="ts">
import { Btn, Image, useContainerFilledCS, useCS } from '@roku-ui/vue'
import { v3ListSelfLatestLogs } from '~/api/v3'
import VSCodeIcon from '~/components/VSCodeIcon.vue'

const t = useI18N()
const headerTabs = computed(() => [
  { label: t.value.dashboard.pageHeader.title.overview, id: 'overview', path: `/dashboard` },
  { label: t.value.dashboard.pageHeader.title.badge, id: 'badges', path: `/dashboard/badges` },
  { label: t.value.dashboard.pageHeader.title.workspace, id: 'workspace', path: `/dashboard/workspace` },
  { label: t.value.dashboard.pageHeader.title.tags, id: 'tags', path: `/dashboard/tags` },
  { label: t.value.dashboard.pageHeader.title.leaderboard, id: 'leaderboard', path: `/dashboard/leaderboard` },
  { label: t.value.dashboard.pageHeader.title.settings, id: 'settings', path: `/dashboard/settings` },
])

const locale = useLocale()
const currentTab = useCurrentTab(headerTabs)
const user = useUser()

const pending = autoResetRef(false, 1000)
pending.value = true

useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/icon.png',
    },
  ],
})
const containerCS = useCS({
  type: 'bg',
  color: 'surface',
  index: { dark: 9, light: 1 },
})
const hoverCS = useCS({
  type: 'hover:bg',
  color: 'surface',
  index: { dark: 7, light: 3 },
})
const fillCS = useContainerFilledCS('primary')

const resp = useAsyncData('user-latest-logs', async () => {
  const resp = await v3ListSelfLatestLogs({
    query: {
      limit: 1,
    },
  })
  return resp.data?.[0]
}, {
  server: false,
})

// 如果日期是 12月 20日到 1月 15 日之间，则是年度报告展示周期
const showAnnualReport = computed(() => {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  return (month === 11 && day >= 20) || (month === 0 && day <= 15)
})
</script>

<template>
  <NuxtLayout name="default">
    <RHeader
      class="px-2 pt-2"
      v-bind="containerCS"
    >
      <div class="px-2 pt-2 flex flex-col gap-4 w-full">
        <div class="flex h-34px items-center justify-between">
          <ClientOnly>
            <div class="flex gap-2 items-center">
              <NuxtLink :to="`/${locale}`">
                <img
                  alt="Code Time"
                  src="/icon.svg"
                  width="26"
                  class="ml-2 mr-3"
                  loading="lazy"
                  decoding="async"
                >
              </NuxtLink>
              <NuxtLink
                v-if="user"
                class="text-sm flex gap-3 items-center"
                :to="`/${locale}/dashboard`"
              >
                <Image
                  v-if="user.avatar"
                  :src="user.avatar"
                  class="rounded-full h-7 w-7"
                  height="28px"
                  width="28px"
                />
                <div class="hidden sm:block">
                  {{ user.username }}
                </div>
                <PlanTag :plan="user.plan" />
              </NuxtLink>
              <div
                v-else-if="pending"
                class="text-sm flex gap-3 items-center"
              >
                <div class="rounded-full bg-op50 h-7 w-7 animate-pulse" />
                <div class="rounded bg-op50 h-1em w-16 animate-pulse" />
              </div>

              <NuxtLink
                v-if="user && showAnnualReport"
                :to="`/${locale}/user/${user.id}/annual-report`"
                target="_blank"
              >
                <Btn
                  variant="light"
                  size="sm"
                  color="primary"
                >
                  {{ t.annualReport.reviewAnnualReport }}
                </Btn>
              </NuxtLink>

              <div v-if="resp.status.value === 'pending'">
                <div class="rounded-full bg-white bg-op50 h-4 w-20 animate-pulse" />
              </div>
              <div
                v-else-if="resp.data.value"
                class="text-xs flex gap-2 items-center"
              >
                <div class="relative">
                  <div class="rounded-full bg-primary h-3 w-3 animate-ping" />
                  <div class="rounded-full bg-primary h-3 w-3 left-0 top-0 absolute" />
                </div>
                <VSCodeIcon
                  :language="resp.data.value.language"
                  class="h-4 w-4"
                />
                <span class="truncate">
                  {{ t.dashboard.pageHeader.userLatestEvent(resp.data.value.project) }}
                </span>
              </div>
            </div>
          </ClientOnly>

          <div class="gap-2 hidden items-center sm:flex">
            <i class="i-tabler-language-hiragana h-6 w-6" />
            <LanguageSelect />
          </div>
        </div>
        <div class="flex gap-2">
          <div
            v-for="tab in headerTabs"
            :key="tab.id"
          >
            <NuxtLink
              :to="`/${locale}${tab.path}`"
              v-bind="hoverCS"
              class="text-sm px-3 py-2 rounded"
            >
              {{ tab.label }}
            </NuxtLink>

            <div class="mt-2 min-h-0.5">
              <div v-if="tab === currentTab">
                <div
                  v-bind="fillCS"
                  class="h-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RHeader>
    <div v-if="pending">
      <!-- loading -->
      <div class="m-auto op75 h-full">
        <DashboardPageTitle loading />
        <div class="m-auto mt-8 w-6xl animate-pulse -px-6 md:max-w-6xl">
          <div class="mt-2 rounded-2xl bg-surface-variant-1 h-32 w-full" />
        </div>
      </div>
    </div>
    <div v-else>
      <slot v-if="user" />
      <div
        v-else
        class="py-16 op75 flex flex-col h-full items-center justify-center"
      >
        <div class="mb-8">
          <img
            alt="Code Time"
            src="/icon.svg"
            width="64"
            loading="lazy"
            decoding="async"
          >
        </div>
        <span class="text-sm pb-6 text-center max-w-2xl">
          {{ t.dashboard.loginRequired }}
        </span>
        <LoginButton />
      </div>
    </div>
    <CodetimeFooter />
  </NuxtLayout>
</template>

<style scoped>
.header-title {
  font-family: "Share Tech Mono", monospace;
  font-size: 1.2rem;
}
</style>
