import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applyGiveUp, applyRaceGuess, everyoneDone, type RoundStates } from './roomRound'
import type { CareerPlayer } from './types'

const kane: CareerPlayer = {
  id: '132098',
  name: 'Harry Kane',
  nationality: 'England',
  position: 'Centre-Forward',
  fame: 85,
  difficulty: 'easy',
  career: [],
}

test('first solver gets the bonus, the second does not', () => {
  let s: RoundStates = {}
  const a = applyRaceGuess(s, 'a', 'harry kane', kane, 3)
  assert.deepEqual(a.outcome, { kind: 'correct', points: 125, first: true })
  s = a.states
  assert.equal(s.a!.first, true)
  s = applyRaceGuess(s, 'b', 'Jamie Vardy', kane, 3).states
  const b = applyRaceGuess(s, 'b', 'Harry Kane', kane, 3)
  assert.deepEqual(b.outcome, { kind: 'correct', points: 75, first: false })
})

test('clues and guesses are per player; repeats and post-solve guesses are ignored', () => {
  let s: RoundStates = {}
  s = applyRaceGuess(s, 'a', 'Jamie Vardy', kane, 2).states
  assert.equal(s.a!.wrong.length, 1)
  assert.equal(s.b, undefined)
  assert.equal(applyRaceGuess(s, 'a', 'jamie vardy', kane, 2).outcome.kind, 'ignored')
  s = applyRaceGuess(s, 'a', 'Wayne Rooney', kane, 2).states
  assert.equal(s.a!.out, true)
  assert.equal(applyRaceGuess(s, 'a', 'Harry Kane', kane, 2).outcome.kind, 'ignored')
})

test('round is over once every present player is done', () => {
  let s: RoundStates = applyRaceGuess({}, 'a', 'Harry Kane', kane, 3).states
  assert.equal(everyoneDone(s, ['a', 'b']), false)
  s = applyGiveUp(s, 'b')
  assert.equal(everyoneDone(s, ['a', 'b']), true)
  // Someone who left mid-round doesn't hold it open.
  assert.equal(everyoneDone(s, ['a']), true)
  assert.equal(everyoneDone({}, []), false)
})
