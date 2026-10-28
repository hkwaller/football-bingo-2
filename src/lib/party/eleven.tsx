'use client'
import { createPartyRoomContext } from './client'
import { elevenActions } from './elevenActions'
import type { ElevenGameStorage, ElevenGamePresence } from './elevenModel'
import type { KickEvent } from './types'
export * from './elevenModel'
export const {
  RoomProvider: ElevenRoomProvider,
  useStorage: useElevenStorage,
  useMutation: useElevenM,
  useOthers: useElevenOthers,
  useMyPresence: useElevenMyPresence,
  useStatus: useElevenStatus,
  useErrorListener: useElevenErrorListener,
  useSelf: useElevenSelf,
  useBroadcastEvent: useElevenBroadcast,
  useEventListener: useElevenEventListener,
} = createPartyRoomContext<ElevenGamePresence, ElevenGameStorage, KickEvent, typeof elevenActions>(
  'eleven',
  elevenActions,
)
