<script setup lang="ts">
const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
const t = useI18N()

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

const installCmd = 'npm i -g codetime-cli'
const configureCmd = computed(() =>
  token.value
    ? `codetime token set ${token.value}`
    : 'codetime token set <token>',
)
const configureCmdDisplay = computed(() =>
  token.value
    ? `codetime token set ${'•'.repeat(Math.min(24, token.value.length))}`
    : 'codetime token set <token>',
)
const hookCmd = 'codetime install'

// Supported agents shown as chips under the hook section. Keep names
// short; icons map to common iconify sets — fall back to a generic
// terminal glyph for any agent without dedicated branding.
const supportedAgents: { name: string, icon: string }[] = [
  { name: 'Claude Code', icon: 'i-simple-icons-anthropic' },
  { name: 'Codex', icon: 'i-simple-icons-openai' },
  { name: 'OpenCode', icon: 'i-brand-opencode' },
  { name: 'Pi', icon: 'i-brand-pi' },
]
</script>

<template>
  <div class="onb">
    <!-- Lead -->
    <div class="onb-lead">
      <span class="onb-lead-stripe" aria-hidden="true" />
      <div class="onb-lead-body">
        <h2 class="onb-lead-title">
          {{ t.dashboard.agentGuide.title }}
        </h2>
        <p class="onb-lead-desc">
          {{ t.dashboard.agentGuide.description }}
        </p>
      </div>
    </div>

    <!-- Token -->
    <PanelSection num="01" :title="t.dashboard.agentGuide.token.title" flush>
      <template #icon>
        <i class="i-tabler-key text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-pad">
        <p class="onb-desc">
          {{ t.dashboard.agentGuide.token.description }}
        </p>

        <div class="cmd-bar">
          <div class="cmd-tag">
            <i class="i-tabler-shield-lock" />
            <span>token</span>
          </div>
          <input
            :value="tokenDisplay"
            readonly
            class="cmd-field"
            type="text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
          >
          <button
            type="button"
            class="cmd-eye"
            :title="tokenVisible ? 'hide' : 'reveal'"
            @click="tokenVisible = !tokenVisible"
          >
            <i :class="tokenVisible ? 'i-tabler-eye-off' : 'i-tabler-eye'" class="text-sm" />
          </button>
          <UCopyBtn :value="token" class="cmd-copy" />
        </div>
      </div>
    </PanelSection>

    <!-- Install CLI -->
    <PanelSection num="02" :title="t.dashboard.agentGuide.install.title" flush>
      <template #icon>
        <i class="i-tabler-download text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-pad">
        <p class="onb-desc">
          {{ t.dashboard.agentGuide.install.description }}
        </p>

        <div class="cmd-bar">
          <div class="cmd-tag cmd-tag-mono">
            <i class="i-tabler-prompt" />
            <span>shell</span>
          </div>
          <input
            :value="installCmd"
            readonly
            class="cmd-field"
            type="text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
          >
          <UCopyBtn :value="installCmd" class="cmd-copy" />
        </div>
      </div>
    </PanelSection>

    <!-- Configure Token -->
    <PanelSection num="03" :title="t.dashboard.agentGuide.configure.title" flush>
      <template #icon>
        <i class="i-tabler-terminal-2 text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-pad">
        <p class="onb-desc">
          {{ t.dashboard.agentGuide.configure.description }}
        </p>

        <div class="cmd-bar">
          <div class="cmd-tag cmd-tag-mono">
            <i class="i-tabler-prompt" />
            <span>shell</span>
          </div>
          <input
            :value="configureCmdDisplay"
            readonly
            class="cmd-field"
            type="text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
          >
          <UCopyBtn :value="configureCmd" class="cmd-copy" />
        </div>

        <p v-if="!token" class="onb-hint">
          <i class="i-tabler-info-circle text-[13px]" />
          <span>{{ t.dashboard.agentGuide.configure.hint }}</span>
        </p>
      </div>
    </PanelSection>

    <!-- Hook Into Agents -->
    <PanelSection num="04" :title="t.dashboard.agentGuide.hook.title" flush>
      <template #icon>
        <i class="i-tabler-plug-connected text-[15px] text-ct-fg-muted" />
      </template>
      <div class="onb-pad">
        <p class="onb-desc">
          {{ t.dashboard.agentGuide.hook.description }}
        </p>

        <div class="cmd-bar">
          <div class="cmd-tag cmd-tag-mono">
            <i class="i-tabler-prompt" />
            <span>shell</span>
          </div>
          <input
            :value="hookCmd"
            readonly
            class="cmd-field"
            type="text"
            @focus="(e) => (e.target as HTMLInputElement).select()"
          >
          <UCopyBtn :value="hookCmd" class="cmd-copy" />
        </div>

        <div class="onb-agents">
          <span class="onb-agents-label">{{ t.dashboard.agentGuide.hook.supports }}</span>
          <ul class="onb-agents-list">
            <li v-for="a in supportedAgents" :key="a.name" class="onb-agents-chip">
              <i :class="`${a.icon} text-[13px]`" />
              <span>{{ a.name }}</span>
            </li>
          </ul>
        </div>

        <p class="onb-hint">
          <i class="i-tabler-clock text-[13px]" />
          <span>{{ t.dashboard.agentGuide.hook.latency }}</span>
        </p>
      </div>
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

.onb-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ct-fg-subtle);
  line-height: 1.5;
}

/* Supported-agents chip list under the hook section. */
.onb-agents {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.onb-agents-label {
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: var(--ct-fg-subtle);
}
.onb-agents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.onb-agents-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--ct-fg);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 999px;
}
[data-scheme="light"] .onb-agents-chip {
  background: color-mix(in srgb, var(--ct-fg) 4%, transparent);
}

/* Command bar — reused for token and shell commands */
.cmd-bar {
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
.cmd-bar:hover {
  background-color: var(--ct-surface-2);
  border-color: var(--ct-border);
}
.cmd-bar:focus-within { border-color: var(--ct-primary); }
[data-scheme="light"] .cmd-bar {
  background-color: color-mix(in srgb, var(--ct-fg) 4%, transparent);
}
[data-scheme="light"] .cmd-bar:hover {
  background-color: color-mix(in srgb, var(--ct-fg) 7%, transparent);
}
.cmd-tag {
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
.cmd-tag-mono {
  font-family: var(--ct-font-mono);
  letter-spacing: 0.1em;
}
.cmd-field {
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
.cmd-eye {
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
.cmd-eye:hover {
  color: var(--ct-fg);
  background-color: var(--ct-surface);
}
.cmd-copy {
  height: 100% !important;
  border-radius: 7px !important;
}
</style>
