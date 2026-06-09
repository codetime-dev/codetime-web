<script setup lang="ts">
import type { UserSelfPublic } from '~/api/v3'
import NuxtLink from '~/i18n/NuxtLink'

declare global {
  // Apple JS SDK augments the global with this once `appleid.auth.js` loads.
  // Typed loosely — we only touch the two surface APIs we need.
  interface Window {
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void
        signIn: (overrides?: Record<string, unknown>) => Promise<{
          authorization: { id_token: string, code?: string, state?: string }
          user?: { email?: string, name?: { firstName?: string, lastName?: string } }
        }>
      }
    }
  }
}

const locale = useRoute().params.locale as string
const user = inject<Ref<UserSelfPublic | null>>('user', ref(null))
const userPending = inject<Ref<boolean>>('user-pending', ref(false))
const t = useI18N()

const isGitHubLoading = ref(false)
const isAppleLoading = ref(false)

// Google Identity Services posts the JWT credential to `data-login_uri`
// as an absolute URL. Use the current page origin so the request lands
// on the Nuxt backend that owns `/v3/auth/google` (and now mints the
// cross-subdomain auth cookie at codetime.dev).
const googleLoginUri = computed(() => {
  if (import.meta.client) {
    return `${globalThis.location.origin}/v3/auth/google`
  }
  return 'https://codetime.dev/v3/auth/google'
})

// Inject the GIS client script the moment the logged-out template branch
// has actually mounted `#g_id_onload`. Using a template ref instead of
// querying the document avoids the setup-time race we hit earlier where
// `await nextTick()` inside an immediate watch ran before the v-else-if
// branch was even chosen, so `document.querySelector('#g_id_onload')`
// returned null and the watcher silently bailed out.
//
// GIS auto-renders the button when its bootstrap script finds an
// `#g_id_onload` element already in the DOM, so we only need to make
// sure the element exists *before* the script tag is appended.
const onloadEl = useTemplateRef<HTMLElement>('onloadEl')
const gisInjected = ref(false)

function injectGis() {
  if (gisInjected.value) {
 return
}
  if (document.querySelector('script[data-gis-client]')) {
    gisInjected.value = true
    return
  }
  gisInjected.value = true
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.dataset.gisClient = '1'
  document.head.append(script)
}

watch(
  onloadEl,
  (el) => {
    if (import.meta.server) {
 return
}
    if (!el) {
 return
}
    injectGis()
  },
  { immediate: true, flush: 'post' },
)

