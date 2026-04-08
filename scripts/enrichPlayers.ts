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

const DISCOVERY_SEASONS = ['2000', '2003', '2006', '2009', '2012', '2015', '2018', '2021', '2024', '2025']

// ─── Manual Players ──────────────────────────────────────────────────────────
// Use this to override wrong IDs picked up by squad discovery, or to force-include
// legendary players not found in any of our tracked club squads.
const MANUAL_PLAYERS: { id: string; name: string }[] = [
  // ── Corrections (wrong IDs from squad discovery) ──────────────────────────
  { id: '3140',   name: 'Ronaldo Nazário (R9)' },     // was wrongly mapped to Ronaldo Córdoba (421727)
  { id: '2904',   name: 'Rafael Márquez' },            // was wrongly mapped to lower-league player (310484)
  { id: '50935',  name: 'Javier Hernández (Chicharito)' }, // was wrongly mapped to amateur player (719927)
  { id: '7349',   name: 'Raúl González' },             // was wrongly mapped to Venezuelan Raúl (131754)
  { id: '181136', name: 'Piotr Zieliński' },           // was wrongly mapped to Polish GK (528347)

  // ── FIFA 100 legends missing from squad discovery ─────────────────────────
  // Argentina
  { id: '135778', name: 'Alfredo Di Stéfano' },
  { id: '37264',  name: 'Mario Kempes' },
  { id: '8024',   name: 'Diego Maradona' },
  { id: '7611',   name: 'Javier Saviola' },
  { id: '3143',   name: 'Juan Sebastián Verón' },
  // Brazil
  { id: '229662', name: 'Carlos Alberto Torres' },
  { id: '17121',  name: 'Pelé' },
  { id: '10201',  name: 'Rivellino' },
  { id: '117633', name: 'Sócrates' },
  { id: '117619', name: 'Zico' },
  // Bulgaria
  { id: '7938',   name: 'Hristo Stoichkov' },
  // Cameroon
  { id: '88989',  name: 'Roger Milla' },
  // Chile
  { id: '129083', name: 'Iván Zamorano' },
  // Colombia
  { id: '88998',  name: 'Carlos Valderrama' },
  // Croatia
  { id: '1407',   name: 'Davor Šuker' },
  // Denmark
  { id: '39667',  name: 'Brian Laudrup' },
  { id: '8023',   name: 'Michael Laudrup' },
  // England
  { id: '200627', name: 'Gordon Banks' },
  { id: '174874', name: 'Bobby Charlton' },
  { id: '85458',  name: 'Kevin Keegan' },
  { id: '22256',  name: 'Gary Lineker' },
  { id: '3110',   name: 'Alan Shearer' },
  // France
  { id: '12000',  name: 'Éric Cantona' },
  { id: '75553',  name: 'Didier Deschamps' },
  { id: '151245', name: 'Just Fontaine' },
  { id: '17168',  name: 'Jean-Pierre Papin' },
  // Germany
  { id: '72347',  name: 'Franz Beckenbauer' },
  { id: '89550',  name: 'Sepp Maier' },
  { id: '35604',  name: 'Gerd Müller' },
  { id: '72343',  name: 'Karl-Heinz Rummenigge' },
  // Ghana
  { id: '6657',   name: 'Abedi Pelé' },
  // Hungary
  { id: '103092', name: 'Ferenc Puskás' },
  // Italy
  { id: '42049',  name: 'Franco Baresi' },
  { id: '4289',   name: 'Alessandro Del Piero' },
  { id: '4171',   name: 'Alessandro Nesta' },
  { id: '116757', name: 'Paolo Rossi' },
  { id: '5797',   name: 'Christian Vieri' },
  { id: '89229',  name: 'Dino Zoff' },
  // Liberia
  { id: '8542',   name: 'George Weah' },
  // Netherlands
  { id: '8021',   name: 'Johan Cruyff' },
  { id: '5758',   name: 'Edgar Davids' },
  { id: '135643', name: 'Johan Neeskens' },
  { id: '70667',  name: 'Frank Rijkaard' },
  // Northern Ireland
  { id: '174986', name: 'George Best' },
  // Poland
  { id: '117229', name: 'Zbigniew Boniek' },
  // Portugal
  { id: '89230',  name: 'Eusébio' },
  // Republic of Ireland
  { id: '3396',   name: 'Roy Keane' },
  // Senegal
  { id: '54432',  name: 'El Hadji Diouf' },
  // Spain
  { id: '117598', name: 'Emilio Butragueño' },
  { id: '7601',   name: 'Luis Enrique' },
  // Turkey
  { id: '4077',   name: 'Rüştü Reçber' },
  { id: '5782',   name: 'Emre Belözoğlu' },
  // Uruguay
  { id: '116072', name: 'Enzo Francescoli' },
]

