// Sets the user's saved color scheme on <html> as early as possible after
// hydration so the page does not flash the wrong palette during navigation.
// (For the very first paint, an inline pre-hydration script in
// nuxt.config.ts head would be needed; CSS prefers-color-scheme handles the
// dark/light fallback meanwhile.)
const STORAGE_KEY = 'scheme'

export default defineNuxtPlugin(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.scheme = saved
    }
    else {
      const dark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.dataset.scheme = dark ? 'dark' : 'light'
    }
  }
  catch { /* private mode */ }
})
