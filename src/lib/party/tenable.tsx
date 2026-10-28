'use client'
import { createPartyRoomContext } from './client'
import { tenableActions } from './tenableActions'
import type { TenableGameStorage, TenableGamePresence } from './tenableModel'
import type { KickEvent } from './types'
export * from './tenableModel'
export const {
  RoomProvider: TenableRoomProvider,
  useStorage: useTenableStorage,
  useMutation: useTenableM,
  useOthers: useTenableOthers,
  useMyPresence: useTenableMyPresence,
  useStatus: useTenableStatus,
  useErrorListener: useTenableErrorListener,
  useSelf: useTenableSelf,
  useBroadcastEvent: useTenableBroadcast,
  useEventListener: useTenableEventListener,
} = createPartyRoomContext<
  TenableGamePresence,
  TenableGameStorage,
  KickEvent,
  typeof tenableActions
>('tenable', tenableActions)