// IDs to forcibly remove from cache (wrong entries replaced by MANUAL_PLAYERS above)
const PURGE_IDS = new Set(['421727', '310484', '719927', '131754', '528347'])

// ─── Club List ───────────────────────────────────────────────────────────────

const OUR_CLUBS: { canonicalName: string; displayName: string }[] = [
  { canonicalName: 'Manchester United',   displayName: 'Manchester United' },
  { canonicalName: 'Liverpool FC',        displayName: 'Liverpool' },
  { canonicalName: 'Real Madrid',         displayName: 'Real Madrid' },
  { canonicalName: 'FC Barcelona',        displayName: 'Barcelona' },
  { canonicalName: 'Bayern Munich',       displayName: 'Bayern Munich' },
  { canonicalName: 'Paris Saint-Germain', displayName: 'PSG' },
  { canonicalName: 'Manchester City',     displayName: 'Manchester City' },
  { canonicalName: 'Chelsea FC',          displayName: 'Chelsea' },
  { canonicalName: 'Juventus FC',         displayName: 'Juventus' },
  { canonicalName: 'Arsenal FC',          displayName: 'Arsenal' },
  { canonicalName: 'AC Milan',            displayName: 'AC Milan' },
  { canonicalName: 'Inter Milan',         displayName: 'Inter Milan' },
  { canonicalName: 'Borussia Dortmund',   displayName: 'Borussia Dortmund' },
  { canonicalName: 'Atlético de Madrid',  displayName: 'Atletico Madrid' },
  { canonicalName: 'Ajax Amsterdam',      displayName: 'Ajax' },
  { canonicalName: 'FC Porto',            displayName: 'Porto' },
  { canonicalName: 'SL Benfica',          displayName: 'Benfica' },
  { canonicalName: 'Celtic FC',           displayName: 'Celtic' },
  { canonicalName: 'Rangers FC',          displayName: 'Rangers' },
  { canonicalName: 'SSC Napoli',          displayName: 'Napoli' },
  { canonicalName: 'Tottenham Hotspur',   displayName: 'Tottenham' },
  { canonicalName: 'CA Boca Juniors',     displayName: 'Boca Juniors' },
  { canonicalName: 'CA River Plate',      displayName: 'River Plate' },
  { canonicalName: 'Olympique Marseille', displayName: 'Marseille' },
  { canonicalName: 'Olympique Lyon',      displayName: 'Lyon' },
  { canonicalName: 'AS Roma',             displayName: 'AS Roma' },
  { canonicalName: 'Everton FC',          displayName: 'Everton' },
  { canonicalName: 'Aston Villa',         displayName: 'Aston Villa' },
  { canonicalName: 'AS Monaco',           displayName: 'Monaco' },
  { canonicalName: 'West Ham United',     displayName: 'West Ham' },
  { canonicalName: 'Bayer 04 Leverkusen', displayName: 'Bayer Leverkusen' },
  { canonicalName: 'Sevilla FC',          displayName: 'Sevilla' },
  { canonicalName: 'Feyenoord Rotterdam', displayName: 'Feyenoord' },
  { canonicalName: 'Los Angeles Galaxy',  displayName: 'LA Galaxy' },
  { canonicalName: 'Parma Calcio 1913',   displayName: 'Parma' },
  { canonicalName: 'Villarreal CF',       displayName: 'Villarreal' },
  { canonicalName: 'Southampton FC',      displayName: 'Southampton' },
  { canonicalName: 'Leicester City',      displayName: 'Leicester City' },
  { canonicalName: 'PSV Eindhoven',       displayName: 'PSV' },
  { canonicalName: 'Fenerbahce',          displayName: 'Fenerbahçe' },
  { canonicalName: 'Newcastle United',    displayName: 'Newcastle United' },
  { canonicalName: 'Blackburn Rovers',    displayName: 'Blackburn Rovers' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface Club { id: string; canonicalName: string; displayName: string }
interface SquadPlayer {
  id: string; name: string; position: string; dateOfBirth: string
  nationality: string[]; height: number | null; foot: string
  marketValue: number | null; fromClubs: string[]; earliestSeason: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) as T } catch { return null }
}
function saveJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

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
    return await res.json() as T
  } catch {
    return null
  }
}

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
  { pattern: /English champion|Premier League champion/i, country: 'England',     label: 'Premier League winner' },
  { pattern: /Spanish champion|La Liga champion/i,        country: 'Spain',       label: 'La Liga winner' },
  { pattern: /Italian champion|Serie A champion/i,        country: 'Italy',       label: 'Serie A winner' },
  { pattern: /German champion|Bundesliga champion/i,      country: 'Germany',     label: 'Bundesliga winner' },
  { pattern: /French champion|Ligue 1 champion/i,         country: 'France',      label: 'Ligue 1 winner' },
  { pattern: /Dutch champion|Eredivisie champion/i,       country: 'Netherlands', label: 'Eredivisie winner' },
  { pattern: /Portuguese champion|Liga NOS/i,             country: 'Portugal' },
  { pattern: /Scottish champion/i,                        country: 'Scotland' },
  { pattern: /Turkish champion/i,                         country: 'Turkey' },
  { pattern: /Argentine champion/i,                       country: 'Argentina' },
  { pattern: /Brazilian champion/i,                       country: 'Brazil' },
  { pattern: /American champion|MLS Cup/i,                country: 'USA' },
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

