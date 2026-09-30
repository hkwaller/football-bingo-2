/**
 * Fill club career totals from Wikipedia for icons whose Transfermarkt stats
 * are missing or a stub.
 *
 * Icons = fameScore >= 70 (the Legends preset). A stub is under 50 appearances.
 *
 * Usage: npx tsx scripts/fetchWikiCareerStats.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import {
  ICON_FAME,
  TM_STUB_APPEARANCES,
  parseClubCareer,
  readWikiCareerStats,
  wikiCareerFor,
  writeWikiCareerStats,
  type WikiCareer,
} from './wikiCareerStats'

function assertParser() {
  const dir = path.join(__dirname, 'output', 'wiki')
  const expect: Record<string, { apps: number; goals: number }> = {
    'pel-.txt': { apps: 647, goals: 606 },
    'garrincha.txt': { apps: 345, goals: 102 },
    'lev-yashin.txt': { apps: 358, goals: 0 },
    'bobby-moore.txt': { apps: 795, goals: 28 },
    's-crates.txt': { apps: 513, goals: 236 },
    'carlos-alberto-torres.txt': { apps: 762, goals: 64 },
    'zinedine-zidane.txt': { apps: 695, goals: 125 },
  }
  for (const [file, want] of Object.entries(expect)) {
    const p = path.join(dir, file)
    if (!fs.existsSync(p)) continue
    const got = parseClubCareer(fs.readFileSync(p, 'utf8'))
    if (!got || got.appearances !== want.apps || got.goals !== want.goals) {
      throw new Error(
        `${file}: parsed ${got?.appearances}/${got?.goals}, expected ${want.apps}/${want.goals}`,
      )
    }
  }
  console.log('Parser checks passed')
}

function patchPlayers(updates: { id: string; name: string; appearances: number; goals: number }[]) {
  const file = path.join(__dirname, '..', 'src', 'data', 'players.ts')
  let src = fs.readFileSync(file, 'utf8')
  for (const u of updates) {
    const start = src.indexOf(`playerId: '${u.id}'`)
    if (start < 0) throw new Error(`player ${u.name} (${u.id}) not in players.ts`)
    const next = src.indexOf('\n  {', start)
    const end = next < 0 ? src.length : next
    let block = src.slice(start, end)
    const stats = /careerStats: \{\n      appearances: \d+,\n      goals: \d+,/
    if (!stats.test(block)) throw new Error(`no careerStats block for ${u.name}`)
    block = block.replace(
      stats,
      `careerStats: {\n      appearances: ${u.appearances},\n      goals: ${u.goals},`,
    )
    if (u.goals >= 200 && !/achievements: \[[^\]]*200\+ career goals/.test(block)) {
      block = block.replace(/achievements: \[([\s\S]*?)\]/, (_full, inner: string) => {
        if (inner.trim() === '') return `achievements: ['200+ career goals']`
        if (!inner.includes('\n')) {
          const body = inner.replace(/,\s*$/, '').trim()
          return `achievements: [${body}, '200+ career goals']`
        }
        return `achievements: [${inner.replace(/\s*$/, '')}\n      '200+ career goals',\n    ]`
      })
    }
    src = src.slice(0, start) + block + src.slice(end)
  }
  fs.writeFileSync(file, src)
}

async function main() {
  assertParser()
  const existing = readWikiCareerStats()
  const icons = enrichedFootballPlayers.filter(
    (p) => p.fameScore >= ICON_FAME && p.careerStats.appearances < TM_STUB_APPEARANCES,
  )
  console.log(`${icons.length} icons under ${TM_STUB_APPEARANCES} Transfermarkt appearances`)

  const stats: Record<string, WikiCareer> = { ...existing }
  const applied: { id: string; name: string; appearances: number; goals: number }[] = []

  for (const p of icons) {
    if (stats[p.playerId] && stats[p.playerId].appearances > p.careerStats.appearances) {
      applied.push({
        id: p.playerId,
        name: p.name,
        appearances: stats[p.playerId].appearances,
        goals: stats[p.playerId].goals,
      })
      console.log(`  cached ${p.name}: ${stats[p.playerId].appearances} apps, ${stats[p.playerId].goals} goals`)
      continue
    }
    process.stdout.write(`  ${p.name}... `)
    await new Promise((r) => setTimeout(r, 1100))
    const wiki = await wikiCareerFor(p.name)
    if (!wiki || wiki.appearances <= p.careerStats.appearances) {
      console.log(wiki ? `wiki ${wiki.appearances} not higher than TM` : 'no football article total')
      continue
    }
    stats[p.playerId] = wiki
    applied.push({ id: p.playerId, name: p.name, appearances: wiki.appearances, goals: wiki.goals })
    console.log(`${wiki.appearances} apps, ${wiki.goals} goals (${wiki.via}, ${wiki.page})`)
    writeWikiCareerStats(stats)
  }

  writeWikiCareerStats(stats)
  patchPlayers(applied)
  console.log(`\nUpdated ${applied.length} players`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
