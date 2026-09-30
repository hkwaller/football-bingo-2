/**
 * Club career totals from English Wikipedia, used when Transfermarkt's stats
 * page comes back empty. The detailed-stats table is no longer in the HTML
 * (it is a client-rendered component), so the local API returns stats: [].
 *
 * Prefer the "Career total" row of the Career statistics → club table, whose
 * last pair is all-competition appearances and goals. Fall back to the
 * infobox totalcaps / totalgoals (often league-only, still a real career).
 */
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

/** Below this, a Transfermarkt career is a stub (Pelé's 18 apps) or missing. */
export const TM_STUB_APPEARANCES = 50
/** Ignore career totals smaller than this; a parsed "1" is usually a shirt number. */
const MIN_APPEARANCES = 5

const UA = 'FootballBingoCareerStats/1.0 (local dataset; wikipedia career totals)'
const WIKI = 'https://en.wikipedia.org/w/api.php'

export interface WikiCareer {
  appearances: number
  goals: number
  /** "table" = career-statistics total; "infobox" = totalcaps/totalgoals */
  via: 'table' | 'infobox'
  page: string
}

function stripMarkup(s: string): string {
  let out = s.replace(/<!--[\s\S]*?-->/g, '')
  for (let prev = ''; prev !== out; ) {
    prev = out
    out = out.replace(/\{\{[^{}]*\}\}/g, '')
  }
  return out.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '').replace(/<ref[^>]*\/>/gi, '')
}

function numbers(s: string): number[] {
  return [...stripMarkup(s).matchAll(/\d[\d,]*\+?/g)]
    .map((m) => parseInt(m[0].replace(/[,+]/g, ''), 10))
    .filter((n) => Number.isFinite(n))
}

function heading(line: string): { level: number; title: string } | null {
  const m = /^(={2,6})\s*(.*?)\s*\1\s*$/.exec(line)
  if (!m) return null
  return { level: m[1].length, title: m[2].trim().toLowerCase() }
}

/** Club career from a Wikipedia article's wikitext. Null when neither source parses. */
export function parseClubCareer(wikitext: string): Omit<WikiCareer, 'page'> | null {
  const lines = wikitext.split('\n')
  let inStats = false
  const clubLines: string[] = []
  for (const line of lines) {
    const h = heading(line)
    if (h) {
      if (h.level === 2 && h.title === 'career statistics') {
        inStats = true
        continue
      }
      if (inStats && h.level === 2) break
      if (inStats && h.level === 3 && h.title.startsWith('international')) break
    }
    if (inStats) clubLines.push(line)
  }

  for (let i = 0; i < clubLines.length; i++) {
    if (!/career total/i.test(clubLines[i])) continue
    // The total is often split across the next cells: per-competition pairs,
    // then a final apps/goals pair on its own line (`!737!!4`).
    let row = clubLines[i]
    for (let j = i + 1; j < clubLines.length && j <= i + 12; j++) {
      const extra = clubLines[j].trim()
      if (!extra.startsWith('!')) break
      if (!/\d/.test(extra)) continue
      row += '\n' + extra
    }
    if (/wdltot/i.test(row)) continue
    const nums = numbers(row)
    if (nums.length >= 2) {
      const appearances = nums[nums.length - 2]
      const goals = nums[nums.length - 1]
      if (plausible(appearances, goals)) return { appearances, goals, via: 'table' }
    }
  }

  const infobox = infoboxSlice(wikitext)
  const caps = infoboxField(infobox, 'totalcaps')
  const goals = infoboxField(infobox, 'totalgoals')
  if (caps != null && goals != null && plausible(caps, goals)) {
    return { appearances: caps, goals, via: 'infobox' }
  }
  return sumClubRows(infobox)
}

function plausible(appearances: number, goals: number): boolean {
  return appearances >= MIN_APPEARANCES && goals >= 0 && goals <= appearances * 2
}

