/**
 * Race rules for a Careers room. Everyone plays the same career at once; each
 * player has their own guesses and their own clue ladder (a miss reveals the
 * next clue to that player only). The first correct answer earns FIRST_BONUS.
 * The career closes when every present player is done or the clock runs out.
 *
 * Pure so the Liveblocks mutations stay thin and this stays testable.
 */
import { normalize } from '@/lib/tenable/normalize'
import { isMatch, pointsAfter } from './sessionEngine'
import { FIRST_BONUS, type CareerPlayer } from './types'

export interface RacerState {
  /** Normalized wrong guesses (their count = clues revealed). */
  wrong: string[]
  solved: boolean
  /** Out of guesses or gave up. */
  out: boolean
  points: number
  /** Named him before anyone else (earned FIRST_BONUS). */
  first?: boolean
}

/** playerId → their state for the current career. */
export type RoundStates = Record<string, RacerState>

export const freshRacer = (): RacerState => ({ wrong: [], solved: false, out: false, points: 0 })

export const isDone = (r: RacerState | undefined): boolean => !!r && (r.solved || r.out)

export type RaceGuessOutcome =
  | { kind: 'correct'; points: number; first: boolean }
  | { kind: 'wrong'; guessesLeft: number }
  | { kind: 'ignored' }

export function applyRaceGuess(
  states: RoundStates,
  playerId: string,
  guess: string,
  player: CareerPlayer,
  maxGuesses: number,
): { states: RoundStates; outcome: RaceGuessOutcome } {
  const me = states[playerId] ?? freshRacer()
  const key = normalize(guess)
  if (isDone(me) || !key || me.wrong.includes(key)) {
    return { states, outcome: { kind: 'ignored' } }
  }
  if (isMatch(guess, player)) {
    const first = !Object.values(states).some((r) => r.solved)
    const points = pointsAfter(me.wrong.length) + (first ? FIRST_BONUS : 0)
    return {
      states: {
        ...states,
        [playerId]: { ...me, solved: true, points, ...(first ? { first } : {}) },
      },
      outcome: { kind: 'correct', points, first },
    }
  }
  const wrong = [...me.wrong, key]
  const guessesLeft = Math.max(0, maxGuesses - wrong.length)
  return {
    states: { ...states, [playerId]: { ...me, wrong, out: guessesLeft === 0 } },
    outcome: { kind: 'wrong', guessesLeft },
  }
}

export function applyGiveUp(states: RoundStates, playerId: string): RoundStates {
  const me = states[playerId] ?? freshRacer()
  if (isDone(me)) return states
  return { ...states, [playerId]: { ...me, out: true } }
}

/** Everyone still in the room has solved it or is out. */
export function everyoneDone(states: RoundStates, presentIds: readonly string[]): boolean {
  return presentIds.length > 0 && presentIds.every((id) => isDone(states[id]))
}

export function parseRoundStates(json: string | null | undefined): RoundStates {
  try {
    const v = JSON.parse(json ?? '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as RoundStates) : {}
  } catch {
    return {}
  }
}
