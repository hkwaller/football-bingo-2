/**
 * Race rules for a Connections room. Everyone plays the same clubs at once;
 * each player has their own guesses and their own clue ladder. Any answer
 * counts, and the first player to connect the clubs earns FIRST_BONUS. The
 * puzzle closes when every present player is done or the clock runs out.
 *
 * Pure so the PartyServer mutations stay thin and this stays testable.
 */
import { normalize } from '../tenable/normalize'
import { judgeGuess, scoreFor, type KnownNames } from './sessionEngine'
import { FIRST_BONUS, type ConnectionsPuzzle } from './types'

export interface RacerState {
  /** Normalized wrong guesses (their count = clues revealed). */
  wrong: string[]
  solved: boolean
  /** Out of guesses or gave up. */
  out: boolean
  points: number
  /** The answer they connected the clubs with. */
  answerId?: string
  /** Connected them before anyone else (earned FIRST_BONUS). */
  first?: boolean
  deepCut?: boolean
}

/** playerId → their state for the current puzzle. */
export type RoundStates = Record<string, RacerState>

export const freshRacer = (): RacerState => ({ wrong: [], solved: false, out: false, points: 0 })

export const isDone = (r: RacerState | undefined): boolean => !!r && (r.solved || r.out)

export type RaceGuessOutcome =
  | { kind: 'correct'; name: string; points: number; first: boolean; deepCut: boolean }
  | { kind: 'wrong'; guessesLeft: number }
  | { kind: 'unknown' }
  | { kind: 'ignored' }

export function applyRaceGuess(
  states: RoundStates,
  playerId: string,
  guess: string,
  puzzle: ConnectionsPuzzle,
  known: KnownNames,
  maxGuesses: number,
): { states: RoundStates; outcome: RaceGuessOutcome } {
  const me = states[playerId] ?? freshRacer()
  if (isDone(me)) return { states, outcome: { kind: 'ignored' } }
  const verdict = judgeGuess(puzzle, guess, known, me.wrong)
  if (verdict.kind === 'repeat') return { states, outcome: { kind: 'ignored' } }
  if (verdict.kind === 'unknown') return { states, outcome: verdict }

  if (verdict.kind === 'correct') {
    const first = !Object.values(states).some((r) => r.solved)
    const scored = scoreFor(puzzle, verdict.answer.id, me.wrong.length)
    const points = scored.points + (first ? FIRST_BONUS : 0)
    return {
      states: {
        ...states,
        [playerId]: {
          ...me,
          solved: true,
          points,
          answerId: verdict.answer.id,
          ...(first ? { first } : {}),
          ...(scored.deepCut ? { deepCut: true } : {}),
        },
      },
      outcome: { kind: 'correct', name: verdict.answer.name, points, first, deepCut: scored.deepCut },
    }
  }

  const wrong = [...me.wrong, normalize(guess)]
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