/** Sum `| capsN` / `| goalsN` senior rows when the article has no career-total line. */
function sumClubRows(infobox: string): Omit<WikiCareer, 'page'> | null {
  const caps = new Map<number, number>()
  const goals = new Map<number, number>()
  for (const m of infobox.matchAll(/^\|\s*caps(\d+)\s*=\s*([^\n]*)/gim)) {
    const n = numbers(m[2])
    if (n.length) caps.set(parseInt(m[1], 10), n[0])
  }
  for (const m of infobox.matchAll(/^\|\s*goals(\d+)\s*=\s*([^\n]*)/gim)) {
    const n = numbers(m[2])
    if (n.length) goals.set(parseInt(m[1], 10), n[0])
  }
  if (!caps.size) return null
  let appearances = 0
  let goalsTotal = 0
  for (const [i, c] of caps) {
    appearances += c
    goalsTotal += goals.get(i) ?? 0
  }
  if (!plausible(appearances, goalsTotal)) return null
  return { appearances, goals: goalsTotal, via: 'infobox' }
}

function infoboxSlice(wikitext: string): string {
  const infoboxEnd = wikitext.search(/\n==[^=]/)
  return infoboxEnd === -1 ? wikitext : wikitext.slice(0, infoboxEnd)
}

function infoboxField(infobox: string, key: string): number | null {
  const m = new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|<]+)`, 'i').exec(infobox)
  if (!m) return null
  const n = numbers(m[1])
  return n.length ? n[0] : null
}

const RAW_CACHE = path.join(__dirname, 'output', 'wiki-raw')
let nextSlot = 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function pace() {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + 200
  if (wait) await sleep(wait)
}

async function wikiGet(params: Record<string, string>, attempt = 0): Promise<any> {
  await pace()
  const url = `${WIKI}?${new URLSearchParams({ ...params, format: 'json' })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (res.status === 429 && attempt < 6) {
    await sleep(5000 * (attempt + 1))
    return wikiGet(params, attempt + 1)
  }
  if (!res.ok) throw new Error(`Wikipedia ${res.status} ${url}`)
  return res.json()
}

export function cachedWikitext(title: string): string | null {
  const file = rawCachePath(title)
  if (!fs.existsSync(file)) return null
  const cached = fs.readFileSync(file, 'utf8')
  return cached === '' ? null : cached
}

function rawCachePath(title: string): string {
  const safe = title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 40)
  // Hash the whole title. A short prefix collided for names that only differ
  // by an accent or hyphen near the end (Handanovič / Handanović), so a redirect
  // stub was read back as the target article.
  const hash = createHash('sha1').update(title).digest('hex').slice(0, 12)
  return path.join(RAW_CACHE, `${safe}-${hash}.txt`)
}

