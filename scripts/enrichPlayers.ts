/**
 * Full enrichment pipeline: resolves club IDs, discovers squad players across
 * historical seasons, then fetches full Transfermarkt data for each player.
 *
 * Usage: npm run enrich
 *
 * Stages:
 *   1. Resolve Transfermarkt club IDs (cached in output/clubs.json)
 *   2. Discover players from club squads across seasons (cached in output/squad-cache.json)
 *   3. Fetch full player data sequentially (cached in output/player-cache.json)
 *   4. Parse cached data → output/players.json
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'
import { processPlayer, parseMarketValue, isNotablePlayer, applyCommonsImages } from './transform'

const OUTPUT_DIR = path.join(__dirname, 'output')
const CLUBS_FILE = path.join(OUTPUT_DIR, 'clubs.json')
const SQUAD_CACHE_FILE = path.join(OUTPUT_DIR, 'squad-cache.json')
const CACHE_FILE = path.join(OUTPUT_DIR, 'player-cache.json')
const RESULT_FILE = path.join(OUTPUT_DIR, 'players.json')
const DIFF_FILE = path.join(OUTPUT_DIR, 'diff-report.json')

const API_BASE = 'http://localhost:8000'
const DELAY_MS = 3500
const BACKOFF_DELAY_MS = 90_000
const FULL_FETCH_THRESHOLD = 3_000_000
const HISTORICAL_SEASON_CUTOFF = '2010'
const CURRENT_SEASON = '2025'

const DISCOVERY_SEASONS = [
  '2000',
  '2003',
  '2006',
  '2009',
  '2012',
  '2015',
  '2018',
  '2021',
  '2024',
  '2025',
]

import { MANUAL_PLAYERS, MANUAL_PLAYER_IDS } from './data/manualPlayers'

// IDs to forcibly remove from cache (wrong entries replaced by MANUAL_PLAYERS above)
const PURGE_IDS = new Set(['10201'])

// ─── Club List ───────────────────────────────────────────────────────────────

const OUR_CLUBS: { canonicalName: string; displayName: string }[] = [
  { canonicalName: 'Manchester United', displayName: 'Manchester United' },
  { canonicalName: 'Liverpool FC', displayName: 'Liverpool' },
  { canonicalName: 'Real Madrid', displayName: 'Real Madrid' },
  { canonicalName: 'FC Barcelona', displayName: 'Barcelona' },
  { canonicalName: 'Bayern Munich', displayName: 'Bayern Munich' },
  { canonicalName: 'Paris Saint-Germain', displayName: 'PSG' },
  { canonicalName: 'Manchester City', displayName: 'Manchester City' },
  { canonicalName: 'Chelsea FC', displayName: 'Chelsea' },
  { canonicalName: 'Juventus FC', displayName: 'Juventus' },
  { canonicalName: 'Arsenal FC', displayName: 'Arsenal' },
  { canonicalName: 'AC Milan', displayName: 'AC Milan' },
  { canonicalName: 'Inter Milan', displayName: 'Inter Milan' },
  { canonicalName: 'Borussia Dortmund', displayName: 'Borussia Dortmund' },
  { canonicalName: 'Atlético de Madrid', displayName: 'Atletico Madrid' },
  { canonicalName: 'Ajax Amsterdam', displayName: 'Ajax' },
  { canonicalName: 'FC Porto', displayName: 'Porto' },
  { canonicalName: 'SL Benfica', displayName: 'Benfica' },
  { canonicalName: 'Celtic FC', displayName: 'Celtic' },
  { canonicalName: 'Rangers FC', displayName: 'Rangers' },
  { canonicalName: 'SSC Napoli', displayName: 'Napoli' },
  { canonicalName: 'Tottenham Hotspur', displayName: 'Tottenham' },
  { canonicalName: 'CA Boca Juniors', displayName: 'Boca Juniors' },
  { canonicalName: 'CA River Plate', displayName: 'River Plate' },
  { canonicalName: 'Olympique Marseille', displayName: 'Marseille' },
  { canonicalName: 'Olympique Lyon', displayName: 'Lyon' },
  { canonicalName: 'AS Roma', displayName: 'AS Roma' },
  { canonicalName: 'Everton FC', displayName: 'Everton' },
  { canonicalName: 'Aston Villa', displayName: 'Aston Villa' },
  { canonicalName: 'AS Monaco', displayName: 'Monaco' },
  { canonicalName: 'West Ham United', displayName: 'West Ham' },
  { canonicalName: 'Bayer 04 Leverkusen', displayName: 'Bayer Leverkusen' },
  { canonicalName: 'Sevilla FC', displayName: 'Sevilla' },
  { canonicalName: 'Feyenoord Rotterdam', displayName: 'Feyenoord' },
  { canonicalName: 'Los Angeles Galaxy', displayName: 'LA Galaxy' },
  { canonicalName: 'Parma Calcio 1913', displayName: 'Parma' },
  { canonicalName: 'Villarreal CF', displayName: 'Villarreal' },
  { canonicalName: 'Southampton FC', displayName: 'Southampton' },
  { canonicalName: 'Leicester City', displayName: 'Leicester City' },
  { canonicalName: 'PSV Eindhoven', displayName: 'PSV' },
  { canonicalName: 'Fenerbahce', displayName: 'Fenerbahçe' },
  { canonicalName: 'Newcastle United', displayName: 'Newcastle United' },
  { canonicalName: 'Blackburn Rovers', displayName: 'Blackburn Rovers' },
  // ── Added to widen player discovery (2026-07) ──
  { canonicalName: 'RB Leipzig', displayName: 'RB Leipzig' },
  { canonicalName: 'Atalanta BC', displayName: 'Atalanta' },
  { canonicalName: 'SS Lazio', displayName: 'Lazio' },
  { canonicalName: 'ACF Fiorentina', displayName: 'Fiorentina' },
  { canonicalName: 'Valencia CF', displayName: 'Valencia' },
  { canonicalName: 'Athletic Bilbao', displayName: 'Athletic Bilbao' },
  { canonicalName: 'Real Betis Balompié', displayName: 'Real Betis' },
  { canonicalName: 'Sporting CP', displayName: 'Sporting CP' },
  { canonicalName: 'VfB Stuttgart', displayName: 'VfB Stuttgart' },
  { canonicalName: 'FC Schalke 04', displayName: 'Schalke 04' },
  { canonicalName: 'SV Werder Bremen', displayName: 'Werder Bremen' },
  { canonicalName: 'VfL Wolfsburg', displayName: 'Wolfsburg' },
  { canonicalName: 'Galatasaray', displayName: 'Galatasaray' },
  { canonicalName: 'Shakhtar Donetsk', displayName: 'Shakhtar Donetsk' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface Club {
  id: string
  canonicalName: string
  displayName: string
}
interface SquadPlayer {
  id: string
  name: string
  position: string
  dateOfBirth: string
  nationality: string[]
  height: number | null
  foot: string
  marketValue: number | null
  fromClubs: string[]
  earliestSeason: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return null
  }
}
function saveJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function apiFetch<T>(endpoint: string): Promise<T | null | false> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (res.status === 405 || res.status === 403 || res.status === 429) {
      console.warn(`  ⚠ Rate limited (${res.status}). Waiting ${BACKOFF_DELAY_MS / 1000}s...`)
      await sleep(BACKOFF_DELAY_MS)
      return null
    }
    if (res.status === 404 || res.status >= 500) return false
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ─── Processing (transform logic lives in ./transform) ──────────────────────

// ─── Stage 1: Resolve Club IDs ────────────────────────────────────────────────

async function resolveOneClub(club: { canonicalName: string; displayName: string }): Promise<Club> {
  const searchVariants = [
    club.canonicalName,
    club.displayName,
    club.canonicalName.replace(/^(FC|AC|AS|CA|SL|SSC|SS|SV|VfB|VfL)\s+/i, ''),
  ].filter((v, i, a) => a.indexOf(v) === i)

  for (const searchName of searchVariants) {
    const result = await apiFetch<any>(`/clubs/search/${encodeURIComponent(searchName)}`)
    if (result?.results?.length) {
      const best =
        result.results.find(
          (r: any) =>
            r.name.toLowerCase() === club.canonicalName.toLowerCase() ||
            r.name.toLowerCase().includes(club.canonicalName.toLowerCase()) ||
            club.canonicalName.toLowerCase().includes(r.name.toLowerCase()),
        ) ?? result.results[0]
      console.log(`  ✓ ${club.canonicalName} → ID ${best.id} (${best.name})`)
      return {
        id: best.id,
        canonicalName: club.canonicalName,
        displayName: club.displayName,
      }
    }
  }

  console.warn(`  ✗ Could not find: ${club.canonicalName}`)
  return { id: '', canonicalName: club.canonicalName, displayName: club.displayName }
}

async function resolveClubIds(): Promise<Club[]> {
  const cached = loadJson<Club[]>(CLUBS_FILE) ?? []
  const byName = new Map(cached.map((c) => [c.canonicalName, c]))

  // Resolve only clubs not already in the cache, so adding entries to
  // OUR_CLUBS picks them up without re-resolving the whole list.
  const missing = OUR_CLUBS.filter((c) => !byName.has(c.canonicalName))
  if (cached.length && !missing.length) {
    console.log(`[Stage 1] Using cached club IDs (${cached.length} clubs)`)
    console.log(`${cached.length}/${cached.length} clubs resolved`)
    return cached
  }

  console.log(`[Stage 1] Resolving club IDs (${missing.length} new, ${cached.length} cached)...`)
  const resolved: Club[] = [...cached]
  for (const club of missing) {
    resolved.push(await resolveOneClub(club))
  }

  saveJson(CLUBS_FILE, resolved)
  return resolved
}

// ─── Stage 2: Discover Players from Squad History ────────────────────────────

async function fetchSquadData(clubs: Club[]) {
  const expectedMinPlayers = OUR_CLUBS.length * DISCOVERY_SEASONS.length * 10
  const cachedSquads = loadJson<Record<string, SquadPlayer>>(SQUAD_CACHE_FILE)
  if (cachedSquads && Object.keys(cachedSquads).length >= expectedMinPlayers) {
    console.log(`  Using cached squad data (${Object.keys(cachedSquads).length} players)`)
    const playerMap = new Map(Object.entries(cachedSquads))
    const existingIds = new Set(enrichedFootballPlayers.map((p) => p.playerId))

    for (const id of Array.from(PURGE_IDS)) playerMap.delete(id)

    // Remove manual players no longer in MANUAL_PLAYERS list
    const currentManualIds = new Set(MANUAL_PLAYERS.map((p) => p.id))
    let removed = 0
    for (const [id, sp] of Array.from(playerMap.entries())) {
      if (sp.fromClubs.length === 1 && sp.fromClubs[0] === 'manual' && !currentManualIds.has(id)) {
        playerMap.delete(id)
        removed++
        console.log(`  - Removed stale manual player: ${sp.name} (${id})`)
      }
    }

    let injected = 0
    for (const { id, name } of MANUAL_PLAYERS) {
      if (!playerMap.has(id)) {
        playerMap.set(id, {
          id,
          name,
          position: '',
          dateOfBirth: '',
          nationality: [],
          height: null,
          foot: '',
          marketValue: null,
          fromClubs: ['manual'],
          earliestSeason: '2000',
        })
        injected++
        console.log(`  + Added manual player: ${name} (${id})`)
      }
    }

    if (injected > 0 || removed > 0) {
      const obj: Record<string, SquadPlayer> = {}
      for (const [id, sp] of Array.from(playerMap.entries())) obj[id] = sp
      saveJson(SQUAD_CACHE_FILE, obj)
      console.log(`  +${injected} added, -${removed} removed → total: ${playerMap.size}`)
    }
    return { playerMap, existingIds }
  }

  const playerMap = new Map<string, SquadPlayer>()
  const existingIds = new Set<string>()

  for (const p of enrichedFootballPlayers) {
    existingIds.add(p.playerId)
    playerMap.set(p.playerId, {
      id: p.playerId,
      name: p.name,
      position: (p as any).position?.main ?? '',
      dateOfBirth: p.dateOfBirth ?? '',
      nationality: [p.nationality],
      height: p.height ?? null,
      foot: p.leftFooted ? 'left' : 'right',
      marketValue: p.highestValue?.marketValue ?? null,
      fromClubs: ['existing'],
      earliestSeason: CURRENT_SEASON,
    })
  }
  console.log(`  Starting with ${playerMap.size} existing players`)

  for (const club of clubs) {
    if (!club.id) continue
    for (const season of DISCOVERY_SEASONS) {
      const result = await apiFetch<any>(`/clubs/${club.id}/players?season_id=${season}`)
      if (!result?.players?.length) {
        console.log(`  ${club.displayName} ${season}: no data`)
        continue
      }

      let newCount = 0
      for (const p of result.players) {
        if (!p.id) continue
        const existing = playerMap.get(p.id)
        if (existing) {
          if (!existing.fromClubs.includes(club.canonicalName))
            existing.fromClubs.push(club.canonicalName)
          if (season < existing.earliestSeason) existing.earliestSeason = season
          const mv = parseMarketValue(p.marketValue)
          if (mv && (!existing.marketValue || mv > existing.marketValue)) existing.marketValue = mv
        } else {
          playerMap.set(p.id, {
            id: p.id,
            name: p.name,
            position: p.position ?? '',
            dateOfBirth: p.dateOfBirth ?? '',
            nationality: p.nationality ?? [],
            height: typeof p.height === 'number' ? p.height : parseInt(String(p.height)) || null,
            foot: p.foot ?? '',
            marketValue: parseMarketValue(p.marketValue),
            fromClubs: [club.canonicalName],
            earliestSeason: season,
          })
          newCount++
        }
      }
      console.log(
        `  ${club.displayName} ${season}: ${result.players.length} players (${newCount} new) - total: ${playerMap.size}`,
      )
      await sleep(DELAY_MS)
    }
  }

  for (const id of Array.from(PURGE_IDS)) playerMap.delete(id)
  for (const { id, name } of MANUAL_PLAYERS) {
    if (!playerMap.has(id)) {
      playerMap.set(id, {
        id,
        name,
        position: '',
        dateOfBirth: '',
        nationality: [],
        height: null,
        foot: '',
        marketValue: null,
        fromClubs: ['manual'],
        earliestSeason: '2000',
      })
      console.log(`  + Added manual player: ${name} (${id})`)
    }
  }

  const obj: Record<string, SquadPlayer> = {}
  for (const [id, sp] of Array.from(playerMap.entries())) obj[id] = sp
  saveJson(SQUAD_CACHE_FILE, obj)
  console.log(`  Total unique players: ${playerMap.size}`)
  return { playerMap, existingIds }
}

// ─── Stage 3: Fetch Full Player Data ─────────────────────────────────────────

const ENDPOINTS = [
  'profile',
  'achievements',
  'transfers',
  'stats',
  'marketValue',
  'jerseyNumbers',
] as const
type Endpoint = (typeof ENDPOINTS)[number]

const ENDPOINT_PATH: Record<Endpoint, (id: string) => string> = {
  profile: (id) => `/players/${id}/profile`,
  achievements: (id) => `/players/${id}/achievements`,
  transfers: (id) => `/players/${id}/transfers`,
  stats: (id) => `/players/${id}/stats`,
  marketValue: (id) => `/players/${id}/market_value`,
  jerseyNumbers: (id) => `/players/${id}/jersey_numbers`,
}

function needsFetch(val: unknown): boolean {
  return val === null || val === undefined
}

async function fetchPlayerData(playerMap: Map<string, SquadPlayer>, existingIds: Set<string>) {
  const cache: Record<string, Record<string, any>> = loadJson(CACHE_FILE) ?? {}

  const all = Array.from(playerMap.entries()).map(([id, sp]) => ({
    id,
    mv: sp.marketValue ?? 0,
    earliestSeason: sp.earliestSeason,
    manual: sp.fromClubs?.includes('manual') ?? false,
  }))

  // Fetch buckets:
  //   existing  – already in the shipped dataset (always refresh)
  //   manual    – curated legends (always fetch, even with no market value)
  //   valued    – newly discovered players above the market-value gate
  // Everyone else (fringe squad/youth with sub-threshold value, any era) is
  // skipped - this is what stops pre-2010 reserves from flooding the pool.
  const existing = all.filter((d) => existingIds.has(d.id))
  const manual = all.filter((d) => !existingIds.has(d.id) && d.manual)
  const valued = all.filter(
    (d) => !existingIds.has(d.id) && !d.manual && d.mv >= FULL_FETCH_THRESHOLD,
  )
  const skipLow = all.filter(
    (d) => !existingIds.has(d.id) && !d.manual && d.mv < FULL_FETCH_THRESHOLD,
  )

  const toFetch = [...existing, ...manual, ...valued]

  console.log(`    Existing:                        ${existing.length}`)
  console.log(`    Manual (curated legends):        ${manual.length}`)
  console.log(
    `    Valued (≥€${FULL_FETCH_THRESHOLD / 1_000_000}M, discovered):    ${valued.length}`,
  )
  console.log(`    Will fetch full data for ${toFetch.length} players`)
  console.log(`    Skipping ${skipLow.length} sub-threshold players (squad data only)`)

  const fullyDone = toFetch.filter(
    (d) => cache[d.id] && ENDPOINTS.every((ep) => !needsFetch(cache[d.id]?.[ep])),
  ).length
  const partialN = toFetch.filter(
    (d) =>
      cache[d.id] &&
      ENDPOINTS.some((ep) => !needsFetch(cache[d.id]?.[ep])) &&
      ENDPOINTS.some((ep) => needsFetch(cache[d.id]?.[ep])),
  ).length
  const emptyN = toFetch.filter(
    (d) => !cache[d.id] || ENDPOINTS.every((ep) => needsFetch(cache[d.id]?.[ep])),
  ).length

  console.log(`    Fully cached:                    ${fullyDone}  → skipping`)
  console.log(`    Partial  (some nulls):           ${partialN}  → will fetch missing only`)
  console.log(`    Empty    (nothing cached yet):   ${emptyN}  → will fetch all`)

  let fetched = 0
  for (let i = 0; i < toFetch.length; i++) {
    const { id } = toFetch[i]
    const sp = playerMap.get(id)!
    if (!cache[id]) cache[id] = {}
    ;(cache[id] as any).playerId = id

    const missing = ENDPOINTS.filter((ep) => needsFetch(cache[id][ep]))
    if (!missing.length) continue

    process.stdout.write(`[${i + 1}/${toFetch.length}] ${sp.name} (${id})`)
    let anyFetched = false

    for (const ep of missing) {
      await sleep(DELAY_MS)
      const data = await apiFetch<any>(ENDPOINT_PATH[ep](id))
      if (data === null) {
        process.stdout.write(` ⚠ Blocked. Waiting ${BACKOFF_DELAY_MS / 1000}s...`)
      } else {
        cache[id][ep] = data
        anyFetched = true
      }
    }

    if (anyFetched) {
      ;(cache[id] as any).discoveredFromClubs = sp.fromClubs
      saveJson(CACHE_FILE, cache)
      fetched++
    }
    console.log()
  }

  // Mark skipped players so parsePlayers doesn't retry them
  for (const { id } of skipLow) {
    if (!cache[id]) {
      const sp = playerMap.get(id)!
      cache[id] = {
        playerId: id,
        profile: false,
        achievements: false,
        transfers: false,
        stats: false,
        marketValue: false,
        jerseyNumbers: false,
        discoveredFromClubs: sp.fromClubs,
      }
    }
  }

  saveJson(CACHE_FILE, cache)
  console.log(`\nFetched/updated ${fetched} players.`)
  return cache
}

// ─── Stage 4: Parse and Write Results ────────────────────────────────────────

function parseAndWrite(cache: Record<string, any>, playerMap: Map<string, SquadPlayer>) {
  const squadCache: Record<string, any> = {}
  for (const [id, sp] of Array.from(playerMap.entries())) squadCache[id] = sp

  const processed: any[] = []
  let failed = 0
  let filtered = 0

  for (const raw of Object.values(cache)) {
    const squadInfo = squadCache[raw.playerId]
    const player = processPlayer(raw, squadInfo)
    if (!player?.name) {
      failed++
      continue
    }
    // Drop non-notable squad filler; always keep curated legends.
    if (!isNotablePlayer(player) && !MANUAL_PLAYER_IDS.has(player.playerId)) {
      filtered++
      continue
    }
    processed.push(player)
  }

  applyCommonsImages(processed, path.join(OUTPUT_DIR, 'images.json'))

  console.log(
    `\nProcessed: ${processed.length} players (${failed} skipped - no profile data, ${filtered} filtered as non-notable)`,
  )

  const existingMap = new Map(enrichedFootballPlayers.map((p) => [p.playerId, p]))
  const diffs: any[] = []
  for (const np of processed) {
    const old = existingMap.get(np.playerId)
    if (!old) continue
    const changes: Record<string, any> = {}
    const oldAch = new Set(old.achievements ?? [])
    const newAch = new Set(np.achievements as string[])
    const added = np.achievements.filter((a: string) => !oldAch.has(a))
    const removed = (old.achievements ?? []).filter((a: string) => !newAch.has(a))
    if (added.length || removed.length)
      changes.achievements = {
        old: old.achievements,
        new: np.achievements,
        added,
        removed,
      }
    if (old.nationality !== np.nationality && np.nationality)
      changes.nationality = { old: old.nationality, new: np.nationality }
    if (Object.keys(changes).length) diffs.push({ playerId: np.playerId, name: np.name, changes })
  }

  const achChanges = diffs.filter((d) => d.changes.achievements)
  if (achChanges.length) {
    console.log(`\nAchievement changes for ${achChanges.length} existing players:`)
    for (const d of achChanges) {
      console.log(`  ${d.name}:`)
      if (d.changes.achievements.added.length)
        console.log(`    + ${d.changes.achievements.added.join(', ')}`)
      if (d.changes.achievements.removed.length)
        console.log(`    - ${d.changes.achievements.removed.join(', ')}`)
    }
  }

  const sorted = [...processed].sort((a, b) => b.fameScore - a.fameScore)
  console.log('\nTop 10 by fame score:')
  for (const p of sorted.slice(0, 10))
    console.log(`  ${p.fameScore.toFixed(1).padStart(5)}  ${p.name}`)

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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log('=== Enrich Players ===\n')

  const clubs = await resolveClubIds()

  console.log('\n[Stage 2] Discovering players from club squads...')
  const { playerMap, existingIds } = await fetchSquadData(clubs)

  console.log('\n[Stage 3] Fetching detailed data...')
  const cache = await fetchPlayerData(playerMap, existingIds)

  console.log('\n[Stage 4] Parsing results...')
  parseAndWrite(cache, playerMap)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
