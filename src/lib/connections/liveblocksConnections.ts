'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { KickEvent } from '@/components/RoomKickGate'
import { randomUUID } from '@/lib/randomUUID'
import { DEFAULT_CONNECTIONS_CONFIG, type ConnectionsConfig, type ConnectionsPuzzle } from './types'

export type ConnectionsRoomPhase = 'lobby' | 'playing' | 'finished'

/** One finished puzzle: what each player scored. */
export interface ConnectionsRoomResult {
  puzzleId: string
  clubs: string[]
  /** playerId → points this puzzle (0 = missed). */
  points: Record<string, number>
}

/** Liveblocks storage - complex values JSON-serialised to satisfy LsonObject. */
export type ConnectionsGameStorage = {
  phase: ConnectionsRoomPhase
  /** Stable per-tab player ids - connection ids change on every reconnect. */
  hostPlayerId: string | null
  configJson: string // ConnectionsConfig
  puzzlesJson: string // ConnectionsPuzzle[] - dealt by the host from /api/connections/deal
  currentIndex: number
  roundStatesJson: string // RoundStates (see roomRound.ts)
  /** The current puzzle is closed: everyone done, clock ran out or host revealed it. */
  roundClosed: boolean
  roundDeadline: number // epoch ms, 0 = no clock
  resultsJson: string // ConnectionsRoomResult[]
  startedAt: number
  playerNames: LiveMap<string, string> // playerId → display name
  playerScores: LiveMap<string, string> // playerId → score (number as string)
}

export type ConnectionsGamePresence = {
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

const connectionsClient = createClient({
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
  RoomProvider: ConnectionsRoomProvider,
  useStorage: useConnectionsStorage,
  useMutation: useConnectionsMutation,
  useOthers: useConnectionsOthers,
  useMyPresence: useConnectionsMyPresence,
  useStatus: useConnectionsStatus,
  useErrorListener: useConnectionsErrorListener,
  useSelf: useConnectionsSelf,
  useBroadcastEvent: useConnectionsBroadcast,
  useEventListener: useConnectionsEventListener,
} = createRoomContext<ConnectionsGamePresence, ConnectionsGameStorage, BaseUserMeta, KickEvent>(
  connectionsClient,
)

export function createInitialConnectionsStorage(): ConnectionsGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_CONNECTIONS_CONFIG),
    puzzlesJson: '[]',
    currentIndex: 0,
    roundStatesJson: '{}',
    roundClosed: false,
    roundDeadline: 0,
    resultsJson: '[]',
    startedAt: 0,
    playerNames: new LiveMap(),
    playerScores: new LiveMap(),
  }
}

export function parseConnectionsConfig(json: string | null | undefined): ConnectionsConfig {
  try {
    return { ...DEFAULT_CONNECTIONS_CONFIG, ...(JSON.parse(json ?? '{}') as Partial<ConnectionsConfig>) }
  } catch {
    return DEFAULT_CONNECTIONS_CONFIG
  }
}

function parseArray<T>(json: string | null | undefined): T[] {
  try {
    const arr = JSON.parse(json ?? '[]')
    return Array.isArray(arr) ? (arr as T[]) : []
  } catch {
    return []
  }
}

export const parseConnectionsPuzzles = (json: string | null | undefined) =>
  parseArray<ConnectionsPuzzle>(json)
export const parseConnectionsResults = (json: string | null | undefined) =>
  parseArray<ConnectionsRoomResult>(json)

export const deadlineFor = (cfg: ConnectionsConfig) =>
  cfg.roundSeconds > 0 ? Date.now() + cfg.roundSeconds * 1000 : 0