// Sign in with Apple — popup mode.
// We let Apple's JS SDK pop up its system UI, receive the signed
// identity_token in JS, then POST it (plus the raw nonce so the server
// can verify it matches the JWT's `nonce` claim) to /v3/auth/apple. The
// backend mints the cookie pair and we reload to surface the signed-in
// state via the existing user injection.
let appleSdkPromise: Promise<void> | null = null
function loadAppleSdk(): Promise<void> {
  if (appleSdkPromise) {
    return appleSdkPromise
  }
  appleSdkPromise = new Promise<void>((resolve, reject) => {
    if (globalThis.AppleID?.auth) {
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

function randomNonce(byteCount = 32): string {
  const bytes = new Uint8Array(byteCount)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function handleAppleLogin() {
  if (isAppleLoading.value) {
    return
  }
  const config = useRuntimeConfig()
  const clientId = config.public.appleServiceId
  if (!clientId) {
    console.error('Apple Service ID is not configured (NUXT_PUBLIC_APPLE_SERVICE_ID)')
    return
  }
  isAppleLoading.value = true
  try {
    await loadAppleSdk()
    const nonce = randomNonce()
    globalThis.AppleID!.auth.init({
      clientId,
      scope: 'name email',
      redirectURI: `${globalThis.location.origin}/v3/auth/apple/callback`,
      state: randomNonce(16),
      nonce,
      usePopup: true,
    })
    const credential = await globalThis.AppleID!.auth.signIn()
    const id_token = credential.authorization?.id_token
    if (!id_token) {
      throw new Error('Apple did not return an identity token')
    }
    const fullName = credential.user?.name
      ? [credential.user.name.firstName, credential.user.name.lastName].filter(Boolean).join(' ').trim()
      : ''

    const res = await fetch('/v3/auth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        identity_token: id_token,
        nonce,
        email: credential.user?.email,
        full_name: fullName || undefined,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Apple sign-in failed: ${res.status} ${text}`)
    }
    // Reloading flips the inject<user>() ref via the existing fetch
    // chain — same approach the Google form_post flow relies on.
    globalThis.location.reload()
  }
  catch (error: any) {
    // Apple resolves the rejected promise with `{ error: 'popup_closed_by_user' }`
    // for a user-cancel; treat that as a no-op rather than a visible error.
    if (error?.error === 'popup_closed_by_user' || error?.error === 'user_cancelled_authorize') {
      // No-op
    }
    else {
      console.error('Apple sign-in failed:', error)
    }
  }
  finally {
    isAppleLoading.value = false
  }
}

// Handle GitHub OAuth — delegate to the server so it can mint an HttpOnly
// `state` cookie before redirecting to GitHub. The callback at
// /v3/auth/github verifies that cookie, which closes the OAuth Login-CSRF
// hole where an attacker pre-fetches a code and tricks a victim into
// hitting the callback to silently bind to the attacker's account.
function handleGitHubLogin() {
  isGitHubLoading.value = true
  // Unlike Google/Apple (which reload in place), GitHub leaves the page
  // for github.com, so pass the current path+query as return_to to land
  // back here afterwards — keeps flows like /cli/auth?port=&state= intact.
  // The server validates it to a root-relative path before honouring it.
  const returnTo = globalThis.location.pathname + globalThis.location.search
  globalThis.location.href = `/v3/auth/github/start?return_to=${encodeURIComponent(returnTo)}`
}
</script>

<template>
  <div
    class="flex flex-col h-96px items-center"
  >
    <ClientOnly>
      <div>
        <div
          v-if="userPending"
          class="h-96px"
        />
        <div
          v-else-if="!user"
          class="flex flex-col gap-8"
          style="color-scheme: light;"
        >
          <div class="flex flex-col gap-3 items-center">
            <div class="text-sm text-ct-fg-muted">
              {{ t.landing.login }}
            </div>
            <div class="flex gap-2">
              <div
                id="g_id_onload"
                ref="onloadEl"
                class="hidden"
                data-itp_support="true"
                :data-client_id="$config.public.googleClientId"
                :data-login_uri="googleLoginUri"
                data-nonce=""
              />
              <div
                class="g_id_signin"
                data-type="icon"
                data-shape="circle"
                data-theme="outline"
                data-text="signin_with"
                data-size="medium"
                data-locale="en-US"
              />
              <button
                key="github"
                aria-label="github"
                :disabled="isGitHubLoading"
                class="border border-[#dadce0] rounded-full bg-white flex h-32px w-32px transition-colors items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleGitHubLogin"
              >
                <i
                  v-if="!isGitHubLoading"
                  class="i-eva-github-fill bg-black h-5 w-5"
                />
                <i
                  v-else
                  class="i-eva-loader-outline bg-black h-5 w-5 animate-spin"
                />
              </button>
              <button
                v-if="$config.public.appleServiceId"
                key="apple"
                aria-label="apple"
                :disabled="isAppleLoading"
                class="border border-[#dadce0] rounded-full bg-black flex h-32px w-32px transition-colors items-center justify-center hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleAppleLogin"
              >
                <i
                  v-if="!isAppleLoading"
                  class="i-tabler-brand-apple bg-white h-5 w-5"
                />
                <i
                  v-else
                  class="i-eva-loader-outline bg-white h-5 w-5 animate-spin"
                />
              </button>
            </div>
          </div>
        </div>

        <div
          v-else-if="user"
          class="flex h-96px items-center"
        >
          <NuxtLink
            aria-label="dashboard"
            class="dashboard-cta"
            :to="`/${locale}/dashboard`"
          >
            <span class="dashboard-cta-avatar">
              <NuxtImg
                v-if="user.avatar"
                alt="avatar"
                :src="user.avatar"
                class="dashboard-cta-avatar-img"
              />
              <i v-else class="dashboard-cta-avatar-fallback i-tabler-user" />
            </span>
            <span class="dashboard-cta-text">
              <span class="dashboard-cta-hello">@{{ user.username }}</span>
              <span class="dashboard-cta-label">{{ t.landing.toDashboard }}</span>
            </span>
            <i class="dashboard-cta-arrow i-tabler-arrow-right" />
          </NuxtLink>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
.dashboard-cta {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 10px 22px 10px 10px;
  border: 1px solid var(--ct-border);
  border-radius: 999px;
  background: var(--ct-surface-1);
  color: var(--ct-fg);
  text-decoration: none;
  transition: background-color 200ms ease, border-color 200ms ease, transform 200ms ease;
}
.dashboard-cta:hover {
  background: var(--ct-surface-2);
  border-color: color-mix(in srgb, var(--ct-primary) 35%, transparent);
  transform: translateY(-1px);
}
.dashboard-cta-avatar {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--ct-surface-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dashboard-cta-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.dashboard-cta-avatar-fallback {
  font-size: 18px;
  color: var(--ct-fg-muted);
}
.dashboard-cta-text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  gap: 2px;
}
.dashboard-cta-hello {
  font-family: var(--ct-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
}
.dashboard-cta-label {
  font-family: var(--ct-font-sans);
  font-size: 15px;
  font-weight: var(--ct-weight-semibold);
  color: var(--ct-fg);
}
.dashboard-cta-arrow {
  font-size: 18px;
  color: var(--ct-primary);
  transition: transform 200ms ease;
}
.dashboard-cta:hover .dashboard-cta-arrow {
  transform: translateX(3px);
}
</style>

<style>
iframe {
  color-scheme: light !important;
}
</style>
