'use client'

import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { PlayMode } from '@/lib/playMode'

export type GameStorage = {
  phase: 'lobby' | 'playing' | 'finished'
  seed: string
  startedAt: number | null
  supabaseGameId: string | null
  playMode: PlayMode
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
} = createRoomContext<GamePresence, GameStorage>(client)
