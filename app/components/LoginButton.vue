<script setup lang="ts">
import type { UserSelfPublic } from '~/api/v3'
import NuxtLink from '~/i18n/NuxtLink'

const locale = useRoute().params.locale as string
const user = inject<Ref<UserSelfPublic | null>>('user', ref(null))
const t = useI18N()

const userPending = inject('user-pending')
const notLogin = computed(() => user.value === null || !userPending)

const isGitHubLoading = ref(false)

watchEffect(() => {
  if (notLogin.value && globalThis.window !== undefined) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    setTimeout(() => {
      document.head.append(script)
    }, 1000)
  }
})

// Handle GitHub OAuth
async function handleGitHubLogin() {
  isGitHubLoading.value = true

  try {
    const config = useRuntimeConfig()
    const clientId = config.public.githubClientId
    const scope = 'user:email'
    const state = Math.random().toString(36).slice(2, 15)

    // Store state for verification
    sessionStorage.setItem('github_oauth_state', state)
    sessionStorage.setItem('github_oauth_redirect', globalThis.location.href)

    const authUrl = `https://github.com/login/oauth/authorize?`
      + `client_id=${clientId}&`
      + `scope=${encodeURIComponent(scope)}&`
      + `state=${state}`

    globalThis.location.href = authUrl
  }
  catch (error) {
    console.error('GitHub OAuth initiation failed:', error)
    isGitHubLoading.value = false
  }
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
          <div class="flex">
            <NuxtLink
              key="demo"
              aria-label="demo"
              :to="`/${locale}/dashboard`"
              class="border-surface-border-low hover:bg-surface-low bg-surface-base px-4 py-3 border rounded-xl bg-transparent hidden transition-all"
            >
              <div class="text-sm flex gap-2 items-center">
                <i class="i-eva-bar-chart-outline h-4 w-4" />
                <span>
                  {{ t.landing.demo }}
                </span>
              </div>
            </NuxtLink>
          </div>
          <div class="flex flex-col gap-3 items-center">
            <div class="text-sm text-ct-fg-muted">
              {{ t.landing.login }}
            </div>
            <div class="flex gap-2">
              <div
                id="g_id_onload"
                class="hidden"
                data-itp_support="true"
                :data-client_id="$config.public.googleClientId"
                :data-login_uri="`${$config.public.apiHost}/v3/auth/google`"
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
