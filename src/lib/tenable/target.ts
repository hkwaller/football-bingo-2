import type { TenableQuestion } from '@/data/tenable/types'

/**
 * How many slots to fill for a category: ranked = its 10 answers; open = the
 * first 10 of a larger valid set (name any ten).
 */
export function tenableTarget(q: Pick<TenableQuestion, 'answers'>): number {
  return Math.min(10, q.answers.length)
}
