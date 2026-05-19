<script setup lang="ts">
import type { UserSelfPublic } from '~/api/v3'

// Sign-in provider linking panel. Three providers (GitHub / Google /
// Apple) can be attached to the same Code Time account; this surface
// lets the user wire up or detach each one.
//
// Connect flows reuse the existing sign-in entry points but with a
// link-mode marker so the server attaches to the current user instead
// of provisioning a new row:
//   * Google: GIS JS callback → POST /v3/auth/google/link with the JWT
//   * Apple:  AppleID popup    → POST /v3/auth/apple/link
//   * GitHub: full-page nav to /v3/auth/github/start?link=1 (browser
//             redirect chain handles the callback; we read the
//             ?link=…&result=… query the callback appends to surface
//             feedback after the round-trip).
//
// Disconnect flows are plain DELETE /v3/auth/{provider}/link calls; the
// server refuses to leave the account with zero providers (400).
//
// Note: the SDK's `UserSelfPublic` shipping with this branch may not yet
// expose `appleId` because the OpenAPI regen step hasn't run. The cast
// at the user object below is defensive — once `pnpm openapi` runs the
// field becomes typed and the cast is harmless.

const t = useI18N()
const user = inject<Ref<UserSelfPublic | null>>('user', ref(null))

// Provider SDKs (AppleID JS SDK, Google Identity Services) attach to the
// window object at runtime. LoginButton.vue declares its own slightly
// different Window augmentations, so rather than fight the TS merge we
// access the globals through narrowly-typed casts at the use sites.
type AppleAuth = {
  init: (config: Record<string, unknown>) => void
  signIn: (overrides?: Record<string, unknown>) => Promise<{
    authorization: { id_token: string, code?: string, state?: string }
  }>
}
type GisIdentity = {
  initialize: (config: Record<string, unknown>) => void
  prompt: () => void
}
function appleAuth(): AppleAuth | undefined {
  return (globalThis as any).AppleID?.auth as AppleAuth | undefined
}
function gisId(): GisIdentity | undefined {
  return (globalThis as any).google?.accounts?.id as GisIdentity | undefined
}

type ProviderKey = 'github' | 'google' | 'apple'

type ProviderState = {
  busy: boolean
  error: string | null
}

const state = reactive<Record<ProviderKey, ProviderState>>({
  github: { busy: false, error: null },
  google: { busy: false, error: null },
  apple: { busy: false, error: null },
})

const labels = computed(() => t.value.dashboard.settings.connections ?? {
  title: 'Sign-in Providers',
  description: 'Link multiple identities so you can sign in with any of them. At least one must remain connected.',
  connected: 'Connected',
  notConnected: 'Not connected',
  connect: 'Connect',
  disconnect: 'Disconnect',
  lastProviderHint: 'Disconnecting this would leave the account with no way to sign in.',
  feedback: {
    ok: 'Account linked.',
    conflict: 'That identity is already linked to a different Code Time account.',
    replace: 'Another identity is already linked for this provider. Disconnect it first.',
  },
})

const links = computed(() => {
  const u = user.value as (UserSelfPublic & { appleId?: string | null }) | null
  return {
    github: !!u?.githubId,
    google: !!u?.googleId,
    apple: !!u?.appleId,
  }
})

// Count of connected providers; disables the last-remaining disconnect
// button so the user doesn't have to round-trip to the server to learn
// they can't.
const connectedCount = computed(() => Object.values(links.value).filter(Boolean).length)

// ---- Post-callback feedback (GitHub redirect chain) ----
// /v3/auth/github appends ?link=github&result=ok|conflict|replace to
// the settings URL. Read once at mount, surface as the panel feedback,
// then strip from the URL so a refresh doesn't replay it.
const route = useRoute()
const router = useRouter()
const initialFeedback = ref<{ provider: ProviderKey, kind: 'ok' | 'conflict' | 'replace' } | null>(null)

