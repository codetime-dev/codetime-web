<script setup lang="ts">
import { v3ListSelfLatestLogs } from '~/api/v3'
import VSCodeIcon from '~/components/VSCodeIcon.vue'

withDefaults(defineProps<{
  showLatest?: boolean
  showAnnualLink?: boolean
}>(), {
  showLatest: true,
  showAnnualLink: true,
})

const t = useI18N()
const locale = useLocale()
const user = useUser()

const pending = autoResetRef(false, 1000)
pending.value = true

const resp = useAsyncData('user-latest-logs', async () => {
  const r = await v3ListSelfLatestLogs({ query: { limit: 1 } })
  return r.data?.[0]
}, { server: false })

// 12-20 ~ 1-15 期间展示年度报告入口
const showAnnualReport = computed(() => {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  return (month === 11 && day >= 20) || (month === 0 && day <= 15)
})
</script>

<template>
  <header class="layout-topbar relative">
    <div class="px-6 py-4 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
      <ClientOnly>
        <div class="flex flex-wrap gap-4 items-center">
          <NuxtLink :to="`/${locale}`" class="flex gap-2.5 items-center">
            <img
              alt="Code Time"
              src="/icon.svg"
              width="22"
              height="22"
              class="block"
              loading="lazy"
              decoding="async"
            >
            <span class="text-[15px] tracking-tight font-semibold" style="color: var(--ct-fg)">Code Time</span>
          </NuxtLink>

          <NuxtLink
            v-if="user"
            class="dash-user-chip"
            :to="`/${locale}/dashboard`"
          >
            <img
              v-if="user.avatar"
              :src="user.avatar"
              alt=""
              class="rounded-full h-5 w-5 object-cover"
              style="border:1px solid var(--ct-border)"
            >
            <span class="text-[14px] hidden sm:inline">{{ user.username }}</span>
            <UTag
              :tone="String(user.plan).toLowerCase() === 'pro' ? 'primary' : 'neutral'"
              variant="soft"
              size="sm"
            >
              {{ String(user.plan ?? 'free').toUpperCase() }}
            </UTag>
          </NuxtLink>
          <div
            v-else-if="pending"
            class="flex gap-2 items-center"
          >
            <div class="rounded-full h-5 w-5 animate-pulse" style="background: var(--ct-surface-2)" />
            <div class="rounded h-3 w-16 hidden animate-pulse sm:block" style="background: var(--ct-surface-2)" />
          </div>
          <NuxtLink
            v-else
            :to="`/${locale}/login`"
            class="dash-user-chip"
          >
            <span class="text-[14px]">Log in</span>
          </NuxtLink>

          <NuxtLink
            v-if="user && showAnnualLink && showAnnualReport"
            :to="`/${locale}/user/${user.id}/annual-report`"
            target="_blank"
            class="dash-annual"
          >
            <i class="i-tabler-sparkles" />
            <span class="hidden sm:inline">{{ t.annualReport.reviewAnnualReport }}</span>
          </NuxtLink>

          <template v-if="showLatest">
            <div v-if="resp.status.value === 'pending'">
              <div class="rounded h-3 w-24 animate-pulse" style="background: var(--ct-surface-2)" />
            </div>
            <div
              v-else-if="resp.data.value"
              class="dash-latest"
            >
              <div class="shrink-0 relative">
                <div class="rounded-full h-2 w-2 animate-ping" style="background: var(--ct-primary)" />
                <div class="rounded-full h-2 w-2 left-0 top-0 absolute" style="background: var(--ct-primary)" />
              </div>
              <VSCodeIcon
                :language="resp.data.value.language"
                class="h-3.5 w-3.5"
              />
              <span class="max-w-40 truncate">
                {{ t.dashboard.pageHeader.userLatestEvent(resp.data.value.project) }}
              </span>
            </div>
          </template>
        </div>
      </ClientOnly>

      <div class="flex gap-3 items-center">
        <LanguageSelect />
      </div>
    </div>
    <slot name="nav" />
  </header>
</template>

<style scoped>
.layout-topbar::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 100vw;
  height: 1px;
  background: var(--ct-border-subtle);
  transform: translateX(-50%);
  pointer-events: none;
}

.dash-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  padding: 4px 10px 4px 4px;
  border-radius: var(--ct-radius-full);
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.dash-user-chip:hover { color: var(--ct-fg); background: var(--ct-surface-1); }

.dash-annual {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: var(--ct-text-xs);
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border-radius: var(--ct-radius-full);
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
}
.dash-annual:hover { background: color-mix(in srgb, var(--ct-primary) 22%, transparent); }

.dash-latest {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
</style>
