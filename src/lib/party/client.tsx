'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import PartySocket from 'partysocket'
import { getTabPlayerId } from '../roomPlayer'
import { randomUUID } from '../randomUUID'
import { applyRoomAction, type ActionTable } from './reducer'
import {
  actionScope,
  decodeStorage,
  type GameKind,
  type RoomAction,
  type RoomMember,
  type RoomMessage,
} from './types'

type Status = 'initial' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
type Snapshot<P, S> = {
  storage: S | null
  self: RoomMember<P> | null
  members: RoomMember<P>[]
  presence: P
  status: Status
}
type Listener<T> = (event: T) => void
type ActionArgs<F> = F extends (context: never, ...args: infer A) => unknown ? A : never
type ActionResult<F> = F extends (...args: never[]) => infer R ? R : never

/** A single socket and external store per mounted room; no connection is shared across tabs. */
export function createPartyRoomContext<
  P extends object,
  S extends object,
  E,
  A extends ActionTable<S>,
>(kind: GameKind, actions: A) {
  type Store = ReturnType<typeof makeStore>
  const Context = createContext<Store | null>(null)
  function makeStore(initial: P) {
    let snapshot: Snapshot<P, S> = {
      storage: null,
      self: null,
      members: [],
      presence: initial,
      status: 'initial',
    }
    let authoritative: S | null = null
    let socket: PartySocket | null = null
    let serial = 0
    let guestIdentity = ''
    const listeners = new Set<() => void>()
    const errors = new Set<Listener<{ message: string }>>()
    const events = new Set<Listener<{ event: E }>>()
    const pending = new Map<number, RoomAction>()
    const publish = (patch: Partial<Snapshot<P, S>>) => {
      snapshot = { ...snapshot, ...patch }
      listeners.forEach((fn) => fn())
    }
    const error = (message: string) => errors.forEach((fn) => fn({ message }))
    function execute(state: S, action: RoomAction) {
      if (!snapshot.self) return { state, result: undefined }
      return applyRoomAction(
        kind,
        state,
        actions,
        action,
        snapshot.self as RoomMember,
        snapshot.members as RoomMember[],
        Date.now(),
        '',
      )
    }
    const store = {
      subscribe: (fn: () => void) => {
        listeners.add(fn)
        return () => {
          listeners.delete(fn)
        }
      },
      snapshot: () => snapshot,
      errors,
      events,
      connect(id: string, initialStorage: S) {
        publish({ status: 'connecting' })
        const host = process.env.NEXT_PUBLIC_PARTY_HOST
        if (!host) {
          publish({ status: 'disconnected' })
          error('Room server is not configured. Set NEXT_PUBLIC_PARTY_HOST.')
          return () => {}
        }
        socket = new PartySocket({
          host,
          party: 'room',
          room: id,
          maxEnqueuedMessages: 0,
          query: async () => {
            let anonId: string
            try {
              anonId = localStorage.getItem('fb_anon_id') || randomUUID()
              localStorage.setItem('fb_anon_id', anonId)
            } catch {
              anonId = guestIdentity ||= randomUUID()
            }
            try {
              const res = await fetch('/api/party-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room: id, anonId, playerId: getTabPlayerId() }),
              })
              const data = await res.json()
              if (!res.ok || !data.ticket)
                throw new Error(data.error ?? 'Room authorization failed')
              return { ticket: data.ticket }
            } catch (e) {
              error(e instanceof Error ? e.message : 'Room authorization failed')
              throw e
            }
          },
        })
        socket.addEventListener('open', () => {
          pending.clear()
          // Rejoin restores the persisted presence; only the first join uses these defaults.
          socket?.send(
            JSON.stringify({
              type: 'join',
              presence: snapshot.presence,
              config: kind === 'bingo' ? initialStorage : undefined,
            }),
          )
        })
        socket.addEventListener('message', (event) => {
          let msg: RoomMessage
          try {
            msg = JSON.parse(String(event.data))
          } catch {
            return
          }
          if (msg.type === 'event') {
            events.forEach((fn) => fn({ event: msg.event as E }))
            return
          }
          if (msg.type === 'error') {
            error(msg.message)
            return
          }
          if (msg.type !== 'state') return
          authoritative = decodeStorage<S>(msg.storage)
          const members = msg.members as RoomMember<P>[]
          const self = members.find((m) => m.connectionId === msg.me) ?? null
          if (msg.ack !== undefined) pending.delete(msg.ack)
          snapshot = {
            ...snapshot,
            self,
            members,
            presence: self?.presence ?? snapshot.presence,
            status: 'connected',
          }
          let storage = authoritative
          for (const action of pending.values()) storage = execute(storage, action).state
          publish({ storage })
        })
        socket.addEventListener('close', () => {
          pending.clear()
          publish({ status: 'reconnecting', storage: authoritative })
        })
        socket.addEventListener('error', () => error('Unable to connect to the room server.'))
        const resume = () => {
          if (document.visibilityState === 'visible') socket?.reconnect()
        }
        document.addEventListener('visibilitychange', resume)
        return () => {
          document.removeEventListener('visibilitychange', resume)
          const old = socket
          socket = null
          old?.close()
          pending.clear()
        }
      },
      presence(patch: Partial<P>) {
        if (socket?.readyState !== WebSocket.OPEN) return
        publish({ presence: { ...snapshot.presence, ...patch } })
        socket.send(JSON.stringify({ type: 'presence', presence: patch }))
      },
      action<K extends keyof A>(name: K, args: ActionArgs<A[K]>): ActionResult<A[K]> {
        if (
          !snapshot.storage ||
          !snapshot.self ||
          snapshot.status !== 'connected' ||
          socket?.readyState !== WebSocket.OPEN
        )
          return undefined as ActionResult<A[K]>
        const action: RoomAction = {
          type: 'action',
          name: String(name),
          args: args as unknown[],
          id: ++serial,
          scope: actionScope(snapshot.storage),
        }
        // Start actions select a random bank on the server. Never predict them locally.
        let result: unknown
        if (name !== 'startGame') {
          const next = execute(snapshot.storage, action)
          pending.set(action.id, action)
          result = next.result
          if (next.state !== snapshot.storage) publish({ storage: next.state })
        }
        socket.send(JSON.stringify(action))
        return result as ActionResult<A[K]>
      },
      broadcast(event: E) {
        if (socket?.readyState === WebSocket.OPEN)
          socket.send(JSON.stringify({ type: 'event', event }))
      },
    }
    return store
  }
  function useStore() {
    const store = useContext(Context)
    if (!store) throw new Error('RoomProvider is missing')
    return store
  }
  function useSnapshot() {
    const store = useStore()
    return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
  }
  function RoomProvider({
    id,
    initialStorage,
    initialPresence,
    children,
  }: {
    id: string
    initialStorage: S | (() => S)
    initialPresence: P | (() => P)
    children: ReactNode
  }) {
    const [store] = useState(() =>
      makeStore(
        typeof initialPresence === 'function' ? (initialPresence as () => P)() : initialPresence,
      ),
    )
    const initial = useRef(initialStorage)
    useEffect(
      () =>
        store.connect(
          id,
          typeof initial.current === 'function' ? (initial.current as () => S)() : initial.current,
        ),
      [id, store],
    )
    return <Context.Provider value={store}>{children}</Context.Provider>
  }
  function useMutation<K extends keyof A>(name: K) {
    const store = useStore()
    return useCallback((...args: ActionArgs<A[K]>) => store.action(name, args), [store, name])
  }
  function useMyPresence(): [P, (patch: Partial<P>) => void] {
    const store = useStore()
    return [useSnapshot().presence, store.presence]
  }
  function useOthers() {
    const s = useSnapshot()
    const me = s.self?.connectionId
    return useMemo(() => s.members.filter((m) => m.connectionId !== me), [s.members, me])
  }
  function useErrorListener(callback: Listener<{ message: string }>) {
    const store = useStore()
    const ref = useRef(callback)
    ref.current = callback
    useEffect(() => {
      const fn = (e: { message: string }) => ref.current(e)
      store.errors.add(fn)
      return () => {
        store.errors.delete(fn)
      }
    }, [store])
  }
  function useEventListener(callback: Listener<{ event: E }>) {
    const store = useStore()
    const ref = useRef(callback)
    ref.current = callback
    useEffect(() => {
      const fn = (e: { event: E }) => ref.current(e)
      store.events.add(fn)
      return () => {
        store.events.delete(fn)
      }
    }, [store])
  }
  return {
    RoomProvider,
    useMutation,
    useMyPresence,
    useOthers,
    useErrorListener,
    useEventListener,
    useStorage: <T,>(selector: (storage: S) => T): T | null => {
      const s = useSnapshot()
      return s.storage ? selector(s.storage) : null
    },
    useSelf: () => useSnapshot().self,
    useStatus: () => useSnapshot().status,
    useBroadcastEvent: () => useStore().broadcast,
  }
}
