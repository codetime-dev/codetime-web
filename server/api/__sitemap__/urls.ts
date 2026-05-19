import type { SitemapUrlInput } from '#sitemap/types'
import { locales } from '~/i18n'

export default defineSitemapEventHandler(async () => {
  const urls: SitemapUrlInput[] = []
  const now = new Date().toISOString()

  for (const locale of locales) {
    urls.push(
      {
        loc: `/${locale}`,
        changefreq: 'daily',
        priority: 1,
        lastmod: now,
      },
      {
        loc: `/${locale}/dashboard/leaderboard`,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: now,
      },
      {
        loc: `/${locale}/privacy`,
        changefreq: 'monthly',
        priority: 0.3,
        lastmod: now,
      },
      {
        loc: `/${locale}/terms`,
        changefreq: 'monthly',
        priority: 0.3,
        lastmod: now,
      },
    )
  }

  // User profile pages are publicly accessible but we do not actively
  // submit them to search engines via the sitemap — search engines can
  // still discover them by following links from the leaderboard. Avoid
  // listing specific user IDs here so we are not "publishing" a curated
  // list of identifiable users to crawlers.

  return urls
})
