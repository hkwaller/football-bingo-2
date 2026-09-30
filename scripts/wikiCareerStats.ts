/**
 * Club career totals from English Wikipedia, used when Transfermarkt's stats
 * page comes back empty. The detailed-stats table is no longer in the HTML
 * (it is a client-rendered component), so the local API returns stats: [].
 *
 * Prefer the "Career total" row of the Career statistics → club table, whose
 * last pair is all-competition appearances and goals. Fall back to the
 * infobox totalcaps / totalgoals (often league-only, still a real career).
 */
import * as fs from 'fs'
import * as path from 'path'

export const ICON_FAME = 70
/** Below this, a Transfermarkt career is a stub (Pelé's 18 apps) or missing. */
export const TM_STUB_APPEARANCES = 50

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
    let row = clubLines[i]
    const next = clubLines[i + 1] ?? ''
    if (numbers(row).length < 2) row += '\n' + next
    if (/wdltot/i.test(row)) continue
    const nums = numbers(row)
    if (nums.length >= 2) {
      const appearances = nums[nums.length - 2]
      const goals = nums[nums.length - 1]
      if (appearances >= 20 && goals <= appearances) return { appearances, goals, via: 'table' }
    }
  }

  const infoboxEnd = wikitext.search(/\n==[^=]/)
  const infobox = infoboxEnd === -1 ? wikitext : wikitext.slice(0, infoboxEnd)
  const caps = infoboxField(infobox, 'totalcaps')
  const goals = infoboxField(infobox, 'totalgoals')
  if (caps != null && goals != null && caps >= 20 && goals <= caps) {
    return { appearances: caps, goals, via: 'infobox' }
  }
  return null
}

function infoboxField(infobox: string, key: string): number | null {
  const m = new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|<]+)`, 'i').exec(infobox)
  if (!m) return null
  const n = numbers(m[1])
  return n.length ? n[0] : null
}

async function wikiGet(params: Record<string, string>): Promise<any> {
  const url = `${WIKI}?${new URLSearchParams({ ...params, format: 'json' })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (res.status === 429) {
    await sleep(8000)
    return wikiGet(params)
  }
  if (!res.ok) throw new Error(`Wikipedia ${res.status} ${url}`)
  return res.json()
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWikitext(title: string): Promise<string | null> {
  const data = await wikiGet({
    action: 'parse',
    page: title,
    prop: 'wikitext',
    redirects: '1',
  })
  if (data.error) return null
  return data.parse?.wikitext?.['*'] ?? null
}

async function resolveArticle(name: string): Promise<{ page: string; text: string } | null> {
  const direct = await fetchWikitext(name)
  if (direct && /infobox football biography/i.test(direct)) return { page: name, text: direct }
  await sleep(1100)
  const search = await wikiGet({
    action: 'query',
    list: 'search',
    srsearch: `${name} footballer`,
    srlimit: '5',
  })
  const hits: { title: string }[] = search.query?.search ?? []
  for (const hit of hits) {
    await sleep(1100)
    const text = await fetchWikitext(hit.title)
    if (text && /infobox football biography/i.test(text)) return { page: hit.title, text }
  }
  return null
}

export async function wikiCareerFor(name: string): Promise<WikiCareer | null> {
  const article = await resolveArticle(name)
  if (!article) return null
  const parsed = parseClubCareer(article.text)
  return parsed ? { ...parsed, page: article.page } : null
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
// Club career totals from English Wikipedia for icons whose Transfermarkt
// stats are missing or a stub (under ${TM_STUB_APPEARANCES} appearances).

export const wikiCareerStats: Record<
  string,
  { appearances: number; goals: number; via: 'table' | 'infobox'; page: string }
> = ${JSON.stringify(stats, null, 2)}
`
  fs.writeFileSync(OUT, body)
}
