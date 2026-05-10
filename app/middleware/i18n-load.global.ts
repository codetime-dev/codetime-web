import { loadI18N, locales, setI18N } from '~/i18n'

// Global middleware: ensures the i18n state is populated for the route's
// locale BEFORE the page renders, on both SSR and client navigation. The
// fetched chunk is cached per-locale, so successive navigations within the
// same language do no extra work.
export default defineNuxtRouteMiddleware(async (to) => {
  const seg = to.path.split('/')[1] || ''
  const locale = locales.includes(seg) ? seg : 'en'
  const data = await loadI18N(locale)
  setI18N(data)
})
