<script setup lang="ts">
const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
const t = useI18N()
</script>

<template>
  <div class="pg">
    <!-- Welcome -->
    <section class="pg-section">
      <h2 class="pg-title">
        {{ t.dashboard.pluginGuide.title }}
      </h2>
      <p class="pg-desc">
        {{ t.dashboard.pluginGuide.description }}
      </p>
    </section>

    <!-- Token -->
    <section class="pg-section">
      <h3 class="pg-h3">
        {{ t.dashboard.pluginGuide.token.title }}
      </h3>
      <p class="pg-muted">
        {{ t.dashboard.pluginGuide.token.description }}
      </p>
      <div class="pg-token-row">
        <UInput :model-value="token" readonly type="password" class="pg-token-field" />
        <UCopyBtn :value="token" />
      </div>
    </section>

    <!-- Plugin Downloads -->
    <section class="pg-section">
      <h3 class="pg-h3">
        {{ t.dashboard.pluginGuide.plugins.title }}
      </h3>
      <div class="pg-plugins">
        <a
          href="https://marketplace.visualstudio.com/items?itemName=jannchie.codetime"
          target="_blank"
          class="pg-plugin"
        >
          <i class="i-mdi-microsoft-visual-studio-code pg-plugin-icon" />
          <div>
            <div class="pg-plugin-title">
              {{ t.dashboard.pluginGuide.vscode.title }}
            </div>
            <div class="pg-plugin-desc">
              {{ t.dashboard.pluginGuide.vscode.description }}
            </div>
          </div>
        </a>
        <a
          href="https://plugins.jetbrains.com/plugin/15507-codetime"
          target="_blank"
          class="pg-plugin"
        >
          <i class="i-simple-icons-jetbrains pg-plugin-icon" />
          <div>
            <div class="pg-plugin-title">
              {{ t.dashboard.pluginGuide.jetbrains.title }}
            </div>
            <div class="pg-plugin-desc">
              {{ t.dashboard.pluginGuide.jetbrains.description }}
            </div>
          </div>
        </a>
      </div>
    </section>

    <!-- Setup Steps -->
    <section class="pg-section">
      <h3 class="pg-h3">
        <i class="i-tabler-info-circle" />
        {{ t.dashboard.pluginGuide.setup.title }}
      </h3>
      <ol class="pg-steps">
        <li v-for="i in 4" :key="i" class="pg-step">
          <span class="pg-step-num">{{ i }}</span>
          <span class="pg-step-text">{{ (t.dashboard.pluginGuide.setup as any)[`step${i}`] }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.pg { display: flex; flex-direction: column; gap: 32px; padding: 0 16px; width: 100%; }
@media (min-width: 768px) { .pg { padding: 0 24px; gap: 40px; } }

.pg-section { display: flex; flex-direction: column; gap: 12px; }
.pg-title {
  font-size: var(--ct-text-2xl);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
}
.pg-h3 {
  font-size: var(--ct-text-lg);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pg-desc { font-size: var(--ct-text-base); color: var(--ct-fg-muted); line-height: 1.6; }
.pg-muted { font-size: var(--ct-text-sm); color: var(--ct-fg-subtle); }

.pg-token-row {
  display: flex;
  gap: 8px;
  max-width: 28rem;
}
.pg-token-field { flex: 1; }
.pg-token-field :deep(input) { letter-spacing: 4px; font-family: var(--ct-font-mono); }

.pg-plugins {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .pg-plugins { grid-template-columns: 1fr 1fr; gap: 16px; }
}
.pg-plugin {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid var(--ct-border);
  background: var(--ct-surface);
  color: var(--ct-fg);
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease);
}
.pg-plugin:hover { background: var(--ct-surface-1); border-color: var(--ct-border-strong); }
.pg-plugin-icon { font-size: 32px; flex-shrink: 0; color: var(--ct-fg-muted); }
.pg-plugin-title {
  font-size: var(--ct-text-md);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}
.pg-plugin-desc { font-size: var(--ct-text-sm); color: var(--ct-fg-muted); margin-top: 2px; }

.pg-steps { display: flex; flex-direction: column; gap: 14px; padding: 0; margin: 0; list-style: none; }
.pg-step { display: flex; gap: 14px; align-items: flex-start; }
.pg-step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ct-primary);
  color: var(--ct-on-primary);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-semibold);
  border-radius: var(--ct-radius-full);
}
.pg-step-text { font-size: var(--ct-text-base); line-height: 1.55; color: var(--ct-fg); }
</style>
