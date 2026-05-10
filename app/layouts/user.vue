<script setup lang="ts">
const locale = useLocale()
const user = useUser()

const pending = autoResetRef(false, 1000)
pending.value = true

const route = useRoute()

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

const sectionLabel = computed(() => {
  if (route.path.includes('/user/')) {
    return 'PROFILE'
  }
  return 'USER'
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
            <span class="text-[14px] text-ct-fg tracking-[0.3em] font-mono font-semibold">CODE·TIME</span>
            <span class="text-[12px] text-ct-fg-subtle font-mono">/</span>
            <span class="text-[12px] text-primary tracking-[0.24em] font-mono uppercase">{{ sectionLabel }}</span>
          </NuxtLink>

          <div class="flex gap-3 items-center">
            <ClientOnly>
              <NuxtLink
                v-if="user"
                :to="`/${locale}/dashboard`"
                class="text-[13px] text-ct-fg-muted tracking-[0.08em] font-mono inline-flex gap-2 transition-colors items-center hover:text-primary"
              >
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  alt=""
                  class="border border-ct-border rounded-full h-5 w-5 object-cover"
                >
                <span class="hidden sm:inline">{{ user.username }}</span>
                <span
                  class="text-[11px] tracking-[0.14em] font-mono px-2 py-0.5 border rounded-full"
                  :class="String(user.plan).toLowerCase() === 'pro'
                    ? 'border-primary/30 text-primary bg-ct-primary-soft'
                    : 'border-ct-border text-ct-fg-muted'"
                >
                  {{ String(user.plan ?? 'free').toUpperCase() }}
                </span>
              </NuxtLink>
              <div v-else-if="pending" class="flex gap-2 items-center">
                <div class="bg-ct-surface-2 h-5 w-5 animate-pulse" />
                <div class="bg-ct-surface-2 h-3 w-14 hidden animate-pulse sm:block" />
              </div>
              <NuxtLink
                v-else
                :to="`/${locale}/login`"
                class="text-[13px] text-ct-fg-muted tracking-[0.08em] font-mono transition-colors hover:text-primary"
              >
                [ LOGIN ]
              </NuxtLink>
            </ClientOnly>
            <span class="text-ct-fg-subtle">·</span>
            <LanguageSelect />
          </div>
        </div>
      </header>

      <main class="layout-main relative">
        <slot />
      </main>

      <footer class="layout-foot relative">
        <div class="text-[12px] text-ct-fg-muted tracking-[0.12em] font-mono px-5.5 py-3.5 flex gap-3 uppercase items-center justify-center">
          <span>datreks · {{ new Date().getFullYear() }}</span>
          <span class="text-ct-fg-subtle">·</span>
          <NuxtLink
            to="https://github.com/Jannchie/codetime-web-v3"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-github text-sm" />
            <span class="hidden sm:inline">github</span>
          </NuxtLink>
          <span class="text-ct-fg-subtle">·</span>
          <NuxtLink
            to="https://discord.gg/WWEQrWCkkP"
            target="_blank"
            class="inline-flex gap-1 transition-colors items-center hover:text-primary"
          >
            <i class="i-tabler-brand-discord text-sm" />
            <span class="hidden sm:inline">discord</span>
          </NuxtLink>
          <span class="text-ct-fg-subtle">·</span>
          <span class="hidden sm:inline">vue · nuxt · plot</span>
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
  background: var(--r-surface-background-variant-1-color);
  background-color: var(--ct-surface-1);
}

[data-scheme="light"] .layout-foot {
  background: none;
  background-color: color-mix(in srgb, var(--ct-fg) 4%, transparent);
}
</style>
