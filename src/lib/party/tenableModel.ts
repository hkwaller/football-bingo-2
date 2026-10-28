import type { TenableQuestion } from '../../data/tenable'
import {
  DEFAULT_TENABLE_CONFIG,
  type TenableConfig,
  type TenableHint,
  type TenableQuestionResult,
} from '../tenable/types'

export type TenableRoomPhase = 'lobby' | 'playing' | 'finished'

export type TenableGameStorage = {
  phase: TenableRoomPhase
  /** Stable per-tab player id (see roomPlayer.ts) - kept across reconnects. */
  hostPlayerId: string | null
  configJson: string // TenableConfig
  seed: string
  questionsJson: string // TenableQuestion[]
  currentQuestionIndex: number
  foundRanksJson: string // number[] found in the current category
  livesLostJson: string // UsedCounts - lives lost this category, per player (versus) or team (co-op)
  hintsUsedJson: string // UsedCounts - hints used this game, per player (versus) or team (co-op)
  hintsJson: string // TenableHint[] taken in the current category
  currentTurnPlayerId: string | null
  turnOrderJson: string // string[] player ids
  resultsJson: string // TenableQuestionResult[]
  lastGuessJson: string // TenableLastGuess - most recent guess, for shared feedback
  startedAt: number
  playerNames: Map<string, string> // playerId → displayName
  playerScores: Map<string, string> // playerId → score (number as string)
}

export type TenableGamePresence = {
  displayName: string
  playerId: string
}

export function createInitialTenableStorage(): TenableGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_TENABLE_CONFIG),
    seed: '',
    questionsJson: '[]',
    currentQuestionIndex: 0,
    foundRanksJson: '[]',
    livesLostJson: '{}',
    hintsUsedJson: '{}',
    hintsJson: '[]',
    currentTurnPlayerId: null,
    turnOrderJson: '[]',
    resultsJson: '[]',
    lastGuessJson: '',
    startedAt: 0,
    playerNames: new Map(),
    playerScores: new Map(),
  }
}

export function parseTenableConfig(json: string): TenableConfig {
  try {
    return { ...DEFAULT_TENABLE_CONFIG, ...(JSON.parse(json) as Partial<TenableConfig>) }
  } catch {
    return DEFAULT_TENABLE_CONFIG
  }
}

export function parseTenableQuestions(json: string): TenableQuestion[] {
  try {
    return JSON.parse(json) as TenableQuestion[]
  } catch {
    return []
  }
}

export function parseNumberArray(json: string): number[] {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? (v as number[]) : []
  } catch {
    return []
  }
}

export type TenableLastGuess = {
  /** Monotonic counter so the UI can re-trigger its animation on repeated outcomes. */
  seq: number
  /** Player id of the guesser. */
  by: string
  /** The name the player typed. */
  name: string
  kind: 'correct' | 'wrong' | 'already-found'
  /** Canonical answer name for correct/already-found. */
  answer?: string
}

export function parseLastGuess(json: string): TenableLastGuess | null {
  try {
    const v = JSON.parse(json)
    return v && typeof v === 'object' && typeof (v as TenableLastGuess).seq === 'number'
      ? (v as TenableLastGuess)
      : null
  } catch {
    return null
  }
}

export function parseHints(json: string): TenableHint[] {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? (v as TenableHint[]) : []
  } catch {
    return []
  }
}

export function parseResults(json: string): TenableQuestionResult[] {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? (v as TenableQuestionResult[]) : []
  } catch {
    return []
  }
}
