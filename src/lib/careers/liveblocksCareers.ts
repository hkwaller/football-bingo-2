'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { KickEvent } from '@/components/RoomKickGate'
import { randomUUID } from '@/lib/randomUUID'
import { DEFAULT_CAREERS_CONFIG, type CareerPlayer, type CareersConfig } from './types'

export type CareersRoomPhase = 'lobby' | 'playing' | 'finished'

/** One finished career: who named him and what each player scored. */
export interface CareersRoomResult {
  playerId: string
  name: string
  /** playerId → points this career (0 = missed). */
  points: Record<string, number>
}

/** Liveblocks storage - complex values JSON-serialised to satisfy LsonObject. */
export type CareersGameStorage = {
  phase: CareersRoomPhase
  /** Stable per-tab player ids - connection ids change on every reconnect. */
  hostPlayerId: string | null
  configJson: string // CareersConfig
  playersJson: string // CareerPlayer[] - dealt by the host from /api/careers/deal
  currentIndex: number
  roundStatesJson: string // RoundStates (see roomRound.ts)
  /** The current career is closed: everyone done, clock ran out or host revealed it. */
  roundClosed: boolean
  roundDeadline: number // epoch ms, 0 = no clock
  resultsJson: string // CareersRoomResult[]
  startedAt: number
  playerNames: LiveMap<string, string> // playerId → display name
  playerScores: LiveMap<string, string> // playerId → score (number as string)
}

export type CareersGamePresence = {
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

const careersClient = createClient({
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
  RoomProvider: CareersRoomProvider,
  useStorage: useCareersStorage,
  useMutation: useCareersMutation,
  useOthers: useCareersOthers,
  useMyPresence: useCareersMyPresence,
  useStatus: useCareersStatus,
  useErrorListener: useCareersErrorListener,
  useSelf: useCareersSelf,
  useBroadcastEvent: useCareersBroadcast,
  useEventListener: useCareersEventListener,
} = createRoomContext<CareersGamePresence, CareersGameStorage, BaseUserMeta, KickEvent>(
  careersClient,
)

export function createInitialCareersStorage(): CareersGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_CAREERS_CONFIG),
    playersJson: '[]',
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

export function parseCareersConfig(json: string | null | undefined): CareersConfig {
  try {
    return { ...DEFAULT_CAREERS_CONFIG, ...(JSON.parse(json ?? '{}') as Partial<CareersConfig>) }
  } catch {
    return DEFAULT_CAREERS_CONFIG
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

export const parseCareerPlayers = (json: string | null | undefined) =>
  parseArray<CareerPlayer>(json)
export const parseCareersResults = (json: string | null | undefined) =>
  parseArray<CareersRoomResult>(json)

export const deadlineFor = (cfg: CareersConfig) =>
  cfg.roundSeconds > 0 ? Date.now() + cfg.roundSeconds * 1000 : 0
