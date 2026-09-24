import { tenableQuestions } from '@/data/tenable'
import type { TenableGroup, TenableQuestion } from '@/data/tenable'
import { normalize } from './normalize'
import type { TenableBrowseSort, TenableDifficultyFilter, TenableKindFilter } from './types'

/**
 * Live counts for the Tenable setup screen, derived straight from the curated
 * question bank - no hand-typed numbers.
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

const matchesDifficulty = (d: TenableDifficultyFilter, qd: string): boolean =>
  d === 'mixed' || qd === d

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

/** "1 list" / "3 lists" - small pluralisation helper for the count sub-lines. */
export function pluralLists(n: number): string {
  return `${n} ${n === 1 ? 'list' : 'lists'}`
}

const DIFFICULTY_ORDER = { easy: 0, medium: 1, hard: 2 } as const
const GROUP_ORDER = new Map(TENABLE_GROUPS.map((g, i) => [g.id, i]))

export function groupLabel(group: TenableGroup): string {
  return TENABLE_GROUPS.find((g) => g.id === group)?.label ?? group
}

/** The "Pick a list" gallery: search + filter + sort over the whole bank. */
export function browseTenables(opts: {
  query: string
  group: TenableGroup | 'all'
  kind: TenableKindFilter
  difficulty: TenableDifficultyFilter
  sort: TenableBrowseSort
}): TenableQuestion[] {
  const q = normalize(opts.query)
  const pool = tenableQuestions.filter((t) => {
    if (opts.group !== 'all' && t.group !== opts.group) return false
    if (opts.kind !== 'all' && (t.kind ?? 'ranked') !== opts.kind) return false
    if (!matchesDifficulty(opts.difficulty, t.difficulty)) return false
    return !q || normalize(`${t.category} ${t.prompt}`).includes(q)
  })

  const az = (a: TenableQuestion, b: TenableQuestion) => a.category.localeCompare(b.category)
  const sorted = [...pool]
  switch (opts.sort) {
    case 'az':
      sorted.sort(az)
      break
    case 'difficulty':
      sorted.sort(
        (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] || az(a, b),
      )
      break
    case 'topic':
    default:
      sorted.sort((a, b) => GROUP_ORDER.get(a.group)! - GROUP_ORDER.get(b.group)! || az(a, b))
      break
  }
  return sorted
}
