<script setup lang="ts">
import { client } from '~/api/v3/client.gen'

const user = useUser()
const t = useI18N()
const { getCheckoutLink } = await useCheckoutLink(ref(false), ref(true))
const checkoutLink = (await getCheckoutLink()) ?? undefined

const planLabel = computed(() => String(user.value?.plan ?? 'free').toUpperCase())
const isPro = computed(() => String(user.value?.plan ?? '').toLowerCase() === 'pro')

const USERNAME_MIN = 3
const USERNAME_MAX = 32
const USERNAME_PATTERN = /^[\w-]+$/

const editing = ref(false)
const draft = ref('')
const saving = ref(false)
const errorMessage = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

function startEdit() {
  draft.value = user.value?.username ?? ''
  errorMessage.value = ''
  editing.value = true
  nextTick(() => {
    inputEl.value?.focus()
    inputEl.value?.select()
  })
}

function cancelEdit() {
  editing.value = false
  draft.value = ''
  errorMessage.value = ''
}

const trimmed = computed(() => draft.value.trim())
const localValidation = computed<string | null>(() => {
  const v = trimmed.value
  if (v.length === 0) {
    return t.value.dashboard.settings.account.username?.errorEmpty ?? 'Username is required'
  }
  if (v.length < USERNAME_MIN || v.length > USERNAME_MAX) {
    return (t.value.dashboard.settings.account.username?.errorLength?.(USERNAME_MIN, USERNAME_MAX))
      ?? `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`
  }
  if (!USERNAME_PATTERN.test(v)) {
    return t.value.dashboard.settings.account.username?.errorChars
      ?? 'Only letters, digits, underscore, and hyphen are allowed'
  }
  return null
})
const dirty = computed(() => trimmed.value !== user.value?.username)
const canSave = computed(() => !saving.value && !localValidation.value && dirty.value)

