/**
 * Fetch freely-licensed player photos from Wikimedia Commons.
 *
 * Pipeline:
 *   1. Map each player's Transfermarkt ID → Wikidata item via property P2446,
 *      and read the item's image (P18). This only ever yields Commons files
 *      (free-licensed / public-domain), never Wikipedia fair-use images.
 *   2. For each Commons file, read a sized thumbnail URL + license + author via
 *      the Commons imageinfo API (so we can display correct attribution).
 *
 * Output: scripts/output/images.json  { [playerId]: ImageRecord }
 * Resumable: existing entries are kept; only missing players are fetched.
 *
 * Usage: npx tsx scripts/fetchWikidataImages.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_DIR = path.join(__dirname, 'output')
const PLAYERS_FILE = path.join(OUTPUT_DIR, 'players.json')
const IMAGES_FILE = path.join(OUTPUT_DIR, 'images.json')

const UA = 'football-bingo-image-fetch/1.0 (https://github.com/; hannes@unfold.no)'
const THUMB_WIDTH = 400
const SPARQL_CHUNK = 180
const COMMONS_CHUNK = 40

interface ImageRecord {
  imageUrl: string
  attribution: {
    author: string
    license: string
    licenseUrl: string
    source: string // Commons file description page
  } | null
  // null attribution + empty url means "checked, no free image found"
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function stripHtml(s: string): string {
  const txt = s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Commons Artist templates sometimes duplicate the text; collapse "X X" -> "X".
  const words = txt.split(' ')
  if (words.length % 2 === 0) {
    const h = words.length / 2
    if (words.slice(0, h).join(' ') === words.slice(h).join(' ')) {
      return words.slice(0, h).join(' ')
    }
  }
  const half = txt.slice(0, txt.length / 2).trim()
  if (half && txt === half + half) return half
  return txt
}

async function sparqlImages(tmids: string[]): Promise<Map<string, string>> {
  const values = tmids.map((id) => `"${id}"`).join(' ')
  const query = `SELECT ?tmid ?image WHERE { VALUES ?tmid { ${values} } ?item wdt:P2446 ?tmid . OPTIONAL { ?item wdt:P18 ?image } }`
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } })
  if (!res.ok) {
    console.warn(`  SPARQL ${res.status}; backing off 20s`)
    await sleep(20_000)
    return new Map()
  }
  const data: any = await res.json()
  const out = new Map<string, string>()
  for (const b of data.results.bindings) {
    const tmid = b.tmid?.value
    const image = b.image?.value
    if (tmid && image && !out.has(tmid)) {
      // ".../Special:FilePath/<filename>"
      const fname = decodeURIComponent(image.split('/Special:FilePath/')[1] ?? '')
      if (fname) out.set(tmid, fname)
    }
  }
  return out
}

async function commonsInfo(
  filenames: string[],
): Promise<Map<string, ImageRecord['attribution'] & { thumb: string }>> {
  const titles = filenames.map((f) => `File:${f}`).join('|')
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo` +
    `&iiprop=extmetadata|url&iiurlwidth=${THUMB_WIDTH}&titles=${encodeURIComponent(titles)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) {
    console.warn(`  Commons ${res.status}; backing off 20s`)
    await sleep(20_000)
    return new Map()
  }
  const data: any = await res.json()
  const norm: Record<string, string> = data.query?.normalized
    ? Object.fromEntries(data.query.normalized.map((n: any) => [n.to, n.from]))
    : {}
  const out = new Map<string, any>()
  for (const pg of Object.values<any>(data.query?.pages ?? {})) {
    const ii = pg.imageinfo?.[0]
    if (!ii) continue
    const title: string = norm[pg.title] ?? pg.title // back to requested title
    const fname = title.replace(/^File:/, '')
    const em = ii.extmetadata ?? {}
    out.set(fname, {
      thumb: ii.thumburl ?? '',
      author: stripHtml(em.Artist?.value ?? '') || 'Unknown author',
      license: stripHtml(em.LicenseShortName?.value ?? '') || 'see source',
      licenseUrl: em.LicenseUrl?.value ?? '',
      source: ii.descriptionurl ?? '',
    })
  }
  return out
}

async function main() {
  const players: any[] = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf-8'))
  const images: Record<string, ImageRecord> = fs.existsSync(IMAGES_FILE)
    ? JSON.parse(fs.readFileSync(IMAGES_FILE, 'utf-8'))
    : {}

  const todo = players.map((p) => p.playerId).filter((id: string) => !(id in images))
  console.log(`${players.length} players, ${Object.keys(images).length} cached, ${todo.length} to fetch`)

  for (let i = 0; i < todo.length; i += SPARQL_CHUNK) {
    const chunk = todo.slice(i, i + SPARQL_CHUNK)
    const fileByTmid = await sparqlImages(chunk)
    await sleep(1000)

    // Players in this chunk with no Wikidata image → record as "checked, none".
    for (const id of chunk) {
      if (!fileByTmid.has(id)) images[id] = { imageUrl: '', attribution: null }
    }

    const files = [...new Set(fileByTmid.values())]
    const meta = new Map<string, any>()
    for (let j = 0; j < files.length; j += COMMONS_CHUNK) {
      const fchunk = files.slice(j, j + COMMONS_CHUNK)
      const m = await commonsInfo(fchunk)
      for (const [k, v] of m) meta.set(k, v)
      await sleep(600)
    }

    for (const [tmid, fname] of fileByTmid) {
      const info = meta.get(fname)
      if (info?.thumb) {
        images[tmid] = {
          imageUrl: info.thumb,
          attribution: {
            author: info.author,
            license: info.license,
            licenseUrl: info.licenseUrl,
            source: info.source,
          },
        }
      } else {
        images[tmid] = { imageUrl: '', attribution: null }
      }
    }

    fs.writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2))
    const withImg = Object.values(images).filter((r) => r.imageUrl).length
    console.log(`  [${Math.min(i + SPARQL_CHUNK, todo.length)}/${todo.length}] with image so far: ${withImg}`)
  }

  const withImg = Object.values(images).filter((r) => r.imageUrl).length
  console.log(`\nDone. ${withImg}/${players.length} players have a Commons image.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
