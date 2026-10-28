import { categoryFameScores } from '../data/categoryCoverage.generated'

export type BoardDifficulty = 'easy' | 'medium' | 'hard'

export const BOARD_DIFFICULTIES = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Familiar nations and major clubs, with plenty of answers.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'A broader mix, with fewer answers for some clues.',
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'The full range, including niche nations and clubs.',
  },
] as const

// Explicit familiarity picks: coverage alone does not make a category recognisable.
const EASY_NATIONS = new Set([
  'Argentina',
  'Belgium',
  'Brazil',
  'Croatia',
  'Denmark',
  'Netherlands',
  'England',
  'France',
  'Germany',
  'Italy',
  'Portugal',
  'Spain',
  'Sweden',
  'Uruguay',
])
const EASY_CLUBS = new Set([
  'Manchester United',
  'Liverpool FC',
  'Real Madrid',
  'FC Barcelona',
  'Bayern Munich',
  'Paris Saint-Germain',
  'Manchester City',
  'Chelsea FC',
  'Juventus FC',
  'Arsenal FC',
  'AC Milan',
  'Inter Milan',
  'Borussia Dortmund',
  'Atlético de Madrid',
  'Ajax Amsterdam',
  'FC Porto',
  'SL Benfica',
  'Celtic FC',
  'Rangers FC',
  'SSC Napoli',
  'Tottenham Hotspur',
  'AS Roma',
  'Newcastle United',
])

export function parseBoardDifficulty(raw: unknown): BoardDifficulty | undefined {
  return raw === 'easy' || raw === 'medium' || raw === 'hard' ? raw : undefined
}

export function categoryIsEligible(
  label: string,
  kind: string,
  difficulty: BoardDifficulty,
  minFameScore: number,
): boolean {
  const scores = categoryFameScores[label] ?? []
  const minimum = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 4 : 1
  if (scores.filter((score) => score >= minFameScore).length < minimum) return false
  if (difficulty !== 'easy') return true
  if (kind === 'nationalities' && !EASY_NATIONS.has(label)) return false
  if (kind === 'clubs' && !EASY_CLUBS.has(label)) return false
  // Every easy clue must also have several well-known matching players.
  return scores.filter((score) => score >= Math.max(40, minFameScore)).length >= 8
}
