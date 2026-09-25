import type { TenableGroup, TenableQuestion } from '@/data/tenable'

export type TenableDifficultyFilter = 'easy' | 'medium' | 'hard' | 'mixed'
export type TenableMultiplayerMechanic = 'turn-based'
export type TenableAnswerOrder = 'any' | 'topdown'

export interface TenableConfig {
  /** Wrong guesses allowed per category. */
  lives: number
  /** Categories per session. */
  questionCount: number
  /** Category groups to draw from; 'all' = no filter. */
  groups: TenableGroup[] | 'all'
  difficulty: TenableDifficultyFilter
  /** Whether answers may be named in any order or must go top-down. */
  answerOrder?: TenableAnswerOrder
  multiplayerMechanic: TenableMultiplayerMechanic
  /** Hints available for the whole run (solo) or the whole room (multiplayer). */
  hints: number
  /** Picked from the setup gallery: play just this list, ignoring the filters above. */
  selectedQuestionId?: string
}

export type TenableKindFilter = 'all' | 'ranked' | 'open'
export type TenableBrowseSort = 'topic' | 'az' | 'difficulty'

export const DEFAULT_TENABLE_CONFIG: TenableConfig = {
  lives: 3,
  questionCount: 3,
  groups: 'all',
  difficulty: 'mixed',
  answerOrder: 'any',
  multiplayerMechanic: 'turn-based',
  hints: 3,
}

/** Points per correct answer + bonus for clearing all ten. */
export const POINTS_PER_ANSWER = 100
export const CLEAR_BONUS = 500
/** Points for an answer that was named after a hint pointed at it. */
export const HINTED_POINTS = 50

/** Clues pointing at one unfound answer, drawn by /api/tenable/hint. */
export interface TenableHint {
  /** The answer this hint points at. */
  rank: number
  clues: string[]
  /** Multiplayer: connection id of whoever used the hint. */
  by?: number
}

/** Points a correct answer is worth, given the hints taken this category. */
export function pointsFor(rank: number, hints: readonly TenableHint[]): number {
  return hints.some((h) => h.rank === rank) ? HINTED_POINTS : POINTS_PER_ANSWER
}

/** Outcome of a single guess. */
export type GuessOutcome =
  | { kind: 'correct'; rank: number; name: string }
  | { kind: 'already-found'; rank: number; name: string }
  | { kind: 'wrong' }

/** Finalized record of one played category. */
export interface TenableQuestionResult {
  questionId: string
  category: string
  foundRanks: number[]
  livesUsed: number
  /** Found all ten. */
  cleared: boolean
  hintsUsed?: number
}

export type TenablePhase = 'playing' | 'finished'

export interface TenableSessionState {
  sessionId: string
  seed: string
  config: TenableConfig
  phase: TenablePhase
  questions: TenableQuestion[]
  currentIndex: number
  /** Live state for the current category. */
  foundRanks: number[]
  livesLeft: number
  /** Hints left for the rest of the run. */
  hintsLeft: number
  /** Hints taken in the current category. */
  hints: TenableHint[]
  results: TenableQuestionResult[]
  score: number
  startedAt: number
}
