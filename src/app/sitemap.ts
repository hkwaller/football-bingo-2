import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable pages only. Private rooms, live game runtime and auth
  // pages are intentionally excluded (and disallowed in robots.ts).
  const routes = [
    '/', // home
    '/play/setup', // start a Bingo game
    '/trivia/setup', // start a Trivia game
    '/tenable/setup', // start a Tenable game
    '/go-ad-free', // pricing / remove ads
    '/credits', // photo credits
  ]

  return routes.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
  }))
}
