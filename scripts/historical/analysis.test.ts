import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { auditLineup, goalCoverage, questionsForMatch } from './analysis'
import { MatchClient, validateMatch } from './client'
import type { Match, ReviewedMatch } from './types'
import type { Famous11sLineup } from '../../src/data/famous11s/types'

function fixture(): Match {
  const players = Array.from({ length: 11 }, (_, i) => ({ id: String(i), name: `Player ${i}` }))
  return { id: '1', url: 'https://example.com/match/1', competition: { id: 'CL', name: 'Champions League' }, date: '2008-05-21T00:00:00Z',
    home: { id: 'home', name: 'Home', score: 1, formation: '4-4-2', coach: { id: 'c', name: 'Coach' }, startingLineup: players, substitutes: [{ id: 'sub', name: 'Sub' }, { id: 'unused', name: 'Unused' }] },
    away: { id: 'away', name: 'Away', score: 0, formation: '4-4-2', coach: null, startingLineup: players.map((p) => ({ ...p, id: 'a' + p.id })), substitutes: [] },
    events: [{ type: 'goal', minute: 80, clubId: 'home', player: { id: 'sub', name: 'Sub' }, relatedPlayer: null, card: null, score: { home: 1, away: 0 } }] }
}
function lineup(): Famous11sLineup {
  return { id: 'home-final', title: 'Final', prompt: 'vs Away · 21 May 2008', kind: 'club', era: 'classic', side: 'Home', opponent: 'Away', year: 2008, competition: 'Champions League', formation: '4-4-2', difficulty: 'easy', manager: { name: 'Coach' },
    slots: fixture().home.startingLineup.map((p) => ({ name: p.name!, playerId: p.id, slotId: p.id, positionLabel: 'CM', x: 50, y: 50 })) }
}
test('lineup audit prefers IDs and reports membership, fixture and formation separately', () => {
  const m = fixture(), l = lineup()
  l.slots[0].name = 'Different spelling'
  assert.equal(auditLineup(l, m, 'home').status, 'matched')
  m.home.formation = '4-2-3-1'
  assert.ok(auditLineup(l, m, 'home').formationDifference)
  m.home.startingLineup[0] = { id: 'unknown', name: 'Unexpected' }
  assert.equal(auditLineup(l, m, 'home').status, 'membership-disagreement')
  m.date = '2008-05-22T00:00:00Z'
  assert.equal(auditLineup(l, m, 'home').status, 'fixture-mismatch')
})
test('duplicate starters and absent fixtures cannot be confirmed', () => {
  const m = fixture(); m.home.startingLineup[1] = m.home.startingLineup[0]
  assert.equal(auditLineup(lineup(), m, 'home').status, 'incomplete-source')
  assert.equal(auditLineup(lineup()).status, 'identity-unresolved')
  const l = lineup(); delete l.opponent
  assert.equal(auditLineup(l).status, 'season-xi-excluded')
})
test('shootout score and missing goal events cannot produce scorer questions', () => {
  const m = fixture(); m.home.score = 6; m.away.score = 5
  assert.equal(goalCoverage(m).complete, false)
  assert.equal(questionsForMatch(m, undefined, new Map()).length, 0)
  m.home.score = 1; m.away.score = 0; m.events = []
  assert.equal(goalCoverage(m).complete, false)
  m.home.score = null
  assert.equal(goalCoverage(m).complete, false)
})
test('own-goal ambiguity suppresses an entire scorer set', () => {
  const m = fixture()
  m.events[0].player = { id: 'a0', name: 'Opponent player' }
  assert.equal(goalCoverage(m).complete, true)
  assert.equal(questionsForMatch(m, undefined, new Map()).length, 0)
})
test('name resolution conflicts and manager discrepancies are not confirmations', () => {
  const m = fixture(), l = lineup()
  delete l.slots[0].playerId; l.slots[0].name = 'Unresolved spelling'
  assert.equal(auditLineup(l, m, 'home').status, 'identity-unresolved')
  const valid = lineup(); m.home.coach!.name = 'Wrong manager'
  assert.equal(auditLineup(valid, m, 'home').status, 'identity-unresolved')
})
test('scoring substitutes must actually enter before scoring; unused bench is excluded', () => {
  const m = fixture()
  assert.equal(questionsForMatch(m, undefined, new Map()).filter((q) => q.kind === 'scoring-substitute').length, 0)
  m.events.unshift({ type: 'substitution', minute: 60, clubId: 'home', player: { id: '1', name: 'Player 1' }, relatedPlayer: { id: 'sub', name: 'Sub' }, card: null, score: null })
  const q = questionsForMatch(m, undefined, new Map()).find((q) => q.kind === 'scoring-substitute')!
  assert.deepEqual(q.answers.map((p) => p.playerId), ['sub'])
})
test('any-one questions accept every unique scorer and preserve aliases', () => {
  const m = fixture(); m.home.score = 2
  m.events.push({ ...m.events[0], minute: 90, player: { id: '0', name: 'Player 0' }, score: { home: 2, away: 0 } })
  const q = questionsForMatch(m, undefined, new Map([['0', ['Zero']]]))[0]
  assert.equal(q.answerMode, 'any-one')
  assert.deepEqual(q.answers.map((p) => p.playerId), ['sub', '0'])
  assert.deepEqual(q.answers[1].aliases, ['Zero'])
  m.events[1].score = { home: 3, away: 0 }
  assert.equal(goalCoverage(m).complete, false)
})
test('shootout misses require a complete reviewed supplement and include saved kicks', () => {
  const m = fixture()
  const r: ReviewedMatch = { matchId: '1', sourceUrls: ['https://example.com/report'], reviewedAt: '2026-10-13', note: 'test', matchScore: { home: 1, away: 0 }, goalsComplete: true,
    shootout: { complete: true, score: { home: 1, away: 0 }, kicks: [
      { player: { id: '0', name: 'Player 0' }, teamId: 'home', outcome: 'saved' },
      { player: { id: 'a0', name: 'Player 0' }, teamId: 'away', outcome: 'missed' },
      { player: { id: '1', name: 'Player 1' }, teamId: 'home', outcome: 'scored' },
      { player: { id: 'a1', name: 'Player 1' }, teamId: 'away', outcome: 'saved' }] } }
  assert.equal(questionsForMatch(m, r, new Map()).find((q) => q.kind === 'shootout-miss')!.answers.length, 3)
  r.shootout!.score.home = 2
  assert.ok(!questionsForMatch(m, r, new Map()).some((q) => q.kind === 'shootout-miss'))
  r.shootout!.score.home = 1
  r.shootout!.complete = false
  assert.ok(!questionsForMatch(m, r, new Map()).some((q) => q.kind === 'shootout-miss'))
})
test('cached client works offline and rejects incompatible services', async () => {
  const cacheDir = mkdtempSync(join(tmpdir(), 'historical-test-'))
  const baseUrl = 'https://invalid.example'
  const cache = (path: string, payload: unknown) => writeFileSync(join(cacheDir, createHash('sha256').update(baseUrl + path).digest('hex') + '.json'), JSON.stringify({ url: baseUrl + path, fetchedAt: '2026-10-13', providerVersion: '5', payload }))
  cache('/openapi.json', { info: { version: '5' }, paths: { '/games/{game_id}': {} } }); cache('/games/1', fixture())
  const client = new MatchClient({ baseUrl, cacheDir })
  await client.checkCapability(); assert.equal((await client.game('1')).payload.id, '1')
  await assert.rejects(client.game('2'), /Not cached/)
  cache('/openapi.json', { info: { version: '.1' }, paths: { '/players/{id}': {} } })
  await assert.rejects(client.checkCapability(), /lacks/)
  assert.throws(() => validateMatch(fixture(), 'other'), /identity/)
})
