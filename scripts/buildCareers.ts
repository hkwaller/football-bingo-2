/**
 * Build the Careers game bank from raw Transfermarkt transfer histories
 * (scripts/output/career-transfers.json, see fetchCareerTransfers.ts).
 *
 * Cleaning, in order:
 * - Youth / reserve sides are dropped (U19, Youth, B, II, Castilla, Jong...),
 *   as is anything joined before the player turned 16.
 * - Non-clubs (Retired, Without Club, Career break, Ban...) end the current spell.
 * - Loans come from Transfermarkt's own fee text ("loan transfer", "Loan fee:",
 *   "End of loan"), never inferred. A loan nests under the parent club's spell,
 *   so Rashford reads Man Utd 2016- with Aston Villa and Barcelona beneath it.
 * - A return to the same club after a gap (career break, free agency) merges
 *   into one spell.
 * - Players with fewer than MIN_ROWS rows (spells + loans) are left out: a
 *   one-club career isn't a puzzle.
 *
 * Output: src/data/careers/careers.json (served by /api/careers/deal, never
 * bundled to the client).
 *
 * Usage: npm run careers:build
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import { buildCareer, rowCount, type RawTransfer } from '../src/lib/careers/buildCareer'
import type { CareerPlayer, CareersDifficulty } from '../src/lib/careers/types'

const IN_FILE = path.join(__dirname, 'output', 'career-transfers.json')
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'careers', 'careers.json')
const META_FILE = path.join(__dirname, '..', 'src', 'data', 'careers', 'meta.json')
const MIN_ROWS = 3
/** Fame bands (same scale as the bingo presets: Classic >=42, Legends Only >=70). */
const EASY_MIN_FAME = 70
const MEDIUM_MIN_FAME = 50

function difficultyFor(fame: number): CareersDifficulty {
  if (fame >= EASY_MIN_FAME) return 'easy'
  if (fame >= MEDIUM_MIN_FAME) return 'medium'
  return 'hard'
}

function main() {
  if (!fs.existsSync(IN_FILE)) {
    console.error(`Missing ${IN_FILE} - run "npm run careers:fetch" first.`)
    process.exit(1)
  }
  const raw = JSON.parse(fs.readFileSync(IN_FILE, 'utf8')) as Record<string, RawTransfer[]>
  const today = new Date().toISOString().slice(0, 10)

  const out: CareerPlayer[] = []
  const skipped: string[] = []
  let missing = 0
  for (const p of enrichedFootballPlayers) {
    const transfers = raw[p.playerId]
    if (!transfers) {
      missing++
      continue
    }
    const career = buildCareer(transfers, p.dateOfBirth, today)
    if (rowCount(career) < MIN_ROWS) {
      skipped.push(p.name)
      continue
    }
    out.push({
      id: p.playerId,
      name: p.name,
      nationality: p.nationality,
      position: p.position.main,
      fame: p.fameScore ?? 0,
      difficulty: difficultyFor(p.fameScore ?? 0),
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      career,
    })
  }
  out.sort((a, b) => b.fame - a.fame)

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + '\n')
  const counts: Record<CareersDifficulty, number> = { easy: 0, medium: 0, hard: 0 }
  for (const p of out) counts[p.difficulty]++
  fs.writeFileSync(META_FILE, JSON.stringify(counts, null, 2) + '\n')
  console.log('By difficulty:', counts)

  const loans = out.reduce((n, p) => n + p.career.reduce((m, s) => m + s.loans.length, 0), 0)
  console.log(
    `Wrote ${out.length} careers (${loans} loans) to ${path.relative(process.cwd(), OUT_FILE)}`,
  )
  console.log(`Skipped ${skipped.length} with < ${MIN_ROWS} rows, ${missing} not fetched`)
}

if (require.main === module) main()
