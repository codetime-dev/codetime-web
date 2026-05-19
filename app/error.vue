<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const route = useRoute()

// `useLocale()` reads from route params, which won't exist when an unmatched
// path triggers this page (no `[locale]` was captured). Sniff the first path
// segment and fall back to `en` so all CTAs land on a real, translated route.
const supportedLocales = new Set([
  'en',
  'zh-CN',
  'zh-TW',
  'ja',
  'de',
  'es',
  'fr',
  'it',
  'ru',
  'ua',
  'ms',
  'pt-BR',
])
const locale = computed(() => {
  const seg = (route.path.split('/').find(Boolean) || '').trim()
  return supportedLocales.has(seg) ? seg : 'en'
})

const statusCode = computed(() => Number(props.error?.statusCode) || 404)
const isNotFound = computed(() => statusCode.value === 404)

const heading = computed(() => (isNotFound.value ? 'Page not found' : 'Something went wrong'))
const description = computed(() =>
  isNotFound.value
    ? 'The route you followed does not exist, was moved, or has been retired. Check the URL, or jump back to a known surface.'
    : 'An unexpected error occurred while rendering this page. You can try again or head back home.',
)

useSeoMeta({
  title: `${statusCode.value} · Code Time`,
  description: description.value,
  robots: 'noindex',
})

function goBack() {
  if (import.meta.client && globalThis.history.length > 1) {
    globalThis.history.back()
    return
  }
  clearError({ redirect: `/${locale.value}` })
}

function goHome() {
  clearError({ redirect: `/${locale.value}` })
}
</script>

<template>
  <NuxtLayout name="default">
    <main class="err-root">
      <div class="err-bg" aria-hidden="true">
        <div class="err-grid" />
        <div class="err-glow" />
      </div>

      <section class="err-panel">
        <div class="err-eyebrow">
          <span class="err-eyebrow-bracket">[</span>
          <span class="err-eyebrow-key">STATUS</span>
          <span class="err-eyebrow-sep">·</span>
          <span class="err-eyebrow-val">{{ statusCode }}</span>
          <span class="err-eyebrow-bracket">]</span>
        </div>

        <h1 class="err-code" aria-label="Error 404">
          <span class="err-digit err-digit-1">4</span>
          <span class="err-digit err-digit-2">0</span>
          <span class="err-digit err-digit-3">4</span>
        </h1>

        <h2 class="err-heading">
          {{ heading }}
        </h2>
        <p class="err-desc">
          {{ description }}
        </p>

        <div class="err-trace" role="status">
          <span class="err-trace-prompt">$</span>
          <span class="err-trace-cmd">codetime route resolve</span>
          <span class="err-trace-flag">--path</span>
          <span class="err-trace-path">{{ route.path }}</span>
          <span class="err-trace-arrow">→</span>
          <span class="err-trace-err">no match</span>
        </div>

        <div class="err-actions">
          <button
            type="button"
            class="err-btn err-btn-primary"
            @click="goHome"
          >
            <i class="i-tabler-home" />
            <span>Back to home</span>
          </button>
          <button
            type="button"
            class="err-btn err-btn-ghost"
            @click="goBack"
          >
            <i class="i-tabler-arrow-back-up" />
            <span>Go back</span>
          </button>
        </div>

        <nav class="err-quick" aria-label="Quick links">
          <NuxtLink :to="`/${locale}/dashboard`" class="err-quick-link">
            <i class="i-tabler-layout-dashboard" />
            Dashboard
          </NuxtLink>
          <span class="err-quick-sep">·</span>
          <NuxtLink :to="`/${locale}/demo`" class="err-quick-link">
            <i class="i-tabler-flask" />
            Live demo
          </NuxtLink>
          <span class="err-quick-sep">·</span>
          <NuxtLink :to="`/${locale}/dashboard/widgets`" class="err-quick-link">
            <i class="i-tabler-components" />
            Widgets
          </NuxtLink>
          <span class="err-quick-sep">·</span>
          <NuxtLink :to="`/${locale}/dashboard/leaderboard`" class="err-quick-link">
            <i class="i-tabler-trophy" />
            Leaderboard
          </NuxtLink>
        </nav>
      </section>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.err-root {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  overflow: hidden;
  isolation: isolate;
}

/* Layered ambient background — a faint dot grid behind a soft brand-tinted
   glow. Both sit under `z: 0` so the panel above stays crisp. */
.err-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.err-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--ct-border) 1px,
    transparent 0
  );
  background-size: 24px 24px;
  opacity: 0.45;
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}
.err-glow {
  position: absolute;
  left: 50%;
  top: 38%;
  width: min(900px, 90vw);
  aspect-ratio: 1.4 / 1;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 35% 40%, color-mix(in srgb, var(--ct-primary) 32%, transparent) 0%, transparent 55%),
    radial-gradient(circle at 70% 60%, color-mix(in srgb, var(--ct-primary) 18%, transparent) 0%, transparent 60%);
  filter: blur(40px);
  opacity: 0.7;
}

