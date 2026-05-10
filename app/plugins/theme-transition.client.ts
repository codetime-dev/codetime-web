// Suppress transitions/animations when the color scheme flips, so dual-tone
// interpolations don't flash through ugly intermediate colors.
// Covers: explicit toggles via ThemeItem (already wraps the change itself) and
// OS-level prefers-color-scheme changes when the user follows system theme.
export default defineNuxtPlugin(() => {
  if (globalThis.window === undefined) {
    return
  }

  const root = document.documentElement
  const suspend = () => {
    root.classList.add('is-theme-switching')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('is-theme-switching')
      })
    })
  }

  const mq = globalThis.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', suspend)
})
