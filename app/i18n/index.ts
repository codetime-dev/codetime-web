import type { Translation } from './type'
import { en } from './en'

// English is the universal fallback so it ships in the entry bundle. Every
// other locale is a separate Vite chunk loaded on demand from the active
// route's locale param — saves ~200KB on the landing page when the visitor
// is browsing in English.
const lazyLoaders: Record<string, () => Promise<Partial<Translation>>> = {
  'zh-CN': () => import('./zhCN').then(m => m.zhCN),
  'zh-TW': () => import('./zhTW').then(m => m.zhTW),
  'ja': () => import('./ja').then(m => m.ja),
  'pt-BR': () => import('./ptBR').then(m => m.ptBR),
  'it': () => import('./it').then(m => m.it),
  'ms': () => import('./ms').then(m => m.ms),
  'ru': () => import('./ru').then(m => m.ru),
  'ua': () => import('./ua').then(m => m.ua),
  'es': () => import('./es').then(m => m.es),
  'fr': () => import('./fr').then(m => m.fr),
  'de': () => import('./de').then(m => m.de),
}

export const locales = ['en', ...Object.keys(lazyLoaders)]

function mergeI18N(a: any, b: any): Translation {
  const result: any = { ...a }
  for (const key in b) {
    if (Object.hasOwn(b, key)) {
      if (Object.hasOwn(result, key)) {
        if (typeof result[key] === 'object' && typeof b[key] === 'object') {
 result[key] = mergeI18N(result[key], b[key])
}
      }
      else {
        result[key] = b[key]
      }
    }
  }
  return result
}

// Per-locale promise cache so a chunk is fetched at most once per session.
const loadCache = new Map<string, Promise<Translation>>()

export function loadI18N(locale: string): Promise<Translation> {
  if (locale === 'en') {
 return Promise.resolve(en as Translation)
}
  let pending = loadCache.get(locale)
  if (pending) {
 return pending
}
  const loader = lazyLoaders[locale]
  pending = loader
    ? loader().then(data => mergeI18N(data, en))
    : Promise.resolve(en as Translation)
  loadCache.set(locale, pending)
  return pending
}

// Synchronous getter used for rendering. Translation objects contain function
// values (e.g. parametric strings) that devalue cannot serialize, so the
// state is held on the Nuxt app instance instead of the SSR payload. The
// global middleware below re-runs loadI18N on the client at hydration time —
// cheap because the chunk is already in cache from the SSR pass when the
// locale matches.
type I18NHolder = { _i18n?: Ref<Translation> }
export function useI18N(): Ref<Translation> {
  const app = useNuxtApp() as unknown as I18NHolder
  if (!app._i18n) {
 app._i18n = ref(en as Translation)
}
  return app._i18n
}

export function setI18N(value: Translation) {
  const ref_ = useI18N()
  ref_.value = value
}
