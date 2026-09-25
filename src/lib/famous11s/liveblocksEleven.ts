'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { Famous11sLineup } from '@/data/famous11s'
import { randomUUID } from '@/lib/randomUUID'
import { DEFAULT_FAMOUS11S_CONFIG, type Famous11sConfig, type LineupResult } from './types'

export type ElevenRoomPhase = 'lobby' | 'playing' | 'finished'

export interface ElevenLastGuess {
  seq: number
  by: string // player id
  name: string
  kind: 'correct' | 'already-found' | 'wrong'
  slotId?: string
  displayName?: string
}

/** Liveblocks storage - complex values JSON-serialised to satisfy LsonObject. */
export type ElevenGameStorage = {
  phase: ElevenRoomPhase
  /** Stable per-tab player ids - connection ids change on every reconnect. */
  hostPlayerId: string | null
  configJson: string // Famous11sConfig
  seed: string
  lineupsJson: string // Famous11sLineup[]
  currentLineupIndex: number
  foundSlotIdsJson: string // string[] - current lineup slot IDs found
  livesLostJson: string // UsedCounts - lives lost this lineup, per player (versus) or team (co-op)
  currentTurnPlayerId: string | null
  turnOrderJson: string // string[] - player ids, ring order
  resultsJson: string // LineupResult[]
  lastGuessJson: string // ElevenLastGuess
  turnDeadline: number // epoch ms, 0 = no timer active
  startedAt: number
  playerNames: LiveMap<string, string> // playerId → display name
  playerScores: LiveMap<string, string> // playerId → score (number as string)
}

export type ElevenGamePresence = {
  displayName: string
  /** Per-tab id (see lib/roomPlayer) - survives reconnects, unlike connectionId. */
  playerId: string
}

/** Persist an anon id so guests keep the same Liveblocks user id across reconnects. */
function ensureAnonId(): string | undefined {
  try {
    let id = window.localStorage.getItem('fb_anon_id')
    if (!id) {
      id = randomUUID()
      window.localStorage.setItem('fb_anon_id', id)
    }
    return id
  } catch {
    return undefined
  }
}

const elevenClient = createClient({
  authEndpoint: async (room) => {
    const anonId = typeof window !== 'undefined' ? ensureAnonId() : undefined
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, anonId }),
    })
    return await res.json()
  },
})

export const {
  RoomProvider: ElevenRoomProvider,
  useStorage: useElevenStorage,
  useMutation: useElevenM,
  useOthers: useElevenOthers,
  useMyPresence: useElevenMyPresence,
  useStatus: useElevenStatus,
  useErrorListener: useElevenErrorListener,
  useSelf: useElevenSelf,
} = createRoomContext<ElevenGamePresence, ElevenGameStorage, BaseUserMeta>(elevenClient)

export function createInitialElevenStorage(): ElevenGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_FAMOUS11S_CONFIG),
    seed: '',
    lineupsJson: '[]',
    currentLineupIndex: 0,
    foundSlotIdsJson: '[]',
    livesLostJson: '{}',
    currentTurnPlayerId: null,
    turnOrderJson: '[]',
    resultsJson: '[]',
    lastGuessJson: '',
    turnDeadline: 0,
    startedAt: 0,
    playerNames: new LiveMap(),
    playerScores: new LiveMap(),
  }
}

// ── Parse helpers ─────────────────────────────────────────────────────────

export function parseElevenConfig(json: string): Famous11sConfig {
  try {
    return { ...DEFAULT_FAMOUS11S_CONFIG, ...(JSON.parse(json) as Partial<Famous11sConfig>) }
  } catch {
    return DEFAULT_FAMOUS11S_CONFIG
  }
}

export function parseElevenLineups(json: string): Famous11sLineup[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as Famous11sLineup[]) : []
  } catch {
    return []
  }
}

export function parseStringArray(json: string): string[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as string[]) : []
  } catch {
    return []
  }
}

export function parseNumberArray(json: string): number[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as number[]) : []
  } catch {
    return []
  }
}

export function parseLastGuess(json: string): ElevenLastGuess | null {
  if (!json) return null
  try {
    return JSON.parse(json) as ElevenLastGuess
  } catch {
    return null
  }
}

export function parseResults(json: string): LineupResult[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as LineupResult[]) : []
  } catch {
    return []
  }
}
