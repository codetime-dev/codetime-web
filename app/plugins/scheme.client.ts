// Client-side colour-scheme controller. Hydrates the persisted preference,
// reflects it to <html data-scheme>, persists explicit changes, and follows
// OS-level prefers-color-scheme when the user picks 'system'. The plugin runs
// once on app boot so the listeners exist before any component mounts —
// `useSchemeString` is then a thin accessor returning the shared ref.
import type { SchemeString } from '~/composables/useScheme'

const STORAGE_KEY = 'scheme'
const SUPPORTED = ['light', 'dark', 'system'] as const

function resolveSystem(): 'light' | 'dark' {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// `animate=true` cross-fades the swap via .is-theme-switching (suppresses
// transitions for one paint), so colour-mix values don't flash mid-tween.
function applyScheme(scheme: SchemeString, animate = false) {
  const real = scheme === 'system' ? resolveSystem() : scheme
  const root = document.documentElement
  if (animate && root.dataset.scheme !== real) {
    root.classList.add('is-theme-switching')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('is-theme-switching')
      })
    })
  }
  root.dataset.scheme = real
}

export default defineNuxtPlugin(() => {
  const state = useState<SchemeString>('app-scheme', () => 'system')

  const saved = localStorage.getItem(STORAGE_KEY) as SchemeString | null
  if (saved && SUPPORTED.includes(saved)) {
    state.value = saved
  }
  applyScheme(state.value)

  watch(state, (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, v)
    }
    catch { /* private mode */ }
    applyScheme(v, true)
  })

  const mq = matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (state.value === 'system') {
      applyScheme('system', true)
    }
  })
})
