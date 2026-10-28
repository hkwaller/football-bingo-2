'use client'
import { createPartyRoomContext } from './client'
import { careersActions } from './careersActions'
import type { CareersGameStorage, CareersGamePresence } from './careersModel'
import type { KickEvent } from './types'
export * from './careersModel'
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
} = createPartyRoomContext<
  CareersGamePresence,
  CareersGameStorage,
  KickEvent,
  typeof careersActions
>('careers', careersActions)
