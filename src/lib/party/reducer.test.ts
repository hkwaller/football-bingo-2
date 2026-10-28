import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanConfig } from './config'
import { applyRoomAction, parseAction } from './reducer'
import { actionsFor } from './registry'
import { createInitialGameStorage } from './bingoModel'
import { createInitialTriviaStorage } from './triviaModel'
import { createInitialTenableStorage } from './tenableModel'
import { createInitialElevenStorage } from './elevenModel'
import { createInitialConnectionsStorage } from './connectionsModel'
import { createInitialCareersStorage } from './careersModel'
import {
  actionScope,
  encodeStorage,
  decodeStorage,
  gameKind,
  type GameKind,
  type RoomMember,
} from './types'
import { tenableTarget } from '../tenable/target'
import { DEFAULT_CONNECTIONS_CONFIG, type ConnectionsPuzzle } from '../connections/types'
import { DEFAULT_CAREERS_CONFIG, type CareerPlayer } from '../careers/types'
import { DEFAULT_TENABLE_CONFIG } from '../tenable/types'
import { DEFAULT_FAMOUS11S_CONFIG } from '../famous11s/types'
import { DEFAULT_TRIVIA_CONFIG } from '../trivia/types'

const people: RoomMember[] = [1, 2].map((connectionId) => ({
  id: `user:${connectionId}`,
  connectionId,
  presence: { playerId: `user:${connectionId}`, displayName: `Player ${connectionId}` },
  info: { name: 'Guest' },
}))
const host = people[0],
  guest = people[1]
function action<S extends object>(
  kind: GameKind,
  state: S,
  name: string,
  args: unknown[] = [],
  actor = host,
  members = people,
  now = 1000,
) {
  const command = parseAction({ type: 'action', name, args, id: 1, scope: actionScope(state) })
  assert.ok(command, `parse ${name}`)
  const next = applyRoomAction(
    kind,
    state,
    actionsFor(kind),
    command,
    actor,
    members,
    now,
    'test-seed',
  )
  return { ...next, state: next.state as S }
}

test('tickets use isolated game rooms, and Maps survive JSON persistence', () => {
  assert.equal(gameKind('connections-00000000-0000-4000-8000-000000000000'), 'connections')
  assert.equal(gameKind('00000000-0000-4000-8000-000000000000'), 'bingo')
  assert.equal(gameKind('../admin'), null)
  const initial = createInitialGameStorage()
  initial.draftVotes.set('1', { type: 'skip' })
  assert.deepEqual(decodeStorage(encodeStorage(initial)), initial)
})

test('malformed messages and arbitrary storage patches are rejected', () => {
  for (const value of [
    null,
    {},
    { type: 'storage', phase: 'finished' },
    { type: 'action', name: '__proto__', args: [], id: 1, scope: '' },
    { type: 'action', name: 'guessMutation', args: [{ guess: 99 }], id: 1, scope: '' },
    {
      type: 'action',
      name: 'applySharedPick',
      args: [{ cellIndex: 99, pick: {} }],
      id: 1,
      scope: '',
    },
  ])
    assert.equal(parseAction(value), null)
})

test('Bingo host identity cannot be spoofed and a shared round requires every vote', () => {
  let s = createInitialGameStorage({ boardLayout: 'shared' })
  s = action('bingo', s, 'claimHost', [99]).state
  assert.equal(s.hostConnectionId, 1)
  assert.equal(
    action('bingo', s, 'applyStart', [{ seed: 'x', supabaseGameId: null }], guest).state,
    s,
  )
  s = action('bingo', s, 'applyStart', [{ seed: 'x', supabaseGameId: null }]).state
  assert.equal(action('bingo', s, 'resolveDraftRound', [{ skip: true, layout: 'shared' }]).state, s)
  s = action('bingo', s, 'castDraftVoteWithSelf', [{ type: 'skip' }]).state
  s = action('bingo', s, 'castDraftVoteWithSelf', [{ type: 'skip' }], guest).state
  s = action('bingo', s, 'resolveDraftRound', [{ skip: true, layout: 'shared' }]).state
  assert.equal(s.draftRound, 1)
  assert.equal(s.draftVotes.size, 0)
  assert.equal(action('bingo', s, 'setFinished').state, s)
})

