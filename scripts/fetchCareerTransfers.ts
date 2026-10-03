/**
 * Fetch every pool player's raw transfer history straight from Transfermarkt's
 * ceapi, for the Careers game mode.
 *
 * Why not the transfermarkt-api cache (player-cache.json): its schema parses
 * `fee` to an int, which throws away the only loan marker Transfermarkt gives
 * ("loan transfer" / "End of loan" / "Loan fee:€3.50m"), and it swaps day and
 * month in dates. Loan fees are common, so fee alone can't tell a loan apart.
 *
 * Output: scripts/output/career-transfers.json - { "<playerId>": RawTransfer[] }
 * Resumable: already-fetched players are skipped unless `--refresh`.
 *
 * Usage: npm run careers:fetch [-- --refresh]
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import type { RawTransfer } from '../src/lib/careers/buildCareer'

const OUT_FILE = path.join(__dirname, 'output', 'career-transfers.json')
const URL = 'https://www.transfermarkt.com/ceapi/transferHistory/list/'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
const DELAY_MS = 400
const MAX_CONSECUTIVE_FAILURES = 8

type Cache = Record<string, RawTransfer[]>

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchOne(id: string): Promise<RawTransfer[] | null> {
  const res = await fetch(URL + id, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) return null
  const json = (await res.json()) as { transfers?: RawTransfer[] }
  if (!Array.isArray(json.transfers)) return null
  return json.transfers.map((t) => ({
    from: { clubName: t.from.clubName, href: t.from.href },
    to: { clubName: t.to.clubName, href: t.to.href },
    date: t.date,
    dateUnformatted: t.dateUnformatted,
    upcoming: t.upcoming,
    season: t.season,
    fee: t.fee,
  }))
}

async function main() {
  const refresh = process.argv.includes('--refresh')
  const cache: Cache = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : {}
  const todo = enrichedFootballPlayers.filter((p) => refresh || !cache[p.playerId])
  console.log(`${todo.length} to fetch (${Object.keys(cache).length} cached)`)

  let failures = 0
  for (const [i, p] of todo.entries()) {
    let got: RawTransfer[] | null = null
    try {
      got = await fetchOne(p.playerId)
    } catch {
      got = null
    }
    if (got) {
      cache[p.playerId] = got
      failures = 0
    } else {
      failures++
      console.warn(`  fail: ${p.name} (${p.playerId})`)
      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        console.error('Too many consecutive failures, stopping (progress saved).')
        break
      }
    }
    if (i % 25 === 0 || i === todo.length - 1) {
      fs.writeFileSync(OUT_FILE, JSON.stringify(cache))
      console.log(`  ${i + 1}/${todo.length}`)
    }
    await sleep(DELAY_MS)
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(cache))
  console.log(`Done: ${Object.keys(cache).length} players cached`)
}

if (require.main === module) main()
