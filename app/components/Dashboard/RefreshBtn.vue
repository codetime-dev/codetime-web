<script setup lang="ts">
import { Modal, Paper } from '@roku-ui/vue'
import { v3RefreshToken } from '~/api/v3'

const user = useUser()
const t = useI18N()
const modal = ref(false)
const status = autoResetRef<string>('idle', 3000)

async function refreshToken() {
  modal.value = false
  status.value = 'pending'
  try {
    const resp = await v3RefreshToken()
    if (resp.data && user.value) {
      user.value.uploadToken = resp.data.token ?? ''
      status.value = 'success'
    }
    else {
      status.value = 'error'
    }
  }
  catch {
    status.value = 'error'
  }
}
</script>

<template>
  <button type="button" class="line-btn" @click="modal = true">
    <i
      class="text-sm"
      :class="[{
        'i-tabler-refresh': status === 'idle',
        'i-tabler-refresh animate-spin': status === 'pending',
        'i-tabler-check': status === 'success',
        'i-tabler-alert-triangle': status === 'error',
      }]"
    />
    <span>{{ t.dashboard.settings.token.refresh }}</span>
  </button>

  <Modal v-model="modal">
    <Paper class="max-w-md" with-border>
      <div class="confirm-shell">
        <div class="confirm-eyebrow">
          <span class="confirm-eyebrow-bracket">[</span>
          <span class="confirm-eyebrow-num">!</span>
          <span class="confirm-eyebrow-sep">/</span>
          <span>refresh · token</span>
          <span class="confirm-eyebrow-bracket">]</span>
        </div>
        <h3 class="confirm-title">
          {{ t.dashboard.settings.token.refresh }}
        </h3>
        <p class="confirm-message">
          {{ t.dashboard.settings.token.confirmRefresh }}
        </p>
        <div class="confirm-actions">
          <button type="button" class="line-btn" @click="modal = false">
            {{ t.general.cancel }}
          </button>
          <button type="button" class="line-btn line-btn-primary" @click="refreshToken">
            <i class="i-tabler-refresh text-sm" />
            <span>{{ t.general.confirm }}</span>
          </button>
        </div>
      </div>
    </Paper>
  </Modal>
</template>

<style scoped>
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
  color: var(--color-primary-1);
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
  color: var(--r-surface-text-color);
}

.confirm-message {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--r-surface-text-color) 70%, transparent);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--r-surface-border-color) 28%, transparent);
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
  white-space: nowrap;
  transition: background-color 180ms ease, color 180ms ease;
}

.line-btn:hover {
  background-color: rgb(var(--r-color-surface-7) / 0.32);
}

.line-btn-primary {
  color: var(--color-primary-1);
  background-color: color-mix(in srgb, var(--color-primary-1) 14%, transparent);
}

.line-btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary-1) 24%, transparent);
}
</style>
