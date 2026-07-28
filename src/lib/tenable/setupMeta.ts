import { tenableQuestions } from '@/data/tenable'
import type { TenableGroup } from '@/data/tenable'
import type { TenableDifficultyFilter } from './types'

/**
 * Live counts for the Tenable setup screen, derived straight from the curated
 * question bank — no hand-typed numbers.
 */

/** The six real groups, in display order, with their setup labels. */
export const TENABLE_GROUPS: Array<{ id: TenableGroup; label: string }> = [
  { id: 'club', label: 'Clubs' },
  { id: 'league', label: 'Leagues' },
  { id: 'international', label: 'Countries' },
  { id: 'competition', label: 'Competitions' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'misc', label: 'Oddities' },
]

const matchesDifficulty = (
  d: TenableDifficultyFilter,
  qd: string,
): boolean => d === 'mixed' || qd === d

/** Lists available in one group at the current difficulty. */
export function groupListCount(group: TenableGroup, difficulty: TenableDifficultyFilter): number {
  return tenableQuestions.filter(
    (q) => q.group === group && matchesDifficulty(difficulty, q.difficulty),
  ).length
}

/** Lists available at a given difficulty across all groups (for the rows). */
export function difficultyListCount(difficulty: TenableDifficultyFilter): number {
  return tenableQuestions.filter((q) => matchesDifficulty(difficulty, q.difficulty)).length
}

/** Lists in the pool for the selected groups + difficulty. */
export function selectedListCount(
  groups: Set<TenableGroup>,
  difficulty: TenableDifficultyFilter,
): number {
  return tenableQuestions.filter(
    (q) => groups.has(q.group) && matchesDifficulty(difficulty, q.difficulty),
  ).length
}

/** ~2 minutes per list. */
export function estimatedMinutes(listCount: number): number {
  return Math.max(1, listCount * 2)
}

/** "1 list" / "3 lists" — small pluralisation helper for the count sub-lines. */
export function pluralLists(n: number): string {
  return `${n} ${n === 1 ? 'list' : 'lists'}`
}
