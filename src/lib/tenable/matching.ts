import type { TenableQuestion } from '@/data/tenable'
import { normalize } from './normalize'
import type { GuessOutcome } from './types'

/**
 * Match a typed name against a category's answer list. Compares the shared
 * normalize() of the input against each answer's name + aliases, so accents and
 * special letters (ø, ß, ł…) never need typing. Matches the curated answer list
 * only — never a player DB.
 */
export function matchAnswer(
  input: string,
  question: TenableQuestion,
  foundRanks: readonly number[],
): GuessOutcome {
  const key = normalize(input)
  if (!key) return { kind: 'wrong' }

  for (const a of question.answers) {
    const keys = [a.name, ...(a.aliases ?? [])].map(normalize)
    if (keys.includes(key)) {
      if (foundRanks.includes(a.rank)) return { kind: 'already-found', rank: a.rank, name: a.name }
      return { kind: 'correct', rank: a.rank, name: a.name }
    }
  }
  return { kind: 'wrong' }
}
