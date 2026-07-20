// Downloads club crests and national-team crests from football-logos.cc
// into public/logos/{clubs,countries}/. Run with: npx tsx scripts/fetchLogos.ts
//
// Logo asset URLs on the site are content-hashed, so we scrape each entity's
// page and pull the 256x256 PNG out of the HTML.
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { clubs } from '../src/data/clubs'
import { slugify } from '../src/lib/slugify'

const SITE = 'https://football-logos.cc'
const OUT_CLUBS = join(__dirname, '..', 'public', 'logos', 'clubs')
const OUT_COUNTRIES = join(__dirname, '..', 'public', 'logos', 'countries')

/** club id → page path on football-logos.cc */
const clubSlugs: Record<string, string> = {
  '985': 'england/manchester-united',
  '31': 'england/liverpool',
  '418': 'spain/real-madrid',
  '131': 'spain/barcelona',
  '27': 'germany/bayern-munchen',
  '583': 'france/paris-saint-germain',
  '281': 'england/manchester-city',
  '631': 'england/chelsea',
  '506': 'italy/juventus',
  '11': 'england/arsenal',
  '5': 'italy/milan',
  '46': 'italy/inter',
  '16': 'germany/borussia-dortmund',
  '13': 'spain/atletico-madrid',
  '610': 'netherlands/ajax',
  '720': 'portugal/fc-porto',
  '294': 'portugal/benfica',
  '371': 'scotland/celtic',
  '124': 'scotland/rangers',
  '6195': 'italy/napoli',
  '148': 'england/tottenham',
  '189': 'argentina/boca-juniors',
  '209': 'argentina/river-plate',
  '244': 'france/marseille',
  '1041': 'france/lyon',
  '12': 'italy/roma',
  '29': 'england/everton',
  '405': 'england/aston-villa',
  '162': 'france/as-monaco',
  '379': 'england/west-ham',
  '15': 'germany/bayer-leverkusen',
  '368': 'spain/sevilla',
  '234': 'netherlands/feyenoord',
  '1061': 'usa/la-galaxy',
  '130': 'italy/parma',
  '1050': 'spain/villarreal',
  '180': 'england/southampton',
  '1003': 'england/leicester',
  '383': 'netherlands/psv',
  '36': 'turkey/fenerbahce',
  '762': 'england/newcastle',
  '164': 'england/blackburn-rovers',
}

/**
 * nationality (as spelled in players.ts) → flagcdn code.
 * Flags read instantly at small sizes, unlike national-team crests.
 * England/Scotland/Wales use GB subdivision codes.
 */
const countryFlags: Record<string, string> = {
  Algeria: 'dz',
  Angola: 'ao',
  Argentina: 'ar',
  Armenia: 'am',
  Aruba: 'aw',
  Australia: 'au',
  Austria: 'at',
  Barbados: 'bb',
  Belgium: 'be',
  Benin: 'bj',
  'Bosnia-Herzegovina': 'ba',
  Brazil: 'br',
  Bulgaria: 'bg',
  Burundi: 'bi',
  Cameroon: 'cm',
  Canada: 'ca',
  'Cape Verde': 'cv',
  Chile: 'cl',
  Colombia: 'co',
  Congo: 'cg',
  "Cote d'Ivoire": 'ci',
  Croatia: 'hr',
  'Czech Republic': 'cz',
  'DR Congo': 'cd',
  Denmark: 'dk',
  Ecuador: 'ec',
  Egypt: 'eg',
  England: 'gb-eng',
  Eritrea: 'er',
  Finland: 'fi',
  France: 'fr',
  'French Guiana': 'gf',
  Gabon: 'ga',
  Germany: 'de',
  Ghana: 'gh',
  Guadeloupe: 'gp',
  Guinea: 'gn',
  'Guinea-Bissau': 'gw',
  Hungary: 'hu',
  Iran: 'ir',
  Ireland: 'ie',
  Italy: 'it',
  Jamaica: 'jm',
  Japan: 'jp',
  'Korea, South': 'kr',
  Kosovo: 'xk',
  Liberia: 'lr',
  Mali: 'ml',
  Martinique: 'mq',
  Mexico: 'mx',
  Montenegro: 'me',
  Morocco: 'ma',
  Netherlands: 'nl',
  Nigeria: 'ng',
  'North Macedonia': 'mk',
  Norway: 'no',
  Poland: 'pl',
  Portugal: 'pt',
  Romania: 'ro',
  Russia: 'ru',
  'Sao Tome and Principe': 'st',
  Scotland: 'gb-sct',
  Senegal: 'sn',
  Serbia: 'rs',
  'Sierra Leone': 'sl',
  Slovakia: 'sk',
  Slovenia: 'si',
  Spain: 'es',
  'St. Kitts & Nevis': 'kn',
  'St. Lucia': 'lc',
  Suriname: 'sr',
  Sweden: 'se',
  Switzerland: 'ch',
  Togo: 'tg',
  'Trinidad and Tobago': 'tt',
  Tunisia: 'tn',
  Türkiye: 'tr',
  Ukraine: 'ua',
  'United States': 'us',
  Uruguay: 'uy',
  Venezuela: 've',
  Wales: 'gb-wls',
}

// assets.football-logos.cc rejects requests without a browser UA + referer
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Referer: `${SITE}/`,
}

async function fetchLogoUrl(pagePath: string): Promise<string | null> {
  const res = await fetch(`${SITE}/${pagePath}/`, { headers: FETCH_HEADERS })
  if (!res.ok) return null
  const html = await res.text()
  const entitySlug = pagePath.split('/').pop()!
  // Not every page publishes every size - take the smallest available
  for (const size of ['256x256', '512x512', '700x700', '1500x1500']) {
    const re = new RegExp(
      `https://assets\\.football-logos\\.cc/logos/[a-z-]+/${size}/${entitySlug}\\.[a-f0-9]+\\.png`,
    )
    const m = html.match(re)
    if (m) return m[0]
  }
  return null
}

async function download(url: string, dest: string): Promise<boolean> {
  const res = await fetch(url, { headers: FETCH_HEADERS })
  if (!res.ok) return false
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  return true
}

async function main() {
  mkdirSync(OUT_CLUBS, { recursive: true })
  mkdirSync(OUT_COUNTRIES, { recursive: true })
  const failures: string[] = []

  for (const club of clubs) {
    const pagePath = clubSlugs[club.id]
    const dest = join(OUT_CLUBS, `${slugify(club.displayName)}.png`)
    if (existsSync(dest)) continue
    const logoUrl = pagePath ? await fetchLogoUrl(pagePath) : null
    if (!logoUrl || !(await download(logoUrl, dest))) {
      failures.push(`club: ${club.displayName}`)
      continue
    }
    console.log(`club ok: ${club.displayName}`)
  }

  for (const [country, code] of Object.entries(countryFlags)) {
    const dest = join(OUT_COUNTRIES, `${slugify(country)}.png`)
    if (existsSync(dest)) continue
    const logoUrl = `https://flagcdn.com/w160/${code}.png`
    if (!(await download(logoUrl, dest))) {
      failures.push(`country: ${country}`)
      continue
    }
    console.log(`country ok: ${country}`)
  }

  if (failures.length) {
    console.error('\nFAILED:\n' + failures.join('\n'))
    process.exit(1)
  }
  console.log('\nAll logos downloaded.')
}

main()
