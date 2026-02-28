<script setup lang="ts">
const locale = useLocale()
watchEffect(() => {
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
})
</script>

<template>
  <NuxtLayout name="default">
    <RHeader class="px-3 py-3 sm:px-4">
      <img
        alt="Code Time"
        src="/icon.svg"
        width="26"
        class="ml-1 mr-2 shrink-0 sm:ml-2 sm:mr-3"
      >
      <div class="flex gap-2 max-w-full min-w-0 items-center">
        <LanguageSelect />
      </div>
    </RHeader>
    <slot />
    <CodetimeFooter />
  </NuxtLayout>
</template>

<style>
#__nuxt {
  min-height: 100vh;
}

html, body {
  max-width: 100%;
  overflow-x: clip;
}
</style>
