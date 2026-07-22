import { selectTenableQuestions, tenableTarget } from '@/data/tenable'
import { randomUUID } from '@/lib/randomUUID'
import { matchAnswer } from './matching'
import {
  CLEAR_BONUS,
  DEFAULT_TENABLE_CONFIG,
  POINTS_PER_ANSWER,
  type GuessOutcome,
  type TenableConfig,
  type TenableSessionState,
} from './types'

export function buildSession(config: TenableConfig, seed?: string): TenableSessionState {
  const sessionSeed = seed ?? randomUUID()
  const questions = selectTenableQuestions(sessionSeed, config.questionCount, {
    groups: config.groups === 'all' ? undefined : config.groups,
    difficulty: config.difficulty,
  })
  return {
    sessionId: randomUUID(),
    seed: sessionSeed,
    config,
    phase: questions.length ? 'playing' : 'finished',
    questions,
    currentIndex: 0,
    foundRanks: [],
    livesLeft: config.lives,
    results: [],
    score: 0,
    startedAt: Date.now(),
  }
}

/** Is the current category over (all ten found, or out of lives)? */
export function isQuestionOver(state: TenableSessionState): boolean {
  const q = state.questions[state.currentIndex]
  if (!q) return true
  return state.foundRanks.length >= tenableTarget(q) || state.livesLeft <= 0
}

/**
 * Apply a guess to the current category. Returns the next state + the outcome.
 * Correct → fills a slot (+points). Wrong → costs a life. Already-found → no-op.
 */
export function submitGuess(
  state: TenableSessionState,
  name: string,
): { state: TenableSessionState; outcome: GuessOutcome } {
  const q = state.questions[state.currentIndex]
  if (!q || state.phase !== 'playing' || isQuestionOver(state)) {
    return { state, outcome: { kind: 'wrong' } }
  }

  const outcome = matchAnswer(name, q, state.foundRanks)

  if (outcome.kind === 'correct') {
    const foundRanks = [...state.foundRanks, outcome.rank]
    const cleared = foundRanks.length >= tenableTarget(q)
    const score = state.score + POINTS_PER_ANSWER + (cleared ? CLEAR_BONUS : 0)
    return { state: { ...state, foundRanks, score }, outcome }
  }

  if (outcome.kind === 'wrong') {
    return { state: { ...state, livesLeft: Math.max(0, state.livesLeft - 1) }, outcome }
  }

  // already-found: no penalty, no change.
  return { state, outcome }
}

/**
 * Finalize the current category into `results` and advance. If it was the last
 * category, the session finishes.
 */
export function advanceQuestion(state: TenableSessionState): TenableSessionState {
  const q = state.questions[state.currentIndex]
  if (!q) return { ...state, phase: 'finished' }

  const result = {
    questionId: q.id,
    category: q.category,
    foundRanks: state.foundRanks,
    livesUsed: state.config.lives - state.livesLeft,
    cleared: state.foundRanks.length >= tenableTarget(q),
  }
  const results = [...state.results, result]
  const nextIndex = state.currentIndex + 1

  if (nextIndex >= state.questions.length) {
    return { ...state, results, phase: 'finished' }
  }
  return {
    ...state,
    results,
    currentIndex: nextIndex,
    foundRanks: [],
    livesLeft: state.config.lives,
  }
}

export { DEFAULT_TENABLE_CONFIG }
