/**
 * The one switch for ads. Adsterra is off unless its env vars are set: with
 * neither set there is no banner, no popunder, no "Remove ads" link and no
 * ad-free page, on the website and in the native app alike (the app loads the
 * same site). Turn ads off by removing the vars on Vercel and redeploying.
 *
 * NEXT_PUBLIC_ vars are inlined at build time, so these are plain constants.
 */
export const ADSTERRA_BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY ?? ''
export const ADSTERRA_POPUNDER_SRC = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC ?? ''

/** True when at least one ad unit is configured. Gates the whole ad-free upsell too. */
export const ADS_ENABLED = Boolean(ADSTERRA_BANNER_KEY || ADSTERRA_POPUNDER_SRC)

/** Gate wrapper markup (spacing divs) around <AdsterraBanner> with this, or it leaves a gap. */
export const BANNER_ENABLED = Boolean(ADSTERRA_BANNER_KEY)
