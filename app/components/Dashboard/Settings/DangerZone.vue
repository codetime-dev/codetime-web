<script setup lang="ts">
import { Modal, Paper } from '@roku-ui/vue'
import { v3DeleteUserData } from '~/api/v3'

const t = useI18N()
const modal = ref(false)
const deletePrompt = ref('')

async function deleteAllData() {
  if (deletePrompt.value !== 'DELETE') {
    return
  }
  modal.value = false
  await v3DeleteUserData()
}

function closeModal() {
  modal.value = false
  deletePrompt.value = ''
}
</script>

<template>
  <PanelSection num="99" title="DANGER ZONE" meta="DESTRUCTIVE" flush>
    <template #icon>
      <i class="i-tabler-alert-octagon text-[15px] text-rose-500/80" />
    </template>

    <div class="danger-section">
      <p class="danger-desc">
        {{ t.dashboard.settings.dangerZone.description }}
      </p>
      <div class="danger-row">
        <button
          type="button"
          class="line-btn line-btn-danger rounded"
          @click="modal = true"
        >
          <i class="i-tabler-trash text-sm" />
          <span>{{ t.dashboard.settings.dangerZone.button.removeAllData }}</span>
        </button>
      </div>
    </div>

    <Modal v-model="modal">
      <Paper class="max-w-md">
        <div class="confirm-shell">
          <div class="confirm-eyebrow">
            <span class="confirm-eyebrow-bracket">[</span>
            <span class="confirm-eyebrow-num">!</span>
            <span class="confirm-eyebrow-sep">/</span>
            <span>destructive</span>
            <span class="confirm-eyebrow-bracket">]</span>
          </div>
          <h3 class="confirm-title">
            {{ t.dashboard.settings.dangerZone.button.removeAllData }}
          </h3>
          <div class="confirm-paragraphs">
            <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p1 }}</p>
            <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p2 }}</p>
            <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p3 }}</p>
          </div>

          <div class="confirm-prompt">
            <div class="confirm-prompt-label">
              <span>type</span>
              <span class="confirm-prompt-keyword">DELETE</span>
              <span>to confirm</span>
            </div>
            <input
              v-model="deletePrompt"
              type="text"
              class="line-input"
              placeholder="DELETE"
              autocomplete="off"
              spellcheck="false"
            >
          </div>

          <div class="confirm-actions">
            <button type="button" class="line-btn rounded" @click="closeModal">
              {{ t.general.cancel }}
            </button>
            <button
              type="button"
              class="line-btn line-btn-danger rounded"
              :disabled="deletePrompt !== 'DELETE'"
              @click="deleteAllData"
            >
              <i class="i-tabler-trash text-sm" />
              <span>{{ t.general.confirm }}</span>
            </button>
          </div>
        </div>
      </Paper>
    </Modal>
  </PanelSection>
</template>

<style scoped>
.danger-section {
  padding: 1rem 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.danger-desc {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--r-surface-text-color) 75%, transparent);
}

.danger-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.confirm-shell {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirm-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--r-color-error-1, #ef4444);
}

.confirm-eyebrow-bracket,
.confirm-eyebrow-sep {
  opacity: 0.55;
}

.confirm-eyebrow-num {
  color: var(--r-surface-text-color);
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--r-color-error-1, #ef4444);
}

.confirm-paragraphs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.65;
  color: color-mix(in srgb, var(--r-surface-text-color) 70%, transparent);
}

.confirm-prompt {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.confirm-prompt-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--r-surface-text-color) 55%, transparent);
}

.confirm-prompt-keyword {
  color: var(--r-color-error-1, #ef4444);
  font-weight: 600;
  letter-spacing: 0.32em;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
}

.line-input {
  display: block;
  width: 100%;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  letter-spacing: 0.18em;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  outline: 0;
  transition: background-color 180ms ease, box-shadow 180ms ease;
}

.line-input:focus {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
  box-shadow: inset 0 -1px 0 var(--r-color-error-1, #ef4444);
}

.line-input::placeholder {
  color: color-mix(in srgb, var(--r-surface-text-color) 30%, transparent);
}

.line-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--r-surface-text-color);
  background-color: rgb(var(--r-color-surface-7) / 0.18);
  border: 0;
  cursor: pointer;
  transition: background-color 180ms ease, color 180ms ease, opacity 180ms ease;
}

.line-btn:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.line-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-btn-danger {
  color: var(--r-color-error-1, #ef4444);
  background-color: color-mix(in srgb, var(--r-color-error-1, #ef4444) 18%, transparent);
}

.line-btn-danger:hover {
  background-color: color-mix(in srgb, var(--r-color-error-1, #ef4444) 28%, transparent);
}
</style>
