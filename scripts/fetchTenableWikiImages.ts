/**
 * Fill Tenable portrait gaps from Wikipedia/Wikidata, looked up by NAME.
 *
 * `npm run tenable:verify` only finds portraits for players in the Kaggle CSV,
 * so legends (Matthews, Yashin, Rush...) have none. For each remaining answer
 * this finds the person's English Wikipedia article and takes its lead image
 * (`pilicense=free`, never fair-use) or, failing that, the Wikidata image
 * (P18, always a Commons file).
 *
 * A page is only accepted when it's the right kind of person: not a
 * disambiguation page, and either its short description mentions football or
 * Wikidata lists footballer/manager as an occupation (catches e.g. George
 * Weah, "President of Liberia"). Lookup order per answer: `wikiTitle` (author
 * override for ambiguous names), then name + aliases, then "<name>
 * (footballer)", then a search whose result title must match the name.
 *
 * Output: src/data/tenable/wikiImages.json - { "<normalized name or wikiTitle>": {title, image} }
 * Keyed by name, not rank, so it survives reorders and `tenable:verify` runs;
 * index.ts uses it as the fallback when enrichment.json has no image.
 * Resumable via scripts/output/tenableWikiCache.json; `--refresh` retries misses.
 *
 * Usage: npm run tenable:images [-- --refresh]
 */
import * as fs from 'fs'
import * as path from 'path'
import { normalize } from '../src/lib/tenable/normalize'
import { tenableQuestions as rawQuestions } from '../src/data/tenable/questions'
import { withOpenMembers } from '../src/data/tenable/openSets'
import enrichment from '../src/data/tenable/enrichment.json'

const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'tenable', 'wikiImages.json')
const CACHE_FILE = path.join(__dirname, 'output', 'tenableWikiCache.json')
const WIKIPEDIA = 'https://en.wikipedia.org/w/api.php'
const WIKIDATA = 'https://www.wikidata.org/w/api.php'
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const UA = 'football-bingo-image-fetch/1.0 (hannes@unfold.no)'
const THUMB_SIZE = 500
const CHUNK = 50
const FOOTBALL_RE = /football|soccer|goalkeeper|striker|midfielder|defender|forward/i
/** Wikidata occupations: association football player, association football manager. */
const FOOTBALL_OCCUPATIONS = new Set(['Q937857', 'Q628099'])

interface PageHit {
  title: string
  image: string
}
/** Cache per lookup key: a hit, or null = checked, nothing usable. */
type Cache = Record<string, PageHit | null>

