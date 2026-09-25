import { famousLineups } from '@/data/famous11s'
import type { Famous11sLineup } from '@/data/famous11s'
import { normalize } from '@/lib/tenable/normalize'
import type {
  Famous11sBrowseSort,
  Famous11sDifficultyFilter,
  Famous11sEraFilter,
  Famous11sKindFilter,
} from './types'

export const KIND_GROUPS = [
  { id: 'national' as const, label: 'National Teams', emoji: '🌍' },
  { id: 'club' as const, label: 'Club Sides', emoji: '🏆' },
]

export const ERA_GROUPS = [
  { id: 'classic' as const, label: 'Classic', explainer: 'Folklore XIs - finals and legendary sides' },
  { id: 'big-nights' as const, label: 'Big Nights', explainer: 'Recent marquee matches a current fan might have watched' },
]

const DIFFICULTY_ORDER: Record<Famous11sLineup['difficulty'], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

export function matchesLineupFilters(
  lineup: Famous11sLineup,
  kind: Famous11sKindFilter,
  difficulty: Famous11sDifficultyFilter,
  era: Famous11sEraFilter,
): boolean {
  if (kind !== 'all' && lineup.kind !== kind) return false
  if (difficulty !== 'mixed' && lineup.difficulty !== difficulty) return false
  if (era !== 'all' && lineup.era !== era) return false
  return true
}

export function lineupPoolSize(
  kind: Famous11sKindFilter,
  difficulty: Famous11sDifficultyFilter,
  era: Famous11sEraFilter = 'all',
): number {
  return famousLineups.filter((l) => matchesLineupFilters(l, kind, difficulty, era)).length
}

export function browseLineups(opts: {
  query: string
  era: Famous11sEraFilter
  kind: Famous11sKindFilter
  difficulty: Famous11sDifficultyFilter
  sort: Famous11sBrowseSort
}): Famous11sLineup[] {
  const q = normalize(opts.query)
  const pool = famousLineups.filter((l) => {
    if (!matchesLineupFilters(l, opts.kind, opts.difficulty, opts.era)) return false
    if (!q) return true
    const haystack = normalize(
      [l.side, l.opponent ?? '', l.title, l.prompt, l.competition, String(l.year), l.formation].join(
        ' ',
      ),
    )
    return haystack.includes(q)
  })

  const sorted = [...pool]
  switch (opts.sort) {
    case 'year-asc':
      sorted.sort((a, b) => a.year - b.year || a.side.localeCompare(b.side))
      break
    case 'side':
      sorted.sort((a, b) => a.side.localeCompare(b.side) || b.year - a.year)
      break
    case 'difficulty':
      sorted.sort(
        (a, b) =>
          DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || b.year - a.year,
      )
      break
    case 'year-desc':
    default:
      sorted.sort((a, b) => b.year - a.year || a.side.localeCompare(b.side))
      break
  }
  return sorted
}

/** Stable key so both XIs of a match share one browse card. Season sides stay solo. */
export function fixtureKey(lineup: Famous11sLineup): string {
  if (!lineup.opponent) return `solo:${lineup.id}`
  const teams = [normalize(lineup.side), normalize(lineup.opponent)].sort().join('~')
  return `${lineup.year}:${normalize(lineup.competition)}:${teams}`
}

export interface Famous11sFixtureDate {
  day: number
  /** Three-letter month, e.g. "Jul". */
  month: string
  year: number
}

const PROMPT_DATE_RE = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/

/** Prompt segments after the "vs X" lead, split on the `·` separators. */
function promptParts(lineup: Famous11sLineup): string[] {
  const parts = lineup.prompt.split('·').map((p) => p.trim()).filter(Boolean)
  return lineup.opponent && /^vs\s/i.test(parts[0] ?? '') ? parts.slice(1) : parts
}

export function fixtureDate(lineup: Famous11sLineup): Famous11sFixtureDate | undefined {
  for (const part of promptParts(lineup)) {
    const m = PROMPT_DATE_RE.exec(part)
    if (m) return { day: Number(m[1]), month: m[2]!.slice(0, 3), year: Number(m[3]) }
  }
  return undefined
}

/** Prompt minus the opponent and the match date - those have their own UI. */
export function fixtureDetail(lineup: Famous11sLineup): string {
  return promptParts(lineup)
    .filter((part) => !PROMPT_DATE_RE.test(part))
    .join(' · ')
}

export interface Famous11sFixture {
  key: string
  year: number
  /** Match day, when the prompt carries one (season sides don't). */
  date?: Famous11sFixtureDate
  competition: string
  era: Famous11sLineup['era']
  kind: Famous11sLineup['kind']
  detail: string
  /** Sides we have in the bank, A–Z. */
  sides: Famous11sLineup[]
  /** Opponent named on the card when that XI is not in the bank yet. */
  missingOpponent?: string
}

function fixtureMinDifficulty(sides: Famous11sLineup[]): number {
  return Math.min(...sides.map((s) => DIFFICULTY_ORDER[s.difficulty]))
}

/**
 * Group matching lineups into fixture cards. A fixture appears if any side
 * matches the filters; both banked XIs stay on the card so you pick a team,
 * not a duplicate reverse row.
 */
export function browseFixtures(opts: {
  query: string
  era: Famous11sEraFilter
  kind: Famous11sKindFilter
  difficulty: Famous11sDifficultyFilter
  sort: Famous11sBrowseSort
}): Famous11sFixture[] {
  const matchedIds = new Set(browseLineups(opts).map((l) => l.id))

  const sidesByKey = new Map<string, Famous11sLineup[]>()
  for (const lineup of famousLineups) {
    const key = fixtureKey(lineup)
    const group = sidesByKey.get(key)
    if (group) group.push(lineup)
    else sidesByKey.set(key, [lineup])
  }

  const fixtures: Famous11sFixture[] = []
  for (const [key, sides] of sidesByKey) {
    if (!sides.some((s) => matchedIds.has(s.id))) continue
    const ordered = [...sides].sort((a, b) => a.side.localeCompare(b.side))
    const head = ordered[0]!
    const missingOpponent =
      head.opponent && ordered.length === 1 && !ordered.some((s) => s.side === head.opponent)
        ? head.opponent
        : undefined
    fixtures.push({
      key,
      year: head.year,
      date: fixtureDate(head),
      competition: head.competition,
      era: head.era,
      kind: head.kind,
      detail: fixtureDetail(head),
      sides: ordered,
      missingOpponent,
    })
  }

  switch (opts.sort) {
    case 'year-asc':
      fixtures.sort((a, b) => a.year - b.year || a.sides[0]!.side.localeCompare(b.sides[0]!.side))
      break
    case 'side':
      fixtures.sort((a, b) => a.sides[0]!.side.localeCompare(b.sides[0]!.side) || b.year - a.year)
      break
    case 'difficulty':
      fixtures.sort(
        (a, b) =>
          fixtureMinDifficulty(a.sides) - fixtureMinDifficulty(b.sides) || b.year - a.year,
      )
      break
    case 'year-desc':
    default:
      fixtures.sort((a, b) => b.year - a.year || a.sides[0]!.side.localeCompare(b.sides[0]!.side))
      break
  }
  return fixtures
}

export function pluralFixtures(n: number): string {
  return `${n} fixture${n === 1 ? '' : 's'}`
}

export function estimatedMinutes(lineupCount: number): string {
  // Rough guide: ~3–5 min per lineup
  const lo = lineupCount * 3
  const hi = lineupCount * 5
  return `${lo}–${hi}`
}

export function pluralLineups(n: number): string {
  return `${n} lineup${n === 1 ? '' : 's'}`
}
