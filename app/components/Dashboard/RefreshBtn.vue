<script setup lang="ts">
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

const iconClass = computed(() => ({
  'i-tabler-refresh': status.value === 'idle',
  'i-tabler-refresh animate-spin': status.value === 'pending',
  'i-tabler-check': status.value === 'success',
  'i-tabler-alert-triangle': status.value === 'error',
}))
</script>

<template>
  <UButton variant="secondary" @click="modal = true">
    <i :class="iconClass" />
    <span>{{ t.dashboard.settings.token.refresh }}</span>
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
.confirm-message {
  font-size: var(--ct-text-base);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0;
}
</style>
