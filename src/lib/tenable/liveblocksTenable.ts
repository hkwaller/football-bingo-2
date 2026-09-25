'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { TenableQuestion } from '@/data/tenable'
import {
  DEFAULT_TENABLE_CONFIG,
  type TenableConfig,
  type TenableHint,
  type TenableQuestionResult,
} from './types'

export type TenableRoomPhase = 'lobby' | 'playing' | 'finished'

/** Liveblocks storage. Complex values are JSON strings to satisfy the LsonObject constraint. */
export type TenableGameStorage = {
  phase: TenableRoomPhase
  hostConnectionId: number | null
  configJson: string // TenableConfig
  seed: string
  questionsJson: string // TenableQuestion[]
  currentQuestionIndex: number
  foundRanksJson: string // number[] found in the current category
  livesLeft: number // shared across the room
  hintsLeft: number // shared across the room, for the whole game
  hintsJson: string // TenableHint[] taken in the current category
  currentTurnConnectionId: number | null
  turnOrderJson: string // number[] connection ids
  resultsJson: string // TenableQuestionResult[]
  lastGuessJson: string // TenableLastGuess - most recent guess, for shared feedback
  startedAt: number
  playerNames: LiveMap<string, string> // connId → displayName
  playerScores: LiveMap<string, string> // connId → score (number as string)
}

export type TenableGamePresence = {
  displayName: string
}

const tenableClient = createClient({
  authEndpoint: async (room) => {
    const anonId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('fb_anon_id') ?? undefined
        : undefined
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, anonId }),
    })
    return await res.json()
  },
})

export const {
  RoomProvider: TenableRoomProvider,
  useStorage: useTenableStorage,
  useMutation: useTenableM,
  useOthers: useTenableOthers,
  useMyPresence: useTenableMyPresence,
  useStatus: useTenableStatus,
  useErrorListener: useTenableErrorListener,
  useSelf: useTenableSelf,
} = createRoomContext<TenableGamePresence, TenableGameStorage, BaseUserMeta>(tenableClient)

export function createInitialTenableStorage(): TenableGameStorage {
  return {
    phase: 'lobby',
    hostConnectionId: null,
    configJson: JSON.stringify(DEFAULT_TENABLE_CONFIG),
    seed: '',
    questionsJson: '[]',
    currentQuestionIndex: 0,
    foundRanksJson: '[]',
    livesLeft: DEFAULT_TENABLE_CONFIG.lives,
    hintsLeft: DEFAULT_TENABLE_CONFIG.hints,
    hintsJson: '[]',
    currentTurnConnectionId: null,
    turnOrderJson: '[]',
    resultsJson: '[]',
    lastGuessJson: '',
    startedAt: 0,
    playerNames: new LiveMap(),
    playerScores: new LiveMap(),
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

/** Broadcast feedback for the most recent guess so every player sees the outcome. */
export type TenableLastGuess = {
  /** Monotonic counter so the UI can re-trigger its animation on repeated outcomes. */
  seq: number
  /** Connection id of the guesser. */
  by: number
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
