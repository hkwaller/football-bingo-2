import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalize } from '@/lib/tenable/normalize'
import { applyRaceGuess } from './roomRound'
import { advance, buildSession, giveUp, revealedClues, submitGuess } from './sessionEngine'
import type { ConnectionsAnswer, ConnectionsPuzzle } from './types'

const answer = (id: string, name: string, fame: number): ConnectionsAnswer => ({
  id,
  name,
  nationality: 'Sweden',
  position: 'Centre-Forward',
  fame,
  stints: [],
})

const puzzle: ConnectionsPuzzle = {
  id: '131+5',
  clubs: [
    { id: '131', name: 'Barcelona', logo: null },
    { id: '5', name: 'AC Milan', logo: null },
  ],
  answers: [
    answer('3455', 'Zlatan Ibrahimović', 85),
    answer('1', 'Ronaldinho', 84),
    answer('2', 'Rivaldo', 80),
    answer('3', 'Gianluca Zambrotta', 50),
  ],
  difficulty: 'easy',
}
const known = new Set(['Lionel Messi', 'Ronaldinho', 'Rivaldo'].map(normalize))
const config = {
  difficulty: 'mixed' as const,
  clubCount: 2 as const,
  puzzleCount: 2,
  guesses: 3,
  roundSeconds: 0,
}

test('any answer counts, accents optional', () => {
  const s = buildSession(config, [puzzle, puzzle])
  const { state, outcome } = submitGuess(s, 'zlatan ibrahimovic', known)
  assert.equal(outcome.kind, 'correct')
  assert.equal(state.roundOver, true)
  assert.equal(state.score, 100)
  assert.equal(state.solvedWith, '3455')
})

test('naming a deep cut earns the bonus', () => {
  const { outcome } = submitGuess(buildSession(config, [puzzle]), 'Gianluca Zambrotta', known)
  assert.deepEqual(outcome.kind === 'correct' && [outcome.points, outcome.deepCut], [125, true])
})

test('a known player who does not fit costs a guess and reveals a clue', () => {
  const { state, outcome } = submitGuess(buildSession(config, [puzzle]), 'Lionel Messi', known)
  assert.deepEqual(outcome, { kind: 'wrong', guessesLeft: 2 })
  assert.equal(revealedClues(puzzle, state.wrongGuesses.length, false)[0]?.value, 'Sweden')
  assert.equal(submitGuess(state, 'Ronaldinho', known).outcome.kind, 'correct')
  assert.equal(submitGuess(state, 'Ronaldinho', known).state.score, 75)
})

test('a name we do not know is free', () => {
  const s = buildSession(config, [puzzle])
  const { state, outcome } = submitGuess(s, 'Henrik Larsson', known)
  assert.deepEqual(outcome, { kind: 'unknown' })
  assert.equal(state, s)
})

test('running out of guesses ends the puzzle; advance moves on and finishes', () => {
  let s = buildSession({ ...config, guesses: 1 }, [puzzle, puzzle])
  s = submitGuess(s, 'Lionel Messi', known).state
  assert.equal(s.roundOver, true)
  assert.equal(s.results[0]?.solved, false)
  s = advance(s)
  assert.equal(s.currentIndex, 1)
  s = advance(giveUp(s))
  assert.equal(s.phase, 'finished')
})

test('room: the first to connect them gets the bonus, later solvers do not', () => {
  const a = applyRaceGuess({}, 'p1', 'Rivaldo', puzzle, known, 3)
  assert.deepEqual(a.outcome, {
    kind: 'correct',
    name: 'Rivaldo',
    points: 125,
    first: true,
    deepCut: false,
  })
  const b = applyRaceGuess(a.states, 'p2', 'Rivaldo', puzzle, known, 3)
  assert.equal(b.outcome.kind === 'correct' && b.outcome.points, 100)
  assert.equal(applyRaceGuess(b.states, 'p1', 'Ronaldinho', puzzle, known, 3).outcome.kind, 'ignored')
})
