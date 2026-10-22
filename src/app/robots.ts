import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Page routes must be crawlable for their noindex metadata to be read.
        // Authentication still controls account access; robots is not access control.
        // Keep render-critical /_next assets crawlable too.
        disallow: ['/api/', '/ingest/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
