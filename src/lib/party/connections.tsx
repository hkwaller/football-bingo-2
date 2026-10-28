'use client'
import { createPartyRoomContext } from './client'
import { connectionsActions } from './connectionsActions'
import type { ConnectionsGameStorage, ConnectionsGamePresence } from './connectionsModel'
import type { KickEvent } from './types'
export * from './connectionsModel'
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
} = createPartyRoomContext<
  ConnectionsGamePresence,
  ConnectionsGameStorage,
  KickEvent,
  typeof connectionsActions
>('connections', connectionsActions)
