// Paths that must NOT be locale-redirected — they are agent/machine-readable
// resources served as-is at canonical URLs.
const AGENT_PATH_PREFIXES = [
  '/.well-known/',
  '/api/',
  '/ask',
  '/docs/api',
  '/v3/',
  '/mcp',
  '/llms.txt',
  '/index.md',
  '/openapi.json',
  '/openapi.yaml',
  '/ai-plugin.json',
  '/AGENTS.md',
  '/SKILL.md',
  '/schema-map.xml',
  '/robots.txt',
  '/sitemap.xml',
]

function isAgentPath(path: string): boolean {
  if (AGENT_PATH_PREFIXES.some(p => path === p || path.startsWith(p))) {
    return true
  }
  // Any path with a file extension (e.g. .json, .md, .txt) is treated as a
  // static/machine resource and skipped from i18n redirects.
  const last = path.split('/').pop() || ''
  return last.includes('.')
}

export default defineNuxtRouteMiddleware((to, from) => {
  try {
    if (isAgentPath(to.path)) {
      return
    }
    const locale = to.path.split('/')[1] || ''
    if (locales.includes(locale)) {
      return
    }
    if (from.path !== to.path) {
      return
    }

    const cookie = useCookie('locale')
    if (cookie.value && locales.includes(locale)) {
      return navigateTo(`/${cookie.value}${to.path}`, { redirectCode: 302 })
    }

    const headers = useRequestHeaders()
    let preferredLanguages = ['en']
    try {
      if (headers['accept-language']) {
        preferredLanguages = headers['accept-language'].split(',').map(d => d.split(';')[0] || '')
      }
    }
    catch (error) {
      console.error(error)
    }

    for (const preferredLanguage of preferredLanguages) {
      let trueLanguage = preferredLanguage
      if (trueLanguage === 'zh-HK' || trueLanguage === 'zh') {
        trueLanguage = 'zh-CN'
      }
      else if (trueLanguage === 'ja-JP' || trueLanguage === 'ja') {
        trueLanguage = 'ja'
      }

      if (trueLanguage !== 'en' && locales.includes(trueLanguage)) {
        return navigateTo(`/${trueLanguage}${to.path}`, { redirectCode: 302 })
      }
    }
    return navigateTo(`/en${to.path}`, { redirectCode: 302 })
  }
  catch (error) {
    console.error(error)
    return navigateTo(`/en${to.path}`, { redirectCode: 302 })
  }
})
