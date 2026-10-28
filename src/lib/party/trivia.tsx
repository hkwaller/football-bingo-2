'use client'
import { createPartyRoomContext } from './client'
import { triviaActions } from './triviaActions'
import type { TriviaGameStorage, TriviaGamePresence, TriviaRoomEvent } from './triviaModel'

export * from './triviaModel'
export const {
  RoomProvider: TriviaRoomProvider,
  useStorage: useTriviaStorage,
  useMutation: useTriviaM,
  useOthers: useTriviaOthers,
  useMyPresence: useTriviaMyPresence,
  useStatus: useTriviaStatus,
  useErrorListener: useTriviaErrorListener,
  useSelf: useTriviaeSelf,
  useBroadcastEvent: useTriviaBroadcast,
  useEventListener: useTriviaEventListener,
} = createPartyRoomContext<
  TriviaGamePresence,
  TriviaGameStorage,
  TriviaRoomEvent,
  typeof triviaActions
>('trivia', triviaActions)
