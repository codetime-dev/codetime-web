<script setup lang="ts">
const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
const t = useI18N()
</script>

<template>
  <div class="onb">
    <!-- Lead -->
    <div class="onb-lead">
      <span class="onb-lead-stripe" aria-hidden="true" />
      <div class="onb-lead-body">
        <span class="onb-lead-eyebrow tabular-nums">
          <i class="i-tabler-rocket" />
          onboarding · plugin
        </span>
        <h2 class="onb-lead-title">
          {{ t.dashboard.pluginGuide.title }}
        </h2>
        <p class="onb-lead-desc">
          {{ t.dashboard.pluginGuide.description }}
        </p>
      </div>
    </div>

    <!-- Token -->
    <PanelSection
      num="01"
      :title="t.dashboard.pluginGuide.token.title"
      meta="credentials · plugin auth"
    >
      <template #icon>
        <i class="i-tabler-key text-[15px] text-ct-fg-muted" />
      </template>
      <p class="onb-help">
        {{ t.dashboard.pluginGuide.token.description }}
      </p>
      <div class="onb-token">
        <UInput
          :model-value="token"
          readonly
          type="password"
          class="onb-token-field"
        />
        <UCopyBtn :value="token" />
      </div>
    </PanelSection>

    <!-- Plugins -->
    <PanelSection
      num="02"
      :title="t.dashboard.pluginGuide.plugins.title"
      meta="vscode · jetbrains"
      flush
    >
      <template #icon>
        <i class="i-tabler-puzzle text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-grid">
        <a
          href="https://marketplace.visualstudio.com/items?itemName=jannchie.codetime"
          target="_blank"
          rel="noopener"
          class="onb-card"
        >
          <i class="i-mdi-microsoft-visual-studio-code onb-card-icon" />
          <div class="onb-card-body">
            <div class="onb-card-title">
              {{ t.dashboard.pluginGuide.vscode.title }}
            </div>
            <div class="onb-card-desc">
              {{ t.dashboard.pluginGuide.vscode.description }}
            </div>
          </div>
          <span class="onb-card-cta tabular-nums">
            {{ t.dashboard.pluginGuide.downloadPlugin }}
            <i class="i-tabler-arrow-up-right" />
          </span>
        </a>
        <a
          href="https://plugins.jetbrains.com/plugin/15507-codetime"
          target="_blank"
          rel="noopener"
          class="onb-card"
        >
          <i class="i-simple-icons-jetbrains onb-card-icon" />
          <div class="onb-card-body">
            <div class="onb-card-title">
              {{ t.dashboard.pluginGuide.jetbrains.title }}
            </div>
            <div class="onb-card-desc">
              {{ t.dashboard.pluginGuide.jetbrains.description }}
            </div>
          </div>
          <span class="onb-card-cta tabular-nums">
            {{ t.dashboard.pluginGuide.downloadPlugin }}
            <i class="i-tabler-arrow-up-right" />
          </span>
        </a>
      </div>
    </PanelSection>

    <!-- Setup -->
    <PanelSection
      num="03"
      :title="t.dashboard.pluginGuide.setup.title"
      meta="4 · steps"
      flush
    >
      <template #icon>
        <i class="i-tabler-route text-[15px] text-ct-fg-muted" />
      </template>
      <ol class="onb-steps">
        <li v-for="i in 4" :key="i" class="onb-step">
          <span class="onb-step-num tabular-nums">{{ String(i).padStart(2, '0') }}</span>
          <span class="onb-step-text">{{ (t.dashboard.pluginGuide.setup as any)[`step${i}`] }}</span>
        </li>
      </ol>
    </PanelSection>
  </div>
</template>

<style scoped>
.onb { width: 100%; display: flex; flex-direction: column; }

/* Lead block — distinct from PanelSection but same visual family */
.onb-lead {
  position: relative;
  display: flex;
  gap: 18px;
  padding: 24px 18px;
  background: var(--ct-surface);
  border-bottom: 1px solid var(--ct-border);
}
.onb-lead-stripe {
  width: 3px;
  flex-shrink: 0;
  background: var(--ct-primary);
  border-radius: 2px;
}
.onb-lead-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.onb-lead-eyebrow {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.02em;
}
.onb-lead-title {
  font-size: var(--ct-text-2xl);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
  line-height: 1.2;
}
.onb-lead-desc {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.6;
  max-width: 56ch;
}

.onb-help {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  line-height: 1.55;
  margin-bottom: 12px;
}

/* Token row */
.onb-token {
  display: flex;
  gap: 8px;
  max-width: 32rem;
}
.onb-token-field { flex: 1; }
.onb-token-field :deep(input) {
  letter-spacing: 4px;
  font-family: var(--ct-font-mono);
}

/* Plugins grid */
.onb-grid {
  display: grid;
  grid-template-columns: 1fr;
  border-top: 1px solid var(--ct-border-subtle);
}
@media (min-width: 768px) {
  .onb-grid { grid-template-columns: 1fr 1fr; }
}
.onb-card {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px 18px;
  background: var(--ct-surface);
  color: var(--ct-fg);
  border-bottom: 1px solid var(--ct-border-subtle);
  transition: background-color var(--ct-duration-fast) var(--ct-ease);
  text-decoration: none;
}
@media (min-width: 768px) {
  .onb-card:not(:last-child) { border-right: 1px solid var(--ct-border-subtle); }
}
.onb-card:hover { background: var(--ct-surface-1); }
.onb-card:hover .onb-card-cta { color: var(--ct-primary); }
.onb-card-icon {
  font-size: 28px;
  flex-shrink: 0;
  color: var(--ct-fg-muted);
}
.onb-card-body { flex: 1; min-width: 0; }
.onb-card-title {
  font-size: var(--ct-text-md);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}
.onb-card-desc {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
  margin-top: 2px;
}
.onb-card-cta {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  color: var(--ct-fg-subtle);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  transition: color var(--ct-duration-fast) var(--ct-ease);
}

/* Setup steps */
.onb-steps {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--ct-border-subtle);
}
.onb-step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 14px 18px;
  border-bottom: 1px solid var(--ct-border-subtle);
}
.onb-step:last-child { border-bottom: 0; }
.onb-step-num {
  flex-shrink: 0;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-primary);
  min-width: 24px;
}
.onb-step-text {
  font-size: var(--ct-text-sm);
  line-height: 1.55;
  color: var(--ct-fg);
}
</style>
