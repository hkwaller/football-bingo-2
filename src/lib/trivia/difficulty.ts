import { enrichedFootballPlayers } from '@/data/players'
import type { Player } from '@/types/player'
import type { TriviaDifficulty } from './types'

const FAME_THRESHOLDS: Record<TriviaDifficulty, number> = {
  easy: 70,
  medium: 40,
  hard: 0,
}

export function filterPlayersByDifficulty(difficulty: TriviaDifficulty): Player[] {
  const threshold = FAME_THRESHOLDS[difficulty]
  return enrichedFootballPlayers.filter((p) => p.fameScore >= threshold)
}

export const DIFFICULTY_LABELS: Record<TriviaDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const DIFFICULTY_DESCRIPTIONS: Record<TriviaDifficulty, string> = {
  easy: 'Famous players only (Messi, Ronaldo, Salah…)',
  medium: 'Well-known players from top leagues',
  hard: 'All 456 players — including the obscure ones',
}
