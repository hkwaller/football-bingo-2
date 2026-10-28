'use client'
import { createPartyRoomContext } from './client'
import { bingoActions } from './bingoActions'
import type { GameStorage, GamePresence, RoomEvent } from './bingoModel'

export * from './bingoModel'
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
} = createPartyRoomContext<GamePresence, GameStorage, RoomEvent, typeof bingoActions>(
  'bingo',
  bingoActions,
)
