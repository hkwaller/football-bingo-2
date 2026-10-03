import { randomUUID } from '@/lib/randomUUID'
import { normalize } from '@/lib/tenable/normalize'
import {
  CLUE_COST,
  CLUE_ORDER,
  MAX_POINTS,
  MIN_POINTS,
  type CareerPlayer,
  type CareersClue,
  type CareersConfig,
  type CareersGuessOutcome,
  type CareersSessionState,
} from './types'

/** Players come from /api/careers/deal so the bank never ships to the client. */
export function buildSession(config: CareersConfig, players: CareerPlayer[]): CareersSessionState {
  return {
    sessionId: randomUUID(),
    config,
    phase: players.length ? 'playing' : 'finished',
    players,
    currentIndex: 0,
    wrongGuesses: [],
    roundOver: false,
    solved: false,
    results: [],
    score: 0,
    startedAt: Date.now(),
  }
}

export function pointsAfter(misses: number): number {
  return Math.max(MIN_POINTS, MAX_POINTS - misses * CLUE_COST)
}

/** "Zlatan Ibrahimović" → "Z. I." */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w[0]!.toUpperCase()}.`)
    .join(' ')
}

/** Clues unlocked so far: one per wrong guess, all of them once the round is over. */
export function revealedClues(
  player: CareerPlayer,
  misses: number,
  roundOver: boolean,
): CareersClue[] {
  const count = roundOver ? CLUE_ORDER.length : Math.min(misses, CLUE_ORDER.length)
  return CLUE_ORDER.slice(0, count).map((kind) => {
    if (kind === 'nationality') return { kind, label: 'Nationality', value: player.nationality }
    if (kind === 'position') return { kind, label: 'Position', value: player.position }
    return { kind, label: 'Initials', value: initialsOf(player.name) }
  })
}

export function isMatch(guess: string, player: CareerPlayer): boolean {
  return normalize(guess) === normalize(player.name)
}

function finishRound(
  state: CareersSessionState,
  solved: boolean,
  points: number,
): CareersSessionState {
  const player = state.players[state.currentIndex]!
  return {
    ...state,
    roundOver: true,
    solved,
    score: state.score + points,
    results: [
      ...state.results,
      {
        playerId: player.id,
        name: player.name,
        solved,
        guessesUsed: state.wrongGuesses.length + (solved ? 1 : 0),
        points,
      },
    ],
  }
}

export function submitGuess(
  state: CareersSessionState,
  guess: string,
): { state: CareersSessionState; outcome: CareersGuessOutcome } {
  const player = state.players[state.currentIndex]
  if (!player || state.phase !== 'playing' || state.roundOver) {
    return { state, outcome: { kind: 'repeat' } }
  }
  const key = normalize(guess)
  if (!key || state.wrongGuesses.includes(key)) return { state, outcome: { kind: 'repeat' } }

  if (isMatch(guess, player)) {
    const points = pointsAfter(state.wrongGuesses.length)
    return { state: finishRound(state, true, points), outcome: { kind: 'correct', points } }
  }

  const wrong = { ...state, wrongGuesses: [...state.wrongGuesses, key] }
  const guessesLeft = state.config.guesses - wrong.wrongGuesses.length
  return {
    state: guessesLeft <= 0 ? finishRound(wrong, false, 0) : wrong,
    outcome: { kind: 'wrong', guessesLeft: Math.max(0, guessesLeft) },
  }
}

export function giveUp(state: CareersSessionState): CareersSessionState {
  if (state.phase !== 'playing' || state.roundOver) return state
  return finishRound(state, false, 0)
}

export function advance(state: CareersSessionState): CareersSessionState {
  if (!state.roundOver) return state
  const next = state.currentIndex + 1
  if (next >= state.players.length) return { ...state, phase: 'finished' }
  return { ...state, currentIndex: next, wrongGuesses: [], roundOver: false, solved: false }
}
