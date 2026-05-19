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
        <div class="px-6 py-4 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between">
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
            <span class="lp-mark">Code Time</span>
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
        <nav class="lp-foot-nav" aria-label="Site">
          <NuxtLink :to="`/${locale}/dashboard`" class="lp-foot-link">
            Dashboard
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/demo`" class="lp-foot-link">
            Live demo
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/dashboard/widgets?tab=badge`" class="lp-foot-link">
            Badges
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/dashboard/widgets`" class="lp-foot-link">
            Widgets
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/dashboard/leaderboard`" class="lp-foot-link">
            Leaderboard
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/privacy`" class="lp-foot-link">
            Privacy
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink :to="`/${locale}/terms`" class="lp-foot-link">
            Terms
          </NuxtLink>
        </nav>
        <div class="lp-foot">
          <span>Code Time · {{ new Date().getFullYear() }}</span>
          <span class="lp-foot-sep">·</span>
          <NuxtLink
            to="https://github.com/codetime-dev/codetime-web"
            target="_blank"
            rel="noopener"
            class="lp-foot-link"
          >
            <i class="i-tabler-brand-github" />
            <span class="hidden sm:inline">GitHub</span>
          </NuxtLink>
          <span class="lp-foot-sep">·</span>
          <NuxtLink
            to="https://discord.gg/WWEQrWCkkP"
            target="_blank"
            rel="noopener"
            class="lp-foot-link"
          >
            <i class="i-tabler-brand-discord" />
            <span class="hidden sm:inline">Discord</span>
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
  background: var(--ct-border);
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
  background: var(--ct-border);
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
  background-color: var(--ct-surface-1);
}

.lp-mark {
  font-size: var(--ct-text-md);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
}

.lp-foot-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 18px 24px 6px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-muted);
}
.lp-foot {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 6px 24px 14px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.lp-foot-sep { color: var(--ct-fg-disabled); }
.lp-foot-link {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.lp-foot-link:hover { color: var(--ct-primary); }
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
