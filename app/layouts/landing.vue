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
    <div class="layout-frame mx-auto max-w-7xl w-full">
      <header class="layout-topbar relative">
        <div class="px-5.5 py-3.5 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
          <NuxtLink :to="`/${locale}`" class="flex gap-3 items-center">
            <img
              alt="Code Time"
              src="/icon.svg"
              width="20"
              height="20"
              class="block"
              loading="lazy"
              decoding="async"
            >
            <span class="text-[14px] text-surface tracking-[0.3em] font-mono font-semibold">CODE·TIME</span>
          </NuxtLink>
          <div class="flex gap-3 items-center">
            <LanguageSelect />
          </div>
        </div>
      </header>

      <main class="layout-main relative">
        <slot />
      </main>

      <footer class="layout-foot relative">
        <div class="text-surface-dimmed/55 text-[12px] tracking-[0.12em] font-mono px-5.5 py-3.5 flex gap-3 uppercase items-center justify-center">
          <span>datreks · {{ new Date().getFullYear() }}</span>
          <span class="text-surface-dimmed/25">·</span>
          <NuxtLink
            to="https://github.com/Jannchie/codetime-web-v3"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-github text-sm" />
            <span class="hidden sm:inline">github</span>
          </NuxtLink>
          <span class="text-surface-dimmed/25">·</span>
          <NuxtLink
            to="https://discord.gg/WWEQrWCkkP"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-discord text-sm" />
            <span class="hidden sm:inline">discord</span>
          </NuxtLink>
        </div>
      </footer>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.layout-frame {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main {
  flex: 1 0 auto;
}

.layout-foot {
  margin-top: auto;
}

.layout-frame::before,
.layout-frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.35;
  pointer-events: none;
}

.layout-frame::before {
  left: 0;
}

.layout-frame::after {
  right: 0;
}

.layout-topbar::after,
.layout-foot::before {
  content: "";
  position: absolute;
  left: 50%;
  width: 100vw;
  height: 1px;
  background: var(--r-surface-border-color);
  opacity: 0.4;
  transform: translateX(-50%);
  pointer-events: none;
}

.layout-topbar::after {
  bottom: 0;
}

.layout-foot::before {
  top: 0;
}

.layout-foot {
  background-color: rgb(var(--r-color-surface-7) / 0.18);
}

[data-scheme="light"] .layout-foot {
  background-color: color-mix(in srgb, var(--r-surface-text-color) 4%, transparent);
}
</style>

<style>
#__nuxt {
  min-height: 100vh;
}

html, body {
  max-width: 100%;
  overflow-x: clip;
}
</style>
