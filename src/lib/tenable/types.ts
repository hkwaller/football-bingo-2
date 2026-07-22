import type { TenableGroup, TenableQuestion } from '@/data/tenable'

export type TenableDifficultyFilter = 'easy' | 'medium' | 'hard' | 'mixed'
export type TenableMultiplayerMechanic = 'turn-based'

export interface TenableConfig {
  /** Wrong guesses allowed per category. */
  lives: number
  /** Categories per session. */
  questionCount: number
  /** Category groups to draw from; 'all' = no filter. */
  groups: TenableGroup[] | 'all'
  difficulty: TenableDifficultyFilter
  multiplayerMechanic: TenableMultiplayerMechanic
}

export const DEFAULT_TENABLE_CONFIG: TenableConfig = {
  lives: 3,
  questionCount: 3,
  groups: 'all',
  difficulty: 'mixed',
  multiplayerMechanic: 'turn-based',
}

/** Points per correct answer + bonus for clearing all ten. */
export const POINTS_PER_ANSWER = 100
export const CLEAR_BONUS = 500

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
  results: TenableQuestionResult[]
  score: number
  startedAt: number
}
