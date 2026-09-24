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

export function estimatedMinutes(lineupCount: number): string {
  // Rough guide: ~3–5 min per lineup
  const lo = lineupCount * 3
  const hi = lineupCount * 5
  return `${lo}–${hi}`
}

export function pluralLineups(n: number): string {
  return `${n} lineup${n === 1 ? '' : 's'}`
}
