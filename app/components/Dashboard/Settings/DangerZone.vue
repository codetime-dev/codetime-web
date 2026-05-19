<script setup lang="ts">
import type { UserSelfPublic } from '~/api/v3'
import { deleteV3UsersSelf, deleteV3UsersSelfData, postV3UsersSelfDeleteChallenge } from '~/api/v3'

const t = useI18N()
const user = inject<Ref<UserSelfPublic | null>>('user', ref(null))

// Two-step destructive flow shared by data-wipe and full account delete:
//   1. POST /v3/users/self/delete-challenge?purpose=<account|data> → token
//   2. DELETE the target endpoint with { challenge, confirmUsername }
// The server verifies the HMAC challenge (60s TTL, keyed by the user's
// token_v1, bound to `purpose`) and that confirmUsername matches the
// current username. Defends against same-origin XSS / click-jacking
// firing a blind DELETE from a stolen session.
async function fetchDeleteChallenge(purpose: 'account' | 'data'): Promise<string> {
  const { data, error } = await postV3UsersSelfDeleteChallenge({ query: { purpose } })
  if (error || !data?.challenge) {
    throw new Error(`Failed to obtain delete challenge`)
  }
  return data.challenge
}

// `deleteAccount` / `deleteAccountModal` are marked optional in
// `type.ts` so non-English locales don't have to translate them
// upfront. At runtime `mergeI18N` fills any missing key from English,
// so the `??` fallbacks below are belt-and-braces for the type checker.
const deleteAccountLabel = computed(() => t.value.dashboard.settings.dangerZone.button.deleteAccount ?? 'Delete Account')
const deleteAccountCopy = computed(() => t.value.dashboard.settings.dangerZone.button.deleteAccountModal ?? {
  p1: 'This will permanently delete your account and erase every record we hold for you.',
  p2: 'This action cannot be undone.',
  p3: 'To confirm, type DELETE below and click Confirm.',
})

// Two independent destructive flows. Each has its own modal + DELETE
// confirmation phrase, intentionally not sharing state so a half-typed
// phrase in one can't be reused to confirm the other.

// 1) Wipe all activity, keep account.
const dataModal = ref(false)
const dataPrompt = ref('')
const dataBusy = ref(false)
async function deleteAllData() {
  if (dataPrompt.value !== 'DELETE' || dataBusy.value) {
    return
  }
  const username = user.value?.username
  if (!username) {
    return
  }
  dataBusy.value = true
  try {
    const challenge = await fetchDeleteChallenge('data')
    const { error } = await deleteV3UsersSelfData({ body: { challenge, confirmUsername: username } })
    if (error) {
      throw new Error('Data wipe failed')
    }
    dataModal.value = false
    dataPrompt.value = ''
    // Hard reload so every cached query refetches and any open dashboards
    // start from an empty state instead of stale rows.
    globalThis.location.reload()
  }
  catch (error) {
    console.error('Delete all data failed:', error)
  }
  finally {
    dataBusy.value = false
  }
}
function closeDataModal() {
  dataModal.value = false
  dataPrompt.value = ''
}

// 2) Delete account entirely. Wipes everything and tombstones the user row;
// the server also clears auth cookies on the response, so a redirect to /
// re-renders as a logged-out visitor.
const accountModal = ref(false)
const accountPrompt = ref('')
const accountBusy = ref(false)
async function deleteAccount() {
  if (accountPrompt.value !== 'DELETE' || accountBusy.value) {
    return
  }
  const username = user.value?.username
  if (!username) {
    return
  }
  accountBusy.value = true
  try {
    const challenge = await fetchDeleteChallenge('account')
    const { error } = await deleteV3UsersSelf({ body: { challenge, confirmUsername: username } })
    if (error) {
      throw new Error('Account delete failed')
    }
    // Cookies are already cleared server-side. Full reload to drop the
    // SDK's in-memory user state and bounce to landing as anonymous.
    globalThis.location.href = '/'
  }
  catch (error) {
    console.error('Delete account failed:', error)
  }
  finally {
    accountBusy.value = false
  }
}
function closeAccountModal() {
  accountModal.value = false
  accountPrompt.value = ''
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
      <div class="danger-actions">
        <UButton variant="secondary" icon-left="i-tabler-trash" class="danger-trigger" @click="dataModal = true">
          {{ t.dashboard.settings.dangerZone.button.removeAllData }}
        </UButton>
        <UButton variant="secondary" icon-left="i-tabler-user-x" class="danger-trigger" @click="accountModal = true">
          {{ deleteAccountLabel }}
        </UButton>
      </div>
    </div>

    <!-- Remove all data — keeps the account -->
    <UModal v-model="dataModal" :title="t.dashboard.settings.dangerZone.button.removeAllData" width="480px">
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
          v-model="dataPrompt"
          placeholder="DELETE"
          autocomplete="off"
          spellcheck="false"
          :invalid="dataPrompt !== '' && dataPrompt !== 'DELETE'"
        />
      </div>
      <template #footer>
        <UButton variant="ghost" @click="closeDataModal">
          {{ t.general.cancel }}
        </UButton>
        <UButton
          variant="danger"
          icon-left="i-tabler-trash"
          :disabled="dataPrompt !== 'DELETE' || dataBusy"
          :loading="dataBusy"
          @click="deleteAllData"
        >
          {{ t.general.confirm }}
        </UButton>
      </template>
    </UModal>

    <!-- Delete account -->
    <UModal v-model="accountModal" :title="deleteAccountLabel" width="480px">
      <div class="confirm-paragraphs">
        <p>{{ deleteAccountCopy.p1 }}</p>
        <p>{{ deleteAccountCopy.p2 }}</p>
        <p>{{ deleteAccountCopy.p3 }}</p>
      </div>
      <div class="confirm-prompt">
        <div class="confirm-prompt-label">
          Type <span class="confirm-prompt-keyword">DELETE</span> to confirm
        </div>
        <UInput
          v-model="accountPrompt"
          placeholder="DELETE"
          autocomplete="off"
          spellcheck="false"
          :invalid="accountPrompt !== '' && accountPrompt !== 'DELETE'"
        />
      </div>
      <template #footer>
        <UButton variant="ghost" @click="closeAccountModal">
          {{ t.general.cancel }}
        </UButton>
        <UButton
          variant="danger"
          icon-left="i-tabler-user-x"
          :disabled="accountPrompt !== 'DELETE' || accountBusy"
          :loading="accountBusy"
          @click="deleteAccount"
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
.danger-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
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
