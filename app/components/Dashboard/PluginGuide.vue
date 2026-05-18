<script setup lang="ts">
const props = withDefaults(defineProps<{
  // Suppress the big lead heading when embedded under a PanelSection in
  // Settings — the section header already names the block.
  hideLead?: boolean
  // Filter the Plugins grid. `both` (default) keeps the existing dashboard
  // empty-state behaviour. `vscode` / `jetbrains` narrows it to a single
  // editor family so each can live in its own collapsible Settings block.
  family?: 'both' | 'vscode' | 'jetbrains'
}>(), {
  hideLead: false,
  family: 'both',
})

const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
const t = useI18N()

const showVscode = computed(() => props.family === 'both' || props.family === 'vscode')
const showJetbrains = computed(() => props.family === 'both' || props.family === 'jetbrains')

const tokenVisible = ref(false)
const tokenDisplay = computed(() => {
  if (!token.value) {
    return ''
  }
  if (tokenVisible.value) {
    return token.value
  }
  return '•'.repeat(Math.min(48, token.value.length))
})
</script>

<template>
  <div class="onb">
    <!-- Lead -->
    <div v-if="!hideLead" class="onb-lead">
      <span class="onb-lead-stripe" aria-hidden="true" />
      <div class="onb-lead-body">
        <h2 class="onb-lead-title">
          {{ t.dashboard.pluginGuide.title }}
        </h2>
        <p class="onb-lead-desc">
          {{ t.dashboard.pluginGuide.description }}
        </p>
      </div>
    </div>

    <!-- Token -->
    <PanelSection num="01" :title="t.dashboard.pluginGuide.token.title" flush>
      <template #icon>
        <i class="i-tabler-key text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-pad">
        <p class="onb-desc">
          {{ t.dashboard.pluginGuide.token.description }}
        </p>

        <div class="token-bar">
          <div class="token-tag">
            <i class="i-tabler-shield-lock" />
            <span>token</span>
          </div>
          <input
            :value="tokenDisplay"
            readonly
            class="token-field"
            type="text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
          >
          <button
            type="button"
            class="token-eye"
            :title="tokenVisible ? 'hide' : 'reveal'"
            @click="tokenVisible = !tokenVisible"
          >
            <i :class="tokenVisible ? 'i-tabler-eye-off' : 'i-tabler-eye'" class="text-sm" />
          </button>
          <UCopyBtn :value="token" class="token-copy" />
        </div>
      </div>
    </PanelSection>

    <!-- Plugins -->
    <PanelSection num="02" :title="t.dashboard.pluginGuide.plugins.title" flush>
      <template #icon>
        <i class="i-tabler-puzzle text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-grid" :class="{ 'onb-grid-single': family !== 'both' }">
        <a
          v-if="showVscode"
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
          <span class="onb-card-cta">
            {{ t.dashboard.pluginGuide.downloadPlugin }}
            <i class="i-tabler-arrow-up-right" />
          </span>
        </a>
        <a
          v-if="showJetbrains"
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
          <span class="onb-card-cta">
            {{ t.dashboard.pluginGuide.downloadPlugin }}
            <i class="i-tabler-arrow-up-right" />
          </span>
        </a>
      </div>
    </PanelSection>

    <!-- Setup -->
    <PanelSection num="03" :title="t.dashboard.pluginGuide.setup.title" flush>
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

/* Lead */
.onb-lead {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 22px 18px;
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

.onb-pad {
  padding: 1rem 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.onb-desc {
  font-size: 12.5px;
  letter-spacing: 0.02em;
  line-height: 1.7;
  color: var(--ct-fg-muted);
}

/* Token bar — mirrors Settings token design */
.token-bar {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: stretch;
  height: 2.75rem;
  padding: 4px;
  gap: 2px;
  background-color: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 10px;
  transition: background-color 180ms ease, border-color 180ms ease;
}
.token-bar:hover {
  background-color: var(--ct-surface-2);
  border-color: var(--ct-border);
}
.token-bar:focus-within { border-color: var(--ct-primary); }
[data-scheme="light"] .token-bar {
  background-color: color-mix(in srgb, var(--ct-fg) 4%, transparent);
}
[data-scheme="light"] .token-bar:hover {
  background-color: color-mix(in srgb, var(--ct-fg) 7%, transparent);
}
.token-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.85rem;
  font-size: var(--ct-text-xs);
  font-weight: var(--ct-weight-medium);
  letter-spacing: 0.05em;
  color: var(--ct-primary);
  background: var(--ct-primary-soft);
  border-radius: 7px;
}
.token-field {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 0.85rem;
  font-family: var(--ct-font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ct-fg);
  background: transparent;
  border: 0;
  outline: 0;
}
.token-eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 100%;
  background: transparent;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  color: var(--ct-fg-subtle);
  transition: color 180ms ease, background-color 180ms ease;
}
.token-eye:hover {
  color: var(--ct-fg);
  background-color: var(--ct-surface);
}
.token-copy {
  height: 100% !important;
  border-radius: 7px !important;
}

/* Plugins grid */
.onb-grid {
  display: grid;
  grid-template-columns: 1fr;
  border-top: 1px solid var(--ct-border-subtle);
}
@media (min-width: 768px) {
  .onb-grid:not(.onb-grid-single) { grid-template-columns: 1fr 1fr; }
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
  border-bottom: 1px solid var(--ct-border-subtle);
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
