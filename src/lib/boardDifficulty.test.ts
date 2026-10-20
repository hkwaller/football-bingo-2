import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enrichedFootballPlayers } from '@/data/players'
import { achievements, clubs, managers, nationalities, traits } from '@/data/categories'
import { categoryFameScores } from '@/data/categoryCoverage.generated'
import { playerMatchesCategory } from '@/lib/validation'
import { generateBoard } from '@/lib/board'
import {
  DEFAULT_BOARD_CONFIG,
  boardConfigFromStorageFields,
  boardConfigKey,
  boardConfigPayload,
  categoryPoolForConfig,
  isBoardConfigViable,
  parseBoardConfig,
} from '@/lib/boardConfig'
import { bingoRoomConfigToStorage, DEFAULT_BINGO_ROOM_CONFIG } from '@/lib/bingoRoomConfig'

const labels = [...nationalities, ...clubs, ...achievements, ...traits, ...managers]

test('generated coverage matches actual placement validation for every category', () => {
  for (const label of labels) {
    const expected = enrichedFootballPlayers
      .filter((p) => playerMatchesCategory(p, label))
      .map((p) => p.fameScore)
      .sort((a, b) => b - a)
    assert.deepEqual(categoryFameScores[label] ?? [], expected, label)
  }
})

test('easy avoids thin countries and each difficulty respects the fame filter', () => {
  assert.equal(DEFAULT_BOARD_CONFIG.difficulty, 'easy')
  const easy = categoryPoolForConfig(DEFAULT_BOARD_CONFIG)
  assert.ok(easy.includes('England'))
  assert.ok(easy.includes('Real Madrid'))
  assert.ok(!easy.includes('Canada'))
  assert.ok(!easy.includes('South Korea'))
  const hard = categoryPoolForConfig({ ...DEFAULT_BOARD_CONFIG, difficulty: 'hard' })
  assert.ok(hard.includes('Canada'))
  assert.ok(hard.includes('South Korea'))
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    for (const minFameScore of [0, 42, 70, 90]) {
      const config = {
        ...DEFAULT_BOARD_CONFIG,
        difficulty,
        minFameScore,
        categoryKinds: {
          nationalities: true,
          clubs: true,
          achievements: true,
          traits: true,
          managers: true,
        },
      }
      for (const label of categoryPoolForConfig(config)) {
        const count = enrichedFootballPlayers.filter(
          (p) => p.fameScore >= minFameScore && playerMatchesCategory(p, label),
        ).length
        assert.ok(count >= { easy: 8, medium: 4, hard: 1 }[difficulty], `${difficulty}: ${label}`)
      }
      if (minFameScore === 70) {
        assert.ok(!categoryPoolForConfig(config).includes('Canada'))
        assert.ok(!categoryPoolForConfig(config).includes('South Korea'))
      }
    }
  }
})

test('insufficient filtered coverage is rejected instead of filling with harder clues', () => {
  const config = { ...DEFAULT_BOARD_CONFIG, minFameScore: 90 }
  assert.equal(isBoardConfigViable(config), false)
  assert.throws(() => generateBoard('thin-pool', config), /Not enough categories/)
})

test('difficulty survives API and room storage and generates identical boards', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const config = { ...DEFAULT_BOARD_CONFIG, difficulty, minFameScore: 42 }
    const parsed = parseBoardConfig(JSON.parse(JSON.stringify(boardConfigPayload(config))))
    assert.deepEqual(parsed, config)
    const stored = bingoRoomConfigToStorage({ ...DEFAULT_BINGO_ROOM_CONFIG, boardConfig: config })
    const restored = boardConfigFromStorageFields(
      stored as Parameters<typeof boardConfigFromStorageFields>[0],
    )
    assert.deepEqual(restored, config)
    assert.deepEqual(generateBoard('same-seed', restored), generateBoard('same-seed', config))
  }
  assert.notEqual(
    boardConfigKey(DEFAULT_BOARD_CONFIG),
    boardConfigKey({ ...DEFAULT_BOARD_CONFIG, difficulty: 'hard' }),
  )
  assert.notEqual(
    boardConfigKey(DEFAULT_BOARD_CONFIG),
    boardConfigKey({ ...DEFAULT_BOARD_CONFIG, minFameScore: 70 }),
  )
  assert.equal(parseBoardConfig({ ...DEFAULT_BOARD_CONFIG, difficulty: 'invalid' }), null)
})

test('legacy games keep their pool and seed key when resumed', () => {
  const legacy = { ...DEFAULT_BOARD_CONFIG, difficulty: undefined }
  const parsed = parseBoardConfig(JSON.parse(JSON.stringify(legacy)))!
  assert.deepEqual(categoryPoolForConfig(parsed), [...nationalities, ...clubs, ...managers])
  assert.equal(
    boardConfigKey(parsed),
    JSON.stringify({
      size: 5,
      categoryKinds: {
        achievements: false,
        clubs: true,
        managers: true,
        nationalities: true,
        traits: false,
      },
    }),
  )
  assert.deepEqual(generateBoard('legacy', legacy), generateBoard('legacy', parsed))
})
