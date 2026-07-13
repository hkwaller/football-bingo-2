import { slugify } from '@/lib/slugify'

/**
 * Country flags in public/logos/countries/ (from flagcdn, named by slugified
 * nationality). Regenerate with: npx tsx scripts/fetchLogos.ts
 */
const countryLogoSlugs = new Set([
  'algeria', 'angola', 'argentina', 'armenia', 'aruba', 'australia',
  'austria', 'barbados', 'belgium', 'benin', 'bosnia-herzegovina', 'brazil',
  'bulgaria', 'burundi', 'cameroon', 'canada', 'cape-verde', 'chile',
  'colombia', 'congo', 'cote-d-ivoire', 'croatia', 'czech-republic',
  'denmark', 'dr-congo', 'ecuador', 'egypt', 'england', 'eritrea', 'finland',
  'france', 'french-guiana', 'gabon', 'germany', 'ghana', 'guadeloupe',
  'guinea', 'guinea-bissau', 'hungary', 'iran', 'ireland', 'italy',
  'jamaica', 'japan', 'korea-south', 'kosovo', 'liberia', 'mali',
  'martinique', 'mexico', 'montenegro', 'morocco', 'netherlands', 'nigeria',
  'north-macedonia', 'norway', 'poland', 'portugal', 'romania', 'russia',
  'sao-tome-and-principe', 'scotland', 'senegal', 'serbia', 'sierra-leone',
  'slovakia', 'slovenia', 'spain', 'st-kitts-nevis', 'st-lucia', 'suriname',
  'sweden', 'switzerland', 'togo', 'trinidad-and-tobago', 'tunisia',
  'turkiye', 'ukraine', 'united-states', 'uruguay', 'venezuela', 'wales',
])

/** Name variants that don't slugify to the file name (files use players.ts spelling) */
const countryAliases: Record<string, string> = {
  'South Korea': 'korea-south',
  'Korea, South': 'korea-south',
  Turkey: 'turkiye',
  'Ivory Coast': 'cote-d-ivoire',
  USA: 'united-states',
  'Bosnia and Herzegovina': 'bosnia-herzegovina',
  'St. Kitts & Nevis': 'st-kitts-nevis',
  'St. Lucia': 'st-lucia',
}

export function getCountryLogo(name: string): string | null {
  const slug = countryAliases[name] ?? slugify(name)
  return countryLogoSlugs.has(slug) ? `/logos/countries/${slug}.png` : null
}
