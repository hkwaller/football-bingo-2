import assert from 'node:assert/strict'
import { test } from 'node:test'
import { POST } from '@/app/api/game/hint/route'
import { enrichedFootballPlayers } from '@/data/players'
import { generateBoard } from '@/lib/board'
import { DEFAULT_BOARD_CONFIG } from '@/lib/boardConfig'
import { playerMatchesCategory } from '@/lib/validation'
import { bingoHintCount, bingoHintKey, bingoPoints, canBuyBingoHint } from '@/lib/bingoHints'
import { loadSolo, saveSolo } from '@/lib/soloStorage'

test('placements earn 100 and hints cost 50 with an affordability boundary', () => {
  assert.equal(bingoPoints(0, 0), 0)
  assert.equal(bingoPoints(1, 0), 100)
  assert.equal(bingoPoints(1, 1), 50)
  assert.equal(bingoPoints(1, 2), 0)
  assert.equal(canBuyBingoHint(49, false), false)
  assert.equal(canBuyBingoHint(50, false), true)
  assert.equal(canBuyBingoHint(0, true), true)
})

test('wallets are isolated by board, while each draw has a distinct purchase key', () => {
  const keys = [bingoHintKey('room::1', 0, 'p'), bingoHintKey('room::2', 0, 'p'), bingoHintKey('room::1', 1, 'p')]
  assert.equal(bingoHintCount(keys, 'room::1'), 2)
  assert.equal(bingoHintCount(keys, 'room::2'), 1)
  assert.equal(bingoHintCount(keys, 'room'), 0)
  assert.notEqual(bingoHintKey('seed', 0, 'a'), bingoHintKey('seed', 0, 'b'))
})

const seed = 'bingo-hint-tests'
const cells = generateBoard(seed)
const player = enrichedFootballPlayers.find((p) => cells.filter((c) => c.kind === 'category' && playerMatchesCategory(p, c.label)).length >= 2)!
const matches = cells.flatMap((cell, i) => cell.kind === 'category' && playerMatchesCategory(player, cell.label) ? [i] : [])
const body = { seed, playerId: player.playerId, boardConfig: DEFAULT_BOARD_CONFIG, occupiedIndices: [] as number[] }
const request = (data: unknown) => new Request('http://localhost/api/game/hint', { method: 'POST', body: JSON.stringify(data) })

test('hint returns every matching category using placement rules, excluding occupied/free squares', async () => {
  assert.ok(player)
  assert.ok(matches.length >= 2)
  const response = await POST(request({ ...body, occupiedIndices: [matches[0]] }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { matchingCells: matches.slice(1) })
})

test('no available matching squares returns an empty hint', async () => {
  const response = await POST(request({ ...body, occupiedIndices: matches }))
  assert.deepEqual(await response.json(), { matchingCells: [] })
})

test('hint rejects malformed input, unknown players, invalid boards and occupied indices', async () => {
  for (const data of [null, {}, { ...body, seed: '' }, { ...body, playerId: 'unknown-id' },
    { ...body, boardConfig: { size: 99 } }, { ...body, occupiedIndices: [-1] },
    { ...body, occupiedIndices: [25] }, { ...body, occupiedIndices: [0.5] },
    { ...body, occupiedIndices: '0' }]) {
    assert.equal((await POST(request(data))).status, 400)
  }
  const invalid = new Request('http://localhost/api/game/hint', { method: 'POST', body: '{' })
  assert.equal((await POST(invalid)).status, 400)
})

test('solo save retains purchases and legacy saves need no migration', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } })
  try {
    const key = bingoHintKey(seed, 0, player.playerId)
    saveSolo({ seed, solved: {}, hintPurchases: [key] })
    assert.deepEqual(loadSolo()?.hintPurchases, [key])
    saveSolo({ seed, solved: {} })
    assert.equal(loadSolo()?.hintPurchases, undefined)
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
