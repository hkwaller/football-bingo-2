/**
 * Canonical site origin for metadata, sitemap, robots and OG images.
 *
 * Prefers an explicit NEXT_PUBLIC_APP_URL (set this to the real domain in the
 * Vercel production env), then falls back to the Vercel-provided production URL,
 * then localhost for dev. Always an absolute origin with no trailing slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '')

export const SITE_NAME = 'Football Bingo'

export const SITE_DESCRIPTION =
  'The football knowledge game. A player is drawn, slap him on the right square — club, nation or honour — and race to a line. Play Bingo, Trivia and Tenable solo or in a full room. No luck, just football knowledge.'
