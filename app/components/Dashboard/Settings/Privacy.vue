<script setup lang="ts">
import { client } from '~/api/v3/client.gen'

// Fine-grained privacy. Mirrors the server `UserPrivacy` shape
// (server/utils/privacy.ts) plus the `leaderboardListed` column. v1 surfaces
// the facets that are actually enforced server-side (discovery, identity,
// live-status widget); history facets are stored with defaults but not shown
// until the history widgets are gated (fast-follow).
//
// NOTE: copy is inline English for v1; move to i18n keys in a follow-up.

type Facet = 'public' | 'private'

type Privacy = {
  v: number
  profilePublic: boolean
  widgetsEnabled: boolean
  leaderboardListed: boolean
  identity: { email: Facet, github: Facet }
  status: { coding: Facet, project: Facet, language: Facet, editor: Facet }
  history: { totalTime: Facet, languages: Facet, projects: Facet, calendar: Facet }
}

const privacy = ref<Privacy | null>(null)
const loading = ref(true)
const saving = ref(false)
const savedTick = autoResetRef(false, 2000)

const { data } = await useAsyncData('user-privacy', () =>
  client.get<{ 200: Privacy }>({ url: '/v3/users/self/privacy', throwOnError: false }).then(r => r.data ?? null))
privacy.value = data.value ?? null
loading.value = false

async function persist() {
  if (!privacy.value) {
    return
  }
  saving.value = true
  try {
    const resp = await client.post<{ 200: Privacy }>({
      url: '/v3/users/self/privacy',
      body: privacy.value,
      headers: { 'Content-Type': 'application/json' },
      throwOnError: false,
    })
    if (resp.data) {
      privacy.value = resp.data
      savedTick.value = true
    }
  }
  finally {
    saving.value = false
  }
}

// --- Segment option sets -----------------------------------------------------
const ON_OFF = [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]
function facetOpts(locked: boolean) {
  return [
    { id: 'public', label: 'Public', disabled: locked },
    { id: 'private', label: 'Private', disabled: locked },
  ]
}

// Boolean masters proxy through 'on'/'off' segment ids.
function boolProxy(get: () => boolean, set: (v: boolean) => void) {
  return computed<string>({
    get: () => (get() ? 'on' : 'off'),
    set: (v) => {
 set(v === 'on'); persist()
},
  })
}

const profilePublic = boolProxy(() => !!privacy.value?.profilePublic, v => privacy.value && (privacy.value.profilePublic = v))
const leaderboardListed = boolProxy(() => !!privacy.value?.leaderboardListed, v => privacy.value && (privacy.value.leaderboardListed = v))
const widgetsEnabled = boolProxy(() => !!privacy.value?.widgetsEnabled, v => privacy.value && (privacy.value.widgetsEnabled = v))

// Facet proxies persist on change.
function facetProxy(get: () => Facet, set: (v: Facet) => void) {
  return computed<string>({
    get: () => get(),
    set: (v) => {
 set(v as Facet); persist()
},
  })
}
const email = facetProxy(() => privacy.value!.identity.email, v => privacy.value!.identity.email = v)
const github = facetProxy(() => privacy.value!.identity.github, v => privacy.value!.identity.github = v)
const coding = facetProxy(() => privacy.value!.status.coding, v => privacy.value!.status.coding = v)
const project = facetProxy(() => privacy.value!.status.project, v => privacy.value!.status.project = v)
const language = facetProxy(() => privacy.value!.status.language, v => privacy.value!.status.language = v)
const editor = facetProxy(() => privacy.value!.status.editor, v => privacy.value!.status.editor = v)

// Lock dependencies — turning a master off greys its children.
const widgetsOff = computed(() => !privacy.value?.widgetsEnabled)
// project/language/editor are moot once the live-status baseline is hidden.
const statusDetailLocked = computed(() => widgetsOff.value || privacy.value?.status.coding === 'private')
</script>

<template>
  <PanelSection num="08" title="Privacy" meta="visibility · who sees what" flush>
    <template #icon>
      <i class="i-tabler-lock text-[15px] text-ct-fg-muted" />
    </template>

    <div v-if="privacy" class="pv">
      <p class="pv-note">
        Your settings are the ceiling: badges, the leaderboard and your public profile only ever show
        what you allow here, no matter what an embed or viewer asks for. Changes propagate within a
        minute (cached README badges may lag).
        <span v-if="saving" class="pv-save">saving…</span>
        <span v-else-if="savedTick" class="pv-save pv-save-ok">saved</span>
      </p>

      <!-- DISCOVERY -->
      <div class="pv-group-label">
        Discovery
      </div>
      <WidgetFormRow label="Public profile">
        <WidgetFormSeg v-model="profilePublic" :options="ON_OFF" />
      </WidgetFormRow>
      <WidgetFormRow label="Show in leaderboards">
        <WidgetFormSeg v-model="leaderboardListed" :options="ON_OFF" />
      </WidgetFormRow>

      <!-- IDENTITY -->
      <div class="pv-group-label">
        Identity
      </div>
      <WidgetFormRow label="Email">
        <WidgetFormSeg v-model="email" :options="facetOpts(false)" />
      </WidgetFormRow>
      <WidgetFormRow label="GitHub">
        <WidgetFormSeg v-model="github" :options="facetOpts(false)" />
      </WidgetFormRow>

      <!-- WIDGETS / LIVE STATUS -->
      <div class="pv-group-label">
        Status widget
        <span v-if="widgetsOff" class="pv-group-hint">— turn on to configure</span>
      </div>
      <WidgetFormRow label="Embeddable widgets">
        <WidgetFormSeg v-model="widgetsEnabled" :options="ON_OFF" />
      </WidgetFormRow>
      <WidgetFormRow label="Currently coding">
        <WidgetFormSeg v-model="coding" :options="facetOpts(widgetsOff)" />
      </WidgetFormRow>
      <WidgetFormRow label="Current project">
        <WidgetFormSeg v-model="project" :options="facetOpts(statusDetailLocked)" />
      </WidgetFormRow>
      <WidgetFormRow label="Current language">
        <WidgetFormSeg v-model="language" :options="facetOpts(statusDetailLocked)" />
      </WidgetFormRow>
      <WidgetFormRow label="Current editor">
        <WidgetFormSeg v-model="editor" :options="facetOpts(statusDetailLocked)" />
      </WidgetFormRow>
    </div>
  </PanelSection>
</template>

<style scoped>
.pv {
  display: flex;
  flex-direction: column;
}
.pv-note {
  padding: 14px 18px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ct-fg-subtle);
  border-bottom: 1px solid var(--ct-border-subtle);
}
.pv-save {
  margin-left: 6px;
  font-family: var(--ct-font-mono);
  color: var(--ct-fg-muted);
}
.pv-save-ok { color: var(--r-color-secondary-1, #10b981); }
.pv-group-label {
  padding: 12px 18px 6px;
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg-subtle);
  background: var(--ct-surface);
  border-top: 1px solid var(--ct-border-subtle);
}
.pv-group-hint {
  margin-left: 6px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: var(--ct-weight-normal);
  color: var(--ct-fg-subtle);
  opacity: 0.8;
}
</style>
