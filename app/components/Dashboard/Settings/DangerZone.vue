<script setup lang="ts">
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
  <PanelSection num="99" :title="t.dashboard.settings.dangerZone.title" :meta="t.dashboard.settings.dangerZone.title" flush>
    <template #icon>
      <i class="i-tabler-alert-octagon" style="color: var(--ct-danger)" />
    </template>

    <div class="danger-section">
      <p class="danger-desc">
        {{ t.dashboard.settings.dangerZone.description }}
      </p>
      <div>
        <UButton variant="secondary" icon-left="i-tabler-trash" class="danger-trigger" @click="modal = true">
          {{ t.dashboard.settings.dangerZone.button.removeAllData }}
        </UButton>
      </div>
    </div>

    <UModal v-model="modal" :title="t.dashboard.settings.dangerZone.button.removeAllData" width="480px">
      <div class="confirm-paragraphs">
        <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p1 }}</p>
        <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p2 }}</p>
        <p>{{ t.dashboard.settings.dangerZone.button.removeAllDataModal.p3 }}</p>
      </div>
      <div class="confirm-prompt">
        <div class="confirm-prompt-label">
          Type <span class="confirm-prompt-keyword">DELETE</span> to confirm
        </div>
        <UInput
          v-model="deletePrompt"
          placeholder="DELETE"
          autocomplete="off"
          spellcheck="false"
          :invalid="deletePrompt !== '' && deletePrompt !== 'DELETE'"
        />
      </div>
      <template #footer>
        <UButton variant="ghost" @click="closeModal">
          {{ t.general.cancel }}
        </UButton>
        <UButton
          variant="danger"
          icon-left="i-tabler-trash"
          :disabled="deletePrompt !== 'DELETE'"
          @click="deleteAllData"
        >
          {{ t.general.confirm }}
        </UButton>
      </template>
    </UModal>
  </PanelSection>
</template>

<style scoped>
.danger-section {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.danger-desc {
  font-size: var(--ct-text-sm);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0;
}
.confirm-paragraphs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--ct-text-sm);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin-bottom: 16px;
}
.confirm-prompt { display: flex; flex-direction: column; gap: 8px; }
.confirm-prompt-label {
  font-size: var(--ct-text-sm);
  color: var(--ct-fg-muted);
}
.confirm-prompt-keyword {
  font-family: var(--ct-font-mono);
  color: var(--ct-danger);
  font-weight: var(--ct-weight-semibold);
}
.danger-trigger { color: var(--ct-danger); }
</style>
