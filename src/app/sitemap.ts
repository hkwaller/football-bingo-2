import type { MetadataRoute } from 'next'
import { ADS_ENABLED } from '@/lib/ads'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable pages only. Private rooms, live game runtime and auth
  // pages are intentionally excluded (and disallowed in robots.ts).
  const routes = ['/privacy', '/terms',
    '/', // home
    '/games', // public rules and previews for every game mode
    ...(ADS_ENABLED ? ['/go-ad-free'] : []), // pricing / remove ads
    '/credits', // photo credits
  ]

  return routes.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
  }))
}