onMounted(() => {
  const link = route.query.link
  const result = route.query.result
  if (typeof link === 'string' && (link === 'github' || link === 'google' || link === 'apple')
    && typeof result === 'string' && (result === 'ok' || result === 'conflict' || result === 'replace')) {
    initialFeedback.value = { provider: link, kind: result }
    // Clean the query so reloads don't keep showing the banner.
    const { link: _l, result: _r, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// ---- Helpers ----

function randomNonce(byteCount = 32): string {
  const bytes = new Uint8Array(byteCount)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function refreshUser() {
  // Hard reload is the simplest way to refetch /v3/users/self and have
  // every component pick up the new connection state. The Dashboard
  // currently fetches once via app.vue's `fetchUser` injection — there
  // is no exposed reactive refetch helper.
  globalThis.location.reload()
}

function setError(key: ProviderKey, message: string | null) {
  state[key].error = message
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json() as { detail?: string }
    if (typeof body.detail === 'string') {
      return body.detail
    }
  }
  catch {}
  return `HTTP ${res.status}`
}

// ---- GitHub ----
// Connect: simple redirect, no popup required. Server-side callback
// handles linking and bounces back here with ?link=github&result=…
function connectGithub() {
  if (state.github.busy) {
    return
  }
  state.github.busy = true
  globalThis.location.href = '/v3/auth/github/start?link=1'
}

async function disconnectGithub() {
  await disconnect('github', '/v3/auth/github/link')
}

// ---- Google ----
let gisScriptPromise: Promise<void> | null = null
function loadGisScript(): Promise<void> {
  if (gisScriptPromise) {
    return gisScriptPromise
  }
  gisScriptPromise = new Promise<void>((resolve, reject) => {
    if (gisId()) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-gis-client]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.gisClient = '1'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true })
    document.head.append(script)
  })
  return gisScriptPromise
}

async function connectGoogle() {
  if (state.google.busy) {
    return
  }
  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId
  if (!clientId) {
    setError('google', 'Google client ID is not configured.')
    return
  }
  setError('google', null)
  state.google.busy = true
  try {
    await loadGisScript()
    const gis = gisId()
    if (!gis) {
      throw new Error('Google Identity Services unavailable')
    }
    const credential = await new Promise<string>((resolve, reject) => {
      let settled = false
      gis.initialize({
        client_id: clientId,
        callback: (resp: { credential?: string }) => {
          if (settled) {
            return
          }
          settled = true
          if (resp?.credential) {
            resolve(resp.credential)
          }
          else {
            reject(new Error('Google did not return a credential'))
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      gis.prompt()
      // Safety net: if the One Tap UI is silently dismissed (cookies
      // disabled, ITP, etc.), unblock after a long timeout so the
      // "Connect" button doesn't stay in busy state forever.
      setTimeout(() => {
        if (!settled) {
          settled = true
          reject(new Error('Google sign-in was dismissed'))
        }
      }, 120_000)
    })

    const res = await fetch('/v3/auth/google/link', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (!res.ok) {
      const detail = await readErrorDetail(res)
      if (res.status === 409) {
        setError('google', labels.value.feedback?.conflict ?? detail)
      }
      else if (res.status === 400) {
        setError('google', labels.value.feedback?.replace ?? detail)
      }
      else {
        setError('google', detail)
      }
      return
    }
    await refreshUser()
  }
  catch (error: any) {
    setError('google', error?.message ?? 'Google sign-in failed')
  }
  finally {
    state.google.busy = false
  }
}

async function disconnectGoogle() {
  await disconnect('google', '/v3/auth/google/link')
}

// ---- Apple ----
let appleSdkPromise: Promise<void> | null = null
function loadAppleSdk(): Promise<void> {
  if (appleSdkPromise) {
    return appleSdkPromise
  }
  appleSdkPromise = new Promise<void>((resolve, reject) => {
    if (appleAuth()) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-apple-auth]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Apple JS SDK')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
    script.async = true
    script.defer = true
    script.dataset.appleAuth = '1'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Apple JS SDK')), { once: true })
    document.head.append(script)
  })
  return appleSdkPromise
}

async function connectApple() {
  if (state.apple.busy) {
    return
  }
  const config = useRuntimeConfig()
  const clientId = config.public.appleServiceId
  if (!clientId) {
    setError('apple', 'Apple Service ID is not configured.')
    return
  }
  setError('apple', null)
  state.apple.busy = true
  try {
    await loadAppleSdk()
    const apple = appleAuth()
    if (!apple) {
      throw new Error('Apple SDK unavailable')
    }
    const nonce = randomNonce()
    apple.init({
      clientId,
      scope: 'name email',
      redirectURI: `${globalThis.location.origin}/v3/auth/apple/callback`,
      state: randomNonce(16),
      nonce,
      usePopup: true,
    })
    const credential = await apple.signIn()
    const idToken = credential.authorization?.id_token
    if (!idToken) {
      throw new Error('Apple did not return an identity token')
    }
    const res = await fetch('/v3/auth/apple/link', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_token: idToken, nonce }),
    })
    if (!res.ok) {
      const detail = await readErrorDetail(res)
      if (res.status === 409) {
        setError('apple', labels.value.feedback?.conflict ?? detail)
      }
      else if (res.status === 400) {
        setError('apple', labels.value.feedback?.replace ?? detail)
      }
      else {
        setError('apple', detail)
      }
      return
    }
    await refreshUser()
  }
  catch (error: any) {
    if (error?.error === 'popup_closed_by_user' || error?.error === 'user_cancelled_authorize') {
      // User-cancelled: surface no error.
    }
    else {
      setError('apple', error?.message ?? 'Apple sign-in failed')
    }
  }
  finally {
    state.apple.busy = false
  }
}

async function disconnectApple() {
  await disconnect('apple', '/v3/auth/apple/link')
}

// ---- Shared disconnect ----
async function disconnect(key: ProviderKey, url: string) {
  if (state[key].busy) {
    return
  }
  setError(key, null)
  state[key].busy = true
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'same-origin' })
    if (!res.ok) {
      setError(key, await readErrorDetail(res))
      return
    }
    await refreshUser()
  }
  catch (error: any) {
    setError(key, error?.message ?? 'Disconnect failed')
  }
  finally {
    state[key].busy = false
  }
}
</script>

