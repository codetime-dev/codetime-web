<script setup lang="ts">
import { postV3AuthRefreshToken } from '~/api/v3'

const user = useUser()
const t = useI18N()
const modal = ref(false)
const status = autoResetRef<'idle' | 'pending' | 'success' | 'error'>('idle', 3000)

async function refreshToken() {
  modal.value = false
  status.value = 'pending'
  try {
    const resp = await postV3AuthRefreshToken()
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

const iconName = computed(() => {
  switch (status.value) {
    case 'success': { return 'i-tabler-check'
    }
    case 'error': { return 'i-tabler-alert-triangle'
    }
    default: { return 'i-tabler-refresh'
    }
  }
})
</script>

<template>
  <UButton variant="secondary" :disabled="status === 'pending'" @click="modal = true">
    <span class="refresh-btn">
      <i
        :class="[iconName, { 'animate-spin': status === 'pending' }, `is-${status}`]"
        class="refresh-btn-icon"
      />
      <span>{{ t.dashboard.settings.token.refresh }}</span>
    </span>
  </UButton>

  <UModal v-model="modal" :title="t.dashboard.settings.token.refresh" width="440px">
    <p class="confirm-message">
      {{ t.dashboard.settings.token.confirmRefresh }}
    </p>
    <template #footer>
      <UButton variant="ghost" @click="modal = false">
        {{ t.general.cancel }}
      </UButton>
      <UButton variant="primary" icon-left="i-tabler-refresh" @click="refreshToken">
        {{ t.general.confirm }}
      </UButton>
    </template>
  </UModal>
</template>

<style scoped>
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  line-height: 1;
}
.refresh-btn-icon {
  width: 14px;
  height: 14px;
  font-size: 14px;
  display: inline-block;
  flex-shrink: 0;
  transition: color 200ms ease;
}
.refresh-btn-icon.is-success {
  color: var(--ct-success);
}
.refresh-btn-icon.is-error {
  color: var(--ct-danger);
}
.confirm-message {
  font-size: var(--ct-text-base);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0;
}
</style>
