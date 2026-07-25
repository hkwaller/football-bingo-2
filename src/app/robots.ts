import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private game rooms, live game runtime, auth and account pages carry
        // no SEO value and shouldn't be crawled. /_next stays crawlable.
        disallow: [
          '/api/',
          '/account',
          '/sign-in',
          '/sign-up',
          '/play',
          '/room/',
          '/trivia/room/',
          '/trivia/play',
          '/tenable/room/',
          '/tenable/play',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
