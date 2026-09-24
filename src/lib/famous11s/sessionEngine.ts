import { selectLineups, lineupTarget } from '@/data/famous11s'
import { randomUUID } from '@/lib/randomUUID'
import { matchSlot } from './matching'
import {
  CLEAR_BONUS,
  DEFAULT_FAMOUS11S_CONFIG,
  MISS_PENALTY,
  POINTS_PER_SLOT,
  type Famous11sConfig,
  type Famous11sSessionState,
  type GuessOutcome,
  type LineupResult,
} from './types'

export function buildSession(config: Famous11sConfig, seed?: string): Famous11sSessionState {
  const sessionSeed = seed ?? randomUUID()

  let lineups =
    config.selectedLineupId
      ? (() => {
          const { getLineupById } = require('@/data/famous11s') as typeof import('@/data/famous11s')
          const l = getLineupById(config.selectedLineupId!)
          return l ? [l] : []
        })()
      : selectLineups(sessionSeed, config.lineupCount, {
          kind: config.kind,
          difficulty: config.difficulty,
        })

  return {
    sessionId: randomUUID(),
    seed: sessionSeed,
    config,
    phase: lineups.length ? 'playing' : 'finished',
    lineups,
    currentIndex: 0,
    foundSlotIds: [],
    livesLeft: config.lives > 0 ? config.lives : Infinity,
    results: [],
    score: 0,
    startedAt: Date.now(),
  }
}

/** Is the current lineup over (all found, or out of lives)? */
export function isLineupOver(state: Famous11sSessionState): boolean {
  const lineup = state.lineups[state.currentIndex]
  if (!lineup) return true
  const target = lineupTarget(lineup, state.config.includeManager)
  const livesOk = state.config.lives <= 0 || state.livesLeft > 0
  return state.foundSlotIds.length >= target || !livesOk
}

/**
 * Apply a guess. Returns the next state + outcome.
 */
export function submitGuess(
  state: Famous11sSessionState,
  name: string,
): { state: Famous11sSessionState; outcome: GuessOutcome } {
  const lineup = state.lineups[state.currentIndex]
  if (!lineup || state.phase !== 'playing' || isLineupOver(state)) {
    return { state, outcome: { kind: 'wrong' } }
  }

  const outcome = matchSlot(name, lineup, state.foundSlotIds, state.config.includeManager)

  if (outcome.kind === 'correct') {
    const foundSlotIds = [...state.foundSlotIds, outcome.slotId]
    const target = lineupTarget(lineup, state.config.includeManager)
    const cleared = foundSlotIds.length >= target
    const score = state.score + POINTS_PER_SLOT + (cleared ? CLEAR_BONUS : 0)
    return { state: { ...state, foundSlotIds, score }, outcome }
  }

  if (outcome.kind === 'wrong' && state.config.lives > 0) {
    const livesLeft = Math.max(0, state.livesLeft - 1)
    const score = state.config.penaltyOnMiss
      ? Math.max(0, state.score - MISS_PENALTY)
      : state.score
    return { state: { ...state, livesLeft, score }, outcome }
  }

  // already-found or unlimited lives wrong: no change
  return { state, outcome }
}

/**
 * Finalize the current lineup into results and advance. If last, finish session.
 */
export function advanceLineup(state: Famous11sSessionState): Famous11sSessionState {
  const lineup = state.lineups[state.currentIndex]
  if (!lineup) return { ...state, phase: 'finished' }

  const target = lineupTarget(lineup, state.config.includeManager)
  const result: LineupResult = {
    lineupId: lineup.id,
    title: lineup.title,
    foundSlotIds: state.foundSlotIds,
    slotsTotal: target,
    managerFound: state.foundSlotIds.includes('manager'),
    livesUsed: state.config.lives > 0 ? state.config.lives - state.livesLeft : 0,
    cleared: state.foundSlotIds.length >= target,
  }

  const results = [...state.results, result]
  const nextIndex = state.currentIndex + 1

  if (nextIndex >= state.lineups.length) {
    return { ...state, results, phase: 'finished' }
  }

  return {
    ...state,
    results,
    currentIndex: nextIndex,
    foundSlotIds: [],
    livesLeft: state.config.lives > 0 ? state.config.lives : Infinity,
  }
}

export { DEFAULT_FAMOUS11S_CONFIG }