<template>
  <PanelSection num="08" :title="labels.title" meta="oauth · identity" flush>
    <template #icon>
      <i class="i-tabler-link text-[15px] text-ct-fg-muted" />
    </template>

    <div class="conn-section">
      <p class="conn-desc">
        {{ labels.description }}
      </p>

      <div v-if="initialFeedback" class="conn-banner" :data-kind="initialFeedback.kind">
        <i :class="initialFeedback.kind === 'ok' ? 'i-tabler-check' : 'i-tabler-alert-triangle'" />
        <span>
          {{ initialFeedback.kind === 'ok'
            ? (labels.feedback?.ok ?? 'Account linked.')
            : initialFeedback.kind === 'conflict'
              ? (labels.feedback?.conflict ?? 'That identity is already linked to a different account.')
              : (labels.feedback?.replace ?? 'Disconnect the existing identity first.') }}
        </span>
      </div>

      <ul class="conn-list">
        <li>
          <div class="conn-row">
            <i class="i-eva-github-fill conn-icon" />
            <div class="conn-meta">
              <div class="conn-name">
                GitHub
              </div>
              <div class="conn-status" :data-on="links.github">
                {{ links.github ? labels.connected : labels.notConnected }}
              </div>
            </div>
            <div class="conn-cta">
              <UButton
                v-if="!links.github"
                variant="secondary"
                icon-left="i-tabler-link"
                :loading="state.github.busy"
                @click="connectGithub"
              >
                {{ labels.connect }}
              </UButton>
              <UButton
                v-else
                variant="ghost"
                icon-left="i-tabler-unlink"
                :disabled="connectedCount <= 1 || state.github.busy"
                :loading="state.github.busy"
                :title="connectedCount <= 1 ? labels.lastProviderHint : ''"
                @click="disconnectGithub"
              >
                {{ labels.disconnect }}
              </UButton>
            </div>
          </div>
          <p v-if="state.github.error" class="conn-error">
            {{ state.github.error }}
          </p>
        </li>

        <li>
          <div class="conn-row">
            <i class="i-logos-google-icon conn-icon" />
            <div class="conn-meta">
              <div class="conn-name">
                Google
              </div>
              <div class="conn-status" :data-on="links.google">
                {{ links.google ? labels.connected : labels.notConnected }}
              </div>
            </div>
            <div class="conn-cta">
              <UButton
                v-if="!links.google"
                variant="secondary"
                icon-left="i-tabler-link"
                :loading="state.google.busy"
                @click="connectGoogle"
              >
                {{ labels.connect }}
              </UButton>
              <UButton
                v-else
                variant="ghost"
                icon-left="i-tabler-unlink"
                :disabled="connectedCount <= 1 || state.google.busy"
                :loading="state.google.busy"
                :title="connectedCount <= 1 ? labels.lastProviderHint : ''"
                @click="disconnectGoogle"
              >
                {{ labels.disconnect }}
              </UButton>
            </div>
          </div>
          <p v-if="state.google.error" class="conn-error">
            {{ state.google.error }}
          </p>
        </li>

        <li>
          <div class="conn-row">
            <i class="i-tabler-brand-apple conn-icon" />
            <div class="conn-meta">
              <div class="conn-name">
                Apple
              </div>
              <div class="conn-status" :data-on="links.apple">
                {{ links.apple ? labels.connected : labels.notConnected }}
              </div>
            </div>
            <div class="conn-cta">
              <UButton
                v-if="!links.apple"
                variant="secondary"
                icon-left="i-tabler-link"
                :loading="state.apple.busy"
                @click="connectApple"
              >
                {{ labels.connect }}
              </UButton>
              <UButton
                v-else
                variant="ghost"
                icon-left="i-tabler-unlink"
                :disabled="connectedCount <= 1 || state.apple.busy"
                :loading="state.apple.busy"
                :title="connectedCount <= 1 ? labels.lastProviderHint : ''"
                @click="disconnectApple"
              >
                {{ labels.disconnect }}
              </UButton>
            </div>
          </div>
          <p v-if="state.apple.error" class="conn-error">
            {{ state.apple.error }}
          </p>
        </li>
      </ul>
    </div>
  </PanelSection>
