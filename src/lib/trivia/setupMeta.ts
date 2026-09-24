import { enrichedFootballPlayers } from '@/data/players'
import type { Player } from '@/types/player'
import { filterPlayersByDifficulty } from './difficulty'
import type { TriviaDifficulty, TriviaTopic } from './types'

/**
 * Live counts for the Trivia setup screen, derived from the same player pool the
 * question generator draws on - no hand-typed numbers.
 */

/** How many players are eligible at a given difficulty (the question pool). */
export function eligiblePlayerCount(difficulty: TriviaDifficulty): number {
  return filterPlayersByDifficulty(difficulty).length
}

/** Which players can supply questions for each topic. */
const TOPIC_PREDICATE: Record<TriviaTopic, (p: Player) => boolean> = {
  clubs: (p) => p.clubs.length > 0,
  stats: (p) => p.careerStats.appearances > 0,
  achievements: (p) => p.achievements.length > 0,
  nationalities: (p) => Boolean(p.nationality),
}

/** Players in the difficulty pool that carry data for one topic. */
export function topicPlayerCount(topic: TriviaTopic, difficulty: TriviaDifficulty): number {
  const pool = filterPlayersByDifficulty(difficulty)
  return pool.filter(TOPIC_PREDICATE[topic]).length
}

/** Union of players covered by the ticked topics - the effective pool size. */
export function selectedPoolCount(topics: TriviaTopic[], difficulty: TriviaDifficulty): number {
  if (topics.length === 0) return 0
  const pool = filterPlayersByDifficulty(difficulty)
  return pool.filter((p) => topics.some((t) => TOPIC_PREDICATE[t](p))).length
}

/** Rough round length: ~24s per question, rounded to the nearest minute (min 1). */
export function estimatedMinutes(questionCount: number): number {
  return Math.max(1, Math.round((questionCount * 24) / 60))
}

/** Total players in the dataset - the "hard" pool, exposed for copy. */
export const TOTAL_PLAYERS = enrichedFootballPlayers.length
