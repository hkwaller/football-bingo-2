/**
 * Shared data-transform logic for the enrichment pipeline.
 *
 * Both `enrichPlayers.ts` (full re-run, hits the API) and `parsePlayers.ts`
 * (rebuilds from cache, no API) import from here so the transform logic lives
 * in ONE place. Previously it was copy-pasted between the two and drifted.
 */
import { clubs as APP_CLUBS } from '../src/data/clubs'
import { managers } from './data/managers'
import { LEGEND_OVERRIDES } from './data/legendOverrides'

// ─── Club canonicalisation (by Transfermarkt club ID) ────────────────────────
// The transfers feed carries stable club IDs (t.clubFrom.id / t.clubTo.id).
// We map those IDs to our canonical names at build time so matching in the app
// no longer depends on fragile name-string equality.

const CLUB_ID_TO_CANONICAL = new Map(APP_CLUBS.map((c) => [c.id, c.canonicalName]))

// Transfermarkt uses a few nationality spellings that differ from our category
// labels; normalise so nationality matching (exact-equality) still hits.
const NATIONALITY_ALIASES: Record<string, string> = {
  'Korea, South': 'South Korea',
  'Korea, North': 'North Korea',
}
function normNationality(n: string): string {
  return NATIONALITY_ALIASES[n] ?? n
}

/** Canonical name for a tracked club id, else the raw name (trimmed). */
function canonicalClubName(id: string | undefined, rawName: string): string {
  if (id && CLUB_ID_TO_CANONICAL.has(id)) return CLUB_ID_TO_CANONICAL.get(id)!
  return rawName.trim()
}

// ─── Achievement Mapping ─────────────────────────────────────────────────────

