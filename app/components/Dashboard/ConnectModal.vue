<script setup lang="ts">
// Near-fullscreen modal that hosts the three "connect" guides (CLI/AI
// agents, VSCode/Cursor/Windsurf, JetBrains family). Triggered from
// Settings or the unified empty-state. Each guide retains its
// `hide-lead` flag so the modal owns the title; the sidebar on wide
// viewports lets the user switch between them without page navigation.

type Tab = 'agent' | 'vscode' | 'jetbrains'

const props = withDefaults(defineProps<{
  initialTab?: Tab
}>(), {
  initialTab: 'agent',
})
const open = defineModel<boolean>('open', { default: false })
const t = useI18N()
const connect = computed(() => t.value.dashboard.settings.connect)

const active = ref<Tab>(props.initialTab)
watch(() => props.initialTab, (v) => {
  active.value = v
})
watch(open, (v) => {
  // Re-anchor to the prop on every re-open so the caller can steer the
  // entry tab — without this the modal would remember whatever the user
  // browsed to last time.
  if (v) {
    active.value = props.initialTab
  }
})

const tabs = computed<Array<{ id: Tab, label: string, meta?: string, icon: string }>>(() => [
  {
    id: 'agent',
    label: connect.value?.agent?.title ?? 'Connect AI Agents',
    meta: connect.value?.agent?.meta ?? 'cli · claude · codex · opencode · pi',
    icon: 'i-tabler-robot',
  },
  {
    id: 'vscode',
    label: connect.value?.vscode?.title ?? 'Connect VSCode',
    meta: connect.value?.vscode?.meta ?? 'vscode · cursor · windsurf',
    icon: 'i-tabler-brand-vscode',
  },
  {
    id: 'jetbrains',
    label: connect.value?.jetbrains?.title ?? 'Connect JetBrains',
    meta: connect.value?.jetbrains?.meta ?? 'intellij · pycharm · webstorm',
    icon: 'i-simple-icons-jetbrains',
  },
])

function close() {
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    close()
  }
}

watch(open, (v) => {
  if (globalThis.document === undefined) {
    return
  }
  document.body.style.overflow = v ? 'hidden' : ''
})

onMounted(() => {
  globalThis.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  if (globalThis.document) {
    document.body.style.overflow = ''
  }
  globalThis.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="cm">
      <div
        v-if="open"
        class="cm-root"
        role="dialog"
        aria-modal="true"
        aria-label="Connect"
      >
        <div class="cm-overlay" @click="close" />
        <div class="cm-card">
          <header class="cm-head">
            <div class="cm-head-text">
              <span class="cm-eyebrow">
                <i class="i-tabler-plug-connected" />
                <span>Connect</span>
              </span>
              <h2 class="cm-title">
                {{ tabs.find(tab => tab.id === active)?.label }}
              </h2>
              <p class="cm-sub">
                {{ tabs.find(tab => tab.id === active)?.meta }}
              </p>
            </div>
            <button type="button" class="cm-close" aria-label="Close" @click="close">
              <i class="i-tabler-x" />
            </button>
          </header>

          <div class="cm-body">
            <nav class="cm-nav" aria-label="Connect targets">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="cm-nav-item"
                :class="{ active: active === tab.id }"
                :aria-current="active === tab.id ? 'page' : undefined"
                @click="active = tab.id"
              >
                <i :class="tab.icon" class="cm-nav-icon" />
                <span class="cm-nav-text">
                  <span class="cm-nav-label">{{ tab.label }}</span>
                  <span class="cm-nav-meta">{{ tab.meta }}</span>
                </span>
              </button>
            </nav>

            <section class="cm-pane">
              <KeepAlive>
                <DashboardAgentGuide v-if="active === 'agent'" hide-lead />
                <DashboardPluginGuide v-else-if="active === 'vscode'" hide-lead family="vscode" />
                <DashboardPluginGuide v-else-if="active === 'jetbrains'" hide-lead family="jetbrains" />
              </KeepAlive>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cm-root {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.cm-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, #000 55%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.cm-card {
  position: relative;
  width: 100%;
  max-width: 1240px;
  height: calc(100vh - 48px);
  max-height: calc(100vh - 48px);
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--ct-surface);
  border: 1px solid var(--ct-border);
  border-radius: 20px;
  box-shadow:
    0 24px 60px -20px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  overflow: hidden;
}

.cm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--ct-border);
  background: var(--ct-surface);
}
.cm-head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ct-fg-subtle);
}
.cm-title {
  font-size: var(--ct-text-xl);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  letter-spacing: var(--ct-tracking-tight);
  line-height: 1.2;
}
.cm-sub {
  font-family: var(--ct-font-mono);
  font-size: 11.5px;
  color: var(--ct-fg-muted);
  letter-spacing: 0.05em;
}
.cm-close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--ct-fg-subtle);
  border-radius: var(--ct-radius-full);
  cursor: pointer;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease);
}
.cm-close:hover { background: var(--ct-surface-2); color: var(--ct-fg); }

.cm-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 0;
}
@media (max-width: 760px) {
  .cm-body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
}

.cm-nav {
  border-right: 1px solid var(--ct-border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}
@media (max-width: 760px) {
  .cm-nav {
    flex-direction: row;
    border-right: 0;
    border-bottom: 1px solid var(--ct-border);
    overflow-x: auto;
    padding: 10px;
  }
}
.cm-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  color: var(--ct-fg-muted);
  text-align: left;
  transition: background-color var(--ct-duration-fast) var(--ct-ease),
              color var(--ct-duration-fast) var(--ct-ease),
              border-color var(--ct-duration-fast) var(--ct-ease);
}
.cm-nav-item:hover { background: var(--ct-surface-1); color: var(--ct-fg); }
.cm-nav-item.active {
  background: var(--ct-primary-soft);
  color: var(--ct-fg);
  border-color: color-mix(in srgb, var(--ct-primary) 35%, transparent);
}
.cm-nav-icon { flex: 0 0 auto; font-size: 16px; }
.cm-nav-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cm-nav-label { font-size: var(--ct-text-sm); font-weight: var(--ct-weight-medium); }
.cm-nav-meta {
  font-family: var(--ct-font-mono);
  font-size: 10.5px;
  color: var(--ct-fg-subtle);
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 760px) {
  .cm-nav-meta { display: none; }
  .cm-nav-item { white-space: nowrap; }
}

.cm-pane {
  overflow-y: auto;
  padding: 4px 0 24px;
}

/* Transition */
.cm-enter-active, .cm-leave-active {
  transition: opacity 220ms ease;
}
.cm-enter-from, .cm-leave-to { opacity: 0; }
.cm-enter-active .cm-card, .cm-leave-active .cm-card {
  transition: transform 240ms cubic-bezier(0.2, 0.7, 0.3, 1.05), opacity 220ms ease;
}
.cm-enter-from .cm-card, .cm-leave-to .cm-card {
  transform: translateY(16px) scale(0.985);
  opacity: 0;
}
</style>
