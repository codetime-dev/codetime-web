<template>
  <footer class="ct-footer">
    <div class="ct-footer-divider">
      <span />
      <span class="ct-footer-mark">Datreks @ {{ new Date().getFullYear() }}</span>
      <span />
    </div>
    <div class="ct-footer-links">
      <NuxtLink
        aria-label="github"
        class="ct-footer-link"
        to="https://github.com/Jannchie/codetime-web-v3"
        target="_blank"
      >
        <i class="i-tabler-brand-github" />
      </NuxtLink>
      <NuxtLink
        aria-label="twitter"
        class="ct-footer-link"
        to="https://twitter.com/__codetime"
        target="_blank"
      >
        <i class="i-tabler-brand-twitter" />
      </NuxtLink>
      <NuxtLink
        aria-label="email"
        class="ct-footer-link"
        to="mailto:admin@codetime.dev"
        target="_blank"
      >
        <i class="i-tabler-mail" />
      </NuxtLink>
      <NuxtLink
        aria-label="vscode"
        class="ct-footer-link"
        to="https://marketplace.visualstudio.com/items?itemName=jannchie.codetime"
        target="_blank"
      >
        <i class="i-tabler-brand-vscode" />
      </NuxtLink>
      <NuxtLink
        aria-label="jetbrains"
        class="ct-footer-link"
        target="_blank"
        to="https://plugins.jetbrains.com/plugin/25617-codetime"
      >
        <i class="i-devicon-plain-jetbrains" />
      </NuxtLink>
      <NuxtLink
        aria-label="discord"
        class="ct-footer-link"
        to="https://discord.gg/WWEQrWCkkP"
        target="_blank"
      >
        <i class="i-tabler-brand-discord" />
      </NuxtLink>
    </div>
  </footer>
</template>

<style scoped>
.ct-footer {
  margin-top: auto;
  padding: 96px 16px 48px;
  text-align: center;
}
.ct-footer-divider {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: center;
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-subtle);
}
.ct-footer-divider > span:first-child,
.ct-footer-divider > span:last-child {
  height: 1px;
  width: 64px;
  background: var(--ct-border);
}
.ct-footer-mark { white-space: nowrap; }
.ct-footer-links {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}
.ct-footer-link {
  color: var(--ct-fg-subtle);
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ct-radius-md);
  transition: color var(--ct-duration-fast) var(--ct-ease),
              background-color var(--ct-duration-fast) var(--ct-ease);
}
.ct-footer-link:hover {
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
}
</style>
