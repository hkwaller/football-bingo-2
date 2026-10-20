import { randomUUID } from '@/lib/randomUUID'
import { normalize } from '@/lib/tenable/normalize'
import { initialsOf } from '@/lib/careers/sessionEngine'
import {
  CLUE_COST,
  CLUE_ORDER,
  DEEP_CUT_BONUS,
  MAX_POINTS,
  MIN_POINTS,
  OBVIOUS_ANSWERS,
  type ConnectionsAnswer,
  type ConnectionsClue,
  type ConnectionsConfig,
  type ConnectionsGuessOutcome,
  type ConnectionsPuzzle,
  type ConnectionsSessionState,
} from './types'

/** Puzzles come from /api/connections/deal, generated server-side from the player bank. */
export function buildSession(
  config: ConnectionsConfig,
  puzzles: ConnectionsPuzzle[],
): ConnectionsSessionState {
  return {
    sessionId: randomUUID(),
    config,
    phase: puzzles.length ? 'playing' : 'finished',
    puzzles,
    currentIndex: 0,
    wrongGuesses: [],
    roundOver: false,
    solvedWith: null,
    results: [],
    score: 0,
    startedAt: Date.now(),
  }
}

export function pointsAfter(misses: number): number {
  return Math.max(MIN_POINTS, MAX_POINTS - misses * CLUE_COST)
}

/** Named someone past the obvious few - only possible when there are more than a few. */
export function isDeepCut(puzzle: ConnectionsPuzzle, answerId: string): boolean {
  const index = puzzle.answers.findIndex((a) => a.id === answerId)
  return index >= OBVIOUS_ANSWERS
}

export function scoreFor(puzzle: ConnectionsPuzzle, answerId: string, misses: number) {
  const deepCut = isDeepCut(puzzle, answerId)
  return { points: pointsAfter(misses) + (deepCut ? DEEP_CUT_BONUS : 0), deepCut }
}

export function findAnswer(puzzle: ConnectionsPuzzle, guess: string): ConnectionsAnswer | null {
  const key = normalize(guess)
  return (key && puzzle.answers.find((a) => normalize(a.name) === key)) || null
}

/**
 * Clues point at the puzzle's best-known answer: one per wrong guess, all of
 * them once the round is over. Any answer still counts.
 */
export function revealedClues(
  puzzle: ConnectionsPuzzle,
  misses: number,
  roundOver: boolean,
): ConnectionsClue[] {
  const target = puzzle.answers[0]
  if (!target) return []
  const count = roundOver ? CLUE_ORDER.length : Math.min(misses, CLUE_ORDER.length)
  return CLUE_ORDER.slice(0, count).map((kind) => {
    if (kind === 'nationality') return { kind, label: 'Nationality', value: target.nationality }
    if (kind === 'position') return { kind, label: 'Position', value: target.position }
    return { kind, label: 'Initials', value: initialsOf(target.name) }
  })
}

/** Normalized names of every player in the bank (from /api/connections/names). */
export type KnownNames = ReadonlySet<string>

export type GuessVerdict =
  | { kind: 'correct'; answer: ConnectionsAnswer }
  | { kind: 'wrong' }
  | { kind: 'unknown' }
  | { kind: 'repeat' }

/**
 * Judge a guess against a puzzle. A name we don't have in the bank might
 * still be right in real life, so it never costs a guess - only a player we
 * know the full career of can be called wrong.
 */
export function judgeGuess(
  puzzle: ConnectionsPuzzle,
  guess: string,
  known: KnownNames,
  tried: readonly string[],
): GuessVerdict {
  const key = normalize(guess)
  if (!key || tried.includes(key)) return { kind: 'repeat' }
  const answer = findAnswer(puzzle, guess)
  if (answer) return { kind: 'correct', answer }
  return known.has(key) ? { kind: 'wrong' } : { kind: 'unknown' }
}

function finishRound(
  state: ConnectionsSessionState,
  answer: ConnectionsAnswer | null,
  points: number,
  deepCut: boolean,
): ConnectionsSessionState {
  const puzzle = state.puzzles[state.currentIndex]!
  return {
    ...state,
    roundOver: true,
    solvedWith: answer?.id ?? null,
    score: state.score + points,
    results: [
      ...state.results,
      {
        puzzleId: puzzle.id,
        clubs: puzzle.clubs.map((c) => c.name),
        solved: !!answer,
        answerName: answer?.name ?? null,
        points,
        deepCut,
      },
    ],
  }
}

export function submitGuess(
  state: ConnectionsSessionState,
  guess: string,
  known: KnownNames,
): { state: ConnectionsSessionState; outcome: ConnectionsGuessOutcome } {
  const puzzle = state.puzzles[state.currentIndex]
  if (!puzzle || state.phase !== 'playing' || state.roundOver) {
    return { state, outcome: { kind: 'repeat' } }
  }
  const verdict = judgeGuess(puzzle, guess, known, state.wrongGuesses)
  if (verdict.kind === 'repeat' || verdict.kind === 'unknown') return { state, outcome: verdict }

  if (verdict.kind === 'correct') {
    const { points, deepCut } = scoreFor(puzzle, verdict.answer.id, state.wrongGuesses.length)
    return {
      state: finishRound(state, verdict.answer, points, deepCut),
      outcome: { kind: 'correct', answer: verdict.answer, points, deepCut },
    }
  }

  const wrong = { ...state, wrongGuesses: [...state.wrongGuesses, normalize(guess)] }
  const guessesLeft = state.config.guesses - wrong.wrongGuesses.length
  return {
    state: guessesLeft <= 0 ? finishRound(wrong, null, 0, false) : wrong,
    outcome: { kind: 'wrong', guessesLeft: Math.max(0, guessesLeft) },
  }
}

export function giveUp(state: ConnectionsSessionState): ConnectionsSessionState {
  if (state.phase !== 'playing' || state.roundOver) return state
  return finishRound(state, null, 0, false)
}

export function advance(state: ConnectionsSessionState): ConnectionsSessionState {
  if (!state.roundOver) return state
  const next = state.currentIndex + 1
  if (next >= state.puzzles.length) return { ...state, phase: 'finished' }
  return { ...state, currentIndex: next, wrongGuesses: [], roundOver: false, solvedWith: null }
}
