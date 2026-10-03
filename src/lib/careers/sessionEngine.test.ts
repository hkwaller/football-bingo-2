import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  advance,
  buildSession,
  giveUp,
  initialsOf,
  revealedClues,
  submitGuess,
} from './sessionEngine'
import type { CareerPlayer } from './types'

const zlatan: CareerPlayer = {
  id: '3455',
  name: 'Zlatan Ibrahimović',
  nationality: 'Sweden',
  position: 'Centre-Forward',
  fame: 85,
  difficulty: 'easy',
  career: [],
}
const config = { difficulty: 'mixed' as const, playerCount: 2, guesses: 3 }

test('first-guess answer scores full points, accents optional', () => {
  const s = buildSession(config, [zlatan, zlatan])
  const { state, outcome } = submitGuess(s, 'zlatan ibrahimovic')
  assert.deepEqual(outcome, { kind: 'correct', points: 100 })
  assert.equal(state.roundOver, true)
  assert.equal(state.score, 100)
})

test('each miss reveals a clue and costs 25; running out reveals the player', () => {
  let s = buildSession(config, [zlatan, zlatan])
  s = submitGuess(s, 'Henrik Larsson').state
  assert.deepEqual(
    revealedClues(zlatan, s.wrongGuesses.length, s.roundOver).map((c) => c.value),
    ['Sweden'],
  )
  assert.equal(submitGuess(s, 'henrik larsson').outcome.kind, 'repeat')
  s = submitGuess(s, 'Kennet Andersson').state
  const second = submitGuess(s, 'Zlatan Ibrahimović')
  assert.deepEqual(second.outcome, { kind: 'correct', points: 50 })

  let t = buildSession(config, [zlatan, zlatan])
  for (const g of ['a b', 'c d', 'e f']) t = submitGuess(t, g).state
  assert.equal(t.roundOver, true)
  assert.equal(t.solved, false)
  assert.equal(t.score, 0)
})

test('give up and advance through to finished', () => {
  let s = buildSession(config, [zlatan, zlatan])
  s = advance(giveUp(s))
  assert.equal(s.currentIndex, 1)
  s = advance(giveUp(s))
  assert.equal(s.phase, 'finished')
  assert.equal(s.results.length, 2)
})

test('initials', () => {
  assert.equal(initialsOf('Zlatan Ibrahimović'), 'Z. I.')
})
