/**
 * Standalone parse script: processes whatever is in player-cache.json
 * and writes output without any API calls. Safe to run at any time.
 *
 * Usage: npm run parse
 *
 * All transform logic lives in ./transform (shared with enrichPlayers.ts).
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import { processPlayer } from './transform'

const OUTPUT_DIR = path.join(__dirname, 'output')
const CACHE_FILE = path.join(OUTPUT_DIR, 'player-cache.json')
const SQUAD_CACHE_FILE = path.join(OUTPUT_DIR, 'squad-cache.json')
const RESULT_FILE = path.join(OUTPUT_DIR, 'players.json')
const DIFF_FILE = path.join(OUTPUT_DIR, 'diff-report.json')

function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error(`No cache found at ${CACHE_FILE}. Run npm run enrich first.`)
    process.exit(1)
  }

  console.log('=== Parse Players (from cache) ===\n')

  const cache: Record<string, any> = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
  const squadCache: Record<string, any> = fs.existsSync(SQUAD_CACHE_FILE)
    ? JSON.parse(fs.readFileSync(SQUAD_CACHE_FILE, 'utf-8'))
    : {}

  console.log(`Cache: ${Object.keys(cache).length} players`)
  const withProfile = Object.values(cache).filter((v) => v.profile && v.profile !== false).length
  const withAchievements = Object.values(cache).filter((v) => v.achievements && v.achievements !== false).length
  const stillPending = Object.values(cache).filter((v) =>
    v.profile === null || v.achievements === null || v.transfers === null
  ).length
  console.log(`  With profile: ${withProfile}`)
  console.log(`  With achievements: ${withAchievements}`)
  console.log(`  Still have null endpoints (blocked — will retry): ${stillPending}`)

  const processed: any[] = []
  let failed = 0

  for (const raw of Object.values(cache)) {
    if (!raw.profile || raw.profile === false) { failed++; continue }
    const squadInfo = squadCache[raw.playerId]
    const player = processPlayer(raw, squadInfo)
    if (player?.name) {
      processed.push(player)
    } else {
      failed++
    }
  }

  console.log(`\nProcessed: ${processed.length} players (${failed} skipped — no profile data)`)

  // Diff against existing players
  const existingMap = new Map(enrichedFootballPlayers.map((p) => [p.playerId, p]))
  const diffs: any[] = []

  for (const np of processed) {
    const old = existingMap.get(np.playerId)
    if (!old) continue
    const changes: Record<string, any> = {}

    const newAch = new Set(np.achievements as string[])
    const oldAch = new Set(old.achievements ?? [])
    const added = np.achievements.filter((a: string) => !oldAch.has(a))
    const removed = (old.achievements ?? []).filter((a: string) => !newAch.has(a))
    if (added.length || removed.length) {
      changes.achievements = { old: old.achievements, new: np.achievements, added, removed }
    }
    if (old.nationality !== np.nationality && np.nationality) {
      changes.nationality = { old: old.nationality, new: np.nationality }
    }
    if (Object.keys(changes).length) {
      diffs.push({ playerId: np.playerId, name: np.name, changes })
    }
  }

  const achChanges = diffs.filter((d) => d.changes.achievements)
  if (achChanges.length) {
    console.log(`\nAchievement changes for ${achChanges.length} existing players:`)
    for (const d of achChanges) {
      console.log(`  ${d.name}:`)
      if (d.changes.achievements.added.length) {
        console.log(`    + ${d.changes.achievements.added.join(', ')}`)
      }
      if (d.changes.achievements.removed.length) {
        console.log(`    - ${d.changes.achievements.removed.join(', ')}`)
      }
    }
  } else {
    console.log('\nNo achievement changes detected in processed players.')
  }

  const sorted = [...processed].sort((a, b) => b.fameScore - a.fameScore)
  console.log('\nTop 10 by fame score:')
  for (const p of sorted.slice(0, 10)) {
    console.log(`  ${p.fameScore.toFixed(1).padStart(5)}  ${p.name}`)
  }

  const tiers = {
    legendary: processed.filter((p) => p.fameScore >= 70).length,
    wellKnown: processed.filter((p) => p.fameScore >= 40 && p.fameScore < 70).length,
    known: processed.filter((p) => p.fameScore >= 20 && p.fameScore < 40).length,
    other: processed.filter((p) => p.fameScore < 20).length,
  }
  console.log('\nFame distribution:')
  console.log(`  Legendary (70+): ${tiers.legendary}`)
  console.log(`  Well-known (40+): ${tiers.wellKnown}`)
  console.log(`  Known (20+): ${tiers.known}`)
  console.log(`  Other (<20): ${tiers.other}`)

  fs.writeFileSync(RESULT_FILE, JSON.stringify(sorted, null, 2))
  fs.writeFileSync(DIFF_FILE, JSON.stringify(diffs, null, 2))
  console.log(`\nWrote ${processed.length} players to ${RESULT_FILE}`)
  console.log(`Diff report: ${DIFF_FILE}`)
  console.log('\n(Run npm run write-players to update src/data/players.ts)')
}

main()
