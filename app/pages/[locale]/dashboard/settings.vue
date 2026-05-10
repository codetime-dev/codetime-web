<script setup lang="ts">
import { v3ExportUserData, v3Logout } from '@/api/v3/sdk.gen'

definePageMeta({
  layout: 'dashboard',
})
const user = useUser()
const token = computed(() => user.value?.uploadToken ?? '')
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

const exporting = ref(false)
const exportSucceed = autoResetRef(false, 3000)
const exportFailed = autoResetRef(false, 3000)
const exportURL = ref('')
const fileName = `${user.value?.username}-codetime-records-${new Date().toLocaleString()}.csv`

async function exportData() {
  if (exporting.value) {
    return
  }
  try {
    exporting.value = true
    const resp = await v3ExportUserData({ throwOnError: true })
    exporting.value = false
    exportSucceed.value = true
    exportFailed.value = false
    const blob = new Blob([resp.data], { type: 'text/csv' })
    const url = globalThis.URL.createObjectURL(blob)
    exportURL.value = url
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
  }
  catch {
    exporting.value = false
    exportSucceed.value = false
    exportFailed.value = true
  }
}

async function logout() {
  await v3Logout({ throwOnError: false })
  globalThis.location.href = '/'
}

const t = useI18N()
</script>

<template>
  <DashboardPageTitle
    num="00"
    :title="t.dashboard.pageHeader.title.settings"
    :description="t.dashboard.pageHeader.description.settings"
  />
  <DashboardPageContent>
    <DashboardSettingsUser />

    <!-- UPLOAD TOKEN -->
    <PanelSection num="02" :title="t.dashboard.settings.token.title" meta="api · credential" flush>
      <template #icon>
        <i class="i-tabler-key text-[15px] text-ct-fg-muted" />
      </template>

      <div class="set-section">
        <p class="set-desc">
          <component :is="t.dashboard.settings.token.getPlugin" />
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

        <p class="set-hint">
          {{ t.dashboard.settings.token.tip }}
        </p>

        <div class="set-row">
          <DashboardRefreshBtn />
          <p class="set-hint set-hint-inline">
            {{ t.dashboard.settings.token.refreshTip }}
          </p>
        </div>
      </div>
    </PanelSection>

    <!-- THEME -->
    <PanelSection num="03" :title="t.dashboard.settings.theme.title" meta="appearance" flush>
      <template #icon>
        <i class="i-tabler-palette text-[15px] text-ct-fg-muted" />
      </template>

      <div class="theme-grid">
        <ClientOnly>
          <template #placeholder>
            <div class="bg-ct-surface-2 h-9 animate-pulse" />
            <div class="bg-ct-surface-2 h-9 animate-pulse" />
          </template>
          <ThemeItem theme="dark" />
          <ThemeItem theme="light" />
        </ClientOnly>
      </div>

      <div class="set-foot">
        <p class="set-hint">
          {{ t.dashboard.settings.theme.tip }}
        </p>
      </div>
    </PanelSection>

    <!-- LANGUAGE -->
    <PanelSection num="04" :title="t.dashboard.settings.language.title" meta="locale" flush>
      <template #icon>
        <i class="i-tabler-language text-[15px] text-ct-fg-muted" />
      </template>

      <div class="set-section">
        <div class="set-row">
          <LanguageSelect />
        </div>
        <p class="set-hint">
          {{ t.dashboard.settings.language.tip }}
        </p>
      </div>
    </PanelSection>

    <!-- EXPORT -->
    <PanelSection num="05" :title="t.dashboard.settings.export.title" meta="csv · download" flush>
      <template #icon>
        <i class="i-tabler-file-export text-[15px] text-ct-fg-muted" />
      </template>

      <div class="set-section">
        <p class="set-desc">
          {{ t.dashboard.settings.export.description }}
        </p>

        <div class="set-row">
          <UButton
            variant="secondary"
            :loading="exporting"
            :icon-left="exportSucceed
              ? 'i-tabler-check'
              : exportFailed
                ? 'i-tabler-alert-triangle'
                : 'i-tabler-file-export'"
            @click="exportData"
          >
            <span v-if="exporting">{{ t.dashboard.settings.export.buttonExporting }}</span>
            <span v-else-if="exportFailed">{{ t.dashboard.settings.export.buttonFailed }}</span>
            <span v-else-if="exportSucceed">{{ t.dashboard.settings.export.buttonSucceed }}</span>
            <span v-else>{{ t.dashboard.settings.export.button }}</span>
          </UButton>

          <a
            v-if="exportURL"
            :href="exportURL"
            :download="fileName"
            class="export-link"
          >
            <UButton variant="ghost" icon-left="i-tabler-arrow-down">
              {{ t.dashboard.settings.export.download }}
            </UButton>
          </a>
        </div>

        <p class="set-hint">
          {{ t.dashboard.settings.export.tip }}
        </p>
      </div>
    </PanelSection>

    <!-- OTHER -->
    <PanelSection num="06" :title="t.dashboard.settings.other.title" meta="session" flush>
      <template #icon>
        <i class="i-tabler-dots-circle-horizontal text-[15px] text-ct-fg-muted" />
      </template>

      <div class="set-section">
        <p class="set-desc">
          {{ t.dashboard.settings.other.description }}
        </p>
        <div class="set-row">
          <UButton variant="secondary" icon-left="i-tabler-logout" @click="logout">
            {{ t.dashboard.settings.other.logout }}
          </UButton>
        </div>
      </div>
    </PanelSection>

    <DashboardSettingsDangerZone />
  </DashboardPageContent>
