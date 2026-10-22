import type { Metadata } from 'next'
import { GAME_MODES } from '@/lib/gameModes'

/**
 * Canonical site origin for metadata, sitemap, robots and OG images.
 *
 * Prefers an explicit NEXT_PUBLIC_APP_URL (set this to the real domain in the
 * Vercel production env), then falls back to the canonical Playam subdomain. Always an absolute origin with no trailing slash.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://bingo.playam.app').replace(/\/$/, '')

export const SITE_NAME = 'Football Bingo'

export const SITE_TITLE = `${SITE_NAME} - Football quizzes, solo or with friends`
export const MODE_NAMES = GAME_MODES.map((mode) => mode.title).join(', ')
export const SITE_DESCRIPTION =
  `Play ${MODE_NAMES}. Football quizzes and puzzles, solo or with friends in a browser. No sign-up needed to play.`

/** Public pages need their own social URL and copy, as well as a canonical. */
export function publicPageMetadata(title: string, description: string, path: string): Metadata {
  // Child openGraph/twitter objects replace the parent objects, including its
  // file-convention images. Point to the shared generated image explicitly.
  const image = {
    url: '/opengraph-image',
    width: 1200,
    height: 630,
    alt: `${SITE_NAME}: ${MODE_NAMES}. Solo or with friends.`,
  }
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  }
}

/** Inherited by setup, runtime, room and account routes, including client pages. */
export const PRIVATE_METADATA: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: null },
}
