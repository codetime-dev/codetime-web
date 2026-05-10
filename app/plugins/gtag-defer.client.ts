// Defer gtag.js initialization until the user interacts with the page or the
// browser becomes idle. Keeps analytics off the critical render path so it no
// longer competes with the LCP element for main-thread time.
export default defineNuxtPlugin(() => {
  const { initialize } = useGtag()

  let started = false
  const start = () => {
    if (started)
      return
    started = true
    initialize()
    cleanup()
  }

  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
  const opts = { passive: true, once: true } as AddEventListenerOptions
  const cleanup = () => {
    for (const ev of events) window.removeEventListener(ev, start)
  }

  for (const ev of events) window.addEventListener(ev, start, opts)

  // Fallback: load when the browser is idle, capped at 5s.
  if ('requestIdleCallback' in window)
    (window as any).requestIdleCallback(start, { timeout: 5000 })
  else
    setTimeout(start, 4000)
})
