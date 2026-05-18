// Defensive fallback for the deploy race that caused the 2026-05-18 incident:
// Nitro's publicAssets handler returns 500 (ENOENT) when an old client still
// references a `_nuxt/<hash>` chunk that the new build replaced. The error
// response inherits the `cache-control: public, max-age=31536000, immutable`
// header Nitro configures for `_nuxt/**` (set before the file is read), so
// Cloudflare pins the broken response at the edge for a year.
//
// The real fixes are (a) a non-destructive deploy that keeps old chunks
// around (see scripts/deploy.sh) and (b) a Cloudflare cache rule that
// bypasses `_nuxt/*` responses with status >= 400. This plugin is the
// in-app safety net for whenever either of those is bypassed.
//
// We hook both `beforeResponse` (normal path) and `error` (unhandled
// throws from publicAssets handler) because the latter fires without the
// former for thrown ENOENT.
function rewriteIfAssetError(event: any) {
  const path = event?.path
  if (typeof path !== 'string' || !path.startsWith('/_nuxt/')) {
    return
  }
  const status = event?.node?.res?.statusCode
  if (typeof status !== 'number' || status < 400) {
    return
  }
  try {
    event.node.res.setHeader('cache-control', 'no-store, must-revalidate')
    event.node.res.setHeader('cdn-cache-control', 'no-store')
  }
  catch {
    // headers already flushed — nothing we can do
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    rewriteIfAssetError(event)
  })
  nitroApp.hooks.hook('error', (_error, { event }) => {
    if (event) {
      rewriteIfAssetError(event)
    }
  })
})
