<script setup lang="ts">
import LoginButton from '~/components/LoginButton.vue'

// CLI login bridge (device-code flow). `codetime login` opens this page
// with `?code=<userCode>` and polls the server in the background. When a
// signed-in user clicks Authorize, we POST that code to the approve
// endpoint, which stamps the user onto the pending row; the CLI's next
// poll then receives the upload token. See:
//   server/routes/v3/agent/cli/link/approve.post.ts
//   codetime-cli/packages/cli/src/lib/login.ts
//
// A standalone page (no marketing chrome), intentionally NOT under
// [locale]: the CLI hard-codes `/cli/auth` and there is no translatable
// marketing copy here.
definePageMeta({ layout: false })
useHead({ title: 'Authorize CLI · Code Time' })

const route = useRoute()
const user = useUser()
const userPending = inject<Ref<boolean>>('user-pending', ref(false))

const code = computed(() => {
  const raw = Array.isArray(route.query.code) ? route.query.code[0] : route.query.code
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null
})

type Phase = 'idle' | 'submitting' | 'done' | 'error'
const phase = ref<Phase>('idle')
const errorMessage = ref('')

async function authorize() {
  if (!code.value) {
    return
  }
  phase.value = 'submitting'
  try {
    const res = await fetch('/v3/agent/cli/link/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userCode: code.value }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { detail?: string } | null
      errorMessage.value = body?.detail ?? 'This login code is invalid or has expired.'
      phase.value = 'error'
      return
    }
    phase.value = 'done'
  }
  catch {
    errorMessage.value = 'Network error — check your connection and try again.'
    phase.value = 'error'
  }
}
</script>

<template>
  <div class="cli-auth">
    <div class="cli-auth__card">
      <div class="cli-auth__brand">
        Code Time CLI
      </div>

      <template v-if="!code">
        <h1>Invalid request</h1>
        <p>
          This page is opened by <code>codetime login</code>. Run that command
          in your terminal to start over.
        </p>
      </template>

      <template v-else-if="phase === 'done'">
        <h1>Authorized</h1>
        <p>You can close this tab and return to your terminal.</p>
      </template>

      <ClientOnly>
        <template v-if="code && phase !== 'done'">
          <template v-if="userPending">
            <h1>One moment…</h1>
            <p>Checking your session.</p>
          </template>

          <template v-else-if="!user">
            <h1>Sign in to continue</h1>
            <p>Sign in to authorize the Code Time CLI on this device.</p>
            <LoginButton />
          </template>

          <template v-else>
            <h1>Authorize this device?</h1>
            <p>
              A terminal is requesting access as
              <strong>@{{ user.username }}</strong>. Confirm the code shown in
              your terminal matches:
            </p>
            <div class="cli-auth__code">
              {{ code }}
            </div>
            <button
              class="cli-auth__btn"
              :disabled="phase === 'submitting'"
              @click="authorize"
            >
              {{ phase === 'submitting' ? 'Authorizing…' : 'Authorize' }}
            </button>
            <p v-if="phase === 'error'" class="cli-auth__error">
              {{ errorMessage }}
            </p>
          </template>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.cli-auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: var(--ct-surface, #0b0b0f);
  color: var(--ct-fg, #e7e7ea);
}
.cli-auth__card {
  width: 100%;
  max-width: 26rem;
  padding: 2.5rem;
  border: 1px solid var(--ct-border, #26262e);
  border-radius: 16px;
  background: var(--ct-surface-1, #131319);
  text-align: center;
}
.cli-auth__brand {
  font-family: var(--ct-font-mono, ui-monospace, monospace);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ct-fg-muted, #8a8a95);
  margin-bottom: 1.25rem;
}
.cli-auth h1 {
  font-size: 1.35rem;
  margin: 0 0 0.6rem;
}
.cli-auth p {
  margin: 0 0 1.25rem;
  line-height: 1.6;
  color: var(--ct-fg-muted, #a8a8b3);
}
.cli-auth code {
  font-family: var(--ct-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
}
.cli-auth__code {
  font-family: var(--ct-font-mono, ui-monospace, monospace);
  font-size: 1.6rem;
  letter-spacing: 0.35em;
  font-weight: 700;
  margin: 0 0 1.5rem;
  padding: 0.6rem 0;
  border-radius: 10px;
  background: var(--ct-surface-2, #1c1c24);
}
.cli-auth__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.7rem 1.25rem;
  border: none;
  border-radius: 999px;
  background: var(--ct-primary, #6366f1);
  color: var(--ct-on-primary, #fff);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 150ms ease;
}
.cli-auth__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.cli-auth__btn:hover:not(:disabled) {
  background: var(--ct-primary-hover, #6366f1);
  filter: brightness(1.04);
}
.cli-auth__error {
  margin: 1rem 0 0;
  color: #f87171;
  font-size: 0.9rem;
}
</style>
