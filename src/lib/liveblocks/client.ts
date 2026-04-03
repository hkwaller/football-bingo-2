'use client'

import {
  type BaseUserMeta,
  createClient,
  type Lson,
  LiveMap,
} from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { CellPick } from '@/lib/cellPick'
import type { DraftPolicy } from '@/lib/draftPolicy'
import type { PlayMode } from '@/lib/playMode'

export type DraftVote =
  | { type: 'skip' }
  | { type: 'square'; cellIndex: number }

export type RoomEvent =
  | { type: 'draft_place'; cellIndex: number; pick: CellPick }
  | { type: 'draft_skip' }

export type GameStorage = {
  phase: 'lobby' | 'playing' | 'finished'
  seed: string
  startedAt: number | null
  supabaseGameId: string | null
  playMode: PlayMode
  hostConnectionId: number | null
  boardSize: 3 | 4 | 5
  categoryNationalities: boolean
  categoryClubs: boolean
  categoryAchievements: boolean
  boardLayout: 'shared' | 'individual'
  draftPolicy: DraftPolicy
  draftRound: number
  draftVotes: LiveMap<string, DraftVote>
  sharedSolved: LiveMap<string, CellPick>
}

export type GamePresence = {
  displayName: string
  bingoAt: number | null
}

const client = createClient({
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
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useMyPresence,
  useStatus,
  useErrorListener,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<GamePresence, GameStorage, BaseUserMeta, RoomEvent>(client)

/** LiveMap has no `clear()` in typings; delete keys explicitly. */
export function liveMapStringKeysClear(m: LiveMap<string, Lson>) {
  for (const k of [...m.keys()]) {
    m.delete(k)
  }
}

export function createInitialGameStorage(): GameStorage {
  return {
    phase: 'lobby',
    seed: '',
    startedAt: null,
    supabaseGameId: null,
    playMode: 'draft',
    hostConnectionId: null,
    boardSize: 5,
    categoryNationalities: true,
    categoryClubs: true,
    categoryAchievements: true,
    boardLayout: 'individual',
    draftPolicy: 'open',
    draftRound: 0,
    draftVotes: new LiveMap(),
    sharedSolved: new LiveMap(),
  }
}