</template>

<style scoped>
.conn-section {
  padding: 1rem 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.conn-desc {
  font-size: 12.5px;
  letter-spacing: 0.02em;
  line-height: 1.7;
  color: var(--ct-fg-muted);
}
.conn-banner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: var(--ct-text-sm);
  background: var(--ct-surface-1);
  border: 1px solid var(--ct-border-subtle);
}
.conn-banner[data-kind="ok"] {
  color: var(--r-color-secondary-1, #10b981);
  background-color: color-mix(in srgb, var(--r-color-secondary-1, #10b981) 12%, transparent);
  border-color: transparent;
}
.conn-banner[data-kind="conflict"],
.conn-banner[data-kind="replace"] {
  color: var(--ct-danger);
  background-color: color-mix(in srgb, var(--ct-danger) 12%, transparent);
  border-color: transparent;
}
.conn-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.conn-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--ct-border-subtle);
}
.conn-list > li:first-child .conn-row {
  border-top: 0;
}
.conn-icon {
  font-size: 22px;
  color: var(--ct-fg-muted);
}
.conn-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.conn-name {
  font-size: var(--ct-text-md);
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}
.conn-status {
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.05em;
  color: var(--ct-fg-subtle);
}
.conn-status[data-on="true"] {
  color: var(--r-color-secondary-1, #10b981);
}
.conn-cta {
  display: inline-flex;
  align-items: center;
}
.conn-error {
  margin: 0 0 8px 46px;
  font-size: var(--ct-text-xs);
  color: var(--ct-danger);
}
</style>
