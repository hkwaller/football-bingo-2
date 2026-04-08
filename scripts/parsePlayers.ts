/**
 * Standalone parse script: processes whatever is in player-cache.json
 * and writes output without any API calls. Safe to run at any time.
 *
 * Usage: npm run parse
 */
import * as fs from 'fs'
import * as path from 'path'
import { enrichedFootballPlayers } from '../src/data/players'

const OUTPUT_DIR = path.join(__dirname, 'output')
const CACHE_FILE = path.join(OUTPUT_DIR, 'player-cache.json')
const SQUAD_CACHE_FILE = path.join(OUTPUT_DIR, 'squad-cache.json')
const RESULT_FILE = path.join(OUTPUT_DIR, 'players.json')
const DIFF_FILE = path.join(OUTPUT_DIR, 'diff-report.json')

// ─── Achievement Mapping ─────────────────────────────────────────────────────

const TROPHY_ACHIEVEMENT_MAP: [RegExp, string][] = [
  [/UEFA Champions League|Champions League winner|European Champion Clubs' Cup winner/i, 'Champions League winner'],
  [/FIFA Club World Cup|Club World Cup winner|Intercontinental Cup winner/i, 'Club World Cup winner'],
  [/(?<!Club )(?:FIFA )?World Cup/i, 'World Cup winner'],
  [/Ballon d'Or|Winner Ballon d'Or/i, "Ballon d'Or winner"],
  [/Copa Am[eé]rica/i, 'Copa America champion'],
  [/Africa Cup of Nations/i, 'African Cup of Nations winner'],
  [/African Footballer of the Year/i, 'African Footballer of the Year'],
  [/^European champion$|UEFA European Championship|UEFA Euro\b/i, 'Euro champion'],
  [/UEFA Europa League|Europa League winner|UEFA Cup winner|Uefa Cup winner/i, 'UEFA Cup/Europa League winner'],
  [/Conference League winner/i, 'Conference League winner'],
  [/Copa Libertadores winner/i, 'Copa Libertadores winner'],
  [/English FA Cup winner|^FA Cup winner$|^English cup winner$/i, 'FA Cup winner'],
  [/Copa del Rey|Spanish cup winner/i, 'Copa del Rey winner'],
  [/DFB-Pokal|German cup winner/i, 'DFB-Pokal winner'],
  [/Italian cup winner|Coppa Italia/i, 'Coppa Italia winner'],
  [/Golden Boot winner \(Europe\)|European Golden Boot/i, 'European Golden Boot winner'],
  [/FIFA World Player|The Best FIFA/i, 'FIFA World Player of the Year'],
  [/PFA Players' Player of the Year|PFA Player of the Year/i, 'PFA Player of the Year'],
]

const TOP_SCORER_MAP: [RegExp, string][] = [
  [/Premier League|English Premier/i, 'Premier League top scorer'],
  [/UEFA Champions League|European Champion Clubs' Cup/i, 'Champions League top scorer'],
  [/LaLiga|La Liga/i, 'La Liga top scorer'],
  [/^Bundesliga$/i, 'Bundesliga top scorer'],
  [/^Serie A$/i, 'Serie A top scorer'],
  [/^Ligue 1$/i, 'Ligue 1 top scorer'],
]

const LEAGUE_CHAMPION_PATTERNS: { pattern: RegExp; country: string; label?: string }[] = [
  { pattern: /English champion|Premier League champion/i, country: 'England', label: 'Premier League winner' },
  { pattern: /Spanish champion|La Liga champion/i, country: 'Spain', label: 'La Liga winner' },
  { pattern: /Italian champion|Serie A champion/i, country: 'Italy', label: 'Serie A winner' },
  { pattern: /German champion|Bundesliga champion/i, country: 'Germany', label: 'Bundesliga winner' },
  { pattern: /French champion|Ligue 1 champion/i, country: 'France', label: 'Ligue 1 winner' },
  { pattern: /Dutch champion|Eredivisie champion/i, country: 'Netherlands', label: 'Eredivisie winner' },
  { pattern: /Portuguese champion|Liga NOS/i, country: 'Portugal' },
  { pattern: /Scottish champion/i, country: 'Scotland' },
  { pattern: /Turkish champion/i, country: 'Turkey' },
  { pattern: /Argentine champion/i, country: 'Argentina' },
  { pattern: /Brazilian champion/i, country: 'Brazil' },
  { pattern: /American champion|MLS Cup/i, country: 'USA' },
]

// ─── Processing ───────────────────────────────────────────────────────────────

function mapAchievements(raw: any): string[] {
  const mapped = new Set<string>()

  if (raw.achievements?.achievements) {
    const allLeagueCountries = new Set<string>()
    let allLeagueTitles = 0

    for (const ach of raw.achievements.achievements) {
      const title: string = ach.title ?? ''
      const count: number = ach.count ?? 0

      for (const [pattern, ourLabel] of TROPHY_ACHIEVEMENT_MAP) {
        if (pattern.test(title)) { mapped.add(ourLabel); break }
      }

      if (/UEFA Champions League|Champions League winner|European Champion Clubs' Cup winner/i.test(title)) {
        const winningClubs = new Set(
          (ach.details ?? []).map((d: any) => d?.club?.id).filter(Boolean)
        )
        if (winningClubs.size >= 2) mapped.add('Champions League winner with different clubs')
      }

      if (/top.*scor|goal.*scor/i.test(title)) {
        for (const detail of ach.details ?? []) {
          const compName = detail?.competition?.name ?? ''
          for (const [pattern, ourLabel] of TOP_SCORER_MAP) {
            if (pattern.test(compName)) mapped.add(ourLabel)
          }
        }
      }

      for (const lcp of LEAGUE_CHAMPION_PATTERNS) {
        if (lcp.pattern.test(title)) {
          allLeagueTitles += count
          allLeagueCountries.add(lcp.country)
          if (lcp.label) mapped.add(lcp.label)
          break
        }
      }
    }

    if (allLeagueTitles >= 3) mapped.add('3+ domestic league titles')
    if (allLeagueCountries.size >= 2) mapped.add('League title in multiple countries')
  }

  if (raw.stats?.stats) {
    let totalGoals = 0, clGames = 0, intlCaps = 0
    for (const s of raw.stats.stats) {
      totalGoals += s.goals ?? 0
      const comp = (s.competitionId ?? '').toUpperCase()
      const compName = (s.competitionName ?? '').toLowerCase()
      if (comp === 'CL' || compName.includes('champions league')) clGames += s.appearances ?? 0
      if (['WM','EM','WCQU','EMQU','NL-A','NL-B','NL-C','COPA','AFCN','GC','CACN','SC'].includes(comp) ||
          compName.includes('world cup') || compName.includes('euro') ||
          compName.includes('nations league') || compName.includes('copa am') ||
          compName.includes('africa cup') || compName.includes('friendl') ||
          compName.includes('qualif')) {
        intlCaps += s.appearances ?? 0
      }
    }
    if (totalGoals >= 500) mapped.add('500+ career goals')
    if (clGames >= 100) mapped.add('100+ Champions League appearances')
    if (intlCaps >= 100) mapped.add('100+ international caps')
  }

  return Array.from(mapped)
}

function computeCareerStats(raw: any) {
  const out = { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0, championsLeagueGames: 0, championsLeagueGoals: 0 }
  if (!raw.stats?.stats) return out
  for (const s of raw.stats.stats) {
    out.appearances += s.appearances ?? 0
    out.goals += s.goals ?? 0
    out.assists += s.assists ?? 0
    out.yellowCards += s.yellowCards ?? 0
    out.redCards += s.redCards ?? 0
    out.minutesPlayed += s.minutesPlayed ?? 0
    const comp = (s.competitionId ?? '').toUpperCase()
    const compName = (s.competitionName ?? '').toLowerCase()
    if (comp === 'CL' || compName.includes('champions league')) {
      out.championsLeagueGames += s.appearances ?? 0
      out.championsLeagueGoals += s.goals ?? 0
    }
  }
  return out
}

function computeHighestValue(raw: any) {
  if (!raw.marketValue?.marketValueHistory?.length) return null
  let best = raw.marketValue.marketValueHistory[0]
  for (const e of raw.marketValue.marketValueHistory) {
    if ((e.marketValue ?? 0) > (best.marketValue ?? 0)) best = e
  }
  return { age: best.age ?? 0, date: best.date ?? '', clubId: best.clubId ?? '', clubName: best.clubName ?? '', marketValue: best.marketValue ?? 0 }
}

/**
 * Returns true if a club name is a youth team, reserve side, or B/C team.
 * Designed to keep real clubs like "Young Boys", "AC Milan", "Sporting CP".
 */
function isYouthOrReserveClub(name: string): boolean {
  return (
    /Yth\.|Youth/i.test(name) ||          // "Barça Youth", "AS Cannes Yth."
    /\bSub-\d/i.test(name) ||             // "Sporting Sub-15"
    /\bU\d{2}\b/i.test(name) ||           // "Man City U21", "Arsenal U18"
    / [BC]$/.test(name) ||                // "Barcelona B", "Barcelona C"
    / II{1,2}$/.test(name) ||             // "Real Madrid II", "Ajax III"
    /\bPrimavera\b/i.test(name) ||        // Italian youth "Roma Primavera"
    /\bReserv/i.test(name) ||             // "Reserve", "Reserves"
    /\bJV\b/.test(name)                   // "Newell's JV" (junior)
  )
}

function deriveClubs(raw: any): string[] {
  if (!raw.transfers?.transfers?.length) {
    if (raw.discoveredFromClubs?.length) {
      return (raw.discoveredFromClubs as string[]).filter((c) => c !== 'existing')
    }
    return raw.profile?.club?.name ? [raw.profile.club.name] : []
  }
  const clubs = new Set<string>()
  for (const t of raw.transfers.transfers) {
    const from = t.clubFrom?.name
    const to = t.clubTo?.name
    if (from && !/retired|without club|career break/i.test(from) && !isYouthOrReserveClub(from)) {
      clubs.add(from)
    }
    if (to && !/retired|without club|career break/i.test(to) && !isYouthOrReserveClub(to)) {
      clubs.add(to)
    }
  }
  return Array.from(clubs)
}

function deriveEra(raw: any): string {
  const profile = raw.profile
  if (!profile) return ''
  let startYear = '', endYear = ''

  if (raw.transfers?.transfers?.length) {
    const sorted = [...raw.transfers.transfers].sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    if (sorted[0]?.date) startYear = sorted[0].date.split('-')[0]
    const last = sorted[sorted.length - 1]
    if (last && /retired/i.test(last.clubTo?.name ?? '')) {
      endYear = last.date.split('-')[0]
    }
  }

  if (!startYear && profile.dateOfBirth) {
    const birth = parseInt(profile.dateOfBirth.split('-')[0])
    if (birth) startYear = String(birth + 17)
  }
  if (!endYear) {
    endYear = profile.isRetired ? (profile.retiredSince?.split('-')[0] ?? '') : 'present'
  }

  return startYear && endYear ? `${startYear}-${endYear}` : startYear ? `${startYear}-present` : ''
}

function computeFameScore(p: any, raw: any): number {
  let score = 0
  score += Math.min(30, (p.highestValue?.marketValue ?? 0) / 5_000_000)
  score += Math.min(30, p.achievements.length * 5)
  score += Math.min(20, p.careerStats.appearances / 50)
  score += Math.min(10, p.careerStats.championsLeagueGames / 10)

  if (raw.stats?.stats) {
    let intlCaps = 0
    for (const s of raw.stats.stats) {
      const comp = (s.competitionId ?? '').toUpperCase()
      const compName = (s.competitionName ?? '').toLowerCase()
      if (['WM','EM','WCQU','EMQU','NL-A','COPA','AFCN','GC','SC'].includes(comp) ||
          compName.includes('world cup') || compName.includes('euro') ||
          compName.includes('nations league') || compName.includes('friendl') ||
          compName.includes('qualif')) {
        intlCaps += s.appearances ?? 0
      }
    }
    score += Math.min(10, intlCaps / 10)
  }
  return Math.round(score * 10) / 10
}

function processPlayer(raw: any, squadInfo?: any) {
  const profile = raw.profile
  if (!profile?.name) return null

  const achievements = mapAchievements(raw)
  const careerStats = computeCareerStats(raw)
  const highestValue = computeHighestValue(raw)
  const clubs = deriveClubs(raw)
  const era = deriveEra(raw)
  const heightStr = String(profile.height ?? '').replace(/[^0-9]/g, '')
  const height = parseInt(heightStr) || 0

  const p: any = {
    playerId: raw.playerId,
    name: profile.name,
    nationality: profile.citizenship?.[0] ?? squadInfo?.nationality?.[0] ?? '',
    citizenship: profile.citizenship ?? squadInfo?.nationality ?? [],
    clubs: clubs.length ? clubs : (raw.discoveredFromClubs?.filter((c: string) => c !== 'existing') ?? []),
    youthClubs: raw.transfers?.youthClubs ?? [],
    achievements,
    randomAchievements: [],
    position: { main: profile.position?.main ?? squadInfo?.position ?? '', other: profile.position?.other ?? [] },
    imageUrl: profile.imageUrl ?? '',
    height: height > 100 ? height : (squadInfo?.height ?? 0),
    dateOfBirth: profile.dateOfBirth ?? squadInfo?.dateOfBirth ?? '',
    leftFooted: profile.foot === 'left' || squadInfo?.foot === 'left',
    era,
    careerStats,
    highestValue: highestValue ?? (squadInfo?.marketValue ? {
      age: 0, date: '', clubId: '', clubName: squadInfo.fromClubs?.[0] ?? '', marketValue: squadInfo.marketValue,
    } : null),
    fameScore: 0,
  }

  // Simple random achievements
  const traits: string[] = []
  if (p.clubs.length === 1) traits.push('One Club Man')
  if (p.clubs.length >= 5) traits.push('5+ Clubs')
  if (p.leftFooted) traits.push('Left Footed')
  if (p.height >= 190) traits.push('190cm+')
  if (p.citizenship.length >= 2) traits.push('Multiple Citizenships')
  if (p.position.other.length > 0) traits.push('Multiple Positions')
  if (p.clubs.length >= 3) traits.push('International Journeyman')
  const { careerStats: s } = p
  if (s.appearances >= 100 && (s.yellowCards + s.redCards) / s.appearances < 0.05) traits.push('Fair Play Master')
  if (s.appearances >= 50 && s.goals / s.appearances >= 0.5) traits.push('Prolific Scorer')
  const eraMatch = p.era.match(/(\d{4})-(\d{4}|present)/)
  if (eraMatch) {
    const span = (eraMatch[2] === 'present' ? new Date().getFullYear() : parseInt(eraMatch[2])) - parseInt(eraMatch[1])
    if (span >= 15) traits.push('Long Career')
  }
  p.randomAchievements = traits
  p.fameScore = computeFameScore(p, raw)

  return p
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  // null = blocked/not tried, false = definitively no data, object = success
  const withProfile = Object.values(cache).filter((v) => v.profile && v.profile !== false).length
  const withAchievements = Object.values(cache).filter((v) => v.achievements && v.achievements !== false).length
  const stillPending = Object.values(cache).filter((v) =>
    v.profile === null || v.achievements === null || v.transfers === null
  ).length
  console.log(`  With profile: ${withProfile}`)
  console.log(`  With achievements: ${withAchievements}`)
  console.log(`  Still have null endpoints (blocked — will retry): ${stillPending}`)

  // Process all players that have at least a profile
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

    const oldAch = new Set(old.achievements ?? [])
    const newAch = new Set(np.achievements as string[])
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

  // Print achievement changes
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

  // Print fame scores
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

  // Save outputs
  fs.writeFileSync(RESULT_FILE, JSON.stringify(sorted, null, 2))
  fs.writeFileSync(DIFF_FILE, JSON.stringify(diffs, null, 2))
  console.log(`\nWrote ${processed.length} players to ${RESULT_FILE}`)
  console.log(`Diff report: ${DIFF_FILE}`)
  console.log('\n(Run npm run write-players to update src/data/players.ts)')
}

main()