async function fetchWikitext(
  title: string,
  attempt = 0,
  depth = 0,
): Promise<{ title: string; text: string } | null> {
  const file = rawCachePath(title)
  let text: string | null
  if (fs.existsSync(file)) {
    const cached = fs.readFileSync(file, 'utf8')
    text = cached === '' ? null : cached
  } else {
    await pace()
    const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}&action=raw`
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
    if (res.status === 429 && attempt < 6) {
      await sleep(5000 * (attempt + 1))
      return fetchWikitext(title, attempt + 1, depth)
    }
    fs.mkdirSync(RAW_CACHE, { recursive: true })
    if (res.status === 404) {
      fs.writeFileSync(file, '')
      return null
    }
    if (!res.ok) throw new Error(`Wikipedia raw ${res.status} ${title}`)
    const body = await res.text()
    if (body.startsWith('<!DOCTYPE') || body.startsWith('<html')) return null
    fs.writeFileSync(file, body)
    text = body
  }
  if (!text) return null
  const redir = /^#REDIRECT\s*\[\[([^\]|#]+)/i.exec(text)
  if (redir && depth < 3) {
    return fetchWikitext(redir[1].trim().replace(/_/g, ' '), 0, depth + 1)
  }
  return { title, text }
}

export interface WikiHint {
  name: string
  nationality: string
  birthYear: number | null
  clubs: string[]
}

const NAT_ALIASES: Record<string, string[]> = {
  netherlands: ['netherlands', 'holland', 'dutch'],
  'united states': ['united states', 'u.s.', 'usa', 'american'],
  'czech republic': ['czech'],
  "cote d'ivoire": ["cote d'ivoire", 'côte', 'ivory coast'],
  'south korea': ['south korea', 'korea republic', 'republic of korea'],
}

function birthYearOf(wikitext: string): number | null {
  const infobox = infoboxSlice(wikitext)
  const templ = infobox.match(/birth[_ ]date[^|\n]*\|(\d{4})\|/i)
  if (templ) return parseInt(templ[1], 10)
  const any = infobox.match(/birth[_ ]date\s*=\s*[^\n]*?(\d{4})/i)
  return any ? parseInt(any[1], 10) : null
}

function nationalityOk(wikitext: string, nationality: string): boolean {
  if (!nationality) return false
  const box = infoboxSlice(wikitext).toLowerCase()
  const key = nationality.toLowerCase()
  const aliases = NAT_ALIASES[key] ?? [key]
  return aliases.some((a) => box.includes(a))
}

function clubOk(wikitext: string, clubs: string[]): boolean {
  const box = infoboxSlice(wikitext).toLowerCase()
  return clubs.some((c) => {
    const token = c.replace(/^(fc|ac|as|cf|sc|ssc|afc)\s+/i, '').toLowerCase()
    return token.length > 3 && box.includes(token)
  })
}

const NAME_SKIP = new Set(['de', 'da', 'di', 'du', 'van', 'von', 'dos', 'del', 'der', 'bin', 'al'])

function foldName(s: string): string {
  return s
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ø/gi, 'o')
    .replace(/å/gi, 'a')
    .replace(/ł/gi, 'l')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/** The surname has to appear in the article title. Given names vary (Andrey/Andrei, Álex/Alejandro). */
export function nameInTitle(page: string, name: string): boolean {
  const title = foldName(page)
  const tokens = foldName(name)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !NAME_SKIP.has(t))
  if (!tokens.length) return false
  return title.includes(tokens[tokens.length - 1])
}

/**
 * Accept the article only when it is the same person. The title has to carry
 * the player's name, and a known birth year has to agree.
 */
export function articleFits(
  text: string,
  page: string,
  hint: WikiHint,
  /** The article was reached from the player's own name, including a Wikipedia redirect. */
  trustExact = false,
): boolean {
  if (!/infobox football biography/i.test(text)) return false
  if (!parseClubCareer(text)) return false
  // Our stored birth years are sometimes a year or two off. Don't let that veto
  // the article Wikipedia itself uses for this name.
  if (trustExact) return true
  if (!nameInTitle(page, hint.name)) return false
  const year = birthYearOf(text)
  if (hint.birthYear && year && Math.abs(hint.birthYear - year) > 1) return false
  if (hint.birthYear && year) return true
  if (nationalityOk(text, hint.nationality) || clubOk(text, hint.clubs)) return true
  const words = hint.name.trim().split(/\s+/).length
  return words >= 2 && page.toLowerCase().startsWith(hint.name.toLowerCase())
}

async function resolveArticle(hint: WikiHint): Promise<{ page: string; text: string } | null> {
  const direct = await fetchWikitext(hint.name)
  if (direct && articleFits(direct.text, direct.title, hint, true)) return direct
  const query = hint.birthYear
    ? `${hint.name} footballer ${hint.birthYear}`
    : `${hint.name} footballer`
  const search = await wikiGet({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
  })
  const hits: { title: string }[] = search.query?.search ?? []
  for (const hit of hits) {
    if (hit.title.toLowerCase() === hint.name.toLowerCase()) continue
    const article = await fetchWikitext(hit.title)
    if (article && articleFits(article.text, article.title, hint)) return article
  }
  return null
}

export async function wikiCareerFor(hint: WikiHint): Promise<WikiCareer | null> {
  const article = await resolveArticle(hint)
  if (!article) return null
  const parsed = parseClubCareer(article.text)
  return parsed ? { ...parsed, page: article.title } : null
}

const OUT = path.join(__dirname, 'data', 'wikiCareerStats.generated.ts')

export function readWikiCareerStats(): Record<string, WikiCareer> {
  if (!fs.existsSync(OUT)) return {}
  const src = fs.readFileSync(OUT, 'utf8')
  const m = /export const wikiCareerStats[^=]*=\s*(\{[\s\S]*\})\s*$/.exec(src)
  if (!m) return {}
  return JSON.parse(m[1])
}

export function writeWikiCareerStats(stats: Record<string, WikiCareer>) {
  const body = `// Auto-generated by scripts/fetchWikiCareerStats.ts — do not edit by hand.
// Club career totals from English Wikipedia for players whose Transfermarkt
// stats are missing or a stub (under ${TM_STUB_APPEARANCES} appearances).

export const wikiCareerStats: Record<
  string,
  { appearances: number; goals: number; via: 'table' | 'infobox'; page: string }
> = ${JSON.stringify(stats, null, 2)}
`
  fs.writeFileSync(OUT, body)
}
