'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { TenableQuestion } from '@/data/tenable'
import { DEFAULT_TENABLE_CONFIG, type TenableConfig, type TenableQuestionResult } from './types'

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
  currentTurnConnectionId: number | null
  turnOrderJson: string // number[] connection ids
  resultsJson: string // TenableQuestionResult[]
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
    currentTurnConnectionId: null,
    turnOrderJson: '[]',
    resultsJson: '[]',
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

export function parseResults(json: string): TenableQuestionResult[] {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? (v as TenableQuestionResult[]) : []
  } catch {
    return []
  }
}