test('Bingo hint wallets reject other boards and enforce the available balance', () => {
  let s = createInitialGameStorage()
  s.hostConnectionId = 1
  s.phase = 'playing'
  s.seed = 'wallet'
  const player = { ...host, presence: { ...host.presence, solvedCount: 1 } }
  const key = JSON.stringify(['wallet::1', 0, '8024'])
  assert.equal(
    action('bingo', s, 'buyHint', [JSON.stringify(['other::1', 0, '8024'])], player).state,
    s,
  )
  s = action('bingo', s, 'buyHint', [key], player).state
  assert.equal(s.hintPurchases?.get(key), true)
  s = action('bingo', s, 'buyHint', [JSON.stringify(['wallet::1', 0, 'other'])], player).state
  assert.equal(
    action('bingo', s, 'buyHint', [JSON.stringify(['wallet::1', 0, 'third'])], player).result,
    false,
  )
})

test('Trivia computes correctness and points itself, rejects duplicate/stale answers, and finishes', () => {
  let s = createInitialTriviaStorage()
  s = action('trivia', s, 'claimHost', [
    {
      id: 999,
      displayName: 'Host',
      config: { ...DEFAULT_TRIVIA_CONFIG, questionCount: 1, multiplayerMechanic: 'race' },
    },
  ]).state
  assert.equal(s.hostConnectionId, 1)
  s = action('trivia', s, 'startGame').state
  const q = JSON.parse(s.questionsJson)[0]
  const answerValue =
    q.type === 'true-false'
      ? String(q.correct)
      : q.type === 'stat-comparison'
      ? q.correctPlayerId
      : q.type === 'open-text'
      ? q.correctPlayerName
      : q.correctAnswer
  const args = {
    answerValue,
    correct: false,
    questionIndex: 0,
    questionStartedAt: -9999,
    myStreak: 999,
  }
  s = action('trivia', s, 'submitAnswer', [args], guest, people, 2000).state
  const answer = JSON.parse(s.playerAnswers.get('2')!)[0]
  assert.equal(answer.correct, true)
  assert.equal(answer.questionStartedAt, 1000)
  assert.ok(answer.pointsEarned <= 1000)
  assert.equal(s.raceWinner.get('0'), '2')
  assert.equal(action('trivia', s, 'submitAnswer', [args], guest).state, s)
  assert.equal(action('trivia', s, 'submitAnswer', [{ ...args, questionIndex: 99 }]).state, s)
  assert.equal(action('trivia', s, 'advanceQuestion', [], guest).state, s)
  s = action('trivia', s, 'advanceQuestion').state
  assert.equal(s.phase, 'finished')
})

test('Tenable uses the connected turn ring and plays a category through to results', () => {
  let s = createInitialTenableStorage()
  s = action('tenable', s, 'claimHost', [
    { displayName: 'Host', config: { ...DEFAULT_TENABLE_CONFIG, questionCount: 1 } },
  ]).state
  s = action('tenable', s, 'startGame', [['forged-player']]).state
  assert.deepEqual(JSON.parse(s.turnOrderJson), ['user:1', 'user:2'])
  const q = JSON.parse(s.questionsJson)[0]
  assert.equal(action('tenable', s, 'advanceCategory').state, s)
  assert.equal(
    action('tenable', s, 'submitTurnGuess', [{ name: q.answers[0].name }], guest).state,
    s,
  )
  for (const answer of q.answers.slice(0, tenableTarget(q))) {
    const actor = s.currentTurnPlayerId === host.id ? host : guest
    s = action(
      'tenable',
      s,
      'submitTurnGuess',
      [{ name: answer.name, ids: ['forged-player'] }],
      actor,
    ).state
  }
  assert.equal(JSON.parse(s.foundRanksJson).length, tenableTarget(q))
  s = action('tenable', s, 'advanceCategory').state
  assert.equal(s.phase, 'finished')
  assert.equal(JSON.parse(s.resultsJson)[0].cleared, true)
})

