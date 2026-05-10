// Lightweight color-scheme management. Replaces @roku-ui/vue's
// useSchemeString/RokuProvider so the landing bundle no longer pulls in the
// entire Roku Vue runtime.
//
// Source of truth on the client is the `data-scheme` attribute on <html>.
// CSS in app/assets/tokens.css already keys off `html[data-scheme="light"]`
// and `html[data-scheme="dark"]`, with `prefers-color-scheme: dark` as the
// default. The user preference is persisted in localStorage under
// `scheme` (matches the legacy Roku key for migration safety).

const STORAGE_KEY = 'scheme'
const SUPPORTED = ['light', 'dark', 'system'] as const
export type SchemeString = typeof SUPPORTED[number]

function resolveSystem(): 'light' | 'dark' {
  if (globalThis.window === undefined) {
 return 'light'
}
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyScheme(scheme: SchemeString) {
  if (typeof document === 'undefined') {
 return
}
  const real = scheme === 'system' ? resolveSystem() : scheme
  document.documentElement.dataset.scheme = real
}

export function useSchemeString() {
  const state = useState<SchemeString>('app-scheme', () => 'system')

  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem(STORAGE_KEY) as SchemeString | null
      if (saved && SUPPORTED.includes(saved)) {
 state.value = saved
}
      applyScheme(state.value)
      const mq = globalThis.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
 if (state.value === 'system') {
 applyScheme('system')
}
}
      mq.addEventListener('change', handler)
      onUnmounted(() => mq.removeEventListener('change', handler))
    })
    watch(state, (v) => {
      try {
 localStorage.setItem(STORAGE_KEY, v)
}
 catch { /* private mode */ }
      applyScheme(v)
    })
  }

  return state
}