async function saveUsername() {
  if (!canSave.value) {
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    const resp = await client.post<{ username: string }>({
      url: '/v3/users/self/username',
      body: { username: trimmed.value },
      headers: { 'Content-Type': 'application/json' },
      throwOnError: false,
    })
    const data = resp.data as { username?: string } | undefined
    const errBody = resp.error as { detail?: string } | undefined
    if (errBody?.detail || !data?.username) {
      errorMessage.value = errBody?.detail
        ?? t.value.dashboard.settings.account.username?.errorGeneric
        ?? 'Failed to update username'
      return
    }
    if (user.value) {
      user.value = { ...user.value, username: data.username }
    }
    refreshNuxtData('user-self').catch(() => {})
    editing.value = false
  }
  catch (error) {
    errorMessage.value = (error as Error)?.message
      ?? t.value.dashboard.settings.account.username?.errorGeneric
      ?? 'Failed to update username'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <PanelSection num="01" :title="t.dashboard.settings.account.title" :meta="t.dashboard.settings.account.title">
    <template #icon>
      <i class="i-tabler-user-circle ws-icon" />
    </template>

    <p class="acc-desc">
      {{ t.dashboard.settings.account.description }}
    </p>

    <div v-if="user" class="acc-row">
      <div class="acc-avatar">
        <img v-if="user.avatar" :src="user.avatar" alt="">
        <i v-else class="i-tabler-user text-2xl" />
      </div>

      <div class="acc-info">
        <div class="acc-line">
          <template v-if="!editing">
            <span class="acc-name">{{ user.username }}</span>
            <button
              type="button"
              class="acc-edit"
              :title="t.dashboard.settings.account.username?.edit ?? 'Edit username'"
              :aria-label="t.dashboard.settings.account.username?.edit ?? 'Edit username'"
              @click="startEdit"
            >
              <i class="i-tabler-pencil" />
            </button>
          </template>
          <template v-else>
            <input
              ref="inputEl"
              v-model="draft"
              type="text"
              class="acc-name-input"
              :class="{ 'acc-name-input-invalid': !!localValidation && draft.length > 0 }"
              :maxlength="USERNAME_MAX"
              :disabled="saving"
              :placeholder="t.dashboard.settings.account.username?.placeholder ?? 'Username'"
              autocomplete="off"
              spellcheck="false"
              @keydown.enter.prevent="saveUsername"
              @keydown.esc.prevent="cancelEdit"
            >
            <button
              type="button"
              class="acc-edit acc-edit-ok"
              :title="t.general.confirm"
              :disabled="!canSave"
              @click="saveUsername"
            >
              <i :class="saving ? 'i-tabler-loader-2 spin' : 'i-tabler-check'" />
            </button>
            <button
              type="button"
              class="acc-edit"
              :title="t.general.cancel"
              :disabled="saving"
              @click="cancelEdit"
            >
              <i class="i-tabler-x" />
            </button>
          </template>
          <UTag :tone="isPro ? 'primary' : 'neutral'" variant="soft" size="sm">
            {{ planLabel }}
          </UTag>
          <UTag
            v-if="user.plan !== 'free' && user.planStatus"
            tone="neutral"
            variant="outline"
            size="sm"
          >
            {{ t.plan.status(user.planStatus ?? 'paused') }}
          </UTag>
          <span
            v-if="(user.plan ?? 'free') !== 'free' && user.planStatus === 'active'"
            class="acc-expires"
          >
            {{ t.dashboard.settings.account.expiresIn }} {{ new Date(user.planExpiresAt ?? '').toLocaleDateString() }}
          </span>
        </div>
        <div v-if="editing && (errorMessage || (localValidation && draft.length > 0))" class="acc-error">
          {{ errorMessage || localValidation }}
        </div>
        <div v-else class="acc-email">
          {{ user.email }}
        </div>
      </div>

      <div class="acc-action">
        <a
          v-if="user.plan !== 'free'"
          target="_blank"
          href="https://codetime.lemonsqueezy.com/billing"
          class="acc-action-link"
        >
          <UButton variant="secondary" icon-left="i-tabler-credit-card">
            {{ t.dashboard.settings.account.manageSubscription }}
          </UButton>
        </a>
        <a v-else :href="checkoutLink" class="acc-action-link">
          <UButton variant="secondary" icon-left="i-tabler-arrow-up-right">
            {{ t.dashboard.settings.account.subscribe }}
          </UButton>
        </a>
      </div>
    </div>
  </PanelSection>
</template>

<style scoped>
.ws-icon { color: var(--ct-fg-subtle); font-size: 15px; }
.acc-desc {
  font-size: var(--ct-text-sm);
  line-height: 1.6;
  color: var(--ct-fg-muted);
  margin: 0 0 14px;
}

.acc-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}
@media (max-width: 599px) {
  .acc-row { grid-template-columns: 1fr; }
}

.acc-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: var(--ct-radius-full);
  background: var(--ct-surface-1);
  color: var(--ct-fg-subtle);
  overflow: hidden;
}
.acc-avatar img { width: 100%; height: 100%; object-fit: cover; }

.acc-info { min-width: 0; }
.acc-line { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.acc-name { font-size: var(--ct-text-base); font-weight: var(--ct-weight-semibold); color: var(--ct-fg); }

.acc-name-input {
  font-size: var(--ct-text-base);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
  border-radius: 6px;
  padding: 2px 8px;
  height: 28px;
  min-width: 0;
  width: 14ch;
  outline: 0;
  transition: border-color 180ms ease, background-color 180ms ease;
}
.acc-name-input:focus { border-color: var(--ct-primary); background: var(--ct-surface-2); }
.acc-name-input-invalid { border-color: var(--ct-danger); }
.acc-name-input:disabled { opacity: 0.6; cursor: not-allowed; }

.acc-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 14px;
  color: var(--ct-fg-subtle);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease, opacity 180ms ease;
}
.acc-edit:hover:not(:disabled) { color: var(--ct-fg); background-color: var(--ct-surface-1); }
.acc-edit:disabled { opacity: 0.4; cursor: not-allowed; }
.acc-edit-ok { color: var(--ct-primary); }
.acc-edit-ok:hover:not(:disabled) { color: var(--ct-primary); background-color: var(--ct-primary-soft); }

.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.acc-expires { font-size: var(--ct-text-xs); color: var(--ct-fg-subtle); }
.acc-email { font-size: var(--ct-text-sm); color: var(--ct-fg-muted); margin-top: 4px; }
.acc-error { font-size: var(--ct-text-xs); color: var(--ct-danger); margin-top: 4px; line-height: 1.5; }

.acc-action-link { text-decoration: none; }
</style>