const TROPHY_ACHIEVEMENT_MAP: [RegExp, string][] = [
  [/UEFA CL|CL winner|European Champion Clubs' Cup winner/i, 'CL winner'],
  [
    /FIFA Club World Cup|Club World Cup winner|Intercontinental Cup winner|FIFA Intercontinental Cup/i,
    'Club World Cup winner',
  ],
  [/(?<!Club )(?:FIFA )?World Cup/i, 'World Cup winner'],
  [/Ballon d'Or|Winner Ballon d'Or/i, "Ballon d'Or winner"],
  [/Copa Am[eé]rica/i, 'Copa America champion'],
  [/Africa Cup of Nations|Africa Cup winner/i, 'African Cup of Nations winner'],
  [/African Footballer of the Year/i, 'African Footballer of the Year'],
  [/^European champion$|UEFA European Championship|UEFA Euro\b/i, 'Euro champion'],
  [
    /UEFA Europa League|Europa League winner|UEFA Cup winner|Uefa Cup winner/i,
    'UEFA Cup/Europa League winner',
  ],
  [/Conference League winner/i, 'Conference League winner'],
  [/Copa Libertadores winner/i, 'Copa Libertadores winner'],
  [/English FA Cup winner|^FA Cup winner$|^English cup winner$/i, 'FA Cup winner'],
  [/Copa del Rey|Spanish cup winner/i, 'Copa del Rey winner'],
  [/DFB-Pokal|German cup winner/i, 'DFB-Pokal winner'],
  [/Italian cup winner|Coppa Italia/i, 'Coppa Italia winner'],
  [/Golden Boot winner \(Europe\)|European Golden Boot/i, 'European Golden Boot winner'],
  [/FIFA World Player|The Best FIFA/i, 'FIFA World Player of the Year'],
  [/PFA Players' Player of the Year|PFA Player of the Year/i, 'PFA Player of the Year'],
  // ── Newly added labels (titles verified present in the cached feed) ──
  [/UEFA Nations League/i, 'Nations League winner'],
  [/Pusk[aá]s Award/i, 'Puskás Award winner'],
  [/UEFA Best Player in Europe/i, 'UEFA Best Player in Europe'],
  [/Olympic medalist|Olympic Games/i, 'Olympic medalist'],
  [/Confederations Cup winner/i, 'Confederations Cup winner'],
]

const TOP_SCORER_MAP: [RegExp, string][] = [
  [/Premier League|English Premier/i, 'Premier League top scorer'],
  [/UEFA CL|European Champion Clubs' Cup/i, 'CL top scorer'],
  [/LaLiga|La Liga/i, 'La Liga top scorer'],
  [/^Bundesliga$/i, 'Bundesliga top scorer'],
  [/^Serie A$/i, 'Serie A top scorer'],
  [/^Ligue 1$/i, 'Ligue 1 top scorer'],
]

const LEAGUE_CHAMPION_PATTERNS: { pattern: RegExp; country: string; label?: string }[] = [
  {
    pattern: /English champion|Premier League champion/i,
    country: 'England',
    label: 'Premier League winner',
  },
  { pattern: /Spanish champion|La Liga champion/i, country: 'Spain', label: 'La Liga winner' },
  { pattern: /Italian champion|Serie A champion/i, country: 'Italy', label: 'Serie A winner' },
  {
    pattern: /German champion|Bundesliga champion/i,
    country: 'Germany',
    label: 'Bundesliga winner',
  },
  { pattern: /French champion|Ligue 1 champion/i, country: 'France', label: 'Ligue 1 winner' },
  {
    pattern: /Dutch champion|Eredivisie champion/i,
    country: 'Netherlands',
    label: 'Eredivisie winner',
  },
  { pattern: /Portuguese champion|Liga NOS/i, country: 'Portugal' },
  { pattern: /Scottish champion/i, country: 'Scotland' },
  { pattern: /Turkish champion/i, country: 'Turkey' },
  { pattern: /Argentin(e|ian) champion/i, country: 'Argentina' },
  { pattern: /Brazilian champion/i, country: 'Brazil' },
  { pattern: /American champion|MLS Cup/i, country: 'USA' },
]

// Domestic-cup titles, keyed for the double/treble season-join.
const DOMESTIC_CUP_PATTERN =
  /English FA Cup winner|^FA Cup winner$|^English cup winner$|Copa del Rey|Spanish cup winner|DFB-Pokal|German cup winner|Italian cup winner|Coppa Italia|French cup winner|Dutch Cup winner|Portuguese cup winner/i
const CL_WINNER_PATTERN = /UEFA CL|CL winner|European Champion Clubs' Cup winner/i

/** Season ids (strings) present on an achievement's details. */
function seasonIds(ach: any): string[] {
  return (ach.details ?? [])
    .map((d: any) => d?.season?.id ?? d?.season?.name)
    .filter(Boolean)
    .map(String)
}

function isLeagueTitle(title: string): boolean {
  return LEAGUE_CHAMPION_PATTERNS.some((lcp) => lcp.pattern.test(title))
}

function mapAchievements(raw: any): string[] {
  const mapped = new Set<string>()

  if (raw.achievements?.achievements) {
    const allLeagueCountries = new Set<string>()
    let allLeagueTitles = 0
    // For domestic double / treble: which seasons the player won each type.
    const leagueSeasons = new Set<string>()
    const cupSeasons = new Set<string>()
    const clSeasons = new Set<string>()

    for (const ach of raw.achievements.achievements) {
      const title: string = ach.title ?? ''
      const count: number = ach.count ?? 0

      for (const [pattern, ourLabel] of TROPHY_ACHIEVEMENT_MAP) {
        if (pattern.test(title)) {
          mapped.add(ourLabel)
          break
        }
      }

      if (CL_WINNER_PATTERN.test(title)) {
        const winningClubs = new Set(
          (ach.details ?? []).map((d: any) => d?.club?.id).filter(Boolean),
        )
        if (winningClubs.size >= 2) mapped.add('CL winner with different clubs')
        for (const s of seasonIds(ach)) clSeasons.add(s)
      }

      if (/top.*scor|goal.*scor/i.test(title)) {
        for (const detail of ach.details ?? []) {
          const compName = detail?.competition?.name ?? ''
          for (const [pattern, ourLabel] of TOP_SCORER_MAP) {
            if (pattern.test(compName)) mapped.add(ourLabel)
          }
        }
      }

      if (isLeagueTitle(title)) {
        for (const s of seasonIds(ach)) leagueSeasons.add(s)
      }
      if (DOMESTIC_CUP_PATTERN.test(title)) {
        for (const s of seasonIds(ach)) cupSeasons.add(s)
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

    // Same-season league + domestic cup = double; + CL = treble.
    const leagueAndCup = [...leagueSeasons].filter((s) => cupSeasons.has(s))
    if (leagueAndCup.length) mapped.add('Domestic double')
    if (leagueAndCup.some((s) => clSeasons.has(s))) mapped.add('Treble winner')
  }

  const totals = computeCareerStats(raw)
  if (raw.stats?.stats) {
    if (totals.goals >= 500) mapped.add('500+ career goals')
    else if (totals.goals >= 200) mapped.add('200+ career goals')
    if (totals.assists >= 200) mapped.add('200+ career assists')
    if (totals.championsLeagueGames >= 100) mapped.add('100+ CL appearances')
  }
  // NB: the stats endpoint returns club competitions only - no national-team
  // rows - so international caps/goals are not derivable here.

  return Array.from(mapped)
}

function computeCareerStats(raw: any) {
  const out = {
    appearances: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: 0,
    championsLeagueGames: 0,
    championsLeagueGoals: 0,
  }
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
    if (comp === 'CL' || compName.includes('CL')) {
      out.championsLeagueGames += s.appearances ?? 0
      out.championsLeagueGoals += s.goals ?? 0
    }
  }
  return out
}

/** International (national-team) appearances and goals, summed across comps. */
function computeIntlStats(raw: any): { caps: number; goals: number } {
  let caps = 0
  let goals = 0
  if (!raw.stats?.stats) return { caps, goals }
  for (const s of raw.stats.stats) {
    const comp = (s.competitionId ?? '').toUpperCase()
    const compName = (s.competitionName ?? '').toLowerCase()
    if (
      [
        'WM',
        'EM',
        'WCQU',
        'EMQU',
        'NL-A',
        'NL-B',
        'NL-C',
        'COPA',
        'AFCN',
        'GC',
        'CACN',
        'SC',
        'KLUB',
      ].includes(comp) ||
      compName.includes('world cup') ||
      compName.includes('euro') ||
      compName.includes('nations league') ||
      compName.includes('copa am') ||
      compName.includes('africa cup') ||
      compName.includes('friendl') ||
      compName.includes('qualif')
    ) {
      caps += s.appearances ?? 0
      goals += s.goals ?? 0
    }
  }
  return { caps, goals }
}

function computeHighestValue(raw: any) {
  if (!raw.marketValue?.marketValueHistory?.length) return null
  let best = raw.marketValue.marketValueHistory[0]
  for (const e of raw.marketValue.marketValueHistory) {
    if ((e.marketValue ?? 0) > (best.marketValue ?? 0)) best = e
  }
  return {
    age: best.age ?? 0,
    date: best.date ?? '',
    clubId: best.clubId ?? '',
    clubName: best.clubName ?? '',
    marketValue: best.marketValue ?? 0,
  }
}

/**
 * Returns true if a club name is a youth team, reserve side, or B/C team.
 * Designed to keep real clubs like "Young Boys", "AC Milan", "Sporting CP".
 */
function isYouthOrReserveClub(name: string): boolean {
  return (
    /Yth\.|Youth/i.test(name) ||
    /\bSub-\d/i.test(name) ||
    /\bU\d{2}\b/i.test(name) ||
    /\bY\d{2}\b/.test(name) ||
    / [BC]$/.test(name) ||
    / II{1,2}$/.test(name) ||
    /\bPrimavera\b/i.test(name) ||
    /\bReserv/i.test(name) ||
    /\bJV\b/.test(name)
  )
}

const RETIRED_RE = /retired|without club|career break/i

function deriveClubs(raw: any): string[] {
  if (!raw.transfers?.transfers?.length) {
    if (raw.discoveredFromClubs?.length) {
      return (raw.discoveredFromClubs as string[]).filter((c) => c !== 'existing')
    }
    return raw.profile?.club?.name
      ? [canonicalClubName(raw.profile.club.id, raw.profile.club.name)]
      : []
  }
  const clubs = new Set<string>()
  for (const t of raw.transfers.transfers) {
    for (const side of [t.clubFrom, t.clubTo]) {
      const name = side?.name
      if (name && !RETIRED_RE.test(name) && !isYouthOrReserveClub(name)) {
        clubs.add(canonicalClubName(side?.id, name))
      }
    }
  }
  return Array.from(clubs)
}

// ─── Manager join ─────────────────────────────────────────────────────────────

function ym(d: string): string {
  // Normalise a "YYYY-MM" or "YYYY-MM-DD" or "present" to a comparable "YYYY-MM-DD".
  if (!d || /present/i.test(d)) {
    const now = new Date()
    return `${now.getFullYear()}-12-31`
  }
  const parts = d.split('-')
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-15`
  return d
}

interface Tenure {
  clubId: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
}

/** Build club tenures from the transfer arrival events (clubTo). */
function deriveTenures(raw: any): Tenure[] {
  const transfers = raw.transfers?.transfers
  if (!transfers?.length) return []
  const sorted = [...transfers]
    .filter((t: any) => t.date)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const tenures: Tenure[] = []
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i]
    const to = t.clubTo
    if (!to?.id || RETIRED_RE.test(to.name ?? '')) continue
    const next = sorted[i + 1]
    const end = next?.date ? ym(next.date) : ym('present')
    tenures.push({ clubId: String(to.id), start: ym(t.date), end })
  }
  return tenures
}

function overlaps(a: Tenure, s: { clubId: string; from: string; to: string }): boolean {
  if (a.clubId !== s.clubId) return false
  const sStart = ym(s.from)
  const sEnd = ym(s.to)
  return a.start <= sEnd && sStart <= a.end
}

function deriveManagers(raw: any): string[] {
  const tenures = deriveTenures(raw)
  if (!tenures.length) return []
  const out = new Set<string>()
  for (const m of managers) {
    for (const stint of m.stints) {
      if (tenures.some((t) => overlaps(t, stint))) {
        out.add(`Played under ${m.name}`)
        break
      }
    }
  }
  return Array.from(out)
}

// ─── Tags (position / decade / shirt number / trait / academy) ───────────────

const POSITION_BUCKETS: [RegExp, string][] = [
  [/goalkeeper/i, 'Goalkeeper'],
  [/(centre|center)-?back|central defender/i, 'Centre-Back'],
  [/(left|right)-?back|full-?back|wing-?back/i, 'Full-Back'],
  [/defensive midfield/i, 'Defensive Midfield'],
  [/attacking midfield/i, 'Attacking Midfield'],
  [/(central|left|right) midfield|^midfield/i, 'Central Midfield'],
  [/winger|wide/i, 'Winger'],
  [/(centre|center)-?forward|striker/i, 'Centre-Forward'],
]

function positionTags(position: { main?: string; other?: string[] }): string[] {
  const all = [position.main ?? '', ...(position.other ?? [])].filter(Boolean)
  const out = new Set<string>()
  for (const pos of all) {
    for (const [re, label] of POSITION_BUCKETS) {
      if (re.test(pos)) {
        out.add(label)
        break
      }
    }
  }
  return Array.from(out)
}

function decadeTags(era: string): string[] {
  const m = era.match(/(\d{4})-(\d{4}|present)/)
  if (!m) return []
  const start = parseInt(m[1])
  const end = m[2] === 'present' ? new Date().getFullYear() : parseInt(m[2])
  const out: string[] = []
  for (let dec = Math.floor(start / 10) * 10; dec <= end; dec += 10) {
    if (dec >= 1960 && dec <= 2000) out.push(`${dec}s player`)
  }
  return out
}

const ICONIC_NUMBERS = new Set([1, 7, 9, 10])

function jerseyTags(jerseyNumbers: { jerseyNumber?: number }[]): string[] {
  const out = new Set<string>()
  for (const j of jerseyNumbers) {
    if (typeof j.jerseyNumber === 'number' && ICONIC_NUMBERS.has(j.jerseyNumber)) {
      out.add(`Wore #${j.jerseyNumber}`)
    }
  }
  return Array.from(out)
}

// Match exact club identifiers in the youth-club history. Loose substrings
// caused false positives (e.g. "Barcelona Esporte Clube", "FC Miyagi Barcelona").
// This is accurate-but-incomplete: Transfermarkt's youthClubs field often omits
// the senior academy, so some genuine graduates won't be tagged.
const ACADEMY_PATTERNS: [RegExp, string][] = [
  [/\bFC Barcelona\b|La Masia/i, 'La Masia (Barcelona)'],
  [/\bAjax Amsterdam\b|\bAFC Ajax\b|(^|\W)Ajax(\W|$)/i, 'Ajax Academy'],
  [/\bManchester United\b/i, 'Man Utd Academy'],
  [/\bReal Madrid\b/i, 'Real Madrid Academy'],
  [/\bSporting (CP|Clube)\b|Sporting Lissabon/i, 'Sporting CP Academy'],
  [/\bArsenal FC\b/i, 'Arsenal Academy'],
  [/\bChelsea FC\b/i, 'Chelsea Academy'],
  [/\bSantos FC\b/i, 'Santos Academy'],
]

function academyTags(youthClubs: string[]): string[] {
  const out = new Set<string>()
  for (const yc of youthClubs) {
    for (const [re, label] of ACADEMY_PATTERNS) {
      if (re.test(yc)) out.add(label)
    }
  }
  return Array.from(out)
}

// ─── Era / fame ───────────────────────────────────────────────────────────────

function deriveEra(raw: any): string {
  const profile = raw.profile
  if (!profile) return ''
  let startYear = '',
    endYear = ''

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

function computeFameScore(p: any, intlCaps: number): number {
  let score = 0
  score += Math.min(30, (p.highestValue?.marketValue ?? 0) / 5_000_000)
  score += Math.min(30, p.achievements.length * 5)
  score += Math.min(20, p.careerStats.appearances / 50)
  score += Math.min(10, p.careerStats.championsLeagueGames / 10)
  score += Math.min(10, intlCaps / 10)
  return Math.round(score * 10) / 10
}

// ─── Main per-player transform ────────────────────────────────────────────────

export function processPlayer(raw: any, squadInfo?: any) {
  // Legends whose /profile endpoint 500s: use hand-sourced fallback fields, but
  // still build clubs/honours/stats from their working endpoints.
  const override = LEGEND_OVERRIDES[raw.playerId as string]
  const profile = raw.profile && typeof raw.profile === 'object' ? raw.profile : {}
  const name = profile.name ?? override?.name
  if (!name) return null

  const intl = computeIntlStats(raw)
  const achievements = mapAchievements(raw)
  const careerStats = computeCareerStats(raw)
  const highestValue = computeHighestValue(raw)
  const clubs = deriveClubs(raw)
  const era = deriveEra(raw)
  const heightStr = String(profile.height ?? '').replace(/[^0-9]/g, '')
  const height = parseInt(heightStr) || 0
  const youthClubs: string[] = raw.transfers?.youthClubs ?? []
  const jerseyNumbers: { season: string; club: string; jerseyNumber: number }[] =
    raw.jerseyNumbers?.jerseyNumbers ?? []

  const citizenship: string[] =
    profile.citizenship ?? override?.citizenship ?? squadInfo?.nationality ?? []
  const p: any = {
    playerId: raw.playerId,
    name,
    nationality: normNationality(
      profile.citizenship?.[0] ?? override?.nationality ?? squadInfo?.nationality?.[0] ?? '',
    ),
    citizenship: citizenship.map(normNationality),
    clubs: clubs.length
      ? clubs
      : (raw.discoveredFromClubs?.filter((c: string) => c !== 'existing') ?? []),
    youthClubs,
    achievements,
    randomAchievements: [],
    tags: [],
    managers: [],
    jerseyNumbers,
    position: {
      main: profile.position?.main ?? override?.position ?? squadInfo?.position ?? '',
      other: profile.position?.other ?? [],
    },
    imageUrl: profile.imageUrl ?? '',
    imageAttribution: null,
    height: height > 100 ? height : (squadInfo?.height ?? 0),
    dateOfBirth: profile.dateOfBirth ?? squadInfo?.dateOfBirth ?? '',
    leftFooted: profile.foot === 'left' || squadInfo?.foot === 'left',
    era,
    careerStats,
    highestValue:
      highestValue ??
      (squadInfo?.marketValue
        ? {
            age: 0,
            date: '',
            clubId: '',
            clubName: squadInfo.fromClubs?.[0] ?? '',
            marketValue: squadInfo.marketValue,
          }
        : null),
    fameScore: 0,
  }

  // ── randomAchievements (kept for backward compatibility) ──
  const traits: string[] = []
  if (p.clubs.length === 1) traits.push('One Club Man')
  if (p.clubs.length >= 5) traits.push('5+ Clubs')
  if (p.leftFooted) traits.push('Left Footed')
  if (p.height >= 190) traits.push('190cm+')
  if (p.citizenship.length >= 2) traits.push('Multiple Citizenships')
  if (p.position.other.length > 0) traits.push('Multiple Positions')
  if (p.clubs.length >= 3) traits.push('International Journeyman')
  const { careerStats: s } = p
  if (s.appearances >= 100 && (s.yellowCards + s.redCards) / s.appearances < 0.05)
    traits.push('Fair Play Master')
  if (s.appearances >= 50 && s.goals / s.appearances >= 0.5) traits.push('Prolific Scorer')
  const eraMatch = p.era.match(/(\d{4})-(\d{4}|present)/)
  if (eraMatch) {
    const span =
      (eraMatch[2] === 'present' ? new Date().getFullYear() : parseInt(eraMatch[2])) -
      parseInt(eraMatch[1])
    if (span >= 15) traits.push('Long Career')
  }
  p.randomAchievements = traits

  // ── tags (the new "traits" bingo axis: position / decade / shirt / trait / academy) ──
  const tagSet = new Set<string>()
  for (const t of positionTags(p.position)) tagSet.add(t)
  for (const t of decadeTags(p.era)) tagSet.add(t)
  for (const t of jerseyTags(jerseyNumbers)) tagSet.add(t)
  for (const t of academyTags(youthClubs)) tagSet.add(t)
  // Bingo-worthy personal traits (curated subset + two new profile-derived ones).
  if (p.leftFooted) tagSet.add('Left Footed')
  if (p.clubs.length === 1) tagSet.add('One Club Man')
  if (p.citizenship.length >= 2) tagSet.add('Dual Nationality')
  if (p.height >= 190) tagSet.add('190cm+')
  if (s.appearances >= 50 && s.goals / s.appearances >= 0.5) tagSet.add('Prolific Scorer')
  if (Array.isArray(profile.relatives) && profile.relatives.length > 0)
    tagSet.add('Football family')
  // trainerProfile exists for many post-career roles (agent, chairman, owner…);
  // only an on-pitch coaching role counts as "became a manager".
  const coachRole: string = profile.trainerProfile?.position ?? ''
  if (/^(manager|assistant manager|.*coach)$/i.test(coachRole.trim()))
    tagSet.add('Became a manager')
  p.tags = Array.from(tagSet)

  // ── managers ──
  p.managers = deriveManagers(raw)

  p.fameScore = computeFameScore(p, intl.caps)

  return p
}

// ─── Popularity filter ────────────────────────────────────────────────────────
// Squad discovery pulls in fringe/youth players (0 appearances, no honours).
// Keep only players notable enough for a popularity-based game. Curated legends
// (MANUAL_PLAYER_IDS) bypass this - see the filter call sites.
const NOTABLE_FAME = 18
const NOTABLE_MARKET_VALUE = 5_000_000
const NOTABLE_APPEARANCES = 200
const NOTABLE_ACHIEVEMENTS = 3

export function isNotablePlayer(p: any): boolean {
  return (
    p.fameScore >= NOTABLE_FAME ||
    (p.highestValue?.marketValue ?? 0) >= NOTABLE_MARKET_VALUE ||
    (p.careerStats?.appearances ?? 0) >= NOTABLE_APPEARANCES ||
    (p.achievements?.length ?? 0) >= NOTABLE_ACHIEVEMENTS
  )
}

/**
 * Overlay Commons images (scripts/output/images.json) onto processed players.
 * A player keeps its existing (Transfermarkt) image only where no free Commons
 * image was found. Mutates and returns the array.
 */
export function applyCommonsImages(players: any[], imagesFile: string): any[] {
  let fs: typeof import('fs')
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fs = require('fs')
  } catch {
    return players
  }
  if (!fs.existsSync(imagesFile)) return players
  const images: Record<string, { imageUrl?: string; attribution?: any }> = JSON.parse(
    fs.readFileSync(imagesFile, 'utf-8'),
  )
  for (const p of players) {
    const rec = images[p.playerId]
    if (rec?.imageUrl) {
      p.imageUrl = rec.imageUrl
      p.imageAttribution = rec.attribution ?? null
    } else if (typeof p.imageUrl === 'string' && p.imageUrl.includes('transfermarkt')) {
      // No free Commons image - drop the copyrighted Transfermarkt fallback so
      // the app never hotlinks TM. The UI shows its placeholder instead.
      p.imageUrl = ''
      p.imageAttribution = null
    }
  }
  return players
}

export function parseMarketValue(val: any): number | null {
  if (typeof val === 'number') return val
  if (typeof val !== 'string') return null
  const cleaned = val.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned) : null
}