</template>

<style scoped>
.set-section {
  padding: 1rem 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.set-foot {
  padding: 0.75rem 1.25rem 1rem;
  border-top: 1px solid var(--ct-border-subtle);
}

.set-desc {
  font-size: 12.5px;
  letter-spacing: 0.02em;
  line-height: 1.7;
  color: var(--ct-fg-muted);
}

.set-hint {
  font-size: 11.5px;
  letter-spacing: 0.02em;
  line-height: 1.7;
  color: var(--ct-fg-subtle);
}

.set-hint-inline {
  margin-left: 0.25rem;
  flex: 1;
}

.set-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

/* TOKEN */
.token-bar {
  display: grid;
  grid-template-columns: 5rem 1fr auto auto;
  align-items: stretch;
  height: 2.5rem;
  background-color: var(--ct-surface-1);
  transition: background-color 180ms ease;
}

.token-bar:hover {
  background-color: var(--ct-surface-2);
}

[data-scheme="light"] .token-bar {
  background-color: color-mix(in srgb, var(--ct-fg) 5%, transparent);
}

[data-scheme="light"] .token-bar:hover {
  background-color: color-mix(in srgb, var(--ct-fg) 8%, transparent);
}

.token-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.95rem;
  font-size: var(--ct-text-xs);
      color: var(--color-primary-1);
  border-right: 1px solid var(--ct-border-subtle);
}

.token-field {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0 1rem;
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
  width: 2.5rem;
  height: 100%;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--ct-border-subtle);
  cursor: pointer;
  color: var(--ct-fg-subtle);
  transition: color 180ms ease, background-color 180ms ease;
}

.token-eye:hover {
  color: var(--ct-fg);
  background-color: var(--ct-surface-2);
}

.token-copy {
  height: 100% !important;
}

/* THEME grid */
.theme-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr 1fr;
  }
  .theme-grid > :nth-child(2) {
    border-left: 1px solid var(--ct-border-subtle);
  }
}

@media (max-width: 767px) {
  .theme-grid > :nth-child(2) {
    border-top: 1px solid var(--ct-border-subtle);
  }
}

/* EXPORT */
.export-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-size: var(--ct-text-xs);
  letter-spacing: 0.2em;
    color: var(--color-primary-1);
  text-decoration: none;
  transition: color 180ms ease, background-color 180ms ease;
}

.export-link:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

/* line-btn */
.line-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  border-radius: 0.375rem;
  font-size: var(--ct-text-xs);
  letter-spacing: 0.2em;
    color: var(--ct-fg);
  background-color: var(--ct-surface-1);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, opacity 180ms ease;
  white-space: nowrap;
}

.line-btn:hover:not(:disabled) {
  background-color: var(--ct-surface-2);
}

.line-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-btn-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.line-btn-primary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary-1) 24%, transparent);
}

.line-btn-ok {
  color: var(--r-color-secondary-1, #10b981);
  background-color: color-mix(in srgb, var(--r-color-secondary-1, #10b981) 18%, transparent);
}

.line-btn-danger {
  color: #ef4444 !important;
  background-color: rgb(239 68 68 / 0.16) !important;
}
</style>
