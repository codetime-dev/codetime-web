<script setup lang="ts">
import { Image } from '@roku-ui/vue'

const locale = useLocale()
// const currentTab = useCurrentTab(headerTabs)
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
</script>

<template>
  <NuxtLayout name="default">
    <RHeader class="bg-surface-low px-2 pt-2">
      <div class="px-2 pt-2 flex flex-col gap-2 w-full">
        <div
          class="flex h-34px items-center justify-between"
        >
          <div class="flex gap-2 items-center">
            <NuxtLink
              :to="`/${locale}`"
            >
              <img
                alt="Code Time"
                src="/icon.svg"
                width="26"
                class="ml-2 mr-3"
                loading="lazy"
                decoding="async"
              >
            </NuxtLink>
            <ClientOnly>
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
                <PlanTag
                  :plan="user.plan"
                />
              </NuxtLink>
              <div
                v-else-if="pending "
                class="text-sm flex gap-3 items-center"
              >
                <div
                  class="rounded-full bg-surface-variant-1 bg-op50 h-7 w-7 animate-pulse"
                />
                <div class="rounded bg-surface-variant-1 bg-op50 h-1em w-16 animate-pulse" />
              </div>
            </ClientOnly>
          </div>
          <div class="gap-2 hidden items-center sm:flex">
            <i class="i-tabler-language-hiragana h-6 w-6" />
            <LanguageSelect />
          </div>
        </div>
        <div class="mt-2 flex gap-2" />
      </div>
    </RHeader>
    <div>
      <slot />
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