.err-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}

.err-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ct-fg-muted);
  padding: 6px 12px;
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-full);
  background: color-mix(in srgb, var(--ct-surface) 70%, transparent);
  backdrop-filter: blur(8px);
}
.err-eyebrow-bracket { color: color-mix(in srgb, var(--ct-primary) 60%, transparent); }
.err-eyebrow-key { color: var(--ct-fg-subtle); }
.err-eyebrow-sep { color: var(--ct-fg-disabled); }
.err-eyebrow-val {
  color: var(--ct-primary);
  font-weight: var(--ct-weight-bold);
  font-variant-numeric: tabular-nums;
}

.err-code {
  display: inline-flex;
  align-items: baseline;
  gap: clamp(0.05em, 1vw, 0.18em);
  margin: 6px 0 2px;
  font-family: var(--ct-font-mono);
  font-weight: var(--ct-weight-bold);
  font-size: clamp(7rem, 22vw, 14rem);
  line-height: 0.85;
  letter-spacing: -0.04em;
}
.err-digit {
  display: inline-block;
  background: linear-gradient(
    180deg,
    var(--ct-primary) 0%,
    color-mix(in srgb, var(--ct-primary) 55%, transparent) 100%
  );
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  animation: err-digit-in 700ms var(--ct-ease) both;
}
.err-digit-2 {
  color: var(--ct-fg);
  -webkit-text-fill-color: var(--ct-fg);
  animation-delay: 80ms;
}
.err-digit-1 { animation-delay: 0ms; }
.err-digit-3 { animation-delay: 160ms; }

/* Light scheme: same darker→brand ramp used on the landing title so the
   gradient reads on the soft-gray bg without going washed out. */
html[data-scheme="light"] .err-digit:not(.err-digit-2) {
  background: linear-gradient(
    180deg,
    var(--ct-brand-700) 0%,
    var(--ct-brand-500) 100%
  );
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

@keyframes err-digit-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.err-heading {
  margin: 4px 0 0;
  font-family: var(--ct-font-sans);
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: var(--ct-weight-semibold);
  letter-spacing: -0.01em;
  color: var(--ct-fg);
}
.err-desc {
  margin: 0;
  max-width: 38rem;
  font-size: var(--ct-text-md);
  line-height: var(--ct-leading-relaxed);
  color: var(--ct-fg-muted);
}

.err-trace {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 16px;
  font-family: var(--ct-font-mono);
  font-size: var(--ct-text-xs);
  letter-spacing: 0.02em;
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius-md);
  background: color-mix(in srgb, var(--ct-surface) 80%, transparent);
  backdrop-filter: blur(8px);
  max-width: 100%;
  overflow-x: auto;
}
.err-trace-prompt { color: var(--ct-primary); font-weight: var(--ct-weight-bold); }
.err-trace-cmd { color: var(--ct-fg); }
.err-trace-flag { color: var(--ct-fg-subtle); }
.err-trace-path {
  color: var(--ct-fg-muted);
  background: var(--ct-surface-1);
  padding: 2px 6px;
  border-radius: var(--ct-radius-xs);
  border: 1px solid var(--ct-border-subtle);
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.err-trace-arrow { color: var(--ct-fg-disabled); }
.err-trace-err {
  color: var(--ct-danger);
  font-weight: var(--ct-weight-medium);
}

.err-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 18px;
}
.err-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-family: var(--ct-font-sans);
  font-size: var(--ct-text-sm);
  font-weight: var(--ct-weight-medium);
  border-radius: var(--ct-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--ct-duration-fast) var(--ct-ease),
    border-color var(--ct-duration-fast) var(--ct-ease),
    transform var(--ct-duration-fast) var(--ct-ease),
    box-shadow var(--ct-duration-fast) var(--ct-ease);
}
.err-btn:active { transform: translateY(1px); }
.err-btn-primary {
  background: var(--ct-primary);
  color: var(--ct-on-primary);
  box-shadow: var(--ct-shadow-sm);
}
.err-btn-primary:hover { background: var(--ct-primary-hover); }
.err-btn-ghost {
  background: var(--ct-surface);
  color: var(--ct-fg);
  border-color: var(--ct-border);
}
.err-btn-ghost:hover {
  background: var(--ct-surface-1);
  border-color: var(--ct-border-strong);
}
.err-btn i { font-size: 16px; }

.err-quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed var(--ct-border-subtle);
  width: 100%;
  max-width: 30rem;
  font-size: var(--ct-text-xs);
}
.err-quick-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ct-fg-subtle);
  transition: color var(--ct-duration-fast) var(--ct-ease);
}
.err-quick-link:hover { color: var(--ct-primary); }
.err-quick-sep { color: var(--ct-fg-disabled); }

@media (prefers-reduced-motion: reduce) {
  .err-digit { animation: none; }
}
</style>