function isYouthOrReserveClub(name: string): boolean {
  return (
    /Yth\.|Youth/i.test(name) ||
    /\bSub-\d/i.test(name) ||
    /\bU\d{2}\b/i.test(name) ||
    / [BC]$/.test(name) ||
    / II{1,2}$/.test(name) ||
    /\bPrimavera\b/i.test(name) ||
    /\bReserv/i.test(name) ||
    /\bJV\b/.test(name)
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
    if (from && !/retired|without club|career break/i.test(from) && !isYouthOrReserveClub(from)) clubs.add(from)
    if (to && !/retired|without club|career break/i.test(to) && !isYouthOrReserveClub(to)) clubs.add(to)
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
    if (last && /retired/i.test(last.clubTo?.name ?? '')) endYear = last.date.split('-')[0]
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

function parseMarketValue(val: any): number | null {
  if (typeof val === 'number') return val
  if (typeof val !== 'string') return null
  const cleaned = val.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned) : null
}

// ─── Stage 1: Resolve Club IDs ────────────────────────────────────────────────

async function resolveClubIds(): Promise<Club[]> {
  const cached = loadJson<Club[]>(CLUBS_FILE)
  if (cached?.length) {
    console.log(`[Stage 1] Using cached club IDs (${cached.length} clubs)`)
    console.log(`${cached.length}/${cached.length} clubs resolved`)
    return cached
  }

  console.log('[Stage 1] Resolving club IDs...')
  const clubs: Club[] = []

  for (const club of OUR_CLUBS) {
    const searchVariants = [
      club.canonicalName,
      club.displayName,
      club.canonicalName.replace(/^(FC|AC|AS|CA|SL|SSC)\s+/i, ''),
    ].filter((v, i, a) => a.indexOf(v) === i)

    let found = false
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

        clubs.push({ id: best.id, canonicalName: club.canonicalName, displayName: club.displayName })
        console.log(`  ✓ ${club.canonicalName} → ID ${best.id} (${best.name})`)
        found = true
        break
      }
    }

    if (!found) {
      console.warn(`  ✗ Could not find: ${club.canonicalName}`)
      clubs.push({ id: '', canonicalName: club.canonicalName, displayName: club.displayName })
    }
  }

  saveJson(CLUBS_FILE, clubs)
  return clubs
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
          id, name, position: '', dateOfBirth: '', nationality: [],
          height: null, foot: '', marketValue: null,
          fromClubs: ['manual'], earliestSeason: '2000',
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
          if (!existing.fromClubs.includes(club.canonicalName)) existing.fromClubs.push(club.canonicalName)
          if (season < existing.earliestSeason) existing.earliestSeason = season
          const mv = parseMarketValue(p.marketValue)
          if (mv && (!existing.marketValue || mv > existing.marketValue)) existing.marketValue = mv
        } else {
          playerMap.set(p.id, {
            id: p.id, name: p.name, position: p.position ?? '',
            dateOfBirth: p.dateOfBirth ?? '', nationality: p.nationality ?? [],
            height: typeof p.height === 'number' ? p.height : parseInt(String(p.height)) || null,
            foot: p.foot ?? '', marketValue: parseMarketValue(p.marketValue),
            fromClubs: [club.canonicalName], earliestSeason: season,
          })
          newCount++
        }
      }
      console.log(`  ${club.displayName} ${season}: ${result.players.length} players (${newCount} new) — total: ${playerMap.size}`)
      await sleep(DELAY_MS)
    }
  }

  for (const id of Array.from(PURGE_IDS)) playerMap.delete(id)
  for (const { id, name } of MANUAL_PLAYERS) {
    if (!playerMap.has(id)) {
      playerMap.set(id, {
        id, name, position: '', dateOfBirth: '', nationality: [],
        height: null, foot: '', marketValue: null,
        fromClubs: ['manual'], earliestSeason: '2000',
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

const ENDPOINTS = ['profile', 'achievements', 'transfers', 'stats', 'marketValue'] as const
type Endpoint = typeof ENDPOINTS[number]

const ENDPOINT_PATH: Record<Endpoint, (id: string) => string> = {
  profile:      (id) => `/players/${id}/profile`,
  achievements: (id) => `/players/${id}/achievements`,
  transfers:    (id) => `/players/${id}/transfers`,
  stats:        (id) => `/players/${id}/stats`,
  marketValue:  (id) => `/players/${id}/market_value`,
}

function needsFetch(val: unknown): boolean { return val === null || val === undefined }

async function fetchPlayerData(playerMap: Map<string, SquadPlayer>, existingIds: Set<string>) {
  const cache: Record<string, Record<string, any>> = loadJson(CACHE_FILE) ?? {}

  const all = Array.from(playerMap.entries()).map(([id, sp]) => ({
    id, mv: sp.marketValue ?? 0, earliestSeason: sp.earliestSeason,
  }))

  const existing   = all.filter((d) => existingIds.has(d.id))
  const historical = all.filter((d) => !existingIds.has(d.id) && d.earliestSeason <= HISTORICAL_SEASON_CUTOFF)
  const highValue  = all.filter((d) => !existingIds.has(d.id) && d.earliestSeason > HISTORICAL_SEASON_CUTOFF && d.mv >= FULL_FETCH_THRESHOLD)
  const skipLow    = all.filter((d) => !existingIds.has(d.id) && d.earliestSeason > HISTORICAL_SEASON_CUTOFF && d.mv < FULL_FETCH_THRESHOLD)

  const toFetch = [...existing, ...historical, ...highValue]

  console.log(`    Existing:                        ${existing.length}`)
  console.log(`    Historical era (pre-${HISTORICAL_SEASON_CUTOFF}):      ${historical.length}`)
  console.log(`    High-value modern (≥€${FULL_FETCH_THRESHOLD / 1_000_000}M): ${highValue.length}`)
  console.log(`    Will fetch full data for ${toFetch.length} players`)
  console.log(`    Skipping ${skipLow.length} low-value modern players (squad data only)`)

  const fullyDone = toFetch.filter((d) => cache[d.id] && ENDPOINTS.every((ep) => !needsFetch(cache[d.id]?.[ep]))).length
  const partialN  = toFetch.filter((d) => cache[d.id] && ENDPOINTS.some((ep) => !needsFetch(cache[d.id]?.[ep])) && ENDPOINTS.some((ep) => needsFetch(cache[d.id]?.[ep]))).length
  const emptyN    = toFetch.filter((d) => !cache[d.id] || ENDPOINTS.every((ep) => needsFetch(cache[d.id]?.[ep]))).length

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
        playerId: id, profile: false, achievements: false,
        transfers: false, stats: false, marketValue: false,
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

  for (const raw of Object.values(cache)) {
    if (!raw.profile || raw.profile === false) { failed++; continue }
    const squadInfo = squadCache[raw.playerId]
    const player = processPlayer(raw, squadInfo)
    if (player?.name) processed.push(player)
    else failed++
  }

  console.log(`\nProcessed: ${processed.length} players (${failed} skipped — no profile data)`)

  const existingMap = new Map(enrichedFootballPlayers.map((p) => [p.playerId, p]))
  const diffs: any[] = []
  for (const np of processed) {
    const old = existingMap.get(np.playerId)
    if (!old) continue
    const changes: Record<string, any> = {}
    const oldAch = new Set(old.achievements ?? [])
    const newAch = new Set(np.achievements as string[])
    const added   = np.achievements.filter((a: string) => !oldAch.has(a))
    const removed = (old.achievements ?? []).filter((a: string) => !newAch.has(a))
    if (added.length || removed.length) changes.achievements = { old: old.achievements, new: np.achievements, added, removed }
    if (old.nationality !== np.nationality && np.nationality) changes.nationality = { old: old.nationality, new: np.nationality }
    if (Object.keys(changes).length) diffs.push({ playerId: np.playerId, name: np.name, changes })
  }

  const achChanges = diffs.filter((d) => d.changes.achievements)
  if (achChanges.length) {
    console.log(`\nAchievement changes for ${achChanges.length} existing players:`)
    for (const d of achChanges) {
      console.log(`  ${d.name}:`)
      if (d.changes.achievements.added.length)   console.log(`    + ${d.changes.achievements.added.join(', ')}`)
      if (d.changes.achievements.removed.length) console.log(`    - ${d.changes.achievements.removed.join(', ')}`)
    }
  }

  const sorted = [...processed].sort((a, b) => b.fameScore - a.fameScore)
  console.log('\nTop 10 by fame score:')
  for (const p of sorted.slice(0, 10)) console.log(`  ${p.fameScore.toFixed(1).padStart(5)}  ${p.name}`)

  const tiers = {
    legendary: processed.filter((p) => p.fameScore >= 70).length,
    wellKnown: processed.filter((p) => p.fameScore >= 40 && p.fameScore < 70).length,
    known:     processed.filter((p) => p.fameScore >= 20 && p.fameScore < 40).length,
    other:     processed.filter((p) => p.fameScore < 20).length,
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

main().catch((err) => { console.error(err); process.exit(1) })