interface PageInfo {
  title: string
  description: string
  thumb?: string
  qid?: string
}
interface Person {
  name: string
  aliases: string[]
  wikiTitle?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function chunks<T>(xs: T[], n = CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

async function api(base: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params })
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${base}?${qs}`, { headers: { 'User-Agent': UA } })
    if (res.ok) {
      await sleep(400)
      return res.json()
    }
    console.warn(`  ${new URL(base).host} ${res.status}; backing off ${10 * (attempt + 1)}s`)
    await sleep(10_000 * (attempt + 1))
  }
  throw new Error(`${base} kept failing`)
}

/** Follow the API's normalized/redirects hops from a requested title to its final page title. */
function hops(query: any): (title: string) => string {
  const hop = new Map<string, string>()
  for (const n of query?.normalized ?? []) hop.set(n.from, n.to)
  for (const r of query?.redirects ?? []) hop.set(r.from, r.to)
  return (t) => {
    for (let n = 0; n < 3 && hop.has(t); n++) t = hop.get(t)!
    return t
  }
}

/** Requested title → page info, or null when missing / a disambiguation page. */
async function fetchPages(titles: string[]): Promise<Map<string, PageInfo | null>> {
  const out = new Map<string, PageInfo | null>()
  for (const chunk of chunks(titles)) {
    const data = await api(WIKIPEDIA, {
      action: 'query',
      redirects: '1',
      titles: chunk.join('|'),
      prop: 'pageimages|description|pageprops',
      piprop: 'thumbnail',
      pithumbsize: String(THUMB_SIZE),
      pilicense: 'free',
      pilimit: 'max',
      ppprop: 'disambiguation|wikibase_item',
    })
    const final = hops(data.query)
    const pages = new Map<string, any>()
    for (const p of data.query?.pages ?? []) pages.set(p.title, p)
    for (const t of chunk) {
      const p = pages.get(final(t))
      const usable = p && !p.missing && p.pageprops && !('disambiguation' in p.pageprops)
      out.set(
        t,
        usable
          ? {
              title: p.title,
              description: p.description ?? '',
              thumb: p.thumbnail?.source,
              qid: p.pageprops.wikibase_item,
            }
          : null,
      )
    }
  }
  return out
}

/** QID → whether it's a footballer/manager, plus its Commons image filename (P18). */
async function fetchWikidata(
  qids: string[],
): Promise<Map<string, { footballer: boolean; file?: string }>> {
  const out = new Map<string, { footballer: boolean; file?: string }>()
  for (const chunk of chunks(qids)) {
    const data = await api(WIKIDATA, { action: 'wbgetentities', ids: chunk.join('|'), props: 'claims' })
    for (const [qid, e] of Object.entries<any>(data.entities ?? {})) {
      const occ = (e.claims?.P106 ?? []).map((c: any) => c.mainsnak?.datavalue?.value?.id)
      out.set(qid, {
        footballer: occ.some((id: string) => FOOTBALL_OCCUPATIONS.has(id)),
        file: e.claims?.P18?.[0]?.mainsnak?.datavalue?.value,
      })
    }
  }
  return out
}

/** Commons filename → sized thumbnail URL. */
async function commonsThumbs(files: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  for (const chunk of chunks(files)) {
    const data = await api(COMMONS, {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: String(THUMB_SIZE),
      titles: chunk.map((f) => `File:${f}`).join('|'),
    })
    const final = hops(data.query)
    const pages = new Map<string, any>()
    for (const p of data.query?.pages ?? []) pages.set(p.title, p)
    for (const f of chunk) {
      const thumb = pages.get(final(`File:${f}`))?.imageinfo?.[0]?.thumburl
      if (thumb) out.set(f, thumb)
    }
  }
  return out
}

/** For each key, the first candidate title that is a footballer with a free image. */
async function resolve(candidates: Map<string, string[]>): Promise<Map<string, PageHit | null>> {
  const pages = await fetchPages([...new Set([...candidates.values()].flat())])
  const existing = [...pages.values()].filter((p): p is PageInfo => !!p)
  const wd = await fetchWikidata([...new Set(existing.flatMap((p) => (p.qid ? [p.qid] : [])))])

  const isFootballer = (p: PageInfo) =>
    FOOTBALL_RE.test(p.description) || !!(p.qid && wd.get(p.qid)?.footballer)
  const needFiles = existing.flatMap((p) => {
    const file = p.qid && wd.get(p.qid)?.file
    return !p.thumb && file && isFootballer(p) ? [file] : []
  })
  const thumbs = await commonsThumbs([...new Set(needFiles)])

  const out = new Map<string, PageHit | null>()
  for (const [key, titles] of candidates) {
    let hit: PageHit | null = null
    for (const t of titles) {
      const p = pages.get(t)
      if (!p || !isFootballer(p)) continue
      const file = p.qid && wd.get(p.qid)?.file
      const image = p.thumb ?? (file ? thumbs.get(file) : undefined)
      if (image) {
        hit = { title: p.title, image }
        break
      }
    }
    out.set(key, hit)
  }
  return out
}

/** Search fallback: first result whose title (minus "(...)") matches a wanted name. */
async function searchTitle(name: string, wanted: Set<string>): Promise<string | null> {
  const data = await api(WIKIPEDIA, {
    action: 'query',
    list: 'search',
    srsearch: `${name} footballer`,
    srlimit: '5',
  })
  for (const r of data.query?.search ?? []) {
    const bare = normalize(String(r.title).replace(/\s*\(.*\)\s*$/, ''))
    if (wanted.has(bare)) return r.title
  }
  return null
}

async function main() {
  const refresh = process.argv.includes('--refresh')
  const cache: Cache = fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    : {}
  if (refresh) for (const k of Object.keys(cache)) if (cache[k] === null) delete cache[k]
  const saveCache = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))

  // One entry per distinct person (by output key) that still has no portrait,
  // plus every `wikiTitle` override (those beat a possibly-wrong CSV match).
  const todo = new Map<string, Person>()
  let total = 0
  // Read the bank WITHOUT wikiImages.json merged, or past hits would drop out of the output.
  const csvImages = enrichment as Record<string, { image?: string }>
  for (const q of withOpenMembers(rawQuestions)) {
    for (const a of q.answers) {
      total++
      const csvImage = a.image ?? csvImages[`${q.id}#${a.rank}`]?.image
      if (csvImage && !a.wikiTitle) continue
      const key = normalize(a.wikiTitle ?? a.name)
      if (!todo.has(key))
        todo.set(key, { name: a.name, aliases: a.aliases ?? [], wikiTitle: a.wikiTitle })
    }
  }
  const pending = [...todo.entries()].filter(([key]) => !(key in cache))
  console.log(
    `${total} answers, ${todo.size} people need a portrait, ${pending.length} not yet looked up`,
  )

  // Pass 1: direct titles (override, or name + aliases + "(footballer)").
  const direct = await resolve(
    new Map(
      pending.map(([key, p]) => [
        key,
        p.wikiTitle ? [p.wikiTitle] : [p.name, ...p.aliases, `${p.name} (footballer)`],
      ]),
    ),
  )
  const unresolved: [string, Person][] = []
  for (const [key, p] of pending) {
    const hit = direct.get(key) ?? null
    // An explicit wikiTitle is never second-guessed by search.
    if (hit || p.wikiTitle) cache[key] = hit
    else unresolved.push([key, p])
  }
  saveCache()
  console.log(
    `  direct titles: ${pending.length - unresolved.length} found, ${unresolved.length} left`,
  )

  // Pass 2: search for the rest, then resolve the matched titles in one batch.
  const searched = new Map<string, string[]>()
  for (const [i, [key, p]] of unresolved.entries()) {
    const title = await searchTitle(p.name, new Set([p.name, ...p.aliases].map(normalize)))
    if (title) searched.set(key, [title])
    else cache[key] = null
    if ((i + 1) % 50 === 0) console.log(`  search [${i + 1}/${unresolved.length}]`)
  }
  const viaSearch = await resolve(searched)
  for (const [key, hit] of viaSearch) cache[key] = hit
  saveCache()
  if (unresolved.length) {
    const found = [...viaSearch.values()].filter(Boolean).length
    console.log(`  search: ${found}/${unresolved.length} found`)
  }

  // Emit only hits for people still in the bank, sorted for stable diffs.
  const out: Record<string, PageHit> = {}
  for (const key of [...todo.keys()].sort()) if (cache[key]) out[key] = cache[key]!
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + '\n')

  const misses = [...todo.entries()].filter(([k]) => !cache[k]).map(([, p]) => p.name)
  console.log(
    `\nWrote ${path.relative(process.cwd(), OUT_FILE)}: ${Object.keys(out).length}/${todo.size} people`,
  )
  if (misses.length) console.log(`No free image for ${misses.length}: ${misses.join(', ')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
