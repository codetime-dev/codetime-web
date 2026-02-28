import type { SitemapUrlInput } from '#sitemap/types'
import { locales } from '~/i18n'

export default defineSitemapEventHandler(async () => {
  const urls: SitemapUrlInput[] = []

  // Add homepage for all locales
  for (const locale of locales) {
    urls.push({
      loc: `/${locale}`,
      changefreq: 'daily',
      priority: 1,
      lastmod: new Date().toISOString(),
    })
  }

  // Add only leaderboard page from dashboard
  for (const locale of locales) {
    urls.push({
      loc: `/${locale}/dashboard/leaderboard`,
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })
  }

  // Add user profile pages
  // Note: In production, you might want to fetch this from your API
  // For now, adding some example user IDs
  // You can replace this with actual API calls to get user list
  const exampleUserIds = [1, 2, 3, 4, 5] // Replace with real user IDs from API

  for (const locale of locales) {
    for (const userId of exampleUserIds) {
      urls.push({
        loc: `/${locale}/user/${userId}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      })
    }
  }

  return urls
})
