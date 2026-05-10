<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="layout-foot relative">
    <div class="dash-foot">
      <span>Datreks · {{ year }}</span>
      <span class="dash-foot-sep">·</span>
      <NuxtLink
        to="https://github.com/Jannchie/codetime-web-v3"
        target="_blank"
        class="dash-foot-link"
      >
        <i class="i-tabler-brand-github" />
        <span class="hidden sm:inline">GitHub</span>
      </NuxtLink>
      <span class="dash-foot-sep">·</span>
      <NuxtLink
        to="https://discord.gg/WWEQrWCkkP"
        target="_blank"
        class="dash-foot-link"
      >
        <i class="i-tabler-brand-discord" />
        <span class="hidden sm:inline">Discord</span>
      </NuxtLink>
    </div>
  </footer>
</template>

<style scoped>
.layout-foot {
  margin-top: auto;
  background: var(--ct-surface-1);
}
.layout-foot::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  width: 100vw;
  height: 1px;
  background: var(--ct-border-subtle);
  transform: translateX(-50%);
  pointer-events: none;
}

.dash-foot {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
}
.dash-foot-sep { color: var(--ct-fg-disabled); }
.dash-foot-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ct-fg-subtle);
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.dash-foot-link:hover { color: var(--ct-primary); }
</style>
