/**
 * Fill club career totals from Wikipedia for every player whose Transfermarkt
 * stats are missing or a stub (under 50 appearances).
 *
 * Usage: npx tsx scripts/fetchWikiCareerStats.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import {
  TM_STUB_APPEARANCES,
  articleFits,
  cachedWikitext,
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
  const missesFile = path.join(__dirname, 'output', 'wiki-career-misses.json')
  const misses = new Set<string>(
    fs.existsSync(missesFile) ? JSON.parse(fs.readFileSync(missesFile, 'utf8')) : [],
  )
  const pending = enrichedFootballPlayers.filter(
    (p) => p.careerStats.appearances < TM_STUB_APPEARANCES && !misses.has(p.playerId),
  )
  console.log(`${pending.length} players under ${TM_STUB_APPEARANCES} Transfermarkt appearances`)

  const stats: Record<string, WikiCareer> = { ...existing }
  const byId = new Map(enrichedFootballPlayers.map((p) => [p.playerId, p]))
  for (const [id, wiki] of Object.entries(stats)) {
    const p = byId.get(id)
    const hint = p
      ? {
          name: p.name,
          nationality: p.nationality,
          birthYear: Number(p.dateOfBirth?.slice(0, 4)) || null,
          clubs: p.clubs,
        }
      : null
    // A missing cache, or a redirect stub, is not evidence the record is wrong.
    // Only drop a record when the cached article itself fails the identity check.
    const text = cachedWikitext(wiki.page)
    const ok = !hint || !text || /^#REDIRECT/i.test(text) || articleFits(text, wiki.page, hint, true)
    if (!ok) {
      console.log(`  drop ${p?.name ?? id} → ${wiki.page}`)
      delete stats[id]
    }
  }
  writeWikiCareerStats(stats)

  const applied: { id: string; name: string; appearances: number; goals: number }[] = []
  let done = 0

  for (const p of pending) {
    done++
    const birthYear = Number(p.dateOfBirth?.slice(0, 4)) || null
    if (stats[p.playerId] && stats[p.playerId].appearances > p.careerStats.appearances) {
      applied.push({
        id: p.playerId,
        name: p.name,
        appearances: stats[p.playerId].appearances,
        goals: stats[p.playerId].goals,
      })
      continue
    }
    process.stdout.write(`  [${done}/${pending.length}] ${p.name}... `)
    const wiki = await wikiCareerFor({
      name: p.name,
      nationality: p.nationality,
      birthYear,
      clubs: p.clubs,
    })
    if (!wiki || wiki.appearances <= p.careerStats.appearances) {
      misses.add(p.playerId)
      fs.mkdirSync(path.dirname(missesFile), { recursive: true })
      fs.writeFileSync(missesFile, JSON.stringify([...misses]))
      console.log('no matching career')
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
