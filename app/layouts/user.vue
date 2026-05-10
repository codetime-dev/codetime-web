<script setup lang="ts">
const locale = useLocale()

useHead({
  htmlAttrs: { lang: locale.value },
  link: [{ rel: 'icon', type: 'image/png', href: '/icon.png' }],
})
</script>

<template>
  <NuxtLayout name="default">
    <div class="layout-frame mx-auto max-w-7xl w-full">
      <DashboardTopbar />
      <main class="layout-main relative">
        <slot />
      </main>
      <DashboardFooter />
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
.layout-main { flex: 1 0 auto; }

.layout-frame::before,
.layout-frame::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ct-border-subtle);
  pointer-events: none;
  z-index: 2;
}
.layout-frame::before { left: 0; }
.layout-frame::after  { right: 0; }
</style>