test('Famous 11s validates the turn and deadlines, and records a cleared lineup', () => {
  let s = createInitialElevenStorage()
  s = action('eleven', s, 'claimHost', [
    {
      displayName: 'Host',
      config: { ...DEFAULT_FAMOUS11S_CONFIG, includeManager: false, turnSeconds: 60 },
    },
  ]).state
  s = action('eleven', s, 'startGame', [['forged-player']]).state
  assert.equal(
    action('eleven', s, 'skipTurn', [{ ids: [], deadline: s.turnDeadline }], guest).state,
    s,
  )
  const lineup = JSON.parse(s.lineupsJson)[0]
  for (const slot of lineup.slots) {
    const actor = s.currentTurnPlayerId === host.id ? host : guest
    s = action('eleven', s, 'submitTurnGuess', [{ name: slot.name, ids: [] }], actor).state
  }
  assert.equal(JSON.parse(s.foundSlotIdsJson).length, lineup.slots.length)
  s = action('eleven', s, 'advanceLineupRoom').state
  assert.equal(s.phase, 'finished')
  assert.equal(JSON.parse(s.resultsJson)[0].cleared, true)
})

const career: CareerPlayer = {
  id: '1',
  name: 'Test Player',
  nationality: 'Test',
  position: 'Test',
  fame: 80,
  difficulty: 'easy',
  career: [],
}
const puzzle: ConnectionsPuzzle = {
  id: '1+2',
  clubs: [
    { id: '1', name: 'A', logo: null },
    { id: '2', name: 'B', logo: null },
  ],
  difficulty: 'easy',
  answers: [
    { id: '1', name: 'Test Player', nationality: 'Test', position: 'Test', fame: 80, stints: [] },
  ],
}
for (const kind of ['connections', 'careers'] as const) {
  test(`${kind} preserves concurrent first bonuses, ignores forged membership, and finishes a full game`, () => {
    let s =
      kind === 'connections' ? createInitialConnectionsStorage() : createInitialCareersStorage()
    const config = kind === 'connections' ? DEFAULT_CONNECTIONS_CONFIG : DEFAULT_CAREERS_CONFIG
    s = action(kind, s, 'claimHost', [{ displayName: 'Host', config }]).state
    const duplicate = action(
      kind,
      s,
      'claimHost',
      [{ displayName: 'Guest', config: { ...config, phase: 'finished' } }],
      guest,
    ).state
    assert.equal(duplicate.hostPlayerId, 'user:1')
    s = action(kind, duplicate, 'startGame', [[kind === 'connections' ? puzzle : career]]).state
    const payload = {
      guess: 'Test Player',
      ids: ['forged-player'],
      known: new Set(['test player']),
    }
    s = action(kind, s, 'guessMutation', [payload]).state
    assert.equal(s.roundClosed, false)
    const first = Number(s.playerScores.get(host.id))
    s = action(kind, s, 'guessMutation', [payload], guest).state
    assert.equal(Number(s.playerScores.get(guest.id)), first - 25)
    assert.equal(s.roundClosed, true)
    assert.equal(action(kind, s, 'guessMutation', [payload], guest).state, s)
    s = action(kind, s, kind === 'connections' ? 'nextPuzzle' : 'nextCareer', [0]).state
    assert.equal(s.phase, 'finished')
    assert.equal(JSON.parse(s.resultsJson).length, 1)
  })
}

test('a delayed action cannot advance a newer round', () => {
  const s = createInitialTriviaStorage()
  s.hostConnectionId = 1
  s.phase = 'playing'
  const stale = {
    type: 'action' as const,
    name: 'advanceQuestion',
    args: [],
    id: 9,
    scope: actionScope(s),
  }
  s.currentQuestionIndex = 1
  assert.equal(
    applyRoomAction('trivia', s, actionsFor('trivia'), stale, host, people, 1000, '').state,
    s,
  )
})

test('setup sanitization discards state patches, invalid enums, and unbounded values', () => {
  assert.deepEqual(
    cleanConfig('bingo', {
      phase: 'finished',
      hostConnectionId: 99,
      boardSize: 99,
      singleGuess: true,
    }),
    { singleGuess: true },
  )
  assert.deepEqual(
    cleanConfig('tenable', { questionCount: 1e9, groups: ['invalid-group'], hints: -1 }),
    {},
  )
  assert.deepEqual(cleanConfig('eleven', { lineupCount: 2, era: 'big-nights', playMode: 'coop' }), {
    era: 'big-nights',
    playMode: 'coop',
  })
})
