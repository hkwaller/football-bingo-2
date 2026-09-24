import { famousLineups } from '@/data/famous11s'
import type { Famous11sDifficultyFilter, Famous11sKindFilter } from './types'

export const KIND_GROUPS = [
  { id: 'national' as const, label: 'National Teams', emoji: '🌍' },
  { id: 'club' as const, label: 'Club Sides', emoji: '🏆' },
]

export function lineupPoolSize(
  kind: Famous11sKindFilter,
  difficulty: Famous11sDifficultyFilter,
): number {
  return famousLineups.filter((l) => {
    if (kind !== 'all' && l.kind !== kind) return false
    if (difficulty !== 'mixed' && l.difficulty !== difficulty) return false
    return true
  }).length
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
