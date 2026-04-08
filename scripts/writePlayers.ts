/**
 * Writes scripts/output/players.json → src/data/players.ts
 * Run after: npm run parse
 * Usage: npm run write-players
 */
import * as fs from 'fs'
import * as path from 'path'

const RESULT_FILE = path.join(__dirname, 'output', 'players.json')
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'players.ts')

if (!fs.existsSync(RESULT_FILE)) {
  console.error(`No players.json found. Run npm run parse first.`)
  process.exit(1)
}

const players: any[] = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf-8'))

const ts = `// Auto-generated — do not edit by hand.
// Source: scripts/output/players.json (run "npm run enrich" then "npm run parse" to regenerate)
// ${players.length} players, last updated ${new Date().toISOString().split('T')[0]}
import type { Player } from '@/types/player'

export const enrichedFootballPlayers: Player[] = ${JSON.stringify(players, null, 2)}
`

fs.writeFileSync(OUT_FILE, ts)
console.log(`✓ Wrote ${players.length} players to src/data/players.ts`)
