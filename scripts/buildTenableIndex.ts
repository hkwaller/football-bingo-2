/**
 * Builds the name→player lookup used to backfill Tenable answer portraits.
 *
 * Usage: npm run tenable:index   (then npm run tenable:verify)
 *
 * Output: scripts/output/tenableNameLookup.json — { normalizedKey: { id, image } }
 * consumed by verifyTenable.ts. NOT imported by the app.
 *
 * The autocomplete pool is NOT built here — it's derived at runtime in
 * src/lib/tenable/nameSearch.ts from our curated players + the answer names, so
 * every suggestion is a notable player. This CSV only supplies portraits/ids.
 */
import * as fs from 'fs'
import * as path from 'path'
import { normalize } from '../src/lib/tenable/normalize'

const PLAYERS_CSV = path.join(__dirname, '..', 'datasets', 'players.csv')
const LOOKUP_OUT = path.join(__dirname, 'output', 'tenableNameLookup.json')

/** Minimal RFC-4180-ish CSV parser (handles quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // ignore; \n handles the newline
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function main() {
  if (!fs.existsSync(PLAYERS_CSV)) {
    console.error(`❌ Missing ${PLAYERS_CSV}. Put the Kaggle datasets in datasets/.`)
    process.exit(1)
  }

  console.log('Reading players.csv…')
  const rows = parseCsv(fs.readFileSync(PLAYERS_CSV, 'utf-8'))
  const header = rows[0] ?? []
  const col = (name: string) => header.indexOf(name)
  const iName = col('name')
  const iId = col('player_id')
  const iImg = col('image_url')
  const iMv = col('market_value_in_eur')
  const iHmv = col('highest_market_value_in_eur')
  console.log(`  ${rows.length - 1} rows`)

  const num = (s: string | undefined) => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

  // Keep the highest-market-value player per normalized name (usually the famous one).
  const lookup = new Map<string, { id: string; image: string; mv: number }>()
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const name = (row[iName] || '').trim()
    if (!name) continue
    const key = normalize(name)
    if (!key) continue
    const mv = num(row[iMv]) || num(row[iHmv])
    const existing = lookup.get(key)
    if (!existing || mv > existing.mv) {
      lookup.set(key, { id: row[iId] || '', image: row[iImg] || '', mv })
    }
  }

  const lookupObj: Record<string, { id: string; image: string }> = {}
  for (const [key, { id, image }] of lookup) lookupObj[key] = { id, image }
  fs.mkdirSync(path.dirname(LOOKUP_OUT), { recursive: true })
  fs.writeFileSync(LOOKUP_OUT, JSON.stringify(lookupObj))
  console.log(
    `✅ Wrote ${Object.keys(lookupObj).length} lookups → ${path.relative(process.cwd(), LOOKUP_OUT)}`,
  )
}

main()
